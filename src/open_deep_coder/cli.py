from __future__ import annotations

import sys
from pathlib import Path
import json
import click

from .planner import append_plan_md, default_breakdown
from .retrieval import index_and_query
from .testgen import generate_smoke_tests


@click.group()
def main() -> None:
    """Open‑Deep‑Coder CLI (mirrors core UI actions)."""


@main.command()
@click.argument("agent", type=str)
@click.option("--prompt", required=True, help="Task description for the agent")
def run(agent: str, prompt: str) -> None:
    """Run an agent sequence (dry-run for local CLI)."""
    agent_lc = agent.strip().lower()
    if agent_lc not in {"orchestrator", "planner", "implementer", "verifier", "reviewer", "researcher"}:
        click.echo(f"Unknown agent: {agent}", err=True)
        sys.exit(2)

    # Minimal emulation: for planner, also write/update plan.md
    if agent_lc == "planner":
        tasks = default_breakdown(prompt)
        append_plan_md(cycle=1, milestone="CLI Plan", tasks=tasks)
        click.echo("Planner: plan.md updated")
    elif agent_lc == "implementer":
        # show retrieval suggestions to emulate pattern-informed coding
        hits = index_and_query(prompt, root=str(Path.cwd()))
        click.echo(json.dumps({"suggestions": hits}, indent=2))
        # generate smoke tests to emulate post-codegen tests
        out = generate_smoke_tests()
        click.echo(f"Tests generated at {out}")
    else:
        click.echo(f"{agent} run simulated for prompt: {prompt}")


@main.command()
@click.option("--prompt", required=True, help="High-level task to plan for")
def plan(prompt: str) -> None:
    """Write a Planner YAML block into plan.md."""
    tasks = default_breakdown(prompt)
    append_plan_md(cycle=1, milestone="CLI Plan", tasks=tasks)
    click.echo("Plan appended to plan.md")


@main.command()
@click.option("--query", required=True, help="Search prompt")
@click.option("--k", default=3, show_default=True, help="Top-k suggestions")
def index(query: str, k: int) -> None:
    """Index the repo and return top-k code fragments."""
    hits = index_and_query(query, root=str(Path.cwd()), k=k)
    click.echo(json.dumps(hits, indent=2))


@main.command("generate-tests")
def generate_tests_cmd() -> None:
    """Generate smoke tests alongside code (tests/test_autogen_smoke.py)."""
    out = generate_smoke_tests()
    click.echo(f"Generated: {out}")


if __name__ == "__main__":  # pragma: no cover
    main()

