#!/usr/bin/env bash
set -euo pipefail
# Simple healthcheck script for the Open-Deep-Coder backend deployed via docker-compose
# Usage: healthcheck.sh [container-name] [compose-file]

CONTAINER_NAME=${1:-open-deep-coder-ci}
COMPOSE_FILE=${2:-/opt/open-deep-coder/docker-compose.yml}
HEALTH_URL=${3:-http://127.0.0.1:8000/health}
TAIL=${4:-200}

echo "Checking health $HEALTH_URL"
if ! curl -sSf "$HEALTH_URL" -m 5 -o /tmp/odc-health.json; then
  echo "Health endpoint not reachable. Restarting backend via docker-compose..."
  docker-compose -f "$COMPOSE_FILE" restart backend || true
  exit 1
fi

if ! jq -e '.status=="healthy"' /tmp/odc-health.json >/dev/null 2>&1; then
  echo "Health returned not healthy. Output:"; jq . /tmp/odc-health.json || true
  echo "Restarting backend via docker-compose..."
  docker-compose -f "$COMPOSE_FILE" restart backend || true
  # Save last logs to /var/log for sysadmin review
  docker logs --tail "$TAIL" "$CONTAINER_NAME" > /var/log/open-deep-coder-health.log 2>&1 || true
  exit 2
fi

echo "Service healthy"
exit 0
