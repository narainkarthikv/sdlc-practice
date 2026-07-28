#!/bin/sh
set -eu

template="/usr/share/nginx/html/runtime-config.template.js"
output="/usr/share/nginx/html/runtime-config.js"

if [ -f "$template" ]; then
  envsubst '${VITE_API_BASE_URL} ${VITE_AGENT_BASE_URL}' < "$template" > "$output"
fi
