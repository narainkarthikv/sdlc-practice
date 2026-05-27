#!/bin/bash
# scripts/create-state-buckets.sh

set -e

PROJECT_ID=${1:-"narainkarthik812-practice-dev"}
ENVIRONMENTS=("dev" "staging" "prod")

echo "Creating Terraform state buckets for project: $PROJECT_ID"

for env in "${ENVIRONMENTS[@]}"; do
    BUCKET_NAME="ownlyst-tf-state-${env}"
    
    echo "Creating bucket: $BUCKET_NAME"
    
    # Create bucket with versioning enabled
    gsutil mb -p "$PROJECT_ID" -l asia-south1 "gs://$BUCKET_NAME"
    
    # Enable versioning
    gsutil versioning set on "gs://$BUCKET_NAME"
    
    # Set uniform bucket-level access
    gsutil uniformbucketlevelaccess set on "gs://$BUCKET_NAME"
    
    # Set lifecycle policy to clean up old versions
    cat > /tmp/lifecycle-${env}.json << EOF
{
  "lifecycle": {
    "rule": [
      {
        "action": {"type": "Delete"},
        "condition": {
          "age": 30,
          "isLive": false
        }
      }
    ]
  }
}
EOF
    
    gsutil lifecycle set /tmp/lifecycle-${env}.json "gs://$BUCKET_NAME"
    rm /tmp/lifecycle-${env}.json
    
    echo "✅ Bucket $BUCKET_NAME created successfully"
done

echo "🎉 All state buckets created!"