"""
Process-local adapter around backend retrieval for CLI parity.
"""
from __future__ import annotations

from typing import List, Dict
from pathlib import Path

# Import backend utility directly; both live in same repo
try:
    from backend.integrations.retrieval import suggest_code_patterns  # type: ignore
except Exception:  # pragma: no cover
    suggest_code_patterns = None  # type: ignore


def index_and_query(prompt: str, root: str = ".", k: int = 3) -> List[Dict[str, str | int]]:
    if suggest_code_patterns is None:
        raise RuntimeError("retrieval backend not available")
    root = str(Path(root).resolve())
    return suggest_code_patterns(prompt=prompt, root=root, k=k)

