#!/usr/bin/env bash
set -euo pipefail

# Idempotent LXD/LXC provisioning script for OpenUI
# - If the container exists, it will update the code, rebuild, and restart the service
# - If not, it will create the profile (if needed), launch the container and provision it

CONTAINER_NAME="openui"
IMAGE="images:ubuntu/24.04"
PROFILE_NAME="openui-profile"
REPO_URL="https://github.com/rcmiller01/openUI.git"

function profile_exists() {
  lxc profile show "${PROFILE_NAME}" >/dev/null 2>&1
}

function container_exists() {
  lxc info "${CONTAINER_NAME}" >/dev/null 2>&1
}

function ensure_profile() {
  if profile_exists; then
    echo "Profile ${PROFILE_NAME} already exists"
    return
  fi

  echo "Creating profile ${PROFILE_NAME}"
  lxc profile create "${PROFILE_NAME}"
  lxc profile edit "${PROFILE_NAME}" <<'YAML'
config:
  user.network_mode: "bridged"
  limits.cpu: "2"
  limits.memory: 2GB
description: "Profile for OpenUI container (basic limits and bridged networking)"
devices:
  eth0:
    name: eth0
    nictype: bridged
    parent: lxdbr0
    type: nic
  root:
    path: /
    pool: default
    type: disk
YAML
}

function provision_new_container() {
  echo "Launching container ${CONTAINER_NAME} from ${IMAGE}"
  lxc launch "${IMAGE}" "${CONTAINER_NAME}" -p default -p "${PROFILE_NAME}"

  echo "Waiting for network"
  lxc exec "${CONTAINER_NAME}" -- bash -c 'for i in {1..30}; do ip -4 addr show eth0 && break || sleep 1; done'

  echo "Provisioning container (installing packages, cloning repo, building)"
  lxc exec "${CONTAINER_NAME}" -- bash -lc "
    set -euo pipefail
    apt-get update -y
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
      build-essential git curl ca-certificates python3 python3-venv python3-pip ufw
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs

    rm -rf /opt/openui || true
    git clone ${REPO_URL} /opt/openui
    cd /opt/openui
    python3 -m venv .venv
    .venv/bin/pip install -U pip
    .venv/bin/pip install . || true
    if [ -f backend/requirements.txt ]; then .venv/bin/pip install -r backend/requirements.txt || true; fi
    cd frontend && npm ci && npm run build || true
  "

  echo "Create env and systemd service"
  lxc exec "${CONTAINER_NAME}" -- bash -lc "
    cat >/etc/openui.env <<'EOF'
OPENROUTER_API_KEY=
OLLAMA_BASE_URL=http://localhost:11434
BACKEND_HOST=0.0.0.0
BACKEND_PORT=1420
FRONTEND_HOST=0.0.0.0
FRONTEND_PORT=1420
DEV_MODE=false
LOG_LEVEL=info
EOF

    cat >/etc/systemd/system/openui-backend.service <<'SERVICE'
[Unit]
Description=OpenUI backend (Uvicorn)
After=network.target

[Service]
User=root
WorkingDirectory=/opt/openui
EnvironmentFile=/etc/openui.env
ExecStart=/opt/openui/.venv/bin/uvicorn backend.main:app --host ${BACKEND_HOST:-0.0.0.0} --port ${BACKEND_PORT:-1420} --workers 1
Restart=on-failure
KillMode=process

[Install]
WantedBy=multi-user.target
SERVICE

    systemctl daemon-reload || true
    systemctl enable --now openui-backend.service || true
  "

  lxc exec "${CONTAINER_NAME}" -- bash -lc 'ufw allow 1420/tcp; ufw --force enable || true'
  echo "Provision complete"
}

function update_existing_container() {
  echo "Container ${CONTAINER_NAME} exists — updating repository and rebuilding"
  lxc exec "${CONTAINER_NAME}" -- bash -lc "
    set -euo pipefail
    if [ -d /opt/openui ]; then
      cd /opt/openui
      git fetch --all --prune || true
      git reset --hard origin/main || true
      .venv/bin/pip install -U pip || true
      .venv/bin/pip install . || true
      cd frontend && npm ci && npm run build || true
      systemctl restart openui-backend.service || true
    else
      echo '/opt/openui not found, running initial provisioning steps'
      exit 1
    fi
  " || provision_new_container
}

# Main
ensure_profile
if container_exists; then
  update_existing_container
else
  provision_new_container
fi

echo "Done. To view logs: lxc exec ${CONTAINER_NAME} -- journalctl -u openui-backend -f"
