output "todo_api_gateway_hostname" {
  description = "Hostname for the todo backend API Gateway"
  value       = var.enable_todo_prototype ? google_api_gateway_gateway.todo[0].default_hostname : null
}

output "todo_frontend_static_ip" {
  description = "Reserved static IP for the todo frontend load balancer"
  value       = var.enable_todo_prototype ? google_compute_global_address.todo_frontend[0].address : null
}

output "todo_frontend_function_uri" {
  description = "Direct URI of the frontend function"
  value       = var.enable_todo_prototype ? google_cloudfunctions2_function.todo_frontend[0].service_config[0].uri : null
}

output "todo_backend_function_uri" {
  description = "Direct URI of the backend function"
  value       = var.enable_todo_prototype ? google_cloudfunctions2_function.todo_backend[0].service_config[0].uri : null
}
