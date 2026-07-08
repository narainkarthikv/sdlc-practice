# VPC Network
resource "google_compute_network" "main" {
  name                    = "${var.app_name}-${var.environment}-vpc"
  auto_create_subnetworks = false
  routing_mode           = "GLOBAL"
  
  description = "VPC network for ${var.app_name} ${var.environment} environment"
}

# Subnet for application instances
resource "google_compute_subnetwork" "app_subnet" {
  name          = "${var.app_name}-${var.environment}-app-subnet"
  ip_cidr_range = var.app_subnet_cidr
  region        = var.region
  network       = google_compute_network.main.id
  
  description = "Subnet for application instances"
  
  # Enable private Google access for instances without external IPs
  private_ip_google_access = true
  
  # Secondary IP ranges for GKE pods and services (if needed)
  dynamic "secondary_ip_range" {
    for_each = var.enable_gke ? [1] : []
    content {
      range_name    = "gke-pods"
      ip_cidr_range = var.gke_pods_cidr
    }
  }
  
  dynamic "secondary_ip_range" {
    for_each = var.enable_gke ? [1] : []
    content {
      range_name    = "gke-services"
      ip_cidr_range = var.gke_services_cidr
    }
  }
}

# Subnet for database instances
resource "google_compute_subnetwork" "db_subnet" {
  count = var.enable_database_subnet ? 1 : 0
  
  name          = "${var.app_name}-${var.environment}-db-subnet"
  ip_cidr_range = var.db_subnet_cidr
  region        = var.region
  network       = google_compute_network.main.id
  
  description = "Subnet for database instances"
  
  private_ip_google_access = true
}

# Cloud Router for NAT Gateway
resource "google_compute_router" "main" {
  name    = "${var.app_name}-${var.environment}-router"
  region  = var.region
  network = google_compute_network.main.id
  
  description = "Cloud Router for NAT Gateway"
}

# NAT Gateway for outbound internet access
resource "google_compute_router_nat" "main" {
  name   = "${var.app_name}-${var.environment}-nat"
  router = google_compute_router.main.name
  region = var.region
  
  nat_ip_allocate_option             = "MANUAL_ONLY"
  nat_ips                           = google_compute_address.nat.*.self_link
  source_subnetwork_ip_ranges_to_nat = "ALL_SUBNETWORKS_ALL_IP_RANGES"
  
  log_config {
    enable = true
    filter = "ERRORS_ONLY"
  }
}

# Static IP addresses for NAT Gateway
resource "google_compute_address" "nat" {
  count = var.nat_ip_count
  
  name   = "${var.app_name}-${var.environment}-nat-ip-${count.index + 1}"
  region = var.region
  
  description = "Static IP for NAT Gateway ${count.index + 1}"
}

# Firewall rule to allow internal communication
resource "google_compute_firewall" "allow_internal" {
  name    = "${var.app_name}-${var.environment}-allow-internal"
  network = google_compute_network.main.name
  
  description = "Allow internal communication within VPC"
  
  allow {
    protocol = "tcp"
    ports    = ["0-65535"]
  }
  
  allow {
    protocol = "udp"
    ports    = ["0-65535"]
  }
  
  allow {
    protocol = "icmp"
  }
  
  source_ranges = [var.app_subnet_cidr]
  target_tags   = ["internal"]
}

# Firewall rule to allow SSH access
resource "google_compute_firewall" "allow_ssh" {
  name    = "${var.app_name}-${var.environment}-allow-ssh"
  network = google_compute_network.main.name
  
  description = "Allow SSH access from specified IP ranges"
  
  allow {
    protocol = "tcp"
    ports    = ["22"]
  }
  
  source_ranges = var.allowed_ip_ranges
  target_tags   = ["ssh-access"]
}

# Firewall rule to allow HTTP/HTTPS traffic
resource "google_compute_firewall" "allow_http_https" {
  name    = "${var.app_name}-${var.environment}-allow-http-https"
  network = google_compute_network.main.name
  
  description = "Allow HTTP and HTTPS traffic from internet"
  
  allow {
    protocol = "tcp"
    ports    = ["80", "443"]
  }
  
  source_ranges = ["0.0.0.0/0"]
  target_tags   = ["web-server"]
}

# Firewall rule to allow health checks
resource "google_compute_firewall" "allow_health_checks" {
  name    = "${var.app_name}-${var.environment}-allow-health-checks"
  network = google_compute_network.main.name
  
  description = "Allow health checks from Google load balancers"
  
  allow {
    protocol = "tcp"
    ports    = ["80", "443", "8080"]
  }
  
  # Google's health check IP ranges
  source_ranges = [
    "35.191.0.0/16",
    "130.211.0.0/22"
  ]
  
  target_tags = ["web-server"]
}