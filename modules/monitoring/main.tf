# Notification channel for alerts
resource "google_monitoring_notification_channel" "email" {
  count = length(var.notification_emails)
  
  display_name = "Email - ${var.notification_emails[count.index]}"
  type         = "email"
  
  labels = {
    email_address = var.notification_emails[count.index]
  }
  
  description = "Email notification channel for ${var.app_name} ${var.environment}"
}


# Alert policy for high CPU usage
resource "google_monitoring_alert_policy" "high_cpu" {
  display_name = "${var.app_name} ${var.environment} - High CPU Usage"
  combiner     = "OR"
  
  conditions {
    display_name = "High CPU utilization"
    
    condition_threshold {
      filter          = "resource.type=\"gce_instance\" AND resource.labels.project_id=\"${var.project_id}\""
      duration        = "300s"
      comparison      = "COMPARISON_GT"
      threshold_value = var.cpu_alert_threshold
      
      aggregations {
        alignment_period   = "60s"
        per_series_aligner = "ALIGN_MEAN"
      }
    }
  }


notification_channels = concat(
    google_monitoring_notification_channel.email.*.id
  )
}


# Alert policy for disk usage
resource "google_monitoring_alert_policy" "high_disk_usage" {
  display_name = "${var.app_name} ${var.environment} - High Disk Usage"
  combiner     = "OR"
  
  conditions {
    display_name = "High disk utilization"
    
    condition_threshold {
      filter          = "resource.type=\"gce_instance\" AND resource.labels.project_id=\"${var.project_id}\""
      duration        = "300s"
      comparison      = "COMPARISON_GT"
      threshold_value = var.disk_alert_threshold
      
      aggregations {
        alignment_period   = "60s"
        per_series_aligner = "ALIGN_MEAN"
      }
    }
  }
  
  notification_channels = concat(
    google_monitoring_notification_channel.email.*.id
  )
}

# Alert policy for instance down
resource "google_monitoring_alert_policy" "instance_down" {
  display_name = "${var.app_name} ${var.environment} - Instance Down"
  combiner     = "OR"
  
  conditions {
    display_name = "Instance is down"
    
    condition_threshold {
      filter          = "resource.type=\"gce_instance\" AND resource.labels.project_id=\"${var.project_id}\""
      duration        = "60s"
      comparison      = "COMPARISON_LT"
      threshold_value = 1
      
      aggregations {
        alignment_period   = "60s"
        per_series_aligner = "ALIGN_MEAN"
      }
    }
  }
  
  notification_channels = concat(
    google_monitoring_notification_channel.email.*.id
  )
}

# Custom dashboard
resource "google_monitoring_dashboard" "main" {
  dashboard_json = jsonencode({
    displayName = "${var.app_name} ${var.environment} Dashboard"
    
    gridLayout = {
      widgets = [
        {
          title = "CPU Utilization"
          xyChart = {
            dataSets = [{
              timeSeriesQuery = {
                timeSeriesFilter = {
                  filter = "resource.type=\"gce_instance\" AND resource.labels.project_id=\"${var.project_id}\""
                  aggregation = {
                    alignmentPeriod = "60s"
                    perSeriesAligner = "ALIGN_MEAN"
                  }
                }
              }
            }]
          }
        },
        {
          title = "Memory Utilization"
          xyChart = {
            dataSets = [{
              timeSeriesQuery = {
                timeSeriesFilter = {
                  filter = "resource.type=\"gce_instance\" AND resource.labels.project_id=\"${var.project_id}\""
                  aggregation = {
                    alignmentPeriod = "60s"
                    perSeriesAligner = "ALIGN_MEAN"
                  }
                }
              }
            }]
          }
        },
        {
          title = "Network Traffic"
          xyChart = {
            dataSets = [{
              timeSeriesQuery = {
                timeSeriesFilter = {
                  filter = "resource.type=\"gce_instance\" AND resource.labels.project_id=\"${var.project_id}\""
                  aggregation = {
                    alignmentPeriod = "60s"
                    perSeriesAligner = "ALIGN_RATE"
                  }
                }
              }
            }]
          }
        },
        {
          title = "Instance Count"
          scorecard = {
            timeSeriesQuery = {
              timeSeriesFilter = {
                filter = "resource.type=\"gce_instance\" AND resource.labels.project_id=\"${var.project_id}\""
                aggregation = {
                  alignmentPeriod = "60s"
                  perSeriesAligner = "ALIGN_MEAN"
                  crossSeriesReducer = "REDUCE_COUNT"
                }
              }
            }
          }
        }
      ]
    }
  })
}

# Log-based metric for application errors
resource "google_logging_metric" "app_errors" {
  count  = var.error_log_filter != null ? 1 : 0
  name   = "${var.app_name}_${var.environment}_errors"
  filter = var.error_log_filter
  
  metric_descriptor {
    metric_kind = "GAUGE"
    value_type  = "INT64"
    display_name = "${var.app_name} ${var.environment} Error Count"
  }
  
  value_extractor = "EXTRACT(jsonPayload.level)"
}

# Alert policy for application errors
resource "google_monitoring_alert_policy" "app_errors" {
  count = var.error_log_filter != null ? 1 : 0
  
  display_name = "${var.app_name} ${var.environment} - High Error Rate"
  combiner     = "OR"
  
  conditions {
    display_name = "High application error rate"
    
    condition_threshold {
      filter          = "resource.type=\"global\" AND metric.type=\"logging.googleapis.com/user/${google_logging_metric.app_errors[0].name}\""
      duration        = "300s"
      comparison      = "COMPARISON_GT"
      threshold_value = var.error_rate_threshold
      
      aggregations {
        alignment_period   = "60s"
        per_series_aligner = "ALIGN_RATE"
      }
    }
  }
  
  notification_channels = concat(
    google_monitoring_notification_channel.email.*.id
  )
}
