locals {
  todo_prefix                = "todolist-${var.environment}"
  todo_backend_source_dir    = abspath(var.todo_backend_source_dir)
  todo_frontend_source_dir   = abspath(var.todo_frontend_source_dir)
  todo_artifacts_dir         = "${path.module}/.terraform-artifacts/todolist"
  todo_backend_archive_path  = "${local.todo_artifacts_dir}/backend.zip"
  todo_frontend_archive_path = "${local.todo_artifacts_dir}/frontend.zip"
  todo_backend_source_hash = sha256(join("", [
    for file_name in sort(fileset(local.todo_backend_source_dir, "**")) :
    filesha256("${local.todo_backend_source_dir}/${file_name}")
  ]))
  todo_frontend_source_hash = sha256(join("", [
    for file_name in sort(fileset(local.todo_frontend_source_dir, "**")) :
    filesha256("${local.todo_frontend_source_dir}/${file_name}")
  ]))
}

resource "google_project_service" "todo_required" {
  for_each = var.enable_todo_prototype ? toset([
    "apigateway.googleapis.com",
    "artifactregistry.googleapis.com",
    "cloudbuild.googleapis.com",
    "cloudfunctions.googleapis.com",
    "run.googleapis.com",
    "secretmanager.googleapis.com",
    "servicecontrol.googleapis.com",
    "servicemanagement.googleapis.com",
    "vpcaccess.googleapis.com"
  ]) : toset([])

  project            = var.project_id
  service            = each.value
  disable_on_destroy = false
}

data "google_compute_network" "todo_vpc" {
  count   = var.enable_todo_prototype ? 1 : 0
  name    = "${var.app_name}-${var.environment}-vpc"
  project = var.project_id

  depends_on = [module.networking]
}

data "google_sql_database_instance" "todo" {
  count   = var.enable_todo_prototype ? 1 : 0
  project = var.project_id
  name    = var.todo_cloudsql_instance_name
}

resource "google_sql_database" "todo" {
  count    = var.enable_todo_prototype ? 1 : 0
  project  = var.project_id
  name     = var.todo_db_name
  instance = data.google_sql_database_instance.todo[0].name
}

resource "random_password" "todo_db" {
  count   = var.enable_todo_prototype ? 1 : 0
  length  = 24
  special = false
}

resource "google_sql_user" "todo" {
  count    = var.enable_todo_prototype ? 1 : 0
  project  = var.project_id
  name     = var.todo_db_user
  instance = data.google_sql_database_instance.todo[0].name
  password = random_password.todo_db[0].result
}

