import httpx
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

QQBOT_SERVICE_URL = "http://127.0.0.1:3001"


class QQBotError(RuntimeError):
    pass


def _request(method: str, path: str, **kwargs) -> Dict[str, Any]:
    url = f"{QQBOT_SERVICE_URL}{path}"
    try:
        resp = httpx.request(method, url, timeout=30, **kwargs)
        resp.raise_for_status()
        return resp.json()
    except httpx.HTTPStatusError as e:
        logger.error("QQBot service HTTP error: %s %s -> %s", method, url, e.response.status_code)
        body = e.response.json() if e.response.headers.get("content-type", "").startswith("application/json") else {}
        raise QQBotError(body.get("error", f"HTTP {e.response.status_code}"))
    except httpx.RequestError as e:
        logger.error("QQBot service request error: %s %s -> %s", method, url, e)
        raise QQBotError(f"Cannot connect to QQBot service: {e}")


def create_session() -> Dict[str, Any]:
    result = _request("POST", "/register")
    return result


def get_session(session_id: str) -> Optional[Dict[str, Any]]:
    try:
        return _request("GET", f"/register/{session_id}")
    except QQBotError:
        return None


def delete_session(session_id: str):
    try:
        _request("DELETE", f"/register/{session_id}")
    except QQBotError:
        pass
