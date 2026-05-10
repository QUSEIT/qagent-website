import json
import logging
import re
import shlex
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models import User, Instance, TokenConfig, FeishuChannel, QQChannel
from app.schemas import (
    QAgentStatus, QAgentCreateResponse, QAgentDeleteResponse, QAgentAccessResponse,
    QAgentInstanceStatus, QAgentExecRequest, InstanceInfo,
    TokenConfigCreate, TokenConfigOut,
    FeishuQRResponse, FeishuPollResponse, FeishuChannelOut,
    QQQRResponse, QQPollResponse, QQChannelOut,
)
from app.services.clawmanager import clawmanager_client, ClawManagerError
from app.services.feishu import create_session, get_session, delete_session, FeishuError
from app.services.qqbot import create_session as create_qq_session, get_session as get_qq_session, delete_session as delete_qq_session, QQBotError

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/qagent", tags=["qagent"])

TYPE_MAP = {
    "OpenClaw": "openclaw",
    "HermesAgent": "hermes",
}

TYPE_OS_MAP = {
    "OpenClaw": {"os_type": "openclaw", "os_version": "latest"},
    "HermesAgent": {"os_type": "hermes", "os_version": "latest"},
}

SKILL_TEMPLATE_MAP = {
    "content": "内容创作",
    "devops": "DevOps",
    "tutor": "学习辅导",
    "none": "无",
}


def _k8s_safe_name(raw: str, fallback: str) -> str:
    s = re.sub(r"[^A-Za-z0-9._-]+", "-", raw or "").lower()
    s = re.sub(r"^[^a-z0-9]+|[^a-z0-9]+$", "", s)[:50]
    s = re.sub(r"[^a-z0-9]+$", "", s)
    return s if len(s) >= 3 else fallback


def _absolutize(url: str) -> str:
    if not url:
        return url
    if url.startswith(("http://", "https://")):
        return url
    base = clawmanager_client.base_url.rstrip("/")
    if not url.startswith("/"):
        url = "/" + url
    return f"{base}{url}"


