FROM python:3.13-slim
WORKDIR /app
COPY pyproject.toml setup.cfg README.md ./
RUN pip install --no-cache-dir -U pip setuptools wheel
RUN pip install --no-cache-dir .[dev]
COPY . /app
EXPOSE 8000
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
