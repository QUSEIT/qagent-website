import json
import logging
import re
import shlex
from typing import Optional

from fastapi import APIRouter, Depends, File, HTTPException, Query, Response, UploadFile
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models import User, Instance, TokenConfig, FeishuChannel, QQChannel, SkillSet, Skill, Profile
from app.schemas import (
    QAgentStatus, QAgentCreateResponse, QAgentDeleteResponse, QAgentAccessResponse,
    QAgentInstanceStatus, QAgentExecRequest, InstanceInfo,
    TokenConfigCreate, TokenConfigOut,
    FeishuQRResponse, FeishuPollResponse, FeishuChannelOut,
    QQQRResponse, QQPollResponse, QQChannelOut,
    SkillSetOut, SkillOut, SkillSyncResponse,
    ProfileCreate, ProfileUpdate, ProfileOut,
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
        if e.status_code == 409 and "not running" in e.detail:
            raise HTTPException(status_code=503, detail="实例未运行，请稍后重试")
        if e.status_code == 409 and "not ready" in e.detail:
            raise HTTPException(status_code=503, detail="实例尚未就绪，请稍后重试")
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
                    existing.status = "pending"
                else:
                    channel = FeishuChannel(
                        user_id=user.id,
                        instance_id=target_instance_id,
                        app_id=result["app_id"],
                        app_secret=result["app_secret"],
                        owner_open_id=result.get("owner_open_id"),
                        tenant_brand=result.get("tenant_brand", "feishu"),
                        status="pending",
                    )
                    db.add(channel)
                db.commit()
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
                    existing.status = "pending"
                else:
                    channel = QQChannel(
                        user_id=user.id,
                        instance_id=target_instance_id,
                        app_id=app_id,
                        app_secret=app_secret,
                        status="pending",
                    )
                    db.add(channel)
                db.commit()
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


@router.post("/channel/feishu/save/{instance_id}")
def save_feishu_channel(instance_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    instance = db.query(Instance).filter(Instance.id == instance_id, Instance.user_id == user.id).first()
    if not instance:
        raise HTTPException(status_code=404, detail="QAgent not found")

    channel = db.query(FeishuChannel).filter(FeishuChannel.instance_id == instance_id, FeishuChannel.user_id == user.id).first()
    if not channel:
        raise HTTPException(status_code=404, detail="Feishu channel not found")

    app_id = channel.app_id
    app_secret = channel.app_secret
    owner_open_id = channel.owner_open_id
    tenant_brand = channel.tenant_brand
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
        result = clawmanager_client.exec_instance(instance.clawmanager_instance_id, command)
        channel.status = "active"
        db.commit()
        logger.info(
            "ClawManager exec succeeded for feishu config (instance_id=%s, result=%s)",
            instance.id,
            result,
        )
        return {"message": "Feishu channel saved", "result": result}
    except Exception as e:
        logger.exception(
            "ClawManager exec failed for feishu config (instance_id=%s, cm_id=%s)",
            instance.id,
            instance.clawmanager_instance_id,
        )
        raise HTTPException(status_code=500, detail=f"Failed to save feishu channel: {type(e).__name__}: {e}")


@router.post("/channel/qq/save/{instance_id}")
def save_qq_channel(instance_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    instance = db.query(Instance).filter(Instance.id == instance_id, Instance.user_id == user.id).first()
    if not instance:
        raise HTTPException(status_code=404, detail="QAgent not found")

    channel = db.query(QQChannel).filter(QQChannel.instance_id == instance_id, QQChannel.user_id == user.id).first()
    if not channel:
        raise HTTPException(status_code=404, detail="QQ channel not found")

    token = f"{channel.app_id}:{channel.app_secret}"
    command = f"openclaw channels add --channel qqbot --token {shlex.quote(token)}"
    logger.info(
        "Executing ClawManager exec for qqbot config (instance_id=%s, cm_id=%s)",
        instance.id,
        instance.clawmanager_instance_id,
    )
    logger.info("Exec command: %s", command)
    try:
        result = clawmanager_client.exec_instance(instance.clawmanager_instance_id, command)
        logger.info(
            "ClawManager exec succeeded for qqbot config (instance_id=%s, result=%s)",
            instance.id,
            result,
        )
        return {"message": "QQ channel saved", "result": result}
    except Exception as e:
        logger.exception(
            "ClawManager exec failed for qqbot config (instance_id=%s, cm_id=%s)",
            instance.id,
            instance.clawmanager_instance_id,
        )
        raise HTTPException(status_code=500, detail=f"Failed to save qq channel: {type(e).__name__}: {e}")


@router.post("/skills/install/{instance_id}")
def install_skills(
    instance_id: int,
    req: dict,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    instance = db.query(Instance).filter(Instance.id == instance_id, Instance.user_id == user.id).first()
    if not instance:
        raise HTTPException(status_code=404, detail="QAgent not found")

    skill_template = req.get("skill_template", instance.skill_template)
    clawmanager_skill_id = req.get("clawmanager_skill_id")

    if clawmanager_skill_id is None and not skill_template:
        raise HTTPException(status_code=400, detail="skill_template or clawmanager_skill_id is required")

    if clawmanager_skill_id:
        try:
            clawmanager_skill_id = int(clawmanager_skill_id)
        except (TypeError, ValueError):
            raise HTTPException(status_code=400, detail="invalid clawmanager_skill_id")

    if skill_template == "none" or clawmanager_skill_id is None:
        command = "openclaw skills reset"
        try:
            result = clawmanager_client.exec_instance(instance.clawmanager_instance_id, command)
            instance.skill_template = "none"
            db.commit()
            return {"message": "Skills reset", "result": result}
        except ClawManagerError as e:
            logger.exception("ClawManager exec_instance failed for skills reset")
            if e.status_code == 409 and "not running" in e.detail:
                raise HTTPException(status_code=503, detail="实例未运行，请稍后重试")
            if e.status_code == 409 and "not ready" in e.detail:
                raise HTTPException(status_code=503, detail="实例尚未就绪，请稍后重试")
            raise HTTPException(status_code=e.status_code if e.status_code >= 400 else 500, detail=e.detail)
        except Exception as e:
            logger.exception("ClawManager exec_instance failed for skills reset")
            raise HTTPException(status_code=500, detail=f"Failed to reset skills: {type(e).__name__}: {e}")

    skill_template = str(skill_template)
    try:
        result = clawmanager_client.attach_skill_to_instance(instance.clawmanager_instance_id, clawmanager_skill_id)
        instance.skill_template = skill_template
        db.commit()
        return {"message": "Skill attached", "result": result}
    except ClawManagerError as e:
        logger.exception("ClawManager attach_skill failed")
        if e.status_code == 409 and "not running" in e.detail:
            raise HTTPException(status_code=503, detail="实例未运行，请稍后重试")
        if e.status_code == 409 and "not ready" in e.detail:
            raise HTTPException(status_code=503, detail="实例尚未就绪，请稍后重试")
        raise HTTPException(status_code=e.status_code if e.status_code >= 400 else 500, detail=e.detail)
    except Exception as e:
        logger.exception("ClawManager attach_skill failed")
        raise HTTPException(status_code=500, detail=f"Failed to attach skill: {type(e).__name__}: {e}")


@router.post("/skills/sync/{instance_id}", response_model=SkillSyncResponse)
def sync_skills(
    instance_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    instance = db.query(Instance).filter(Instance.id == instance_id, Instance.user_id == user.id).first()
    if not instance:
        raise HTTPException(status_code=404, detail="QAgent not found")

    try:
        result = clawmanager_client.list_skills()
    except ClawManagerError as e:
        logger.exception("ClawManager list_skills failed")
        raise HTTPException(status_code=e.status_code if e.status_code >= 400 else 500, detail=e.detail)
    except Exception as e:
        logger.exception("ClawManager list_skills failed")
        raise HTTPException(status_code=500, detail=f"获取技能列表失败: {type(e).__name__}: {e}")

    data = result.get("data", [])
    if not data:
        raise HTTPException(status_code=502, detail="ClawManager 返回为空")

    # ClawManager returns: [{"id": 1, "name": "xxx", "skill_key": "yyy", "description": "...", "status": "active", ...}]
    # Map each ClawManager skill to a SkillSet (grouped by source_type for clarity)
    # Clear existing SkillSets and Skills for this instance_type
    db.query(Skill).filter(Skill.skill_set_id.in_(
        db.query(SkillSet.id).filter(SkillSet.instance_type == instance.instance_type)
    )).delete(synchronize_session="fetch")
    db.query(SkillSet).filter(SkillSet.instance_type == instance.instance_type).delete(synchronize_session="fetch")
    db.commit()

    total_skills = 0
    for idx, skill_item in enumerate(data):
        skill_name = (skill_item.get("name") or "").strip()
        if not skill_name or skill_item.get("status") != "active":
            continue
        skill_key = (skill_item.get("skill_key") or f"skill-{skill_item.get('id')}").strip()
        skill_desc = (skill_item.get("description") or "").strip()
        clawmanager_id = skill_item.get("id")
        skill_set = SkillSet(
            name=skill_name,
            description=skill_desc,
            instance_type=instance.instance_type,
            skill_id=skill_key,
            clawmanager_skill_id=clawmanager_id,
            icon=skill_name[0].upper() if skill_name else "?",
            sort_order=idx,
        )
        db.add(skill_set)
        db.flush()

        skill_obj = Skill(
            skill_set_id=skill_set.id,
            name=skill_name,
            description=skill_desc,
            icon=skill_name[0].upper() if skill_name else "?",
            sort_order=0,
        )
        db.add(skill_obj)
        total_skills += 1

    db.commit()
    skill_sets_count = db.query(SkillSet).filter(SkillSet.instance_type == instance.instance_type).count()
    return SkillSyncResponse(message="同步成功", skill_sets_count=skill_sets_count, skills_count=total_skills)


@router.get("/skills/templates/{instance_id}")
def get_skill_templates(
    instance_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    instance = db.query(Instance).filter(Instance.id == instance_id, Instance.user_id == user.id).first()
    if not instance:
        raise HTTPException(status_code=404, detail="QAgent not found")

    skill_sets = db.query(SkillSet).filter(SkillSet.instance_type == instance.instance_type, SkillSet.skill_id != "none").order_by(SkillSet.sort_order).all()
    result = []
    for ss in skill_sets:
        skills = db.query(Skill).filter(Skill.skill_set_id == ss.id).order_by(Skill.sort_order).all()
        result.append({
            "id": ss.skill_id,
            "clawmanager_skill_id": ss.clawmanager_skill_id,
            "label": ss.name,
            "desc": ss.description or "",
            "skills": [{"name": s.name, "desc": s.description or ""} for s in skills],
        })
    return result


@router.get("/skills/installed/{instance_id}")
def get_installed_skills(
    instance_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    instance = db.query(Instance).filter(Instance.id == instance_id, Instance.user_id == user.id).first()
    if not instance:
        raise HTTPException(status_code=404, detail="QAgent not found")

    try:
        result = clawmanager_client.list_instance_skills(instance.clawmanager_instance_id)
    except ClawManagerError as e:
        logger.exception("ClawManager list_instance_skills failed")
        if e.status_code == 409 and "not running" in e.detail:
            raise HTTPException(status_code=503, detail="实例未运行，请稍后重试")
        raise HTTPException(status_code=e.status_code if e.status_code >= 400 else 500, detail=e.detail)
    except Exception as e:
        logger.exception("ClawManager list_instance_skills failed")
        raise HTTPException(status_code=500, detail=f"获取已安装技能失败: {type(e).__name__}: {e}")

    items = result.get("data", [])
    return [
        {
            "id": item.get("id"),
            "skill_id": item.get("skill", {}).get("skill_key") if item.get("skill") else None,
            "name": item.get("skill", {}).get("name") if item.get("skill") else "Unknown",
            "description": item.get("skill", {}).get("description") if item.get("skill") else "",
            "status": item.get("status"),
        }
        for item in items
    ]


@router.delete("/skills/installed/{instance_id}/{cm_skill_id}")
def uninstall_skill(
    instance_id: int,
    cm_skill_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    instance = db.query(Instance).filter(Instance.id == instance_id, Instance.user_id == user.id).first()
    if not instance:
        raise HTTPException(status_code=404, detail="QAgent not found")

    try:
        clawmanager_client.detach_skill_from_instance(instance.clawmanager_instance_id, cm_skill_id)
        return {"message": "Skill uninstalled"}
    except ClawManagerError as e:
        logger.exception("ClawManager detach_skill failed")
        if e.status_code == 409 and "not running" in e.detail:
            raise HTTPException(status_code=503, detail="实例未运行，请稍后重试")
        raise HTTPException(status_code=e.status_code if e.status_code >= 400 else 500, detail=e.detail)
    except Exception as e:
        logger.exception("ClawManager detach_skill failed")
        raise HTTPException(status_code=500, detail=f"卸载技能失败: {type(e).__name__}: {e}")


def _instance_action(instance_id: int, user_id: int, db: Session, action: str, method: str):
    instance = db.query(Instance).filter(Instance.id == instance_id, Instance.user_id == user_id).first()
    if not instance:
        raise HTTPException(status_code=404, detail="QAgent not found")
    try:
        result = method(instance.clawmanager_instance_id)
        return result
    except ClawManagerError as e:
        logger.exception(f"ClawManager {action} failed")
        raise HTTPException(status_code=e.status_code if e.status_code >= 400 else 500, detail=e.detail)
    except Exception as e:
        logger.exception(f"ClawManager {action} failed")
        raise HTTPException(status_code=500, detail=f"{action}失败: {type(e).__name__}: {e}")


@router.post("/instance/{instance_id}/start")
def start_instance(instance_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    result = _instance_action(instance_id, user.id, db, "启动实例", clawmanager_client.start_instance)
    return result


@router.post("/instance/{instance_id}/stop")
def stop_instance(instance_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    result = _instance_action(instance_id, user.id, db, "停止实例", clawmanager_client.stop_instance)
    return result


@router.post("/instance/{instance_id}/restart")
def restart_instance(instance_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    result = _instance_action(instance_id, user.id, db, "重启实例", clawmanager_client.restart_instance)
    return result


@router.get("/instance/{instance_id}/export")
async def export_instance(instance_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    instance = db.query(Instance).filter(Instance.id == instance_id, Instance.user_id == user.id).first()
    if not instance:
        raise HTTPException(status_code=404, detail="QAgent not found")
    if instance.instance_type.lower() != "openclaw":
        raise HTTPException(status_code=400, detail="功能正在实现中")

    try:
        resp = clawmanager_client.export_openclaw_raw(instance.clawmanager_instance_id)
        if resp.is_error:
            try:
                body = resp.json()
                detail = body.get("error") or body.get("message") or resp.text
            except Exception:
                detail = resp.text
            raise HTTPException(status_code=resp.status_code, detail=detail)
        headers = dict(resp.headers)
        content_disposition = headers.get("content-disposition", "attachment")
        return Response(
            content=resp.content,
            media_type=headers.get("content-type", "application/octet-stream"),
            headers={"Content-Disposition": content_disposition},
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("ClawManager export_openclaw failed")
        raise HTTPException(status_code=500, detail=f"导出配置失败: {type(e).__name__}: {e}")


@router.post("/instance/{instance_id}/import")
async def import_instance(instance_id: int, file: UploadFile = File(...), user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    instance = db.query(Instance).filter(Instance.id == instance_id, Instance.user_id == user.id).first()
    if not instance:
        raise HTTPException(status_code=404, detail="QAgent not found")
    if instance.instance_type.lower() != "openclaw":
        raise HTTPException(status_code=400, detail="功能正在实现中")

    content = await file.read()
    try:
        result = clawmanager_client.import_openclaw(instance.clawmanager_instance_id, content, file.filename or "workspace.tar.gz")
        return result
    except ClawManagerError as e:
        logger.exception("ClawManager import_openclaw failed")
        raise HTTPException(status_code=e.status_code if e.status_code >= 400 else 500, detail=e.detail)
    except Exception as e:
        logger.exception("ClawManager import_openclaw failed")
        raise HTTPException(status_code=500, detail=f"导入配置失败: {type(e).__name__}: {e}")


# ── Profile CRUD ─────────────────────────────────────────────────────────────

def _profile_out(profile: Profile) -> ProfileOut:
    skills_raw = profile.skills or ""
    try:
        skills_list = json.loads(skills_raw) if skills_raw else []
    except Exception:
        skills_list = []
    return ProfileOut(
        id=profile.id,
        instance_id=profile.instance_id,
        name=profile.name,
        description=profile.description,
        system_prompt=profile.system_prompt,
        model=profile.model,
        temperature=profile.temperature,
        skills=skills_list,
        is_default=profile.is_default,
        is_active=profile.is_active,
        agent_id=profile.agent_id,
        soul_content=profile.soul_content,
        created_at=profile.created_at,
        updated_at=profile.updated_at,
    )


def _sync_profile_to_agent(instance: Instance, profile: Profile, db: Session):
    """Write Profile config into the running agent via exec."""
    if instance.instance_type == "OpenClaw":
        # OpenClaw: use agents.create / agents.update gateway methods
        if profile.is_default:
            # Mark this agent as the default in OpenClaw config
            cmd = f"openclaw agents default {profile.agent_id}" if profile.agent_id else ""
            if cmd:
                clawmanager_client.exec_instance(instance.clawmanager_instance_id, cmd)
        # system_prompt goes into SOUL.md via workspace file write
        if profile.system_prompt:
            escaped_prompt = profile.system_prompt.replace('"', '\\"').replace('\n', '\\n')
            cmd = f'openclaw workspace write SOUL.md "{escaped_prompt}"'
            clawmanager_client.exec_instance(instance.clawmanager_instance_id, cmd)
    elif instance.instance_type == "HermesAgent":
        # HermesAgent: write SOUL.md and config.yaml directly
        if profile.soul_content:
            import base64
            encoded = base64.b64encode(profile.soul_content.encode()).decode()
            cmd = f'echo "{encoded}" | base64 -d > ~/.hermes/SOUL.md'
            clawmanager_client.exec_instance(instance.clawmanager_instance_id, cmd)
        if profile.model or profile.temperature:
            import yaml
            config_path = "~/.hermes/config.yaml"
            # For HermesAgent, update model via CLI
            if profile.model:
                cmd = f"hermes model set {profile.model}"
                clawmanager_client.exec_instance(instance.clawmanager_instance_id, cmd)


@router.get("/profiles/{instance_id}", response_model=list[ProfileOut])
def list_profiles(instance_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    instance = db.query(Instance).filter(Instance.id == instance_id, Instance.user_id == user.id).first()
    if not instance:
        raise HTTPException(status_code=404, detail="QAgent not found")
    profiles = db.query(Profile).filter(Profile.instance_id == instance_id).order_by(Profile.created_at).all()
    return [_profile_out(p) for p in profiles]


@router.post("/profiles/{instance_id}", response_model=ProfileOut)
def create_profile(instance_id: int, req: ProfileCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    instance = db.query(Instance).filter(Instance.id == instance_id, Instance.user_id == user.id).first()
    if not instance:
        raise HTTPException(status_code=404, detail="QAgent not found")

    # If this is the first profile, make it default
    existing_count = db.query(Profile).filter(Profile.instance_id == instance_id).count()

    profile = Profile(
        instance_id=instance_id,
        name=req.name,
        description=req.description or "",
        system_prompt=req.system_prompt or "",
        model=req.model or "kimi-k2.6",
        temperature=req.temperature if req.temperature is not None else 0.7,
        skills=json.dumps(req.skills or []) if req.skills else "",
        is_default=1 if (req.is_default or existing_count == 0) else 0,
        is_active=0,
    )
    db.add(profile)
    db.flush()

    # Create agent in OpenClaw / profile dir in HermesAgent
    if instance.instance_type == "OpenClaw":
        safe_name = _k8s_safe_name(req.name, fallback=f"profile-{profile.id}")
        cmd = f"openclaw agents create --name {shlex.quote(safe_name)}"
        try:
            result = clawmanager_client.exec_instance(instance.clawmanager_instance_id, cmd)
            agent_id = result.get("data", {}).get("agent", {}).get("id") or safe_name
            profile.agent_id = agent_id
        except Exception:
            profile.agent_id = safe_name  # best-effort
    elif instance.instance_type == "HermesAgent":
        safe_name = _k8s_safe_name(req.name, fallback=f"profile-{profile.id}")
        profile.agent_id = safe_name  # Hermes profile dir name

    db.commit()
    db.refresh(profile)
    _sync_profile_to_agent(instance, profile, db)
    return _profile_out(profile)


@router.put("/profiles/{instance_id}/{profile_id}", response_model=ProfileOut)
def update_profile(instance_id: int, profile_id: int, req: ProfileUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    instance = db.query(Instance).filter(Instance.id == instance_id, Instance.user_id == user.id).first()
    if not instance:
        raise HTTPException(status_code=404, detail="QAgent not found")

    profile = db.query(Profile).filter(Profile.id == profile_id, Profile.instance_id == instance_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    if req.name is not None:
        profile.name = req.name
    if req.description is not None:
        profile.description = req.description
    if req.system_prompt is not None:
        profile.system_prompt = req.system_prompt
    if req.model is not None:
        profile.model = req.model
    if req.temperature is not None:
        profile.temperature = req.temperature
    if req.skills is not None:
        profile.skills = json.dumps(req.skills) if req.skills else ""
    if req.is_default is not None and req.is_default == 1:
        # Unset all other defaults
        db.query(Profile).filter(
            Profile.instance_id == instance_id,
            Profile.id != profile_id,
        ).update({"is_default": 0})
        profile.is_default = 1

    db.commit()
    db.refresh(profile)
    _sync_profile_to_agent(instance, profile, db)
    return _profile_out(profile)


@router.delete("/profiles/{instance_id}/{profile_id}")
def delete_profile(instance_id: int, profile_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    instance = db.query(Instance).filter(Instance.id == instance_id, Instance.user_id == user.id).first()
    if not instance:
        raise HTTPException(status_code=404, detail="QAgent not found")

    profile = db.query(Profile).filter(Profile.id == profile_id, Profile.instance_id == instance_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    # Delete agent in OpenClaw
    if instance.instance_type == "OpenClaw" and profile.agent_id:
        cmd = f"openclaw agents delete {profile.agent_id}"
        try:
            clawmanager_client.exec_instance(instance.clawmanager_instance_id, cmd)
        except Exception:
            pass  # best-effort

    was_default = profile.is_default == 1
    db.delete(profile)

    # Promote first remaining profile to default
    if was_default:
        first = db.query(Profile).filter(Profile.instance_id == instance_id).order_by(Profile.created_at).first()
        if first:
            first.is_default = 1

    db.commit()
    return {"message": "Profile deleted"}


@router.post("/profiles/{instance_id}/{profile_id}/default")
def set_profile_default(instance_id: int, profile_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    instance = db.query(Instance).filter(Instance.id == instance_id, Instance.user_id == user.id).first()
    if not instance:
        raise HTTPException(status_code=404, detail="QAgent not found")

    profile = db.query(Profile).filter(Profile.id == profile_id, Profile.instance_id == instance_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    db.query(Profile).filter(Profile.instance_id == instance_id).update({"is_default": 0})
    profile.is_default = 1
    db.commit()
    _sync_profile_to_agent(instance, profile, db)
    return _profile_out(profile)
