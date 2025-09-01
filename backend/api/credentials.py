"""Credentials API router

Provides simple server-backed credential storage (file-encrypted) and
GitHub device-code OAuth device flow endpoints.

This implementation is intentionally minimal for local deployments. It
stores encrypted JSON in a local file `credentials.store` using Fernet.
"""
from __future__ import annotations

import asyncio
import json
import logging
import os
import time
from collections.abc import AsyncIterator
from typing import TYPE_CHECKING, Any, cast

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

if TYPE_CHECKING:
    # cryptography may not be installed in all environments; use Any for
    # static typing in those cases.
    Fernet: Any
    InvalidToken: Any
else:  # pragma: no cover - runtime import
    try:
        from cryptography.fernet import Fernet, InvalidToken
    except Exception:
        # Provide a tiny runtime stub so code can still run in dev without
        # cryptography installed. This is intentionally minimal.
        class _StubFernet:
            @staticmethod
            def generate_key() -> bytes:  # pragma: no cover - dev stub
                return b""  # type: ignore

            def __init__(self, key: bytes):
                return

            def encrypt(
                self, data: bytes
            ) -> bytes:  # pragma: no cover - dev stub
                return data

            def decrypt(
                self, token: bytes
            ) -> bytes:  # pragma: no cover - dev stub
                return token

        Fernet = _StubFernet  # type: ignore
        InvalidToken = Exception  # type: ignore

import httpx

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/credentials", tags=["credentials"])

STORE_PATH = os.path.join(
    os.path.dirname(os.path.dirname(__file__)), "credentials.store"
)
KEY_PATH = os.path.join(
    os.path.dirname(os.path.dirname(__file__)), "credentials.key"
)


class CredentialItem(BaseModel):
    name: str
    data: dict


def _load_key() -> bytes:
    if Fernet is None:
        raise RuntimeError(
            "cryptography.fernet.Fernet is required for credentials storage"
        )

    if os.path.exists(KEY_PATH):
        with open(KEY_PATH, "rb") as f:
            return f.read()

    # Fernet.generate_key() returns bytes at runtime; cast for mypy
    key = cast(bytes, Fernet.generate_key())
    with open(KEY_PATH, "wb") as f:
        f.write(key)
    os.chmod(KEY_PATH, 0o600)
    return key


def _read_store() -> dict[str, Any]:
    if not os.path.exists(STORE_PATH):
        return {}

    key = _load_key()
    # mypy: _load_key ensures Fernet is available
    assert Fernet is not None
    f = Fernet(key)
    with open(STORE_PATH, "rb") as fh:
        enc = fh.read()

    try:
        raw = f.decrypt(enc)
    except InvalidToken:
        logger.exception("Invalid encryption key for credentials store")
        raise RuntimeError("Invalid credentials store key") from None

    return cast(dict[str, Any], json.loads(raw.decode("utf-8")))


def _write_store(data: dict[str, Any]) -> None:
    key = _load_key()
    assert Fernet is not None
    f = Fernet(key)
    raw = json.dumps(data, indent=None).encode("utf-8")
    enc = f.encrypt(raw)
    with open(STORE_PATH, "wb") as fh:
        fh.write(enc)
    os.chmod(STORE_PATH, 0o600)


@router.post("/")
async def store_credential(item: CredentialItem) -> dict[str, str]:
    """Store a credential object under the given name.

    Example: { "name": "openrouter", "data": {"api_key": "..."} }
    """
    try:
        store = _read_store()
        store[item.name] = {"data": item.data, "updated_at": int(time.time())}
        _write_store(store)
        return {"status": "ok", "name": item.name}
    except Exception as e:
        logger.error(f"Error storing credential: {e}")
        raise HTTPException(status_code=500, detail=str(e)) from None


