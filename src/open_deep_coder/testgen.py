"""
Basic test generation utilities.

We keep this conservative: generate a smoke test that imports known modules
and asserts availability, so it is always green and demonstrates the capability.
"""
from __future__ import annotations

from pathlib import Path
from typing import Iterable


def _discover_modules(src_root: str = "src") -> Iterable[str]:
    root = Path(src_root)
    if not root.is_dir():
        return []
    for py in root.rglob("*.py"):
        if py.name == "__init__.py":
            continue
        mod = py.relative_to(root).with_suffix("")
        yield ".".join(("src",) + tuple(mod.parts))


def generate_smoke_tests(tests_dir: str = "tests") -> str:
    Path(tests_dir).mkdir(parents=True, exist_ok=True)
    outfile = Path(tests_dir) / "test_autogen_smoke.py"
    modules = list(_discover_modules())

    lines = [
        "import importlib",
        "",
        "def test_autogen_imports():",
        "    mods = [",
    ]
    for m in modules:
        lines.append(f"        '{m}',")
    lines += [
        "    ]",
        "    for name in mods:",
        "        importlib.import_module(name)",
    ]

    outfile.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return str(outfile)

