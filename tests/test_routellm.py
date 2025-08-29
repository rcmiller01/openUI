import os
import sys
from importlib.machinery import SourceFileLoader
from types import SimpleNamespace

import pytest


class FakeResp:
    def __init__(self, status_code=200, data=None):
        self.status_code = status_code
        self._data = data or {}

    def json(self):
        return self._data


async def async_noop(*args, **kwargs):
    raise RuntimeError("no network")


def reload_server_with_env(env: dict):
    # Ensure a fresh import of test_server with the provided env vars
    for k, v in env.items():
        if v is None and k in os.environ:
            del os.environ[k]
        elif v is not None:
            os.environ[k] = v

    # load by path to ensure we get the file in repo root
    if "test_server" in sys.modules:
        del sys.modules["test_server"]
    path = os.path.join(os.getcwd(), "backend", "test_server.py")
    loader = SourceFileLoader("test_server", path)
    module = loader.load_module()
    sys.modules["test_server"] = module
    return module


@pytest.mark.asyncio
async def test_models_prefer_ollama(monkeypatch):
    server = reload_server_with_env(
        {"OPENROUTER_API_KEY": None, "OLLAMA_BASE_URL": "http://ollama.local"}
    )

    async def fake_get(url, *args, **kwargs):
        if url.startswith("http://ollama.local"):
            return FakeResp(200, {"models": [{"name": "llama2"}]})
        return FakeResp(404, {})

    monkeypatch.setattr(
        server, "httpx_client", SimpleNamespace(get=fake_get, post=async_noop)
    )

    # call endpoint
    from httpx import ASGITransport, AsyncClient

    transport = ASGITransport(app=server.app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        r = await client.get("/api/models")
        assert r.status_code == 200
        models = r.json()
        assert any(m.get("provider") == "ollama" for m in models)


@pytest.mark.asyncio
async def test_models_include_openrouter_when_key_set(monkeypatch):
    server = reload_server_with_env(
        {"OPENROUTER_API_KEY": "key123", "OLLAMA_BASE_URL": "http://ollama.local"}
    )

    async def fake_get(url, *args, **kwargs):
        if "openrouter.ai" in url:
            return FakeResp(
                200, {"data": [{"id": "open:1", "context_length": 4096, "name": "or"}]}
            )
        return FakeResp(404, {})

    monkeypatch.setattr(
        server, "httpx_client", SimpleNamespace(get=fake_get, post=async_noop)
    )

    from httpx import ASGITransport, AsyncClient

    transport = ASGITransport(app=server.app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        r = await client.get("/api/models")
        assert r.status_code == 200
        models = r.json()
        assert any(m.get("provider") == "openrouter" for m in models)


@pytest.mark.asyncio
async def test_chat_routes_to_ollama(monkeypatch):
    server = reload_server_with_env({"OPENROUTER_API_KEY": None})

    # Pre-populate mock models with an Ollama model object (SimpleNamespace to mimic object)
    server.mock_models = [
        SimpleNamespace(
            id="ollama-1",
            name="ollama-1",
            provider="ollama",
            context_length=4096,
            is_available=True,
        )
    ]

    async def fake_post(url, *args, **kwargs):
        if "ollama" in url:
            return FakeResp(200, {"message": {"content": "hello from ollama"}})
        raise RuntimeError("unexpected post")

    monkeypatch.setattr(
        server, "httpx_client", SimpleNamespace(get=async_noop, post=fake_post)
    )

    from httpx import ASGITransport, AsyncClient

    transport = ASGITransport(app=server.app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        payload = {"messages": [{"role": "user", "content": "Hi"}], "model": "ollama-1"}
        r = await client.post("/api/chat", json=payload)
        assert r.status_code == 200
        data = r.json()
        assert data.get("context", {}).get("provider") == "ollama"
        assert "ollama" in data.get("message", {}).get("content", "").lower()


@pytest.mark.asyncio
async def test_chat_routes_to_openrouter(monkeypatch):
    server = reload_server_with_env({"OPENROUTER_API_KEY": "key123"})

    server.mock_models = [
        SimpleNamespace(
            id="open:1",
            name="open:1",
            provider="openrouter",
            context_length=4096,
            is_available=True,
        )
    ]

    async def fake_post(url, *args, **kwargs):
        if "openrouter.ai" in url:
            return FakeResp(
                200,
                {
                    "choices": [
                        {
                            "message": {"content": "hello from openrouter"},
                            "finish_reason": "stop",
                        }
                    ],
                    "usage": {"total_tokens": 5},
                },
            )
        raise RuntimeError("unexpected post")

    monkeypatch.setattr(
        server, "httpx_client", SimpleNamespace(get=async_noop, post=fake_post)
    )

    from httpx import ASGITransport, AsyncClient

    transport = ASGITransport(app=server.app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        payload = {"messages": [{"role": "user", "content": "Hi"}], "model": "open:1"}
        r = await client.post("/api/chat", json=payload)
        assert r.status_code == 200
        data = r.json()
        assert data.get("context", {}).get("provider") == "openrouter"


@pytest.mark.asyncio
async def test_chat_fallback_when_providers_fail(monkeypatch):
    server = reload_server_with_env({"OPENROUTER_API_KEY": None})

    # Ensure no models and post raises
    server.mock_models = []
    monkeypatch.setattr(
        server, "httpx_client", SimpleNamespace(get=async_noop, post=async_noop)
    )

    from httpx import ASGITransport, AsyncClient

    transport = ASGITransport(app=server.app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        payload = {"messages": [{"role": "user", "content": "Test fallback"}]}
        r = await client.post("/api/chat", json=payload)
        assert r.status_code == 200
        data = r.json()
        assert data.get("context", {}).get("provider") == "mock"
