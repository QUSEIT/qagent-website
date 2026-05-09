import httpx
import logging
import time
from typing import Dict, Any, Optional
from urllib.parse import urlparse, parse_qs, urlencode, urlunparse

logger = logging.getLogger(__name__)

FEISHU_ACCOUNTS_URL = "https://accounts.feishu.cn/oauth/v1/app/registration"
LARK_ACCOUNTS_URL = "https://accounts.larksuite.com/oauth/v1/app/registration"


def _append_query_params(url: str, params: Dict[str, str]) -> str:
    parsed = urlparse(url)
    query = parse_qs(parsed.query)
    for k, v in params.items():
        query[k] = [v]
    new_query = urlencode(query, doseq=True)
    return urlunparse(parsed._replace(query=new_query))


class FeishuError(RuntimeError):
    def __init__(self, message: str, code: Optional[str] = None):
        super().__init__(message)
        self.code = code


def _call(action: str, data: Dict[str, Any], base_url: str = FEISHU_ACCOUNTS_URL) -> Dict[str, Any]:
    resp = httpx.post(
        base_url,
        data={"action": action, **data},
        timeout=30,
    )
    try:
        body = resp.json()
    except Exception:
        body = {}
    # Feishu returns 4xx with error body for pending/denied states;
    # treat those as valid responses so the caller can inspect body["error"].
    if resp.is_error and not body.get("error"):
        resp.raise_for_status()
    return body


def init_flow() -> Dict[str, Any]:
    result = _call("init", {})
    if "client_secret" not in result.get("supported_auth_methods", []):
        raise FeishuError("client_secret auth not supported")
    return result


def begin_flow() -> Dict[str, Any]:
    init_flow()
    result = _call("begin", {
        "archetype": "PersonalAgent",
        "auth_method": "client_secret",
        "request_user_info": "open_id",
    })
    return result


def poll_flow(device_code: str, tenant_brand: Optional[str] = None) -> Dict[str, Any]:
    base_url = LARK_ACCOUNTS_URL if tenant_brand == "lark" else FEISHU_ACCOUNTS_URL
    result = _call("poll", {"device_code": device_code, "tp": "ob_app"}, base_url=base_url)

    if result.get("error") == "slow_down":
        raise FeishuError("slow_down", code="slow_down")
    if result.get("error") == "authorization_pending":
        raise FeishuError("authorization_pending", code="authorization_pending")
    if result.get("error") == "access_denied":
        raise FeishuError("access_denied", code="access_denied")
    if result.get("error") == "expired_token":
        raise FeishuError("expired_token", code="expired_token")

    # Detect Lark switch
    user_info = result.get("user_info", {})
    if user_info.get("tenant_brand") == "lark" and tenant_brand != "lark":
        return poll_flow(device_code, tenant_brand="lark")

    return result


class FeishuFlowSession:
    def __init__(self):
        self.device_code: Optional[str] = None
        self.qr_url: Optional[str] = None
        self.interval: int = 5
        self.expire_in: int = 600
        self.created_at: float = 0
        self.tenant_brand: Optional[str] = None

    def start(self) -> Dict[str, Any]:
        result = begin_flow()
        self.device_code = result["device_code"]
        self.qr_url = _append_query_params(
            result["verification_uri_complete"],
            {"from": "oc_onboard", "tp": "ob_cli_app"}
        )
        self.interval = result.get("interval", 5)
        self.expire_in = result.get("expire_in", 600)
        self.created_at = time.time()
        return {
            "device_code": self.device_code,
            "qr_url": self.qr_url,
            "interval": self.interval,
            "expire_in": self.expire_in,
        }

    def poll(self) -> Dict[str, Any]:
        if not self.device_code:
            raise FeishuError("Flow not started")
        if time.time() > self.created_at + self.expire_in:
            raise FeishuError("expired_token", code="expired_token")

        try:
            result = poll_flow(self.device_code, self.tenant_brand)
        except FeishuError as e:
            if e.code == "slow_down":
                self.interval += 5
                return {"status": "pending", "interval": self.interval}
            if e.code == "authorization_pending":
                return {"status": "pending", "interval": self.interval}
            if e.code in ("access_denied", "expired_token"):
                return {"status": "failed", "error": e.code}
            raise

        user_info = result.get("user_info", {})
        self.tenant_brand = user_info.get("tenant_brand", "feishu")

        return {
            "status": "success",
            "app_id": result.get("client_id"),
            "app_secret": result.get("client_secret"),
            "owner_open_id": user_info.get("open_id"),
            "tenant_brand": self.tenant_brand,
        }


# In-memory session store (device_code -> session)
_sessions: Dict[str, FeishuFlowSession] = {}


def create_session() -> Dict[str, Any]:
    session = FeishuFlowSession()
    result = session.start()
    _sessions[result["device_code"]] = session
    return result


def get_session(device_code: str) -> Optional[FeishuFlowSession]:
    return _sessions.get(device_code)


def delete_session(device_code: str):
    _sessions.pop(device_code, None)
