variable "app_name" {
  description = "Application name"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "terraform_roles" {
  description = "IAM roles for Terraform Cloud Build service account"
  type        = list(string)
  default = [
    "roles/compute.admin",
    "roles/iam.serviceAccountAdmin",
    "roles/resourcemanager.projectIamAdmin",
    "roles/storage.admin",
    "roles/monitoring.admin",
    "roles/logging.admin",
    "roles/cloudsql.admin",
    "roles/secretmanager.admin"
  ]
}

variable "app_instance_roles" {
  description = "IAM roles for application instance service account"
  type        = list(string)
  default = [
    "roles/logging.logWriter",
    "roles/monitoring.metricWriter",
    "roles/secretmanager.secretAccessor"
  ]
}

variable "monitoring_roles" {
  description = "IAM roles for monitoring service account"
  type        = list(string)
  default = [
    "roles/monitoring.viewer",
    "roles/logging.viewer"
  ]
}

variable "custom_permissions" {
  description = "Custom permissions for application-specific role"
  type        = list(string)
  default     = []
}

variable "enable_workload_identity" {
  description = "Enable Workload Identity for GKE"
  type        = bool
  default     = false
}

variable "kubernetes_namespace" {
  description = "Kubernetes namespace for Workload Identity"
  type        = string
  default     = "default"
}

variable "kubernetes_service_account" {
  description = "Kubernetes service account for Workload Identity"
  type        = string
  default     = "default"
}

variable "cross_project_roles" {
  description = "Cross-project IAM role assignments"
  type = map(object({
    project_id = string
    role       = string
  }))
  default = {}
}

variable "create_service_account_keys" {
  description = "Create service account keys (not recommended for production)"
  type        = bool
  default     = false
}