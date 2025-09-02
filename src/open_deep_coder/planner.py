"""
Simple planner utility used by CLI to write/update plan.md following the
Planner Output Template (YAML block).
"""
from __future__ import annotations

from dataclasses import dataclass, asdict
from typing import List, Dict
from datetime import datetime
import textwrap


@dataclass
class Task:
    id: str
    title: str
    rationale: str
    steps: List[str]
    acceptance: Dict[str, str]


def _yaml_block(cycle: int, milestone: str, tasks: List[Task]) -> str:
    # Minimal YAML emission to avoid new deps
    lines: List[str] = []
    lines.append(f"cycle: {cycle}")
    lines.append(f"milestone: {milestone}")
    lines.append("tasks:")
    for t in tasks:
        lines.append(f"  - id: {t.id}")
        lines.append(f"    title: {t.title}")
        lines.append(f"    rationale: {t.rationale}")
        steps_inline = ", ".join(t.steps)
        lines.append(f"    steps: [{steps_inline}]")
        lines.append(f"    acceptance:")
        for k, v in t.acceptance.items():
            lines.append(f"      - {k}: {v}")
    return "\n".join(lines) + "\n"


def append_plan_md(plan_path: str = "plan.md", *, cycle: int, milestone: str, tasks: List[Task]) -> None:
    banner = f"\n\n<!-- Planner update: {datetime.utcnow().isoformat()}Z -->\n\n"
    yaml_block = _yaml_block(cycle, milestone, tasks)
    with open(plan_path, "a", encoding="utf-8") as f:
        f.write(banner)
        f.write("```yaml\n")
        f.write(yaml_block)
        f.write("```\n")


def default_breakdown(prompt: str) -> List[Task]:
    # Very small heuristic breakdown matching acceptance criteria key areas
    return [
        Task(
            id="OD-PLAN",
            title="Break task into actionable steps",
            rationale=f"Plan for: {prompt[:60]}" + ("..." if len(prompt) > 60 else ""),
            steps=["parse input", "draft steps", "update plan.md", "notify UI"],
            acceptance={
                "tests": "Planner unit test passes",
                "quality": "ruff/mypy clean",
            },
        ),
        Task(
            id="OD-RAG",
            title="Index codebase and retrieve patterns",
            rationale="Enable context-aware code suggestions",
            steps=["scan repo", "chunk files", "tf-idf index", "top-k query"],
            acceptance={"tests": "retrieval test finds fragments"},
        ),
        Task(
            id="OD-TESTGEN",
            title="Generate smoke tests and docs",
            rationale="Add basic tests post codegen",
            steps=["scan modules", "emit smoke tests", "write docs"],
            acceptance={"tests": "pytest runs, smoke passes"},
        ),
    ]

