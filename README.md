# Open‑Deep‑Coder

An agentic IDE with multi‑agent coding workflow (Planner → Implementer → Verifier → Reviewer) powered by LLM integration and advanced development tools.

## Vision

Open‑Deep‑Coder is our version of an intelligent, agent-powered IDE that combines the best of modern development tools with AI-driven workflow automation. Built on the deep research pattern (plan → act → observe → critique → iterate), it provides a seamless development experience with intelligent agent coordination.

## Core Features

### 🤖 Agentic Capabilities
- **Multi-agent workflow** with specialized roles for different development tasks
- **Intelligent task routing** using RouteLLM to match requests with optimal agents
- **Adaptive planning** that learns from project patterns and user preferences
- **Automated code review** with security and quality enforcement

### 🔌 LLM Integration
- **Remote LLMs** via OpenRouter API for powerful cloud-based models
- **Local LLMs** via Ollama and other local providers for privacy and speed
- **Smart routing** automatically selects the best model for each task type:
  - Code generation and debugging
  - Architecture planning and design
  - Documentation and testing
  - Security analysis and review

### 🎨 Advanced UI/UX
- **Four theme variants**:
  - Light (low contrast) - Easy on the eyes for long coding sessions
  - Light (high contrast) - Enhanced readability with brightened syntax highlighting
  - Dark (low contrast) - Comfortable dark mode for low-light environments
  - Dark (high contrast) - Maximum contrast for accessibility and focus
- **Customizable keybinds** stored in JSON configuration
- **Integrated chat interface** for natural language interaction with LLMs
- **Context-aware suggestions** based on current code and project state

### 🛠️ Development Tools Integration
- **LSP Servers** - Full language server protocol support for intelligent code completion
- **MCP Servers** - Model Context Protocol integration for enhanced AI capabilities  
- **n8n Integration** - Workflow automation for CI/CD and development processes
- **Chat-based setup** - Create and configure integrations through natural language
- **Permission system** - Secure remote connection management with user consent

### 🔒 Security & Privacy
- **Permission-based access** for all remote connections and external services
- **Local-first option** with Ollama for complete privacy
- **Encrypted configurations** for API keys and sensitive settings
- **Audit logging** for all agent actions and external communications

## Architecture

The system consists of multiple layers working in harmony:

### Agent Layer
1. **Orchestrator** - Maintains state machine and coordinates agent interactions
2. **Planner** - Analyzes requirements and creates atomic tasks
3. **Implementer** - Generates and modifies code with LLM assistance
4. **Verifier** - Runs tests, linters, and quality checks
5. **Reviewer** - Performs security and code quality reviews
6. **Researcher** - Looks up documentation and best practices

### LLM Integration Layer
- **RouteLLM Router** - Intelligently routes requests to optimal models
- **OpenRouter Client** - Manages remote LLM connections
- **Ollama Client** - Handles local model interactions
- **Context Manager** - Maintains conversation state and project context

### Development Tools Layer
- **LSP Manager** - Coordinates language server integrations
- **MCP Handler** - Manages Model Context Protocol connections
- **n8n Connector** - Automates workflow processes
- **Permission Gateway** - Controls access to external resources

### Frontend Layer
- **Theme Engine** - Manages four contrast/color variants
- **Keybind Manager** - Handles customizable keyboard shortcuts
- **Chat Interface** - Provides natural language interaction
- **Code Editor** - Enhanced Monaco editor with AI integration

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