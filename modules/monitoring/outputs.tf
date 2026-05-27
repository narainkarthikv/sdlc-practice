output "notification_channel_ids" {
  description = "List of notification channel IDs"
  value = concat(
    google_monitoring_notification_channel.email.*.id,
    google_monitoring_notification_channel.slack.*.id
  )
}

output "dashboard_url" {
  description = "URL to the monitoring dashboard"
  value = "https://console.cloud.google.com/monitoring/dashboards/custom/${google_monitoring_dashboard.main.id}"
}

output "alert_policy_ids" {
  description = "List of alert policy IDs"
  value = [
    google_monitoring_alert_policy.high_cpu.id,
    google_monitoring_alert_policy.high_memory.id,
    google_monitoring_alert_policy.high_disk_usage.id,
    google_monitoring_alert_policy.instance_down.id
  ]
}