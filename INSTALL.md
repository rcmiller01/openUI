# Install & Run — Open-Deep-Coder

This file shows the minimal steps to install and start the backend either using Docker (recommended for production/CI) or locally for development.

Prerequisites
- Docker (for containerized run)
- Python 3.11+ and a virtualenv (for local run)
- Node/npm (only needed if you plan to rebuild the frontend locally)

1) Copy `.env.example` to `.env` and set secrets

```bash
cp .env.example .env
# edit .env and set your OPENROUTER_API_KEY, any passwords, etc.
```

2) Docker (recommended)

Build the image (CI uses TEST_DEPS=1 to include test deps):

```bash
docker build -t open-deep-coder:latest .
```

Run the container (disable Proxmox if you don't have it configured):

```bash
docker run -d --name open-deep-coder -p 8000:8000 --env-file .env -e PROXMOX_ENABLED=false open-deep-coder:latest
```

Visit: http://localhost:8000/health

3) Local Python (development)

Create a virtualenv and install from `pyproject.toml`:

```powershell
python -m venv .venv
. .venv\Scripts\Activate.ps1
pip install -U pip setuptools wheel
pip install .
# or install dev deps if you have them
pip install -r backend/requirements.txt || true
```

Start the backend (from repo root):

```powershell
cd backend
$env:PROXMOX_ENABLED='false'
python -m uvicorn main:app --host 127.0.0.1 --port 8000
```

4) Packaging a release tarball

```bash
./scripts/package_release.sh
```

Notes
- `.env` is gitignored and will not be published. Use `.env.example` as a template.
- If you want the image with test deps (CI style), build with `--build-arg TEST_DEPS=1`.
