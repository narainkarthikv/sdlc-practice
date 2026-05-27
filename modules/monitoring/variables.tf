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

variable "notification_emails" {
  description = "List of email addresses for notifications"
  type        = list(string)
  default     = []
}

variable "cpu_alert_threshold" {
  description = "CPU utilization threshold for alerts (0-1)"
  type        = number
  default     = 0.8
}

variable "memory_alert_threshold" {
  description = "Memory utilization threshold for alerts (0-1)"
  type        = number
  default     = 0.85
}

variable "disk_alert_threshold" {
  description = "Disk utilization threshold for alerts (0-1)"
  type        = number
  default     = 0.9
}

variable "error_log_filter" {
  description = "Log filter for application errors"
  type        = string
  default     = null
}

variable "error_rate_threshold" {
  description = "Error rate threshold for alerts"
  type        = number
  default     = 10
}