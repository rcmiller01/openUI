# Open-Deep-Coder Makefile

.PHONY: help init test lint format typecheck security clean install dev-install

# Default target
help: ## Show this help message
	@echo "Open-Deep-Coder Makefile"
	@echo "Available targets:"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

init: ## Initialize the development environment
	python -m venv venv
	@echo "Virtual environment created. Activate with:"
	@echo "  Windows: venv\\Scripts\\activate"
	@echo "  Unix/Mac: source venv/bin/activate"
	@echo "Then run: make dev-install"

dev-install: ## Install development dependencies
	pip install -U pip
	pip install -e .[dev]
	pre-commit install

install: ## Install package only
	pip install -e .

test: ## Run all tests
	pytest

test-cov: ## Run tests with coverage report
	pytest --cov=src --cov-report=html --cov-report=term-missing

test-fast: ## Run tests excluding slow tests
	pytest -m "not slow"

lint: ## Run linting checks
	ruff check .

format: ## Format code with black
	black .

format-check: ## Check code formatting
	black --check .

typecheck: ## Run type checking
	mypy src

security: ## Run security checks
	bandit -r src/
	safety check

quality: lint format-check typecheck ## Run all quality checks

ci: quality test security ## Run full CI pipeline locally

clean: ## Clean up generated files
	rm -rf build/
	rm -rf dist/
	rm -rf *.egg-info/
	rm -rf .pytest_cache/
	rm -rf .mypy_cache/
	rm -rf .ruff_cache/
	rm -rf htmlcov/
	rm -rf .coverage
	find . -type d -name __pycache__ -delete
	find . -type f -name "*.pyc" -delete