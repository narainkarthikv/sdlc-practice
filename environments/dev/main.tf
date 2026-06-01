# Networking module
module "networking" {
  source = "../../modules/networking"

  app_name               = var.app_name
  environment            = var.environment
  region                 = var.region
  app_subnet_cidr        = "10.0.1.0/24"
  db_subnet_cidr         = "10.0.2.0/24"
  gke_pods_cidr          = "10.1.0.0/16"
  gke_services_cidr      = "10.2.0.0/16"
  enable_database_subnet = false
  enable_gke             = false
  nat_ip_count           = 1
  allowed_ip_ranges      = var.allowed_ip_ranges
}

# IAM module
module "iam" {
  source = "../../modules/iam"

  app_name                    = var.app_name
  environment                 = var.environment
  project_id                  = var.project_id
  create_service_account_keys = var.create_service_account_keys
  enable_workload_identity    = var.enable_workload_identity
  custom_permissions          = var.custom_permissions
}

# Monitoring module (only if enabled)
module "monitoring" {
  count  = var.enable_monitoring ? 1 : 0
  source = "../../modules/monitoring"

  app_name               = var.app_name
  environment            = var.environment
  project_id             = var.project_id
  notification_emails    = []
  cpu_alert_threshold    = 0.8
  memory_alert_threshold = 0.85
  disk_alert_threshold   = 0.9
}

data "google_compute_subnetwork" "app" {
  name    = "${var.app_name}-${var.environment}-app-subnet"
  region  = var.region
  project = var.project_id
}

resource "google_compute_instance" "dev_vm" {
  count        = var.enable_compute_instance ? 1 : 0
  name         = var.compute_instance_name
  machine_type = var.instance_type
  zone         = var.zone

  boot_disk {
    initialize_params {
      image = var.compute_image
      size  = 20
      type  = "pd-balanced"
    }
  }

  network_interface {
    subnetwork = data.google_compute_subnetwork.app.self_link
    access_config {}
  }

  tags = ["internal", "web-server", "ssh-access"]

  labels = {
    environment = var.environment
    app         = var.app_name
    managed_by  = "terraform"
  }

  metadata = {
    enable-oslogin = "TRUE"
  }

  depends_on = [module.networking]
}

module "cloudsql" {
  count  = var.enable_cloudsql ? 1 : 0
  source = "../../modules/cloudsql"

  project_id               = var.project_id
  region                   = var.region
  instance_name            = var.cloudsql_instance_name
  database_version         = var.cloudsql_database_version
  tier                     = var.cloudsql_tier
  disk_size_gb             = var.cloudsql_disk_size_gb
  backup_retained_backups  = var.cloudsql_backup_retained_backups
  backup_start_time        = var.cloudsql_backup_start_time
  private_ip_prefix_length = var.cloudsql_private_ip_prefix_length
  authorized_networks      = var.cloudsql_authorized_networks
  vpc_self_link            = "projects/${var.project_id}/global/networks/${var.app_name}-${var.environment}-vpc"

  depends_on = [module.networking]
}
