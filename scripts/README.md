# Diagnostic scripts

This folder contains small scripts to collect Docker container diagnostics (logs, inspect, ps, images) and package them for upload.

Files
- `collect_docker_artifacts.sh` — Bash script for Unix-like runners. Produces `artifacts/docker-logs.tgz` by default.
- `collect_docker_artifacts.ps1` — PowerShell script for Windows. Produces `artifacts/docker-logs.zip` and, when `tar` is available, `artifacts/docker-logs.tgz`.

Usage

From repo root (bash):

```bash
./scripts/collect_docker_artifacts.sh [container-name] [outdir] [tail-lines]
# e.g.
./scripts/collect_docker_artifacts.sh open-deep-coder-ci artifacts 1000
```

From PowerShell (Windows):

```powershell
.\scripts\collect_docker_artifacts.ps1 -ContainerName open-deep-coder-ci -OutDir artifacts -Tail 1000
```

Defaults
- container-name: `open-deep-coder-ci`
- outdir: `artifacts`
- tail-lines: `1000` (last N lines of container logs)

Compression and redaction
- The bash script creates a gzipped tarball (`.tgz`) and uses a conservative sed-based redaction for common env keys (PASSWORD, SECRET, API_KEY, TOKEN).
- The PowerShell script creates a ZIP file and will also create a `.tgz` if `tar` is available.
- Redaction is best-effort. If you need stricter rules (e.g., redact any env value matching a regex), open an issue and I can replace the redaction with a small Python sanitizer.

CI integration
- The GitHub Actions workflow runs the bash script on failure and uploads `artifacts/docker-logs.tgz`.

Adjusting tail/compression
- To change tail length, pass the third argument (bash) or `-Tail` parameter (PowerShell).
- To switch compression formats, modify the scripts or use your preferred tooling to recompress the resulting files.
