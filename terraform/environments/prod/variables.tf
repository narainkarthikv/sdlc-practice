variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "region" {
  description = "GCP region"
  type        = string
  default     = "asia-south1"
}

variable "zone" {
  description = "GCP zone"
  type        = string
  default     = "asia-south1-a"
}

variable "environment" {
  description = "Environment name"
  type        = string
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod."
  }
}

variable "app_name" {
  description = "Application name"
  type        = string
}

variable "instance_type" {
  description = "Compute Engine instance type"
  type        = string
  default     = "e2-micro"
}

variable "min_replicas" {
  description = "Minimum number of instances"
  type        = number
  default     = 1
}

variable "max_replicas" {
  description = "Maximum number of instances"
  type        = number
  default     = 3
}

variable "enable_monitoring" {
  description = "Enable monitoring and alerting"
  type        = bool
  default     = true
}

variable "backup_retention_days" {
  description = "Number of days to retain backups"
  type        = number
  default     = 7
}

variable "allowed_ip_ranges" {
  description = "IP ranges allowed to access the application"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "create_service_account_keys" {
  description = "Create service account keys (not recommended for production)"
  type        = bool
  default     = false
}

variable "enable_workload_identity" {
  description = "Enable Workload Identity for service accounts"
  type        = bool
  default     = false
}

variable "custom_permissions" {
  description = "Custom IAM permissions for service accounts"
  type        = list(string)
  default     = []
}