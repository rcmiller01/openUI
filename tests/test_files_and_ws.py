import os
from importlib.machinery import SourceFileLoader

import pytest
from httpx import ASGITransport, AsyncClient

# Load backend/test_server by path (same pattern used in other tests)
here = os.path.dirname(__file__)
path = os.path.abspath(os.path.join(here, "..", "backend", "test_server.py"))
loader = SourceFileLoader("test_server", path)
server = loader.load_module()


@pytest.mark.asyncio
async def test_list_files_root():
    transport = ASGITransport(app=server.app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        r = await client.get("/api/files")
        assert r.status_code == 200
        assert isinstance(r.json(), list)


@pytest.mark.asyncio
async def test_ws_ping():
    # Import the runtime websocket handler and call it directly with a fake
    # websocket to avoid depending on httpx websocket helpers.
    from importlib.machinery import SourceFileLoader

    main_path = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..", "backend", "main.py")
    )
    loader = SourceFileLoader("backend_main", main_path)
    backend_main = loader.load_module()

    class FakeWS:
        def __init__(self):
            self.sent = []

        async def send_json(self, obj):
            self.sent.append(obj)

    fake = FakeWS()
    await backend_main._handle_ws_message(fake, {"type": "ping"})
    assert any(m.get("type") == "pong" for m in fake.sent)
