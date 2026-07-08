# Instance template for managed instance group
resource "google_compute_instance_template" "app" {
  name_prefix = "${var.app_name}-${var.environment}-template-"
  
  description = "Instance template for ${var.app_name} ${var.environment}"
  
  machine_type = var.instance_type
  
  # Boot disk configuration
  disk {
    source_image = var.source_image
    auto_delete  = true
    boot         = true
    disk_size_gb = var.disk_size_gb
    disk_type    = var.disk_type
    
    # Enable disk encryption
    disk_encryption_key {
      kms_key_self_link = var.kms_key_self_link
    }
  }
  
  # Network interface configuration
  network_interface {
    network    = var.network_id
    subnetwork = var.subnet_id
    
    # Don't assign external IP (use NAT for outbound)
    # Uncomment the next block if you need external IPs
    # access_config {
    #   nat_ip = ""
    # }
  }
  
  # Service account for the instances
  service_account {
    email = google_service_account.instance_sa.email
    scopes = [
      "https://www.googleapis.com/auth/cloud-platform",
      "https://www.googleapis.com/auth/logging.write",
      "https://www.googleapis.com/auth/monitoring.write",
    ]
  }
  
  # Metadata and startup script
  metadata = {
    startup-script = var.startup_script
    user-data      = var.user_data
  }
  
  # Network tags for firewall rules
  tags = concat(
    ["internal", "web-server"],
    var.enable_ssh ? ["ssh-access"] : [],
    var.additional_tags
  )
  
  # Labels for resource management
  labels = merge(
    {
      environment = var.environment
      app         = var.app_name
      managed-by  = "terraform"
    },
    var.additional_labels
  )
  
  # Lifecycle management
  lifecycle {
    create_before_destroy = true
  }
}

# Service account for compute instances
resource "google_service_account" "instance_sa" {
  account_id   = "${var.app_name}-${var.environment}-instance-sa"
  display_name = "Service Account for ${var.app_name} ${var.environment} instances"
  description  = "Service account used by compute instances"
}

# IAM binding for service account
resource "google_project_iam_member" "instance_sa_roles" {
  for_each = toset(var.instance_sa_roles)
  
  project = var.project_id
  role    = each.value
  member  = "serviceAccount:${google_service_account.instance_sa.email}"
}

# Managed instance group
resource "google_compute_region_instance_group_manager" "app" {
  name = "${var.app_name}-${var.environment}-mig"
  
  base_instance_name = "${var.app_name}-${var.environment}"
  region            = var.region
  
  version {
    instance_template = google_compute_instance_template.app.id
  }
  
  target_size = var.target_size
  
  # Auto-healing configuration
  dynamic "auto_healing_policies" {
    for_each = var.health_check_path != null ? [1] : []
    content {
      health_check      = google_compute_health_check.app[0].id
      initial_delay_sec = var.health_check_initial_delay
    }
  }
  
  # Update policy
  update_policy {
    type                           = "PROACTIVE"
    instance_redistribution_type   = "PROACTIVE"
    minimal_action                = "REPLACE"
    most_disruptive_allowed_action = "REPLACE"
    max_surge_fixed               = var.max_surge
    max_unavailable_fixed         = var.max_unavailable
  }
  
  # Named ports for load balancer
  dynamic "named_port" {
    for_each = var.named_ports
    content {
      name = named_port.value.name
      port = named_port.value.port
    }
  }
}

# Health check for auto-healing and load balancing
resource "google_compute_health_check" "app" {
  count = var.health_check_path != null ? 1 : 0
  
  name = "${var.app_name}-${var.environment}-health-check"
  
  description = "Health check for ${var.app_name} ${var.environment}"
  
  timeout_sec         = var.health_check_timeout
  check_interval_sec  = var.health_check_interval
  healthy_threshold   = var.health_check_healthy_threshold
  unhealthy_threshold = var.health_check_unhealthy_threshold
  
  http_health_check {
    port         = var.health_check_port
    request_path = var.health_check_path
  }
}

# Regional autoscaler
resource "google_compute_region_autoscaler" "app" {
  count = var.enable_autoscaling ? 1 : 0
  
  name   = "${var.app_name}-${var.environment}-autoscaler"
  region = var.region
  target = google_compute_region_instance_group_manager.app.id
  
  autoscaling_policy {
    max_replicas    = var.max_replicas
    min_replicas    = var.min_replicas
    cooldown_period = var.autoscaling_cooldown
    
    # CPU utilization scaling
    cpu_utilization {
      target = var.cpu_target_utilization
    }
    
    # Custom metrics scaling
    dynamic "metric" {
      for_each = var.custom_metrics
      content {
        name   = metric.value.name
        target = metric.value.target
        type   = metric.value.type
      }
    }
  }
}

# Load balancer backend service
resource "google_compute_backend_service" "app" {
  count = var.enable_load_balancer ? 1 : 0
  
  name = "${var.app_name}-${var.environment}-backend"
  
  description = "Backend service for ${var.app_name} ${var.environment}"
  
  port_name   = var.backend_port_name
  protocol    = var.backend_protocol
  timeout_sec = var.backend_timeout
  
  health_checks = var.health_check_path != null ? [google_compute_health_check.app[0].id] : []
  
  backend {
    group           = google_compute_region_instance_group_manager.app.instance_group
    balancing_mode  = "UTILIZATION"
    capacity_scaler = 1.0
  }
  
  # Session affinity
  session_affinity = var.session_affinity
  
  # Connection draining
  connection_draining_timeout_sec = var.connection_draining_timeout
  
  # Security policy
  security_policy = var.security_policy_id
}