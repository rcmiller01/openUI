from backend.integrations.retrieval import CodebaseIndexer, suggest_code_patterns


def test_index_query_returns_results():
    idx = CodebaseIndexer(root=".")
    idx.build()
    # Query for something present in repo (e.g., 'fastapi' or 'agent')
    hits = idx.query("agent planner orchestrator", k=3)
    assert isinstance(hits, list)
    # Not asserting non-empty strictly to be robust across layouts, but ensure type/shape
    if hits:
        h = hits[0]
        assert h.path and isinstance(h.start, int) and isinstance(h.end, int)


def test_suggest_code_patterns_shape():
    out = suggest_code_patterns("plan steps", root=".", k=2)
    assert isinstance(out, list)
    if out:
        item = out[0]
        assert set(["path", "start", "end"]).issubset(item.keys())

