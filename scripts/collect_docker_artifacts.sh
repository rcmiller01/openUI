#!/usr/bin/env bash
set -euo pipefail
CONTAINER=${1:-open-deep-coder-ci}
OUTDIR=${2:-artifacts}
TAIL=${3:-1000}

mkdir -p "$OUTDIR"
echo "Collecting last $TAIL lines of logs from $CONTAINER into $OUTDIR/container.log"
docker logs --tail "$TAIL" "$CONTAINER" > "$OUTDIR/container.log" 2>&1 || true

echo "Collecting docker inspect into $OUTDIR/container.inspect.json"
docker inspect "$CONTAINER" > "$OUTDIR/container.inspect.json" 2>&1 || true

# Naive redaction of common sensitive env keys
sed -E -i.bak -e 's/("?)([A-Za-z_]*?(PASSWORD|SECRET|API_KEY|TOKEN)[A-Za-z_]*)("?:\s*\")[^\"]*(\")/\1\2\4[REDACTED]\5/Ig' "$OUTDIR/container.inspect.json" || true

docker ps -a > "$OUTDIR/containers.txt" 2>&1 || true
docker images > "$OUTDIR/images.txt" 2>&1 || true

gzip -9 -c "$OUTDIR/container.log" > "$OUTDIR/container.log.gz" || true
# Create a compressed tarball (tgz) containing the key diagnostics
tar -czf "$OUTDIR/docker-logs.tgz" -C "$OUTDIR" container.inspect.json containers.txt images.txt container.log.gz || true
echo "Artifacts written to $OUTDIR/docker-logs.tgz"
echo "Artifacts written to $OUTDIR/docker-logs.tgz"
