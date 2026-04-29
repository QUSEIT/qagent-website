from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models import User
from app.schemas import HermesStatus, HermesCreateResponse, HermesAccessResponse
from app.services.clawmanager import clawmanager_client

router = APIRouter(prefix="/hermes", tags=["hermes"])

DEFAULT_HERMES_CONFIG = {
    "type": "hermesagent",
    "cpu_cores": 2,
    "memory_gb": 4,
    "disk_gb": 20,
    "os_type": "ubuntu",
    "os_version": "22.04",
    "gpu_enabled": False,
    "gpu_count": 0,
}


@router.get("/status", response_model=HermesStatus)
def get_status(user: User = Depends(get_current_user)):
    return HermesStatus(
        has_instance=user.hermes_instance_id is not None,
        instance_id=user.hermes_instance_id,
    )


@router.post("/create", response_model=HermesCreateResponse)
def create_hermes(
    name: str = "我的 HermesAgent",
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user.hermes_instance_id:
        raise HTTPException(status_code=400, detail="HermesAgent already exists")

    payload = {**DEFAULT_HERMES_CONFIG, "name": name}
    try:
        result = clawmanager_client.create_instance(payload)
        instance_id = result["data"]["id"]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create instance: {str(e)}")

    user.hermes_instance_id = instance_id
    db.commit()

    return HermesCreateResponse(instance_id=instance_id, message="HermesAgent created successfully")


@router.post("/access", response_model=HermesAccessResponse)
def access_hermes(user: User = Depends(get_current_user)):
    if not user.hermes_instance_id:
        raise HTTPException(status_code=404, detail="HermesAgent not found")

    try:
        result = clawmanager_client.generate_access_token(user.hermes_instance_id)
        data = result["data"]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate access: {str(e)}")

    return HermesAccessResponse(
        token=data["token"],
        access_url=data["access_url"],
        proxy_url=data["proxy_url"],
        expires_at=data["expires_at"],
    )
