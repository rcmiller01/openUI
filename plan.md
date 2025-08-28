# Open‑Deep‑Coder Project Plan

**Cycle:** 1  
**Milestone:** Initial Setup and Foundation  
**Created:** 2025-08-28  
**Status:** In Progress  

## Current Tasks

### OD‑1: Initialize repo + CI
- **Title:** Initialize repository structure and CI pipeline
- **Rationale:** Establish foundational project structure with proper tooling and automation
- **Status:** PENDING
- **Owner:** Implementer
- **Steps:**
  1. Set up repository scaffold with proper directory structure
  2. Configure Python environment with pyproject.toml
  3. Wire up tests with pytest
  4. Configure ruff/black/mypy for code quality
  5. Set up GitHub Actions CI workflow
- **Acceptance:**
  - Tests: Basic test suite runs successfully
  - Quality: Ruff, black, and mypy pass with zero errors
  - Coverage: Initial test coverage reporting enabled

### OD‑2: Add tool adapters
- **Title:** Implement tool adapters for fs/shell/git/tests/lint/secr
- **Rationale:** Create thin, testable facades for system interactions
- **Status:** PENDING
- **Owner:** Implementer
- **Steps:**
  1. Design adapter interfaces
  2. Implement filesystem adapter
  3. Implement shell command adapter
  4. Implement git operations adapter
  5. Implement test runner adapter
  6. Implement linter adapter
  7. Implement security scanner adapter
- **Acceptance:**
  - Tests: All adapters have unit tests with >80% coverage
  - Quality: Type hints and documentation for all public interfaces
  - Integration: Adapters work with real tools in CI environment

### OD‑3: Implement example module
- **Title:** Create simple example module (math_ops) with unit tests
- **Rationale:** Demonstrate the workflow with a concrete, testable example
- **Status:** PENDING
- **Owner:** Implementer
- **Steps:**
  1. Create src/math_ops.py with basic operations
  2. Write comprehensive unit tests
  3. Add docstrings and type hints
  4. Verify test coverage meets threshold
- **Acceptance:**
  - Tests: math_ops tests pass with 100% coverage
  - Quality: Full type annotation and documentation
  - Functionality: Basic arithmetic operations work correctly

### OD‑4: Add PR body generator
- **Title:** Implement pr_body.md generator from test_report.json + git.diff()
- **Rationale:** Automate PR documentation with test evidence and change summary
- **Status:** PENDING
- **Owner:** Implementer
- **Steps:**
  1. Design PR body template
  2. Parse test_report.json for test results
  3. Extract meaningful diff summaries
  4. Generate structured PR descriptions
  5. Include implementation notes and rationale
- **Acceptance:**
  - Tests: PR generator produces valid markdown
  - Quality: Template covers all required sections
  - Integration: Works with real test reports and diffs

### OD‑5: Security baseline
- **Title:** Establish security baseline with dependency pinning and secret scanning
- **Rationale:** Ensure secure development practices from the start
- **Status:** PENDING
- **Owner:** Implementer
- **Steps:**
  1. Pin all dependencies with version ranges
  2. Set up basic secret scanning
  3. Create SECURITY.md with guidelines
  4. Add security checklist to PR template
  5. Configure automated security scanning in CI
- **Acceptance:**
  - Tests: Security scanning runs without findings
  - Quality: All dependencies pinned and documented
  - Compliance: SECURITY.md checklist complete

### OD‑6: Explore external frameworks
- **Title:** Explore OpenHands and OpenDevin as inspiration or tool sources
- **Rationale:** Leverage existing multi-agent frameworks for enhanced capabilities
- **Status:** PENDING
- **Owner:** Researcher
- **Steps:**
  1. Research OpenHands multi-modal tool architecture
  2. Analyze OpenDevin's SWE-Bench evaluation approach
  3. Identify reusable components and patterns
  4. Document integration opportunities
  5. Propose compatibility layers or adapters
- **Acceptance:**
  - Research: Comprehensive analysis documented
  - Integration: Clear path for tool reuse identified
  - Compatibility: Adapter interfaces defined

### OD‑7: Extend LangGraph capabilities
- **Title:** Extend LangGraph for dynamic agent spawning and parallel Implementers
- **Rationale:** Enable advanced workflow capabilities with parallel processing
- **Status:** PENDING
- **Owner:** Implementer
- **Steps:**
  1. Design custom LangGraph nodes for agent spawning
  2. Implement parallel Implementer coordination
  3. Add dynamic branching for complex workflows
  4. Create retry mechanisms for flaky tests
  5. Implement branch merging heuristics
- **Acceptance:**
  - Tests: Parallel agent coordination works correctly
  - Performance: Workflow efficiency improved
  - Reliability: Retry and error handling robust

### OD‑8: LLM Integration Infrastructure
- **Title:** Implement LLM integration with OpenRouter and Ollama
- **Rationale:** Core capability for agentic IDE with flexible model selection
- **Status:** PENDING
- **Owner:** Implementer
- **Steps:**
  1. Create OpenRouter client with API key management
  2. Implement Ollama local client integration
  3. Design RouteLLM request classification system
  4. Build model selection and routing logic
  5. Add context management for conversations
- **Acceptance:**
  - Tests: Both remote and local LLM clients work
  - Quality: Smart routing selects appropriate models
  - Security: API keys securely managed

### OD‑9: Theme System and UI Framework
- **Title:** Implement four-variant theme system with customizable keybinds
- **Rationale:** Professional IDE experience with accessibility options
- **Status:** PENDING
- **Owner:** Implementer
- **Steps:**
  1. Design theme architecture (light/dark + low/high contrast)
  2. Implement syntax highlighting brightness control
  3. Create JSON-based keybind configuration system
  4. Build theme switching UI components
  5. Add keybind customization interface
- **Acceptance:**
  - Tests: All four themes render correctly
  - Quality: High contrast modes improve readability
  - UX: Keybinds are fully customizable and persistent

### OD‑10: Development Tools Integration
- **Title:** Integrate LSP, MCP, and n8n with chat-based setup
- **Rationale:** Comprehensive development environment with AI-assisted configuration
- **Status:** PENDING
- **Owner:** Implementer
- **Steps:**
  1. Implement LSP server management and communication
  2. Create MCP server integration framework
  3. Build n8n workflow automation connector
  4. Design chat-based configuration interface
  5. Implement permission system for remote connections
- **Acceptance:**
  - Tests: LSP provides intelligent code completion
  - Integration: MCP and n8n work through chat interface
  - Security: Permission system blocks unauthorized access

### OD‑11: Chat Interface and Frontend
- **Title:** Build integrated chat interface with Monaco editor
- **Rationale:** Core user interaction for the agentic IDE
- **Status:** PENDING
- **Owner:** Implementer
- **Steps:**
  1. Integrate Monaco editor with theme system
  2. Build chat interface component
  3. Implement conversation context management
  4. Create agent status and workflow visualization
  5. Add real-time collaboration features
- **Acceptance:**
  - Tests: Chat interface communicates with LLMs
  - Quality: Monaco editor fully integrated with themes
  - UX: Smooth interaction between chat and code editing

## Notes

- **Language:** Python (default)
- **Test Framework:** pytest
- **Linting:** ruff + black
- **Type Checking:** mypy
- **Coverage Target:** ≥ 70%
- **Max Patch Size:** 500 LOC (unless authorized)

## Next Actions

1. Begin with OD‑1 to establish project foundation
2. All tasks should include comprehensive testing
3. Security considerations must be integrated from the start
4. Document all architectural decisions in this plan

---

*Last Updated: 2025-08-28*