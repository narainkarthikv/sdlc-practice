#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

cd "${SCRIPT_DIR}"

echo "Initializing Terraform providers..."
terraform init

echo "Formatting Terraform configuration..."
terraform fmt

echo "Validating Terraform configuration..."
terraform validate

echo "Planning todo prototype infrastructure..."
terraform plan -out=tfplan

echo "Applying todo prototype infrastructure..."
terraform apply tfplan

echo
echo "Todo prototype deployment complete."
echo "Frontend static IP:"
terraform output -raw todo_frontend_static_ip || true
echo "API Gateway hostname:"
terraform output -raw todo_api_gateway_hostname || true