resource "google_secret_manager_secret" "todo_db_password" {
  count     = var.enable_todo_prototype ? 1 : 0
  secret_id = "${local.todo_prefix}-db-password"

  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "todo_db_password" {
  count       = var.enable_todo_prototype ? 1 : 0
  secret      = google_secret_manager_secret.todo_db_password[0].id
  secret_data = random_password.todo_db[0].result
}

resource "google_service_account" "todo_backend" {
  count        = var.enable_todo_prototype ? 1 : 0
  account_id   = "${local.todo_prefix}-be-sa"
  display_name = "Todo backend function service account"
}

resource "google_service_account" "todo_frontend" {
  count        = var.enable_todo_prototype ? 1 : 0
  account_id   = "${local.todo_prefix}-fe-sa"
  display_name = "Todo frontend function service account"
}

resource "google_service_account" "todo_gateway" {
  count        = var.enable_todo_prototype ? 1 : 0
  account_id   = "${local.todo_prefix}-gw-sa"
  display_name = "Todo API Gateway service account"
}

resource "google_project_iam_member" "todo_backend_roles" {
  for_each = var.enable_todo_prototype ? toset([
    "roles/cloudsql.client",
    "roles/logging.logWriter",
    "roles/monitoring.metricWriter",
    "roles/secretmanager.secretAccessor",
    "roles/vpcaccess.user"
  ]) : toset([])

  project = var.project_id
  role    = each.value
  member  = "serviceAccount:${google_service_account.todo_backend[0].email}"
}

resource "google_project_iam_member" "todo_frontend_roles" {
  for_each = var.enable_todo_prototype ? toset([
    "roles/logging.logWriter",
    "roles/monitoring.metricWriter"
  ]) : toset([])

  project = var.project_id
  role    = each.value
  member  = "serviceAccount:${google_service_account.todo_frontend[0].email}"
}

resource "google_vpc_access_connector" "todo" {
  count         = var.enable_todo_prototype ? 1 : 0
  project       = var.project_id
  name          = "${local.todo_prefix}-connector"
  region        = var.region
  ip_cidr_range = var.todo_vpc_connector_cidr
  network       = data.google_compute_network.todo_vpc[0].name
  min_instances = 2
  max_instances = 3

  depends_on = [google_project_service.todo_required]
}

resource "google_storage_bucket" "todo_function_source" {
  count                       = var.enable_todo_prototype ? 1 : 0
  name                        = "${var.project_id}-${var.environment}-todo-src"
  project                     = var.project_id
  location                    = upper(var.region)
  uniform_bucket_level_access = true

  depends_on = [google_project_service.todo_required]
}

resource "terraform_data" "todo_backend_archive" {
  count = var.enable_todo_prototype ? 1 : 0

  triggers_replace = {
    source_hash = local.todo_backend_source_hash
  }

  provisioner "local-exec" {
    interpreter = ["/bin/bash", "-c"]
    command     = "mkdir -p '${local.todo_artifacts_dir}' && cd '${local.todo_backend_source_dir}' && zip -qrX '${local.todo_backend_archive_path}' ."
  }
}

resource "terraform_data" "todo_frontend_archive" {
  count = var.enable_todo_prototype ? 1 : 0

  triggers_replace = {
    source_hash = local.todo_frontend_source_hash
  }

  provisioner "local-exec" {
    interpreter = ["/bin/bash", "-c"]
    command     = "mkdir -p '${local.todo_artifacts_dir}' && cd '${local.todo_frontend_source_dir}' && zip -qrX '${local.todo_frontend_archive_path}' ."
  }
}

resource "google_storage_bucket_object" "todo_backend_archive" {
  count        = var.enable_todo_prototype ? 1 : 0
  name         = "backend-${local.todo_backend_source_hash}.zip"
  bucket       = google_storage_bucket.todo_function_source[0].name
  source       = local.todo_backend_archive_path
  content_type = "application/zip"

  depends_on = [terraform_data.todo_backend_archive]
}

resource "google_storage_bucket_object" "todo_frontend_archive" {
  count        = var.enable_todo_prototype ? 1 : 0
  name         = "frontend-${local.todo_frontend_source_hash}.zip"
  bucket       = google_storage_bucket.todo_function_source[0].name
  source       = local.todo_frontend_archive_path
  content_type = "application/zip"

  depends_on = [terraform_data.todo_frontend_archive]
}

resource "google_cloudfunctions2_function" "todo_backend" {
  count       = var.enable_todo_prototype ? 1 : 0
  provider    = google-beta
  project     = var.project_id
  name        = "${local.todo_prefix}-backend"
  location    = var.region
  description = "Prototype todo backend function"

  build_config {
    runtime     = "nodejs20"
    entry_point = "todoApi"

    source {
      storage_source {
        bucket = google_storage_bucket.todo_function_source[0].name
        object = google_storage_bucket_object.todo_backend_archive[0].name
      }
    }
  }

  service_config {
    available_memory               = "256M"
    timeout_seconds                = 60
    min_instance_count             = 0
    max_instance_count             = 2
    ingress_settings               = "ALLOW_ALL"
    all_traffic_on_latest_revision = true
    service_account_email          = google_service_account.todo_backend[0].email
    vpc_connector                  = google_vpc_access_connector.todo[0].id
    vpc_connector_egress_settings  = "PRIVATE_RANGES_ONLY"
    environment_variables = {
      DB_HOST    = data.google_sql_database_instance.todo[0].private_ip_address
      DB_NAME    = google_sql_database.todo[0].name
      DB_USER    = google_sql_user.todo[0].name
      DB_PORT    = "5432"
      NODE_ENV   = "development"
      PROJECT_ID = var.project_id
    }

    secret_environment_variables {
      key        = "DB_PASSWORD"
      project_id = var.project_id
      secret     = google_secret_manager_secret.todo_db_password[0].secret_id
      version    = "latest"
    }
  }

  depends_on = [
    google_project_service.todo_required,
    google_secret_manager_secret_version.todo_db_password,
    google_project_iam_member.todo_backend_roles
  ]
}

resource "google_api_gateway_api" "todo" {
  count    = var.enable_todo_prototype ? 1 : 0
  provider = google-beta
  project  = var.project_id
  api_id   = "${local.todo_prefix}-api"
}

resource "google_cloudfunctions2_function_iam_member" "todo_backend_gateway_invoker" {
  count          = var.enable_todo_prototype ? 1 : 0
  project        = var.project_id
  location       = var.region
  cloud_function = google_cloudfunctions2_function.todo_backend[0].name
  role           = "roles/cloudfunctions.invoker"
  member         = "serviceAccount:${google_service_account.todo_gateway[0].email}"
}

resource "google_cloud_run_service_iam_member" "todo_backend_gateway_run_invoker" {
  count    = var.enable_todo_prototype ? 1 : 0
  project  = var.project_id
  location = var.region
  service  = google_cloudfunctions2_function.todo_backend[0].name
  role     = "roles/run.invoker"
  member   = "serviceAccount:${google_service_account.todo_gateway[0].email}"
}

resource "google_api_gateway_api_config" "todo" {
  count         = var.enable_todo_prototype ? 1 : 0
  provider      = google-beta
  project       = var.project_id
  api           = google_api_gateway_api.todo[0].api_id
  api_config_id = "${local.todo_prefix}-cfg"

  gateway_config {
    backend_config {
      google_service_account = google_service_account.todo_gateway[0].email
    }
  }

  openapi_documents {
    document {
      path = "todo-openapi.yaml"
      contents = base64encode(templatefile("${path.module}/todo-openapi.yaml.tpl", {
        backend_address  = google_cloudfunctions2_function.todo_backend[0].service_config[0].uri
        backend_audience = "${google_cloudfunctions2_function.todo_backend[0].service_config[0].uri}/"
      }))
    }
  }

  lifecycle {
    create_before_destroy = true
  }

  depends_on = [
    google_cloudfunctions2_function_iam_member.todo_backend_gateway_invoker,
    google_cloud_run_service_iam_member.todo_backend_gateway_run_invoker
  ]
}

resource "google_api_gateway_gateway" "todo" {
  count      = var.enable_todo_prototype ? 1 : 0
  provider   = google-beta
  project    = var.project_id
  region     = var.region
  gateway_id = "${local.todo_prefix}-gateway"
  api_config = google_api_gateway_api_config.todo[0].id
}

resource "google_cloudfunctions2_function" "todo_frontend" {
  count       = var.enable_todo_prototype ? 1 : 0
  provider    = google-beta
  project     = var.project_id
  name        = "${local.todo_prefix}-frontend"
  location    = var.region
  description = "Prototype todo frontend function"

  build_config {
    runtime     = "nodejs20"
    entry_point = "todoFrontend"

    source {
      storage_source {
        bucket = google_storage_bucket.todo_function_source[0].name
        object = google_storage_bucket_object.todo_frontend_archive[0].name
      }
    }
  }

  service_config {
    available_memory               = "256M"
    timeout_seconds                = 60
    min_instance_count             = 0
    max_instance_count             = 2
    ingress_settings               = "ALLOW_INTERNAL_AND_GCLB"
    all_traffic_on_latest_revision = true
    service_account_email          = google_service_account.todo_frontend[0].email
    environment_variables = {
      API_BASE_URL = "https://${google_api_gateway_gateway.todo[0].default_hostname}"
      NODE_ENV     = "development"
    }
  }

  depends_on = [
    google_project_service.todo_required,
    google_api_gateway_gateway.todo,
    google_project_iam_member.todo_frontend_roles
  ]
}

resource "google_cloudfunctions2_function_iam_member" "todo_frontend_public_invoker" {
  count          = var.enable_todo_prototype ? 1 : 0
  project        = var.project_id
  location       = var.region
  cloud_function = google_cloudfunctions2_function.todo_frontend[0].name
  role           = "roles/cloudfunctions.invoker"
  member         = "allUsers"
}

resource "google_cloud_run_service_iam_member" "todo_frontend_public_run_invoker" {
  count    = var.enable_todo_prototype ? 1 : 0
  project  = var.project_id
  location = var.region
  service  = google_cloudfunctions2_function.todo_frontend[0].name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

resource "google_compute_region_network_endpoint_group" "todo_frontend" {
  count                 = var.enable_todo_prototype ? 1 : 0
  provider              = google-beta
  project               = var.project_id
  name                  = "${local.todo_prefix}-frontend-neg"
  region                = var.region
  network_endpoint_type = "SERVERLESS"

  cloud_function {
    function = google_cloudfunctions2_function.todo_frontend[0].name
  }

  depends_on = [
    google_cloudfunctions2_function_iam_member.todo_frontend_public_invoker,
    google_cloud_run_service_iam_member.todo_frontend_public_run_invoker
  ]
}

resource "google_compute_backend_service" "todo_frontend" {
  count                           = var.enable_todo_prototype ? 1 : 0
  project                         = var.project_id
  name                            = "${local.todo_prefix}-frontend-bes"
  protocol                        = "HTTP"
  load_balancing_scheme           = "EXTERNAL_MANAGED"
  timeout_sec                     = 30
  connection_draining_timeout_sec = 0

  backend {
    group = google_compute_region_network_endpoint_group.todo_frontend[0].id
  }
}

resource "google_compute_url_map" "todo_frontend" {
  count           = var.enable_todo_prototype ? 1 : 0
  project         = var.project_id
  name            = "${local.todo_prefix}-frontend-map"
  default_service = google_compute_backend_service.todo_frontend[0].id
}

resource "google_compute_target_http_proxy" "todo_frontend" {
  count   = var.enable_todo_prototype ? 1 : 0
  project = var.project_id
  name    = "${local.todo_prefix}-frontend-proxy"
  url_map = google_compute_url_map.todo_frontend[0].id
}

resource "google_compute_global_address" "todo_frontend" {
  count   = var.enable_todo_prototype ? 1 : 0
  project = var.project_id
  name    = "${local.todo_prefix}-frontend-ip"
}

resource "google_compute_global_forwarding_rule" "todo_frontend" {
  count                 = var.enable_todo_prototype ? 1 : 0
  project               = var.project_id
  name                  = "${local.todo_prefix}-frontend-fr"
  target                = google_compute_target_http_proxy.todo_frontend[0].id
  ip_address            = google_compute_global_address.todo_frontend[0].address
  load_balancing_scheme = "EXTERNAL_MANAGED"
  port_range            = "80"
}
