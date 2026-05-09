from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    expires_in: int


class UserBase(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)


class UserRegister(UserBase):
    password: str = Field(..., min_length=6)


class UserLogin(BaseModel):
    email: str
    password: str


class UserOut(BaseModel):
    id: int
    email: str
    username: str
    qagent_instance_id: Optional[int]
    max_instances: int
    created_at: datetime

    class Config:
        from_attributes = True


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class InstanceInfo(BaseModel):
    id: int
    clawmanager_instance_id: int
    name: str
    instance_type: str
    skill_template: Optional[str] = None
    default_provider: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class QAgentStatus(BaseModel):
    has_instance: bool
    instances: List[InstanceInfo] = []
    max_instances: int = 0
    can_create: bool = False


class QAgentCreateResponse(BaseModel):
    instance_id: int
    message: str


class QAgentDeleteResponse(BaseModel):
    message: str


class QAgentAccessResponse(BaseModel):
    token: str
    access_url: str
    proxy_url: str
    expires_at: str


class QAgentInstanceStatus(BaseModel):
    status: str
    pod_status: Optional[str] = None


class QAgentExecRequest(BaseModel):
    command: str


class TokenConfigCreate(BaseModel):
    provider: str
    api_key: str
    model: str
    base_url: str
    instance_id: Optional[int] = None


class TokenConfigOut(BaseModel):
    id: int
    provider: str
    api_key: str
    model: str
    base_url: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class FeishuQRResponse(BaseModel):
    device_code: str
    qr_url: str
    interval: int
    expire_in: int


class FeishuPollResponse(BaseModel):
    status: str
    app_id: Optional[str] = None
    owner_open_id: Optional[str] = None
    tenant_brand: Optional[str] = None
    error: Optional[str] = None


class FeishuChannelOut(BaseModel):
    id: int
    instance_id: int
    app_id: str
    owner_open_id: Optional[str] = None
    tenant_brand: str
    created_at: datetime

    class Config:
        from_attributes = True


class QQQRResponse(BaseModel):
    session_id: str
    qr_url: Optional[str] = None
    status: str


class QQPollResponse(BaseModel):
    status: str
    app_id: Optional[str] = None
    app_secret: Optional[str] = None
    error: Optional[str] = None


class QQChannelOut(BaseModel):
    id: int
    instance_id: int
    app_id: str
    created_at: datetime

    class Config:
        from_attributes = True
