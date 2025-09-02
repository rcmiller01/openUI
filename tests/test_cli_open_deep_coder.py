import os
from click.testing import CliRunner

from src.open_deep_coder.cli import main


def test_cli_help():
    r = CliRunner().invoke(main, ["--help"])
    assert r.exit_code == 0
    assert "Open‑Deep‑Coder CLI" in r.output


def test_cli_plan_updates_file(tmp_path, monkeypatch):
    # run in temp dir with copied plan.md if exists
    plan_path = tmp_path / "plan.md"
    plan_path.write_text("# Plan\n", encoding="utf-8")
    cwd = os.getcwd()
    try:
        os.chdir(tmp_path)
        r = CliRunner().invoke(main, ["plan", "--prompt", "Add feature X"])
        assert r.exit_code == 0
        content = plan_path.read_text(encoding="utf-8")
        assert "Planner update" in content
        assert "cycle:" in content
    finally:
        os.chdir(cwd)


def test_cli_generate_tests(tmp_path):
    cwd = os.getcwd()
    try:
        os.chdir(tmp_path)
        r = CliRunner().invoke(main, ["generate-tests"])
        assert r.exit_code == 0
        assert (tmp_path / "tests" / "test_autogen_smoke.py").exists()
    finally:
        os.chdir(cwd)

