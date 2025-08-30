#!/usr/bin/env bash
set -euo pipefail

BASE_URL=${1:-http://localhost:8000}
RETRIES=${2:-5}
SLEEP=${3:-2}

echo "Running sanity checks against $BASE_URL"

for i in $(seq 1 $RETRIES); do
  if curl -sSf "$BASE_URL/health" -m 5 | jq . >/dev/null 2>&1; then
    echo "Health OK"
    break
  fi
  echo "Health not ready (attempt $i). Retrying in $SLEEP seconds..."
  sleep $SLEEP
done

echo "Checking models endpoint"
curl -sSf "$BASE_URL/api/models" -m 10 | jq '.[0:5]' || true

echo "Sanity checks complete"