@router.get("/{name}")
async def get_credential(name: str) -> dict[str, Any]:
    """Get a masked view of a stored credential.

    Returns keys but masks values to avoid accidental leaks through the API.
    """
    try:
        store = _read_store()
        if name not in store:
            raise HTTPException(status_code=404, detail="Not found")

        data = store[name]["data"]
        masked = {
            k: (
                v[:4] + "..." + v[-4:]
                if isinstance(v, str) and len(v) > 8
                else "***"
            )
            for k, v in data.items()
        }
        return {
            "name": name,
            "data": masked,
            "updated_at": store[name].get("updated_at"),
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving credential: {e}")
        raise HTTPException(status_code=500, detail=str(e)) from None


# GitHub device flow support
class GitHubDeviceStartResponse(BaseModel):
    device_code: str
    user_code: str
    verification_uri: str
    expires_in: int
    interval: int


# In-memory subscribers for server-sent events keyed by device_code
_SUBSCRIBERS: dict[str, list[asyncio.Queue[Any]]] = {}


async def _publish(device_code: str, message: dict[str, Any]) -> None:
    queues = _SUBSCRIBERS.get(device_code, [])
    for q in list(queues):
        try:
            await q.put(message)
        except Exception as err:  # log subscriber failures for debugging
            logger.debug("Subscriber queue put failed: %s", err)


async def _poll_github_device(
    client_id: str,
    device_code: str,
    interval: int,
    expires_in: int,
) -> None:
    """Background task that polls GitHub until the device flow completes
    or expires, then publishes events to any subscribers.
    """
    url = "https://github.com/login/oauth/access_token"
    headers = {"Accept": "application/json"}
    deadline = time.time() + expires_in
    async with httpx.AsyncClient(timeout=10) as client:
        while time.time() < deadline:
            payload = {
                "client_id": client_id,
                "device_code": device_code,
                "grant_type": "urn:ietf:params:oauth:grant-type:device_code",
            }
            try:
                http_resp = await client.post(
                    url, data=payload, headers=headers
                )
                http_resp.raise_for_status()
                data = http_resp.json()
            except Exception as e:
                # transient network error; notify subscribers and retry
                await _publish(
                    device_code, {"status": "pending", "error": str(e)}
                )
                await asyncio.sleep(interval)
                continue

            if data.get("error"):
                # still pending or slow_down; notify and sleep
                await _publish(
                    device_code,
                    {
                        "status": "pending",
                        "error": data.get("error"),
                        "description": data.get("error_description"),
                    },
                )
                await asyncio.sleep(interval)
                continue

            access_token = data.get("access_token")
            if access_token:
                # store token
                try:
                    store = _read_store()
                    store["github"] = {
                        "data": {"access_token": access_token},
                        "updated_at": int(time.time()),
                    }
                    _write_store(store)
                except Exception as e:
                    logger.exception(
                        "Error storing github token in background poll: %s", e
                    )
                # notify subscribers
                await _publish(
                    device_code, {"status": "ok", "token_stored": True}
                )
                return

    # expired
    await _publish(device_code, {"status": "error", "error": "expired"})


@router.post("/github/device/start")
@router.post("/github/device/start")
async def github_device_start(client_id: str) -> GitHubDeviceStartResponse:
    """Start GitHub device code flow and return device/user codes.

    The frontend should call the poll endpoint when appropriate.
    """
    url = "https://github.com/login/device/code"
    headers = {"Accept": "application/json"}
    async with httpx.AsyncClient(timeout=10) as client:
        http_resp = await client.post(
            url, data={"client_id": client_id}, headers=headers
        )
        http_resp.raise_for_status()
        data = http_resp.json()

    start_resp = GitHubDeviceStartResponse(**data)
    # kick off a background poller so clients can subscribe to SSE
    try:
        # spawn background task
        asyncio.create_task(
            _poll_github_device(
                client_id,
                start_resp.device_code,
                start_resp.interval or 5,
                start_resp.expires_in or 900,
            )
        )
    except Exception:
        logger.exception("Failed to start background poller for device flow")
    return start_resp


@router.get("/github/device/subscribe")
async def github_device_subscribe(device_code: str) -> StreamingResponse:
    """Subscribe to server-sent events for the given device_code."""
    q: asyncio.Queue = asyncio.Queue()
    _SUBSCRIBERS.setdefault(device_code, []).append(q)

    async def event_generator() -> AsyncIterator[str]:
        try:
            while True:
                msg = await q.get()
                yield f"data: {json.dumps(msg)}\n\n"
        except asyncio.CancelledError:
            return
        finally:
            # cleanup
            if q in _SUBSCRIBERS.get(device_code, []):
                _SUBSCRIBERS[device_code].remove(q)

    return StreamingResponse(event_generator(), media_type="text/event-stream")


# NOTE: simulate endpoint removed. For local testing use internal
# publisher or a temporary patch.


@router.post("/github/device/poll")
async def github_device_poll(
    client_id: str,
    device_code: str,
) -> dict[str, Any]:
    """Poll GitHub for device flow token. On success, store the token
    in credentials store.
    """
    url = "https://github.com/login/oauth/access_token"
    headers = {"Accept": "application/json"}
    payload = {
        "client_id": client_id,
        "device_code": device_code,
        "grant_type": "urn:ietf:params:oauth:grant-type:device_code",
    }

    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.post(
            url, data=payload, headers=headers
        )
        resp.raise_for_status()
        data = resp.json()

    if data.get("error"):
        # authorization_pending or slow_down or other
        return {
            "status": "pending",
            "error": data.get("error"),
            "description": data.get("error_description"),
        }

    access_token = data.get("access_token")
    if not access_token:
        raise HTTPException(
            status_code=500,
            detail="No access token in response",
        )

    # store token
    try:
        store = _read_store()
        store["github"] = {
            "data": {"access_token": access_token},
            "updated_at": int(time.time()),
        }
        _write_store(store)
    except Exception as e:
        logger.error(f"Error storing github token: {e}")

    return {"status": "ok", "token_stored": True}
