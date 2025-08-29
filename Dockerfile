### Builder: compile the frontend using Node
FROM node:20-alpine AS ui-builder
WORKDIR /ui
COPY frontend/package.json frontend/package-lock.json ./
COPY frontend/tsconfig.json frontend/vite.config.ts ./
COPY frontend/src ./src
COPY frontend/public ./public
RUN npm ci --silent
RUN npm run build

### Runtime: Python app that serves built frontend
FROM python:3.13-slim
WORKDIR /app
ENV PYTHONUNBUFFERED=1

# Copy package metadata and install package from pyproject.toml
# This makes the project the single source of truth for dependencies.
COPY pyproject.toml setup.cfg README.md ./
RUN pip install --no-cache-dir -U pip setuptools wheel
COPY . /app
RUN pip install --no-cache-dir .

# Copy built frontend assets from builder
COPY --from=ui-builder /ui/dist ./frontend/dist

EXPOSE 8000
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
