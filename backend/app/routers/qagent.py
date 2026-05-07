import logging
import re

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models import User, Instance
from app.schemas import QAgentStatus, QAgentCreateResponse, QAgentDeleteResponse, QAgentAccessResponse, QAgentInstanceStatus, InstanceInfo
from app.services.clawmanager import clawmanager_client, ClawManagerError

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/qagent", tags=["qagent"])

DEFAULT_QAGENT_CONFIG = {
    "cpu_cores": 1,
    "memory_gb": 2,
    "disk_gb": 20,
    "gpu_enabled": False,
    "gpu_count": 0,
}

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
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    current_count = db.query(Instance).filter(Instance.user_id == user.id).count()
    if current_count >= user.max_instances:
        raise HTTPException(status_code=400, detail="已达到最大实例数量限制")
    if user.max_instances <= 0:
        raise HTTPException(status_code=403, detail="您没有开通QAgent的权限，请联系管理员")

    safe_name = _k8s_safe_name(name, fallback=f"qagent-{user.id}")
    type_os = TYPE_OS_MAP.get(instance_type, {"os_type": "ubuntu", "os_version": "22.04"})
    payload = {
        **DEFAULT_QAGENT_CONFIG,
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

    db.delete(instance)
    db.commit()

    message = "QAgent already removed; local record cleared" if already_gone else "QAgent deletion started"
    return QAgentDeleteResponse(message=message)
