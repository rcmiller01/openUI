"""Credentials API router

Provides simple server-backed credential storage (file-encrypted) and
GitHub device-code OAuth device flow endpoints.

This implementation is intentionally minimal for local deployments. It
stores encrypted JSON in a local file `credentials.store` using Fernet.
"""
from __future__ import annotations

import os
import json
import logging
import time
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

try:
    from cryptography.fernet import Fernet, InvalidToken
except Exception:  # pragma: no cover - cryptography may not be installed
    Fernet = None  # type: ignore

import httpx

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/credentials", tags=["credentials"])

STORE_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "credentials.store")
KEY_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "credentials.key")


class CredentialItem(BaseModel):
    name: str
    data: dict


def _load_key() -> bytes:
    if Fernet is None:
        raise RuntimeError("cryptography.fernet.Fernet is required for credentials storage")

    if os.path.exists(KEY_PATH):
        with open(KEY_PATH, "rb") as f:
            return f.read()

    key = Fernet.generate_key()
    with open(KEY_PATH, "wb") as f:
        f.write(key)
    os.chmod(KEY_PATH, 0o600)
    return key


def _read_store() -> dict:
    if not os.path.exists(STORE_PATH):
        return {}

    key = _load_key()
    f = Fernet(key)
    with open(STORE_PATH, "rb") as fh:
        enc = fh.read()

    try:
        raw = f.decrypt(enc)
    except InvalidToken:
        logger.exception("Invalid encryption key for credentials store")
        raise RuntimeError("Invalid credentials store key")

    return json.loads(raw.decode("utf-8"))


def _write_store(data: dict) -> None:
    key = _load_key()
    f = Fernet(key)
    raw = json.dumps(data, indent=None).encode("utf-8")
    enc = f.encrypt(raw)
    with open(STORE_PATH, "wb") as fh:
        fh.write(enc)
    os.chmod(STORE_PATH, 0o600)


@router.post("/")
async def store_credential(item: CredentialItem):
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
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{name}")
async def get_credential(name: str):
    """Get a masked view of a stored credential.

    Returns keys but masks values to avoid accidental leaks through the API.
    """
    try:
        store = _read_store()
        if name not in store:
            raise HTTPException(status_code=404, detail="Not found")

        data = store[name]["data"]
        masked = {k: (v[:4] + "..." + v[-4:] if isinstance(v, str) and len(v) > 8 else "***") for k, v in data.items()}
        return {"name": name, "data": masked, "updated_at": store[name].get("updated_at")}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving credential: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# GitHub device flow support
class GitHubDeviceStartResponse(BaseModel):
    device_code: str
    user_code: str
    verification_uri: str
    expires_in: int
    interval: int


@router.post("/github/device/start")
async def github_device_start(client_id: str):
    """Start GitHub device code flow. Returns device/user code and verification URI.

    The backend will not poll automatically; the frontend should call the poll endpoint.
    """
    url = "https://github.com/login/device/code"
    headers = {"Accept": "application/json"}
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.post(url, data={"client_id": client_id}, headers=headers)
        resp.raise_for_status()
        data = resp.json()

    return GitHubDeviceStartResponse(**data)


@router.post("/github/device/poll")
async def github_device_poll(client_id: str, device_code: str) -> dict:
    """Poll GitHub for device flow token. On success, store the token in credentials store."""
    url = "https://github.com/login/oauth/access_token"
    headers = {"Accept": "application/json"}
    payload = {"client_id": client_id, "device_code": device_code, "grant_type": "urn:ietf:params:oauth:grant-type:device_code"}

    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.post(url, data=payload, headers=headers)
        resp.raise_for_status()
        data = resp.json()

    if data.get("error"):
        # authorization_pending or slow_down or other
        return {"status": "pending", "error": data.get("error"), "description": data.get("error_description")}

    access_token = data.get("access_token")
    if not access_token:
        raise HTTPException(status_code=500, detail="No access token in response")

    # store token
    try:
        store = _read_store()
        store["github"] = {"data": {"access_token": access_token}, "updated_at": int(time.time())}
        _write_store(store)
    except Exception as e:
        logger.error(f"Error storing github token: {e}")

    return {"status": "ok", "token_stored": True}
