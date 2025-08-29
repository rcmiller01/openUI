# Deploying OpenUI with LXD / LXC

This guide shows how to deploy OpenUI in an LXD (Linux container) using the `lxc` CLI.
It also covers Proxmox LXC hints (Proxmox uses a similar LXC runtime) and notes about persistence, networking, and secrets.

Prereqs
- A host with LXD installed and initialized (snap package `lxd` on Ubuntu is common).
- `lxc` CLI configured and you are in the `lxd` group or running as root.
- Sufficient host resources (2 CPU, 2GB RAM recommended minimum for small deployments).

Quick start (one-shot)

1. Copy the repository to the host or allow the container to clone it directly from GitHub.

2. Use the included helper script to launch and provision a container (runs apt, node, python venv, builds frontend):

```bash
# Run from a machine with LXD installed and access to the repository
bash deploy/lxc/launch_openui.sh
```

3. After the script completes, the backend should be running under `systemd` inside the container.
   - Logs: `lxc exec openui -- journalctl -u openui-backend -f`
   - Environment file: `/etc/openui.env` inside the container (populate secrets and keys here).

Manual steps (if you prefer to do each step yourself)

- Create a profile (example in `deploy/lxc/lxd_profile_example.yaml`) or customize one with resource limits and bridged networking.
- Launch a container from a Ubuntu image: `lxc launch images:ubuntu/24.04 openui -p default -p openui-profile`.
- Exec into the container and install runtime packages (python3, nodejs, build-essential, git).
- Clone the repo to `/opt/openui`, create a venv, install dependencies with `pip install .`, and build the frontend `npm ci && npm run build`.
- Create `/etc/openui.env` with secrets: `OPENROUTER_API_KEY`, `OLLAMA_BASE_URL`, etc.
- Create and enable a `systemd` unit similar to `/etc/systemd/system/openui-backend.service` (see `launch_openui.sh` content).

Proxmox notes
- On Proxmox, prefer to create an LXC container using a Debian/Ubuntu template. Use Proxmox GUI or `pct` CLI to create the container.
- Ensure container template includes `systemd` and networking is bridged to the host.
- If using Proxmox, map storage to a dataset for persistent `/opt/openui` if you want to preserve code between upgrades.

Security considerations
- Do not commit secrets to the repo. Use `/etc/openui.env` or a secrets manager and set proper file permissions (600).
- Use UFW or host firewall rules to restrict which IPs can access port 1420.
- Consider running the backend under a dedicated non-root user inside the container.

Persistence and backups
- Use LXD snapshots (`lxc snapshot openui`) before major changes.
- For persistent data (logs, uploaded files), mount a storage volume into the container and point the application at it.

Scaling and production
- For production, consider running behind a reverse proxy on the host (nginx) to provide TLS and host-level rate limiting.
- For high availability, run multiple containers and a load balancer (HAProxy, Traefik) on the host or orchestrator.

Support
- If you want, I can add a Proxmox-specific `pct` helper script and a systemd unit that runs the frontend via `serve` for static files and the backend via uvicorn+gunicorn.
