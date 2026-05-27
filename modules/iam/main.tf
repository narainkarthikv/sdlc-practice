# Service account for Terraform Cloud Build
resource "google_service_account" "terraform_cloudbuild" {
  account_id   = "${var.app_name}-${var.environment}-terraform-sa"
  display_name = "Terraform Cloud Build SA - ${var.environment}"
  description  = "Service account used by Cloud Build for Terraform deployments in ${var.environment}"
}

# Service account for application instances
resource "google_service_account" "app_instance" {
  account_id   = "${var.app_name}-${var.environment}-app-sa"
  display_name = "Application Instance SA - ${var.environment}"
  description  = "Service account used by application instances in ${var.environment}"
}

# Service account for monitoring
resource "google_service_account" "monitoring" {
  account_id   = "${var.app_name}-${var.environment}-monitoring-sa"
  display_name = "Monitoring SA - ${var.environment}"
  description  = "Service account for monitoring and alerting in ${var.environment}"
}

# IAM roles for Terraform Cloud Build service account
resource "google_project_iam_member" "terraform_cloudbuild_roles" {
  for_each = toset(var.terraform_roles)
  
  project = var.project_id
  role    = each.value
  member  = "serviceAccount:${google_service_account.terraform_cloudbuild.email}"
}

# IAM roles for application instance service account
resource "google_project_iam_member" "app_instance_roles" {
  for_each = toset(var.app_instance_roles)
  
  project = var.project_id
  role    = each.value
  member  = "serviceAccount:${google_service_account.app_instance.email}"
}

# IAM roles for monitoring service account
resource "google_project_iam_member" "monitoring_roles" {
  for_each = toset(var.monitoring_roles)
  
  project = var.project_id
  role    = each.value
  member  = "serviceAccount:${google_service_account.monitoring.email}"
}

# Custom IAM role for application-specific permissions
resource "google_project_iam_custom_role" "app_custom_role" {
  count = length(var.custom_permissions) > 0 ? 1 : 0
  
  role_id     = "${var.app_name}_${var.environment}_custom_role"
  title       = "${var.app_name} ${var.environment} Custom Role"
  description = "Custom role for ${var.app_name} application in ${var.environment}"
  
  permissions = var.custom_permissions
}

# Bind custom role to application service account
resource "google_project_iam_member" "app_custom_role_binding" {
  count = length(var.custom_permissions) > 0 ? 1 : 0
  
  project = var.project_id
  role    = google_project_iam_custom_role.app_custom_role[0].id
  member  = "serviceAccount:${google_service_account.app_instance.email}"
}

# Workload Identity binding for GKE (if using Kubernetes)
resource "google_service_account_iam_member" "workload_identity" {
  count = var.enable_workload_identity ? 1 : 0
  
  service_account_id = google_service_account.app_instance.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "serviceAccount:${var.project_id}.svc.id.goog[${var.kubernetes_namespace}/${var.kubernetes_service_account}]"
}

# Cross-project access (for shared resources)
resource "google_project_iam_member" "cross_project_access" {
  for_each = var.cross_project_roles
  
  project = each.value.project_id
  role    = each.value.role
  member  = "serviceAccount:${google_service_account.app_instance.email}"
}

# Service account keys (only for non-GCP environments)
resource "google_service_account_key" "app_instance_key" {
  count = var.create_service_account_keys ? 1 : 0
  
  service_account_id = google_service_account.app_instance.name
  public_key_type    = "TYPE_X509_PEM_FILE"
}

# Store service account key in Secret Manager
resource "google_secret_manager_secret" "app_instance_key" {
  count = var.create_service_account_keys ? 1 : 0
  
  secret_id = "${var.app_name}-${var.environment}-app-sa-key"
  
  replication {
    automatic = true
  }
  
  labels = {
    environment = var.environment
    app         = var.app_name
    type        = "service-account-key"
  }
}

resource "google_secret_manager_secret_version" "app_instance_key" {
  count = var.create_service_account_keys ? 1 : 0
  
  secret      = google_secret_manager_secret.app_instance_key[0].id
  secret_data = base64decode(google_service_account_key.app_instance_key[0].private_key)
}