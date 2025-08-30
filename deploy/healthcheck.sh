#!/usr/bin/env bash
set -euo pipefail
# Simple healthcheck script for the Open-Deep-Coder backend deployed via docker-compose
# Usage: healthcheck.sh [container-name] [compose-file]

CONTAINER_NAME=${1:-open-deep-coder-ci}
COMPOSE_FILE=${2:-/opt/open-deep-coder/docker-compose.yml}
HEALTH_URL=${3:-http://127.0.0.1:8000/health}
TAIL=${4:-200}
WEBHOOK_URL=${5:-}

MAX_RETRIES=5
RETRY_BASE=2
SLEEP=1

echo "Checking health $HEALTH_URL"
for attempt in $(seq 1 $MAX_RETRIES); do
  if curl -sSf "$HEALTH_URL" -m 5 -o /tmp/odc-health.json; then
    if jq -e '.status=="healthy"' /tmp/odc-health.json >/dev/null 2>&1; then
      echo "Service healthy"
      exit 0
    else
      echo "Health endpoint returned non-healthy payload (attempt $attempt)"
    fi
  else
    echo "Health endpoint unreachable (attempt $attempt)"
  fi

  if [ $attempt -lt $MAX_RETRIES ]; then
    backoff=$((RETRY_BASE ** attempt))
    sleep $backoff
    echo "Retrying in $backoff seconds..."
  fi
done

echo "Persistent health failure after $MAX_RETRIES attempts. Restarting backend via docker-compose..."
docker-compose -f "$COMPOSE_FILE" restart backend || true
docker logs --tail "$TAIL" "$CONTAINER_NAME" > /var/log/open-deep-coder-health.log 2>&1 || true

if [ -n "$WEBHOOK_URL" ]; then
  echo "Sending alert to webhook"
  payload=$(jq -n --arg host "$(hostname)" --arg status "unhealthy" '{host:$host,status:$status,service:"open-deep-coder"}')
  curl -sSf -X POST -H "Content-Type: application/json" -d "$payload" "$WEBHOOK_URL" || true
fi

exit 2
