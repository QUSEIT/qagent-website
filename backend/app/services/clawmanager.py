import httpx
import time
from typing import Optional, Dict, Any

from app.config import settings


class ClawManagerClient:
    def __init__(self):
        self.base_url = settings.clawmanager_base_url.rstrip("/")
        self.username = settings.clawmanager_admin_username
        self.password = settings.clawmanager_admin_password
        self._access_token: Optional[str] = None
        self._refresh_token: Optional[str] = None
        self._token_expires_at: float = 0

    def _is_token_valid(self) -> bool:
        return self._access_token is not None and time.time() < self._token_expires_at - 60

    def _login(self) -> None:
        resp = httpx.post(
            f"{self.base_url}/api/v1/auth/login",
            json={"username": self.username, "password": self.password},
            timeout=10,
        )
        resp.raise_for_status()
        data = resp.json()["data"]
        self._access_token = data["access_token"]
        self._refresh_token = data["refresh_token"]
        self._token_expires_at = time.time() + data.get("expires_in", 3600)

    def _refresh(self) -> None:
        if not self._refresh_token:
            self._login()
            return
        try:
            resp = httpx.post(
                f"{self.base_url}/api/v1/auth/refresh",
                json={"refresh_token": self._refresh_token},
                timeout=10,
            )
            resp.raise_for_status()
            data = resp.json()["data"]
            self._access_token = data["access_token"]
            self._refresh_token = data["refresh_token"]
            self._token_expires_at = time.time() + data.get("expires_in", 3600)
        except Exception:
            self._login()

    def _ensure_auth(self) -> str:
        if not self._is_token_valid():
            if self._refresh_token:
                try:
                    self._refresh()
                    return self._access_token
                except Exception:
                    pass
            self._login()
        return self._access_token

    def _request(self, method: str, path: str, **kwargs) -> Dict[str, Any]:
        token = self._ensure_auth()
        headers = kwargs.pop("headers", {})
        headers["Authorization"] = f"Bearer {token}"
        resp = httpx.request(
            method,
            f"{self.base_url}{path}",
            headers=headers,
            timeout=30,
            **kwargs,
        )
        if resp.status_code == 401:
            self._login()
            token = self._access_token
            headers["Authorization"] = f"Bearer {token}"
            resp = httpx.request(
                method,
                f"{self.base_url}{path}",
                headers=headers,
                timeout=30,
                **kwargs,
            )
        resp.raise_for_status()
        return resp.json()

    def create_instance(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        return self._request("POST", "/api/v1/instances", json=payload)

    def get_instance(self, instance_id: int) -> Dict[str, Any]:
        return self._request("GET", f"/api/v1/instances/{instance_id}")

    def generate_access_token(self, instance_id: int) -> Dict[str, Any]:
        return self._request("POST", f"/api/v1/instances/{instance_id}/access")

    def start_instance(self, instance_id: int) -> Dict[str, Any]:
        return self._request("POST", f"/api/v1/instances/{instance_id}/start")

    def get_instance_status(self, instance_id: int) -> Dict[str, Any]:
        return self._request("GET", f"/api/v1/instances/{instance_id}/status")


clawmanager_client = ClawManagerClient()
