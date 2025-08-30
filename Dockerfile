### Builder: compile the frontend using Node
FROM node:20-alpine AS ui-builder
WORKDIR /ui
# Use root package.json which contains the scripts and deps
COPY package.json package-lock.json ./
COPY frontend ./frontend
COPY frontend/tsconfig.json frontend/vite.config.ts ./frontend/
RUN npm ci --silent
RUN npm run build

### Runtime: Python app that serves built frontend
FROM python:3.13-slim
WORKDIR /app
ENV PYTHONUNBUFFERED=1
ARG TEST_DEPS=0

# Copy package metadata and install package from pyproject.toml
# This makes the project the single source of truth for dependencies.
COPY pyproject.toml README.md ./
RUN pip install --no-cache-dir -U pip setuptools wheel && \
    pip wheel --no-deps --wheel-dir /wheels .
COPY . /app
RUN pip install --no-cache-dir /wheels/*.whl

# Optional test dependencies (installed when building for CI/test)
RUN if [ "${TEST_DEPS}" = "1" ]; then \
            pip install --no-cache-dir pytest requests; \
        fi

# Copy built frontend assets from builder
COPY --from=ui-builder /ui/dist ./frontend/dist

EXPOSE 8000
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
