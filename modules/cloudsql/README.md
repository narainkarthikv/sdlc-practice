# Cloud SQL Module

Reusable Terraform module for a development Cloud SQL for PostgreSQL instance with:

- tier `db-f1-micro`
- `10GB` SSD storage
- deletion protection enabled (Terraform + API level)
- automated backups retained for 7 days (count-based retention)
- private IP in VPC (private service access range + peering)
- public IP enabled with `0.0.0.0/0` authorized network (dev testing only)

## Notes

- Cloud SQL version is configured as `POSTGRES_17`. Patch version selection (for example `17.9`) is managed by Cloud SQL.
- This template is intentionally permissive for initial dev testing and should be hardened before non-dev use.

## Usage

Call this module from an environment root module and pass:

- `project_id`
- `region`
- `instance_name`
- `vpc_self_link`
- optional overrides (tier, disk, retention, authorized networks)

## Required APIs

- `sqladmin.googleapis.com`
- `servicenetworking.googleapis.com`
- `compute.googleapis.com`
