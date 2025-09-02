"""
Process-local adapter around backend retrieval for CLI parity.
"""
from __future__ import annotations

from typing import List, Dict, Optional, Callable, cast
from pathlib import Path

# Import backend utility directly; both live in same repo
SuggestType = Callable[[str, str, int], List[Dict[str, str | int]]]
try:
    from backend.integrations.retrieval import suggest_code_patterns as _suggest
    _suggest_typed: Optional[SuggestType] = cast(SuggestType, _suggest)
except Exception:  # pragma: no cover
    _suggest_typed = None


def index_and_query(prompt: str, root: str = ".", k: int = 3) -> List[Dict[str, str | int]]:
    if _suggest_typed is None:
        raise RuntimeError("retrieval backend not available")
    root = str(Path(root).resolve())
    return _suggest_typed(prompt, root, k)
