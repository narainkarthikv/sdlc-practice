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

variable "enable_compute_instance" {
  description = "Enable creation of a baseline Compute Engine VM in dev"
  type        = bool
  default     = true
}

variable "compute_instance_name" {
  description = "Name for the baseline dev Compute Engine VM"
  type        = string
  default     = "ownlyst-dev-vm"
}

variable "compute_image" {
  description = "Boot image for the baseline dev Compute Engine VM"
  type        = string
  default     = "debian-cloud/debian-12"
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

variable "enable_cloudsql" {
  description = "Enable Cloud SQL PostgreSQL instance for dev"
  type        = bool
  default     = true
}

variable "cloudsql_instance_name" {
  description = "Cloud SQL instance name for dev"
  type        = string
  default     = "narainkarthik812-practice-dev-postgres"
}

variable "cloudsql_database_version" {
  description = "Cloud SQL Postgres major version"
  type        = string
  default     = "POSTGRES_17"
}

variable "cloudsql_tier" {
  description = "Cloud SQL machine tier"
  type        = string
  default     = "db-f1-micro"
}

variable "cloudsql_disk_size_gb" {
  description = "Cloud SQL disk size in GB"
  type        = number
  default     = 10
}

variable "cloudsql_backup_retained_backups" {
  description = "Number of retained Cloud SQL backups"
  type        = number
  default     = 7
}

variable "cloudsql_backup_start_time" {
  description = "Cloud SQL backup start time in UTC (HH:MM)"
  type        = string
  default     = "02:00"
}

variable "cloudsql_private_ip_prefix_length" {
  description = "Private service access CIDR prefix length for Cloud SQL"
  type        = number
  default     = 24
}

variable "cloudsql_authorized_networks" {
  description = "Authorized public networks for Cloud SQL"
  type = list(object({
    name  = string
    value = string
  }))
  default = [
    {
      name  = "dev-open-access"
      value = "0.0.0.0/0"
    }
  ]
}
