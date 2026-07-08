resource "google_project_service" "required" {
  for_each = var.enable_required_apis ? toset([
    "sqladmin.googleapis.com",
    "servicenetworking.googleapis.com",
    "compute.googleapis.com"
  ]) : toset([])

  project            = var.project_id
  service            = each.value
  disable_on_destroy = false
}

resource "google_compute_global_address" "private_ip_alloc" {
  name          = "${var.instance_name}-private-range"
  project       = var.project_id
  purpose       = "VPC_PEERING"
  address_type  = "INTERNAL"
  prefix_length = var.private_ip_prefix_length
  network       = var.vpc_self_link
}

resource "google_service_networking_connection" "private_vpc_connection" {
  network                 = var.vpc_self_link
  service                 = "servicenetworking.googleapis.com"
  reserved_peering_ranges = [google_compute_global_address.private_ip_alloc.name]

  depends_on = [google_project_service.required]
}

resource "google_sql_database_instance" "postgres" {
  name                = var.instance_name
  project             = var.project_id
  region              = var.region
  database_version    = var.database_version
  deletion_protection = true

  settings {
    tier              = var.tier
    edition           = "ENTERPRISE"
    availability_type = "ZONAL"
    disk_type         = "PD_SSD"
    disk_size         = var.disk_size_gb

    deletion_protection_enabled = true

    backup_configuration {
      enabled                        = true
      start_time                     = var.backup_start_time
      point_in_time_recovery_enabled = true

      backup_retention_settings {
        retained_backups = var.backup_retained_backups
        retention_unit   = "COUNT"
      }
    }

    ip_configuration {
      ipv4_enabled       = true
      private_network    = var.vpc_self_link
      allocated_ip_range = google_compute_global_address.private_ip_alloc.name

      # Dev-only public access for initial testing.
      dynamic "authorized_networks" {
        for_each = var.authorized_networks
        content {
          name  = authorized_networks.value.name
          value = authorized_networks.value.value
        }
      }
    }
  }

  depends_on = [
    google_project_service.required,
    google_service_networking_connection.private_vpc_connection
  ]
}
