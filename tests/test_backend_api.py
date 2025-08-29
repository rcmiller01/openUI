import pytest
from httpx import AsyncClient, ASGITransport

import os
import importlib.util
from importlib.machinery import SourceFileLoader

# Load backend/test_server.py by file path so tests can import it regardless
# of PYTHONPATH. Use runtime checks so mypy/linters don't complain about
# optional types returned by importlib.
here = os.path.dirname(__file__)
server_path = os.path.abspath(
    os.path.join(here, '..', 'backend', 'test_server.py')
)
spec = importlib.util.spec_from_loader(
    "test_server", SourceFileLoader("test_server", server_path)
)
assert spec is not None and spec.loader is not None
server = importlib.util.module_from_spec(spec)
spec.loader.exec_module(server)


@pytest.mark.asyncio
async def test_health_ok():
    transport = ASGITransport(app=server.app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        r = await client.get("/health")
        assert r.status_code == 200
        assert r.json().get("status") == "healthy"


@pytest.mark.asyncio
async def test_models_returns_list():
    transport = ASGITransport(app=server.app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        r = await client.get("/api/models")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

