import os
from importlib.machinery import SourceFileLoader

import pytest
from httpx import ASGITransport, AsyncClient

# Load backend/test_server
here = os.path.dirname(__file__)
path = os.path.abspath(os.path.join(here, "..", "backend", "test_server.py"))
loader = SourceFileLoader("test_server", path)
server = loader.load_module()


@pytest.mark.asyncio
async def test_file_write_read_delete(tmp_path):
    """Create a file locally, read it via the test server, list the dir,
    then delete the file and confirm the server returns 404."""

    transport = ASGITransport(app=server.app)
    test_file = tmp_path / "test.txt"

    # create file locally
    test_file.write_text("hello", encoding="utf-8")

    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        r = await client.get("/api/files/content", params={"path": str(test_file)})
        assert r.status_code == 200
        data = r.json()
        assert data.get("content") == "hello"

        # list directory
        list_r = await client.get("/api/files", params={"path": str(tmp_path)})
        assert list_r.status_code == 200
        items = list_r.json()
        assert any(it["name"] == "test.txt" for it in items)

        # delete locally and confirm 404
        test_file.unlink()
        r2 = await client.get("/api/files/content", params={"path": str(test_file)})
        assert r2.status_code == 404
