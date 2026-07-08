variable "app_name" {
  description = "Application name"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "region" {
  description = "GCP region"
  type        = string
}

variable "app_subnet_cidr" {
  description = "CIDR block for application subnet"
  type        = string
  default     = "10.0.1.0/24"
}

variable "db_subnet_cidr" {
  description = "CIDR block for database subnet"
  type        = string
  default     = "10.0.2.0/24"
}

variable "gke_pods_cidr" {
  description = "CIDR block for GKE pods"
  type        = string
  default     = "10.1.0.0/16"
}

variable "gke_services_cidr" {
  description = "CIDR block for GKE services"
  type        = string
  default     = "10.2.0.0/16"
}

variable "enable_database_subnet" {
  description = "Enable database subnet"
  type        = bool
  default     = false
}

variable "enable_gke" {
  description = "Enable GKE secondary IP ranges"
  type        = bool
  default     = false
}

variable "nat_ip_count" {
  description = "Number of static IPs for NAT Gateway"
  type        = number
  default     = 1
}

variable "allowed_ip_ranges" {
  description = "IP ranges allowed to access resources"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}