# agents.md

## Overview

Open‑Deep‑Coder is a graph‑of‑agents for software work. It reuses the research pattern (plan → act → observe → critique → iterate) but swaps in coding tools and code‑quality gates.

## Roles

### 1) Orchestrator

* Maintains state machine and task graph.
* Selects next action based on test/lint outcomes.
* Produces/updates artifacts: `plan.md`, `patchset.diff`, `test_report.json`, `pr_body.md`.

### 2) Planner

* Reads repo + backlog, proposes milestone goals and atomic tasks.
* Generates/updates `plan.md` with clear acceptance criteria and owner agent.
* Splits tasks by domain: feature, refactor, bugfix, infra/CI, security.

**Planner Output Template**

```yaml
cycle: <n>
milestone: <name>
tasks:
  - id: OD-<id>
    title: <short imperative>
    rationale: <why>
    steps: [s1, s2, s3]
    acceptance:
      - tests: <which tests pass>
      - quality: <lint/type/coverage thresholds>
```

### 3) Implementer

* Edits/creates code and tests.
* Uses `shell.run` for installs/builds.
* Writes minimal diffs aligned with acceptance criteria.

**Implementer Output Template**

```yaml
change:
  files:
    - path: src/...
      action: modify|create|delete
  commands: ["pip install -e .", "pytest -q"]
  notes: <design decisions or tradeoffs>
```

### 4) Verifier

* Runs tests (`tests.run`), linters (`lint.run`), type checks (e.g., `mypy`), and coverage.
* Produces `test_report.json` and a short diagnosis
  (e.g., flaky test, unmet import, perf regression).

**Verifier JSON (example)**

```json
{
  "tests": {"passed": 31, "failed": 0, "skipped": 1},
  "coverage": 78.2,
  "lint": {"errors": 0, "warnings": 2},
  "typecheck": {"errors": 0},
  "artifacts": ["coverage.xml", "pytest.log"],
  "next_actions": ["Ready for review"]
}
```

### 5) Reviewer

* Reviews `patchset.diff`, `test_report.json`, and security scan results.
* Enforces checklist; drafts `pr_body.md` and, with approval, opens PR.

**Security Checklist (minimum)**

* No secrets committed; dependency pins present.
* Input validation added/retained; logging avoids sensitive data.
* Licenses respected; third‑party code noted in `NOTICE`.

### 6) Researcher (optional)

* Looks up library/API usage and summarizes sources inside `pr_body.md`.
* May propose alternatives or deprecations.

## Tools (expected interfaces)

> Implement as MCP tools, LangChain tools, or process‑local adapters.

* **File System**
  * `fs.read(path) → {content}`
  * `fs.write(path, content) → {ok}`
  * `fs.glob(pattern) → {paths[]}`
* **Shell**
  * `shell.run(cmd, timeout?) → {exit_code, stdout, stderr}`
* **Git**
  * `git.branch(name)`, `git.diff()`, `git.add(paths)`, `git.commit(msg)`, `git.push()`
* **Tests/Lint/Format**
  * `tests.run(target) → report_json`
  * `lint.run(target)`, `format.run(target)`
* **Security**
  * `secr.scan(target) → findings[]`
* **HTTP** (read‑only docs access)
  * `http.get(url) → {status, text}`

## Repo Conventions

* Python default (switchable to JS/TS by setting `LANG=js` in `plan.md`).
* `pyproject.toml` with `ruff`, `black`, `pytest`, `coverage`, `mypy`.
* `.github/workflows/ci.yml` runs: install → lint → typecheck → tests → coverage upload.

## CI Skeleton

```yaml
name: ci
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: "3.11" }
      - run: pip install -U pip
      - run: pip install -e .[dev]
      - run: ruff check .
      - run: black --check .
      - run: mypy src
      - run: pytest -q --maxfail=1 --disable-warnings --cov=src --cov-report=xml
```

## `README.md` Seed (have the Implementer generate on init)

```
# Open‑Deep‑Coder
A multi‑agent coding workflow (Planner → Implementer → Verifier → Reviewer) running on a LangGraph/MCP‑style toolbelt.

## Quickstart
make init && make test
```

## Starting Backlog (copy into `plan.md` on init)

* OD‑1 Initialize repo + CI
* OD‑2 Implement tool adapters (fs, shell, git, tests, lint, secr)
* OD‑3 Add example module + tests
* OD‑4 Wire PR body generator
* OD‑5 Add security baseline
* OD‑6 Explore OpenHands and OpenDevin as inspiration or tool sources
* OD‑7 Extend LangGraph for dynamic agent spawning and parallel Implementers

## External Projects & Extensions

* **OpenHands**: provides concrete examples of multi‑modal tools (edit code, run shell, interact with browser). Open‑Deep‑Coder can reuse its shell+fs abstractions or adapt its action protocol as a compatibility layer.
* **OpenDevin**: showcases autonomous software‑engineering flows, including SWE‑Bench benchmarks and persistent workspaces. Useful for evaluation harness and workspace persistence ideas.
* **LangGraph**: serves as the backbone orchestrator. Extend with custom nodes (e.g., for spawning multiple Implementers in parallel) and richer state transitions (e.g., retry on flaky tests, branch merging heuristics).

## Guardrails

* No network writes (publishing, package uploads) without explicit approval.
* Max diff 500 LOC unless override in `plan.md`.
* Always add/adjust tests for new behavior.

## Human Approval Gates

* Creating remote branches / pushing.
* Opening PRs.
* Changing licenses or adding new dependencies.