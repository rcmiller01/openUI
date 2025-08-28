# Open‑Deep‑Coder

A multi‑agent coding workflow (Planner → Implementer → Verifier → Reviewer) running on a LangGraph/MCP‑style toolbelt.

## Overview

Open‑Deep‑Coder is a graph‑of‑agents for software work. It reuses the research pattern (plan → act → observe → critique → iterate) but swaps in coding tools and code‑quality gates.

## Architecture

The system consists of 6 specialized agents:

1. **Orchestrator** - Maintains state machine and task graph
2. **Planner** - Reads repo + backlog, proposes milestone goals and atomic tasks
3. **Implementer** - Edits/creates code and tests
4. **Verifier** - Runs tests, linters, type checks, and coverage
5. **Reviewer** - Reviews diffs, security scans, and prepares PRs
6. **Researcher** (optional) - Looks up library/API usage and proposes alternatives

## Core Workflow

1. **PLAN** — read repo + backlog, update `plan.md`, propose atomic tasks
2. **IMPLEMENT** — create/edit files, run commands, generate code + unit tests
3. **VERIFY** — run tests/linters/type checks; summarize results to `test_report.json`
4. **REVIEW** — perform diff review, security scan checklist, prepare `pr_body.md`
5. **GATE** — if pass criteria met, request human approval to open PR; else iterate

## Quickstart

```bash
# Clone the repository
git clone https://github.com/rcmiller01/openUI.git
cd openUI

# Set up development environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -e .[dev]

# Run tests
pytest

# Run quality checks
ruff check .
black --check .
mypy src
```

## Features

- **Multi-agent coordination** with specialized roles
- **Quality gates** enforcing tests, linting, and type checking
- **Security-first approach** with comprehensive checklists
- **Automated workflows** with GitHub Actions CI/CD
- **Extensible tool system** supporting MCP and LangChain tools
- **Human approval gates** for critical operations

## Project Structure

```
open-deep-coder/
├── .editorconfig              # Editor configuration
├── .gitignore                 # Git ignore rules
├── .github/workflows/ci.yml   # CI/CD pipeline
├── README.md                  # This file
├── plan.md                    # Current project plan and tasks
├── agents.md                  # Agent roles and specifications
├── SECURITY.md                # Security guidelines and checklist
├── CONTRIBUTING.md            # Contribution guidelines
├── pyproject.toml             # Python project configuration
├── src/                       # Application code
│   ├── __init__.py
│   └── math_ops.py           # Example module
├── tests/                     # Unit tests
│   ├── __init__.py
│   └── test_math_ops.py      # Example tests
└── scripts/                   # Helper scripts
```

## Development

### Prerequisites

- Python 3.11 or later
- Git
- Virtual environment tool

### Quality Standards

- **Test Coverage:** ≥ 70% (configurable)
- **Code Style:** Black formatting + Ruff linting
- **Type Safety:** MyPy type checking
- **Security:** Bandit security scanning
- **Max Patch Size:** 500 LOC (unless authorized)

### Running Tests

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=src --cov-report=html

# Run specific test markers
pytest -m "not slow"  # Skip slow tests
pytest -m integration  # Run only integration tests
```

### Code Quality

```bash
# Format code
black .

# Lint code
ruff check .

# Type checking
mypy src

# Security scan
bandit -r src/
safety check
```

## External Integrations

The project draws inspiration from and can integrate with:

- **OpenHands**: Multi-modal tool architecture for code editing and shell interaction
- **OpenDevin**: Autonomous software engineering flows and SWE-Bench evaluation
- **LangGraph**: Backbone orchestrator with custom nodes for agent coordination

## Security

This project follows strict security guidelines:

- No secrets committed to the repository
- All dependencies pinned and from trusted sources
- Comprehensive input validation
- Regular security scanning
- Human approval for sensitive operations

See [SECURITY.md](SECURITY.md) for detailed security guidelines.

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on:

- Setting up the development environment
- Following the multi-agent workflow
- Code standards and testing requirements
- Security guidelines
- Pull request process

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Roadmap

See [plan.md](plan.md) for current project tasks and milestones:

- **OD-1**: Initialize repo + CI ✅
- **OD-2**: Implement tool adapters (fs, shell, git, tests, lint, secr)
- **OD-3**: Add example module + tests ✅
- **OD-4**: Wire PR body generator
- **OD-5**: Add security baseline
- **OD-6**: Explore OpenHands and OpenDevin integration
- **OD-7**: Extend LangGraph for dynamic agent spawning

---

*Open‑Deep‑Coder: Transforming software development through intelligent agent coordination.*