#!/usr/bin/env bash
set -euo pipefail

# Create a source tarball for release. Uses git archive when possible to include tracked files only.
VERSION=$(git describe --tags --always 2>/dev/null || echo "local")
OUT="open-deep-coder-${VERSION}.tgz"

if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Creating tarball from git HEAD -> $OUT"
  git archive --format=tar --prefix="open-deep-coder-${VERSION}/" HEAD | gzip > "$OUT"
else
  echo "Not a git repo — creating tarball by archiving files (excludes .git and venv) -> $OUT"
  tar --exclude='.git' --exclude='.venv' --exclude='node_modules' --exclude='frontend/dist' -czf "$OUT" .
fi

echo "Created: $OUT"
