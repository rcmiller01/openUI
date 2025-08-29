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

Notes
- The container runs the FastAPI backend on port 8000 and serves the built
  frontend from `/` (if `frontend/dist` exists). Use a reverse proxy
  (Nginx) if you need TLS or additional routing.
- The Dockerfile uses a Node build stage to produce `frontend/dist`. If you
  are developing locally you can also mount your `frontend/dist` into the
  container at `/app/frontend/dist`.

Environment and providers
- ALLOWED_ORIGINS (optional) - comma-separated list of allowed CORS origins.
  Example: ALLOWED_ORIGINS="https://app.example.com,https://admin.example.com"

- Ollama-only (local): set `OLLAMA_BASE_URL=http://localhost:11434` and
  leave `OPENROUTER_API_KEY` empty.

- OpenRouter-only (cloud): set `OPENROUTER_API_KEY=...` and configure
  `OLLAMA_BASE_URL` if you still want a local fallback.

Example run (Ollama-only):

```bash
docker run -p 8000:8000 \
  --env-file .env \
  -e ALLOWED_ORIGINS="http://localhost:1420" \
  openui:latest
```

