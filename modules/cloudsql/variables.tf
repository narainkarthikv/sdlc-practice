variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "region" {
  description = "GCP region for Cloud SQL"
  type        = string
  default     = "asia-south1"
}

variable "instance_name" {
  description = "Cloud SQL instance name"
  type        = string
  default     = "narainkarthik812-practice-dev-postgres"
}

variable "database_version" {
  description = "Cloud SQL Postgres major version"
  type        = string
  default     = "POSTGRES_17"
}

variable "tier" {
  description = "Cloud SQL machine tier"
  type        = string
  default     = "db-f1-micro"
}

variable "disk_size_gb" {
  description = "Disk size in GB"
  type        = number
  default     = 10
}

variable "backup_retained_backups" {
  description = "Number of retained automated backups"
  type        = number
  default     = 7
}

variable "backup_start_time" {
  description = "Backup start time in UTC (HH:MM)"
  type        = string
  default     = "02:00"
}

variable "vpc_self_link" {
  description = "Self link of the VPC network used for private IP"
  type        = string
}

variable "private_ip_prefix_length" {
  description = "CIDR prefix length for private service access range"
  type        = number
  default     = 24
}

variable "authorized_networks" {
  description = "Authorized IPv4 networks for public Cloud SQL access"
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

variable "enable_required_apis" {
  description = "Enable required project APIs for Cloud SQL and private service networking"
  type        = bool
  default     = true
}
