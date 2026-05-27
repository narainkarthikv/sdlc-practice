#!/bin/bash
# scripts/setup-triggers.sh

set -e

# Configuration
REPO_NAME="terraform-practice"
REPO_OWNER="narainkarthikv"
APP_NAME="ownlyst"

echo "🔧 Setting up Cloud Build triggers..."

# Development trigger (on pushes to feature branches)
gcloud beta builds triggers create github \
  --repo-name="$REPO_NAME" \
  --repo-owner="$REPO_OWNER" \
  --branch-pattern="^feature/.*|^dev$" \
  --build-config="cloudbuild/cloudbuild-dev.yaml" \
  --description="Deploy to development environment" \
  --name="${APP_NAME}-dev-trigger"

echo "✅ Development trigger created"

# Staging trigger (on pushes to release branches)
gcloud beta builds triggers create github \
  --repo-name="$REPO_NAME" \
  --repo-owner="$REPO_OWNER" \
  --branch-pattern="^release/.*|^staging$" \
  --build-config="cloudbuild/cloudbuild-staging.yaml" \
  --description="Deploy to staging environment" \
  --name="${APP_NAME}-staging-trigger"

echo "✅ Staging trigger created"

# Production trigger (on tags only)
gcloud beta builds triggers create github \
  --repo-name="$REPO_NAME" \
  --repo-owner="$REPO_OWNER" \
  --tag-pattern="^v[0-9]+\.[0-9]+\.[0-9]+$" \
  --build-config="cloudbuild/cloudbuild-prod.yaml" \
  --description="Deploy to production environment" \
  --name="${APP_NAME}-prod-trigger"

echo "✅ Production trigger created"

echo "🎉 All Cloud Build triggers configured!"
echo ""
echo "Trigger summary:"
echo "  📝 Development: feature/* branches and 'dev' branch"
echo "  🧪 Staging: release/* branches and 'staging' branch"  
echo "  🚀 Production: version tags (v1.0.0, v2.1.3, etc.)"
echo ""
echo "To deploy:"
echo "  - Push to feature/my-feature → deploys to dev"
echo "  - Push to release/v1.0.0 → deploys to staging"
echo "  - Tag and push v1.0.0 → deploys to production"