@router.get("/status", response_model=QAgentStatus)
def get_status(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    instances = db.query(Instance).filter(Instance.user_id == user.id).all()
    return QAgentStatus(
        has_instance=len(instances) > 0,
        instances=[InstanceInfo.model_validate(i) for i in instances],
        max_instances=user.max_instances,
        can_create=len(instances) < user.max_instances,
    )


@router.post("/create", response_model=QAgentCreateResponse)
def create_qagent(
    name: str = "我的 QAgent",
    instance_type: str = Query("OpenClaw", alias="type"),
    skill_template: str = Query("none", alias="skill"),
    cpu_cores: float = Query(1.0),
    memory_gb: int = Query(4),
    disk_gb: int = Query(20),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    current_count = db.query(Instance).filter(Instance.user_id == user.id).count()
    if current_count >= user.max_instances:
        raise HTTPException(status_code=400, detail="已达到最大实例数量限制")
    if user.max_instances <= 0:
        raise HTTPException(status_code=403, detail="您没有开通QAgent的权限，请联系管理员")
    if disk_gb < 10:
        raise HTTPException(status_code=400, detail="磁盘容量不能小于10GB")

    safe_name = _k8s_safe_name(name, fallback=f"qagent-{user.id}")
    type_os = TYPE_OS_MAP.get(instance_type, {"os_type": "ubuntu", "os_version": "22.04"})
    payload = {
        "cpu_cores": cpu_cores,
        "memory_gb": memory_gb,
        "disk_gb": disk_gb,
        "gpu_enabled": False,
        "gpu_count": 0,
        **type_os,
        "name": safe_name,
        "type": TYPE_MAP.get(instance_type, "openclaw"),
        "skill_template": skill_template,
    }
    try:
        result = clawmanager_client.create_instance(payload)
        clawmanager_id = result["data"]["id"]
    except Exception as e:
        logger.exception(
            "ClawManager create_instance failed (base_url=%s, payload=%s)",
            clawmanager_client.base_url,
            payload,
        )
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create instance: {type(e).__name__}: {e}",
        )

    instance = Instance(
        user_id=user.id,
        clawmanager_instance_id=clawmanager_id,
        name=name,
        instance_type=instance_type,
        skill_template=skill_template,
        cpu_cores=cpu_cores,
        memory_gb=memory_gb,
        disk_gb=disk_gb,
    )
    db.add(instance)
    db.commit()

    return QAgentCreateResponse(instance_id=instance.id, message="QAgent created successfully")


@router.get("/instance-status/{instance_id}", response_model=QAgentInstanceStatus)
def get_instance_status(
    instance_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    instance = db.query(Instance).filter(Instance.id == instance_id, Instance.user_id == user.id).first()
    if not instance:
        raise HTTPException(status_code=404, detail="QAgent not found")

    try:
        result = clawmanager_client.get_instance_status(instance.clawmanager_instance_id)
        instance_status = result["data"]["instance_status"]
    except Exception as e:
        logger.exception(
            "ClawManager get_instance_status failed (base_url=%s, instance_id=%s)",
            clawmanager_client.base_url,
            instance.clawmanager_instance_id,
        )
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get instance status: {type(e).__name__}: {e}",
        )

    return QAgentInstanceStatus(
        status=instance_status["status"],
        pod_status=instance_status.get("pod_status"),
    )


@router.post("/access/{instance_id}", response_model=QAgentAccessResponse)
def access_qagent(
    instance_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    instance = db.query(Instance).filter(Instance.id == instance_id, Instance.user_id == user.id).first()
    if not instance:
        raise HTTPException(status_code=404, detail="QAgent not found")

    try:
        result = clawmanager_client.generate_access_token(instance.clawmanager_instance_id)
        data = result["data"]
    except Exception as e:
        logger.exception(
            "ClawManager generate_access_token failed (base_url=%s, instance_id=%s)",
            clawmanager_client.base_url,
            instance.clawmanager_instance_id,
        )
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate access: {type(e).__name__}: {e}",
        )

    return QAgentAccessResponse(
        token=data["token"],
        access_url=_absolutize(data["access_url"]),
        proxy_url=_absolutize(data["proxy_url"]),
        expires_at=data["expires_at"],
    )


@router.post("/exec/{instance_id}")
def exec_qagent(
    instance_id: int,
    req: QAgentExecRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    instance = db.query(Instance).filter(Instance.id == instance_id, Instance.user_id == user.id).first()
    if not instance:
        raise HTTPException(status_code=404, detail="QAgent not found")

    try:
        result = clawmanager_client.exec_instance(instance.clawmanager_instance_id, req.command)
        return result
    except ClawManagerError as e:
        logger.exception(
            "ClawManager exec_instance failed (base_url=%s, instance_id=%s)",
            clawmanager_client.base_url,
            instance.clawmanager_instance_id,
        )
        raise HTTPException(
            status_code=e.status_code if e.status_code >= 400 else 500,
            detail=e.detail,
        )
    except Exception as e:
        logger.exception(
            "ClawManager exec_instance failed (base_url=%s, instance_id=%s)",
            clawmanager_client.base_url,
            instance.clawmanager_instance_id,
        )
        raise HTTPException(
            status_code=500,
            detail=f"Failed to exec instance: {type(e).__name__}: {e}",
        )


@router.post("/token-config", response_model=TokenConfigOut)
def save_token_config(
    req: TokenConfigCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    existing = (
        db.query(TokenConfig)
        .filter(TokenConfig.user_id == user.id, TokenConfig.provider == req.provider)
        .first()
    )
    if existing:
        existing.api_key = req.api_key
        existing.model = req.model
        existing.base_url = req.base_url
    else:
        existing = TokenConfig(
            user_id=user.id,
            provider=req.provider,
            api_key=req.api_key,
            model=req.model,
            base_url=req.base_url,
        )
        db.add(existing)

    if req.instance_id:
        instance = db.query(Instance).filter(Instance.id == req.instance_id, Instance.user_id == user.id).first()
        if instance:
            instance.default_provider = req.provider

    db.commit()
    db.refresh(existing)
    return existing


@router.get("/token-config/{provider}", response_model=TokenConfigOut)
def get_token_config(
    provider: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    config = (
        db.query(TokenConfig)
        .filter(TokenConfig.user_id == user.id, TokenConfig.provider == provider)
        .first()
    )
    if not config:
        raise HTTPException(status_code=404, detail="Token config not found")
    return config


@router.delete("/instance/{instance_id}", response_model=QAgentDeleteResponse)
def delete_qagent(
    instance_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    instance = db.query(Instance).filter(Instance.id == instance_id, Instance.user_id == user.id).first()
    if not instance:
        raise HTTPException(status_code=404, detail="QAgent not found")

    already_gone = False
    try:
        clawmanager_client.delete_instance(instance.clawmanager_instance_id)
    except ClawManagerError as e:
        if e.status_code == 404:
            already_gone = True
        else:
            logger.exception(
                "ClawManager delete_instance failed (base_url=%s, instance_id=%s)",
                clawmanager_client.base_url,
                instance.clawmanager_instance_id,
            )
            raise HTTPException(
                status_code=500,
                detail=f"Failed to delete instance: {e.detail}",
            )
    except Exception as e:
        logger.exception(
            "ClawManager delete_instance failed (base_url=%s, instance_id=%s)",
            clawmanager_client.base_url,
            instance.clawmanager_instance_id,
        )
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete instance: {type(e).__name__}: {e}",
        )

    # Clean up token config if no other instance uses the same provider
    if instance.default_provider:
        other_using = (
            db.query(Instance)
            .filter(
                Instance.user_id == user.id,
                Instance.id != instance.id,
                Instance.default_provider == instance.default_provider,
            )
            .first()
        )
        if not other_using:
            db.query(TokenConfig).filter(
                TokenConfig.user_id == user.id,
                TokenConfig.provider == instance.default_provider,
            ).delete()

    db.delete(instance)
    db.commit()

    message = "QAgent already removed; local record cleared" if already_gone else "QAgent deletion started"
    return QAgentDeleteResponse(message=message)


@router.post("/channel/feishu/qr", response_model=FeishuQRResponse)
def feishu_qr():
    try:
        result = create_session()
        return FeishuQRResponse(**result)
    except FeishuError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception("Feishu QR generation failed")
        raise HTTPException(status_code=500, detail=f"Failed to generate QR: {e}")


@router.get("/channel/feishu/poll/{device_code}", response_model=FeishuPollResponse)
def feishu_poll(
    device_code: str,
    instance_id: Optional[int] = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    session = get_session(device_code)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    try:
        result = session.poll()
    except FeishuError as e:
        if e.code == "expired_token":
            delete_session(device_code)
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception("Feishu poll failed")
        raise HTTPException(status_code=500, detail=f"Poll failed: {e}")

    logger.info("Feishu poll result: status=%s, device_code=%s", result.get("status"), device_code)

    if result["status"] == "success":
        logger.info("Feishu poll success, app_id=%s, owner_open_id=%s", result.get("app_id"), result.get("owner_open_id"))
        target_instance_id = instance_id
        if not target_instance_id:
            instance = db.query(Instance).filter(Instance.user_id == user.id).order_by(Instance.created_at.desc()).first()
            if instance:
                target_instance_id = instance.id

        logger.info("Feishu save target: instance_id=%s", target_instance_id)

        if target_instance_id:
            instance = db.query(Instance).filter(Instance.id == target_instance_id, Instance.user_id == user.id).first()
            if instance:
                logger.info("Feishu instance found: id=%s, cm_id=%s", instance.id, instance.clawmanager_instance_id)
                existing = db.query(FeishuChannel).filter(FeishuChannel.instance_id == target_instance_id).first()
                if existing:
                    existing.app_id = result["app_id"]
                    existing.app_secret = result["app_secret"]
                    existing.owner_open_id = result.get("owner_open_id")
                    existing.tenant_brand = result.get("tenant_brand", "feishu")
                else:
                    channel = FeishuChannel(
                        user_id=user.id,
                        instance_id=target_instance_id,
                        app_id=result["app_id"],
                        app_secret=result["app_secret"],
                        owner_open_id=result.get("owner_open_id"),
                        tenant_brand=result.get("tenant_brand", "feishu"),
                    )
                    db.add(channel)
                db.commit()

                # Configure OpenClaw via pod exec
                app_id = result["app_id"]
                app_secret = result["app_secret"]
                owner_open_id = result.get("owner_open_id")
                tenant_brand = result.get("tenant_brand", "feishu")
                config_items = [
                    {"path": "channels.feishu.enabled", "value": True},
                    {"path": "channels.feishu.appId", "value": app_id},
                    {"path": "channels.feishu.appSecret", "value": app_secret},
                    {"path": "channels.feishu.domain", "value": tenant_brand},
                    {"path": "channels.feishu.dmPolicy", "value": "allowlist"},
                    {"path": "channels.feishu.allowFrom", "value": [owner_open_id] if owner_open_id else []},
                    {"path": "channels.feishu.groupPolicy", "value": "allowlist"},
                ]
                batch_json = json.dumps(config_items, ensure_ascii=False)
                command = f"openclaw config set --batch-json {shlex.quote(batch_json)}"
                logger.info(
                    "Executing ClawManager exec for feishu config (instance_id=%s, cm_id=%s)",
                    instance.id,
                    instance.clawmanager_instance_id,
                )
                logger.info("Exec command: %s", command)
                try:
                    exec_result = clawmanager_client.exec_instance(instance.clawmanager_instance_id, command)
                    logger.info(
                        "ClawManager exec succeeded for feishu config (instance_id=%s, result=%s)",
                        instance.id,
                        exec_result,
                    )
                except Exception:
                    logger.exception(
                        "ClawManager exec failed for feishu config (instance_id=%s, cm_id=%s)",
                        instance.id,
                        instance.clawmanager_instance_id,
                    )
        delete_session(device_code)
        return FeishuPollResponse(
            status="success",
            app_id=result["app_id"],
            owner_open_id=result.get("owner_open_id"),
            tenant_brand=result.get("tenant_brand", "feishu"),
        )

    if result["status"] == "failed":
        delete_session(device_code)
        return FeishuPollResponse(status="failed", error=result.get("error"))

    return FeishuPollResponse(status="pending")


@router.get("/channel/feishu/{instance_id}", response_model=FeishuChannelOut)
def get_feishu_channel(instance_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    channel = db.query(FeishuChannel).filter(FeishuChannel.instance_id == instance_id, FeishuChannel.user_id == user.id).first()
    if not channel:
        raise HTTPException(status_code=404, detail="Feishu channel not found")
    return channel


@router.post("/channel/qq/qr", response_model=QQQRResponse)
def qq_qr():
    try:
        result = create_qq_session()
        return QQQRResponse(**result)
    except QQBotError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception("QQBot QR generation failed")
        raise HTTPException(status_code=500, detail=f"Failed to generate QR: {e}")


@router.get("/channel/qq/poll/{session_id}", response_model=QQPollResponse)
def qq_poll(
    session_id: str,
    instance_id: Optional[int] = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    session = get_qq_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    status = session.get("status")

    if status == "success":
        credentials = session.get("credentials", [])
        if not credentials:
            delete_qq_session(session_id)
            raise HTTPException(status_code=500, detail="No credentials returned")
        cred = credentials[0]
        app_id = cred.get("appId")
        app_secret = cred.get("appSecret")

        target_instance_id = instance_id
        if not target_instance_id:
            instance = db.query(Instance).filter(Instance.user_id == user.id).order_by(Instance.created_at.desc()).first()
            if instance:
                target_instance_id = instance.id

        if target_instance_id:
            instance = db.query(Instance).filter(Instance.id == target_instance_id, Instance.user_id == user.id).first()
            if instance:
                existing = db.query(QQChannel).filter(QQChannel.instance_id == target_instance_id).first()
                if existing:
                    existing.app_id = app_id
                    existing.app_secret = app_secret
                else:
                    channel = QQChannel(
                        user_id=user.id,
                        instance_id=target_instance_id,
                        app_id=app_id,
                        app_secret=app_secret,
                    )
                    db.add(channel)
                db.commit()

                # Configure OpenClaw via pod exec
                token = f"{app_id}:{app_secret}"
                command = f"openclaw channels add --channel qqbot --token {shlex.quote(token)}"
                logger.info(
                    "Executing ClawManager exec for qqbot config (instance_id=%s, cm_id=%s)",
                    instance.id,
                    instance.clawmanager_instance_id,
                )
                logger.info("Exec command: %s", command)
                try:
                    exec_result = clawmanager_client.exec_instance(instance.clawmanager_instance_id, command)
                    logger.info(
                        "ClawManager exec succeeded for qqbot config (instance_id=%s, result=%s)",
                        instance.id,
                        exec_result,
                    )
                except Exception:
                    logger.exception(
                        "ClawManager exec failed for qqbot config (instance_id=%s, cm_id=%s)",
                        instance.id,
                        instance.clawmanager_instance_id,
                    )
        delete_qq_session(session_id)
        return QQPollResponse(status="success", app_id=app_id)

    if status == "error":
        delete_qq_session(session_id)
        return QQPollResponse(status="failed", error=session.get("error"))

    return QQPollResponse(status="pending")


@router.get("/channel/qq/{instance_id}", response_model=QQChannelOut)
def get_qq_channel(instance_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    channel = db.query(QQChannel).filter(QQChannel.instance_id == instance_id, QQChannel.user_id == user.id).first()
    if not channel:
        raise HTTPException(status_code=404, detail="QQ channel not found")
    return channel
