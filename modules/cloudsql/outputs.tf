output "instance_name" {
  description = "Cloud SQL instance name"
  value       = google_sql_database_instance.postgres.name
}

output "connection_name" {
  description = "Cloud SQL connection name"
  value       = google_sql_database_instance.postgres.connection_name
}

output "public_ip_address" {
  description = "Public IPv4 assigned to Cloud SQL instance"
  value       = try(google_sql_database_instance.postgres.public_ip_address, null)
}

output "private_ip_address" {
  description = "Private IPv4 assigned to Cloud SQL instance"
  value       = try(google_sql_database_instance.postgres.private_ip_address, null)
}
