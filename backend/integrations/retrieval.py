"""
Lightweight codebase retrieval (RAG) utilities.

This module provides a tiny, dependency-free indexer and searcher over the
local repository to surface relevant code fragments to agents (e.g., the
Implementer). It also includes simple document segmentation helpers for large
files to keep context manageable.
"""

from __future__ import annotations

from dataclasses import dataclass
import os
import math
import re
from typing import Iterable, List, Tuple, Dict


# Supported code/text file extensions (kept small on purpose)
INDEX_EXTS = {
    ".py",
    ".ts",
    ".tsx",
    ".js",
    ".md",
}


def iter_repo_files(root: str = ".") -> Iterable[str]:
    for base, _dirs, files in os.walk(root):
        # skip common noise dirs
        if any(seg in base for seg in [".git", "node_modules", ".venv", "dist", "build", "__pycache__"]):
            continue
        for f in files:
            _, ext = os.path.splitext(f)
            if ext.lower() in INDEX_EXTS:
                yield os.path.join(base, f)


def simple_tokenize(text: str) -> List[str]:
    # lowercase, split on non-alphanum, keep short stopword filter minimal
    toks = re.split(r"[^A-Za-z0-9_]+", text.lower())
    return [t for t in toks if len(t) > 2]


@dataclass
class Fragment:
    path: str
    start: int
    end: int
    text: str


def chunk_text(text: str, max_lines: int = 80) -> List[Tuple[int, int, str]]:
    lines = text.splitlines()
    chunks: List[Tuple[int, int, str]] = []
    for i in range(0, len(lines), max_lines):
        chunk_lines = lines[i : i + max_lines]
        chunks.append((i + 1, min(i + len(chunk_lines), len(lines)), "\n".join(chunk_lines)))
    return chunks


class CodebaseIndexer:
    """Tiny TF-IDF-like indexer over code fragments.

    - Segments files into line-based chunks
    - Builds term frequencies for each chunk
    - Answers queries by cosine similarity over normalized vectors
    """

    def __init__(self, root: str = ".", max_lines_per_chunk: int = 80) -> None:
        self.root = root
        self.max_lines = max_lines_per_chunk
        self.fragments: List[Fragment] = []
        self.df: Dict[str, int] = {}
        self.vectors: List[Dict[str, float]] = []  # tf vectors per fragment
        self._built = False

    def build(self) -> None:
        self.fragments.clear()
        self.df.clear()
        self.vectors.clear()

        for path in iter_repo_files(self.root):
            try:
                with open(path, "r", encoding="utf-8") as f:
                    content = f.read()
            except Exception:
                continue

            for start, end, chunk in chunk_text(content, self.max_lines):
                frag = Fragment(path=path, start=start, end=end, text=chunk)
                self.fragments.append(frag)
                toks = simple_tokenize(chunk)
                tf: Dict[str, float] = {}
                for t in toks:
                    tf[t] = tf.get(t, 0.0) + 1.0
                # update doc freq (count once per term per fragment)
                for t in set(toks):
                    self.df[t] = self.df.get(t, 0) + 1
                self.vectors.append(tf)

        # convert tf to tf-idf and normalize
        n = max(1, len(self.fragments))
        for tf in self.vectors:
            norm = 0.0
            for t, cnt in list(tf.items()):
                idf = math.log((n + 1) / (1 + self.df.get(t, 0))) + 1.0
                val = cnt * idf
                tf[t] = val
                norm += val * val
            norm = math.sqrt(norm) or 1.0
            for t in list(tf.keys()):
                tf[t] /= norm

        self._built = True

    def ensure_built(self) -> None:
        if not self._built:
            self.build()

    def query(self, text: str, k: int = 5) -> List[Fragment]:
        self.ensure_built()
        qtok = simple_tokenize(text)
        if not qtok:
            return []
        # build query vector
        qtf: Dict[str, float] = {}
        for t in qtok:
            qtf[t] = qtf.get(t, 0.0) + 1.0
        n = max(1, len(self.fragments))
        norm = 0.0
        for t, cnt in list(qtf.items()):
            idf = math.log((n + 1) / (1 + self.df.get(t, 0))) + 1.0
            val = cnt * idf
            qtf[t] = val
            norm += val * val
        norm = math.sqrt(norm) or 1.0
        for t in list(qtf.keys()):
            qtf[t] /= norm

        # cosine with stored vectors
        scores: List[Tuple[float, int]] = []
        for i, tf in enumerate(self.vectors):
            score = 0.0
            for t, qv in qtf.items():
                tv = tf.get(t)
                if tv:
                    score += qv * tv
            if score > 0:
                scores.append((score, i))
        scores.sort(reverse=True)
        top = [self.fragments[i] for _s, i in scores[:k]]
        return top


def suggest_code_patterns(prompt: str, root: str = ".", k: int = 3) -> List[Dict[str, str | int]]:
    """Convenience wrapper used by agents to fetch top snippets.

    Returns a list of dicts with path and line range to avoid shipping huge blobs.
    """
    idx = CodebaseIndexer(root=root)
    frags = idx.query(prompt, k=k)
    return [
        {"path": f.path, "start": f.start, "end": f.end}
        for f in frags
    ]

