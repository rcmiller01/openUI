#!/usr/bin/env bash
set -euo pipefail

# Minimal LXD/LXC provisioning script for OpenUI
# Assumptions:
# - LXD is installed and configured on the host (lxc CLI available)
# - This script is run on a machine with permission to manage LXD (root or user in lxd group)

CONTAINER_NAME="openui"
IMAGE="images:ubuntu/24.04"  # LXD image alias; adjust if you prefer a different series
PROFILE_NAME="openui-profile"

echo "Creating LXD profile (if missing) -> $PROFILE_NAME"
if ! lxc profile show "${PROFILE_NAME}" >/dev/null 2>&1; then
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
else
  echo "Profile ${PROFILE_NAME} exists, skipping creation."
fi

echo "Launching container ${CONTAINER_NAME} from ${IMAGE}"
lxc launch "${IMAGE}" "${CONTAINER_NAME}" -p default -p "${PROFILE_NAME}"

echo "Waiting for the container to obtain network connectivity..."
lxc exec "${CONTAINER_NAME}" -- bash -c 'for i in {1..30}; do ip -4 addr show eth0 && break || sleep 1; done'

echo "Updating packages and installing runtime deps inside container"
lxc exec "${CONTAINER_NAME}" -- bash -lc '
  apt-get update -y
  DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
    build-essential git curl ca-certificates python3 python3-venv python3-pip \
    ufw
'

echo "Installing Node.js 20 inside container"
lxc exec "${CONTAINER_NAME}" -- bash -lc '
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
'

echo "Cloning repository into /opt/openui and installing app dependencies"
lxc exec "${CONTAINER_NAME}" -- bash -lc '
  rm -rf /opt/openui || true
  git clone https://github.com/rcmiller01/openUI.git /opt/openui
  cd /opt/openui
  python3 -m venv .venv
  .venv/bin/pip install -U pip
  # prefer editable install via pyproject (pip install .) for reproducible runtime
  .venv/bin/pip install .
  # install backend extra runtime deps if present
  if [ -f backend/requirements.txt ]; then
    .venv/bin/pip install -r backend/requirements.txt || true
  fi
  # build frontend
  cd frontend
  npm ci
  npm run build
'

echo "Creating environment file and systemd service inside container"
# Note: edit /etc/openui.env afterwards to populate secrets/keys
lxc exec "${CONTAINER_NAME}" -- bash -lc '
  cat >/etc/openui.env <<EOF
# OpenUI environment variables - edit values for production
OPENROUTER_API_KEY=
OLLAMA_BASE_URL=http://localhost:11434
BACKEND_HOST=0.0.0.0
BACKEND_PORT=1420
FRONTEND_HOST=0.0.0.0
FRONTEND_PORT=1420
DEV_MODE=false
LOG_LEVEL=info
EOF

  cat >/etc/systemd/system/openui-backend.service <<SERVICE
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
  systemctl enable openui-backend.service || true
  systemctl start openui-backend.service || true
'

echo "Opening firewall port ${FRONTEND_PORT:-1420}"
lxc exec "${CONTAINER_NAME}" -- bash -lc 'ufw allow 1420/tcp; ufw --force enable || true'

echo "Deployment finished. To view logs: lxc exec ${CONTAINER_NAME} -- journalctl -u openui-backend -f"
echo "Edit /etc/openui.env inside container to set secrets (lxc exec ${CONTAINER_NAME} -- /bin/bash)"

echo "Done."
