# Contributing to Open-Deep-Coder

Thank you for your interest in contributing to Open-Deep-Coder! This document provides guidelines for contributing to this multi-agent coding workflow project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Standards](#code-standards)
- [Testing Guidelines](#testing-guidelines)
- [Security Guidelines](#security-guidelines)
- [Submitting Changes](#submitting-changes)

## Code of Conduct

Please be respectful and professional in all interactions. We aim to create an inclusive environment for all contributors.

## Getting Started

### Prerequisites

- Python 3.11 or later
- Git
- A virtual environment tool (venv, conda, etc.)

### Setting Up Development Environment

1. **Clone the repository:**
   ```bash
   git clone https://github.com/rcmiller01/openUI.git
   cd openUI
   ```

2. **Create and activate a virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install development dependencies:**
   ```bash
   pip install -e .[dev]
   ```

4. **Install pre-commit hooks:**
   ```bash
   pre-commit install
   ```

## Development Workflow

### Agent-Based Development Process

This project follows a multi-agent workflow as specified in `agents.md`:

1. **PLAN** - Read repo + backlog, update `plan.md`, propose atomic tasks
2. **IMPLEMENT** - Create/edit files, run commands, generate code + unit tests
3. **VERIFY** - Run tests/linters/type checks; summarize results
4. **REVIEW** - Perform diff review, security scan checklist
5. **GATE** - Request approval for PRs if pass criteria met

### Task Management

- All work should be tracked in `plan.md` with clear acceptance criteria
- Follow the OD-{number} task naming convention
- Keep changes under 500 LOC unless explicitly authorized
- Always write/extend tests alongside code changes

## Code Standards

### Python Code Style

- **Formatting:** Use `black` for code formatting
- **Linting:** Use `ruff` for linting (configured in `pyproject.toml`)
- **Type Hints:** Use type hints for all functions and class methods
- **Docstrings:** Use Google-style docstrings for all public functions

### Code Quality Checks

Run these commands before submitting:

```bash
# Format code
black .

# Lint code
ruff check .

# Type checking
mypy src

# Run tests
pytest

# Security scanning
bandit -r src/
safety check
```

## Testing Guidelines

### Test Requirements

- **Coverage:** Maintain ≥70% test coverage
- **Test Types:** Write both unit tests and integration tests
- **Test Organization:** Mirror the `src/` structure in `tests/`
- **Test Naming:** Use descriptive test names that explain the scenario

### Running Tests

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=src --cov-report=html

# Run specific test file
pytest tests/test_math_ops.py

# Run tests with specific markers
pytest -m "not slow"
```

### Test Markers

- `@pytest.mark.unit` - Unit tests
- `@pytest.mark.integration` - Integration tests
- `@pytest.mark.slow` - Tests that take longer to run

## Security Guidelines

Before submitting any changes, ensure:

- [ ] No secrets, API keys, or credentials in code
- [ ] Dependencies are pinned and from trusted sources
- [ ] Input validation is proper and comprehensive
- [ ] Logging doesn't expose sensitive information
- [ ] All licenses are respected and documented

## Submitting Changes

### Pull Request Process

1. **Branch:** Create a feature branch from `main`
   ```bash
   git checkout -b feature/od-{number}-brief-description
   ```

2. **Develop:** Make your changes following the guidelines above

3. **Test:** Ensure all tests pass and coverage requirements are met

4. **Commit:** Use conventional commit messages:
   ```
   feat: add new agent coordination system
   fix: resolve race condition in parallel implementers
   docs: update API documentation for tool adapters
   test: add integration tests for verifier workflow
   ```

5. **Push:** Push your branch and create a pull request

### Pull Request Requirements

Your PR must include:

- [ ] Clear description of changes and rationale
- [ ] Tests for new functionality
- [ ] Documentation updates if needed
- [ ] Security checklist completion
- [ ] All CI checks passing

### Review Process

1. **Automated Checks:** All CI checks must pass
2. **Code Review:** At least one maintainer review required
3. **Security Review:** Security checklist verified
4. **Integration Testing:** Manual testing of critical workflows

## Agent Roles and Responsibilities

When contributing, you may take on different agent roles:

### Planner
- Analyze requirements and break down into atomic tasks
- Update `plan.md` with clear acceptance criteria
- Coordinate with other agents on task dependencies

### Implementer
- Write code that meets acceptance criteria
- Create comprehensive tests
- Document design decisions and tradeoffs

### Verifier
- Run all quality checks (tests, linting, type checking)
- Generate test reports and coverage analysis
- Identify and report issues

### Reviewer
- Review code changes for quality and security
- Validate test coverage and documentation
- Enforce project standards

### Researcher
- Research new tools, frameworks, and best practices
- Document findings and recommendations
- Propose integration strategies

## Questions and Support

- **Issues:** Use GitHub Issues for bug reports and feature requests
- **Discussions:** Use GitHub Discussions for questions and ideas
- **Documentation:** Check `agents.md` and `plan.md` for project details

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

*This contributing guide follows the Open-Deep-Coder multi-agent workflow principles.*