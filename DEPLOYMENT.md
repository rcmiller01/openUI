Deployment options for openUI

Overview
--------
This project can be packaged either as a container (server) or a desktop
executable (Tauri/VSC-like shell). Below are minimal recommendations and
trade-offs.

Container (recommended for servers)
- Build: Dockerfile provided.
- Runtime: Run in LXC/Proxmox as an unprivileged container or as a simple
  Docker container behind a reverse proxy.
- Pros: easy CI/CD, predictable runtime, resource isolation, easy scaling.
- Cons: you must manage API keys and local Ollama socket mapping if used.

Desktop executable (Tauri)
- Use the `frontend` code with Tauri to produce native installers.
- Pros: single-user local app, access to local Ollama without network.
- Cons: packaging complexity across platforms, larger binary sizes.

Recommendation
- If you need multi-user or server hosting, prefer container (LXC/Proxmox).
- For a local-first, offline-capable product using Ollama, consider Tauri.

Quick start (Docker)
1. Build: docker build -t openui:latest .
2. Run: docker run -p 8000:8000 --env-file .env openui:latest
