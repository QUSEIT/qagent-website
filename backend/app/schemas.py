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
    org_code: str = Field(..., min_length=4, max_length=50)


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
    cpu_cores: float = 1.0
    memory_gb: int = 4
    disk_gb: int = 20
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
    status: str = "pending"
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
    status: str = "pending"
    created_at: datetime

    class Config:
        from_attributes = True


class SkillSetOut(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    instance_type: str
    skill_id: str
    icon: Optional[str] = None
    sort_order: int = 0

    class Config:
        from_attributes = True


class SkillOut(BaseModel):
    id: int
    skill_set_id: int
    name: str
    description: Optional[str] = None
    icon: Optional[str] = None
    sort_order: int = 0

    class Config:
        from_attributes = True


class SkillSyncResponse(BaseModel):
    message: str
    skill_sets_count: int
    skills_count: int


class ProfileCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    system_prompt: Optional[str] = Field("", max_length=5000)
    model: Optional[str] = Field("gpt-4o", max_length=100)
    temperature: Optional[float] = Field(0.7, ge=0, le=2)
    skills: Optional[List[str]] = Field(default_factory=list)
    is_default: Optional[int] = Field(0)  # 0=no, 1=yes


class ProfileUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    system_prompt: Optional[str] = Field(None, max_length=5000)
    model: Optional[str] = Field(None, max_length=100)
    temperature: Optional[float] = Field(None, ge=0, le=2)
    skills: Optional[List[str]] = None
    is_default: Optional[int] = None


class ProfileOut(BaseModel):
    id: int
    instance_id: int
    name: str
    description: Optional[str] = None
    system_prompt: Optional[str] = None
    model: Optional[str] = None
    temperature: Optional[float] = 0.7
    skills: List[str] = []
    is_default: int = 0
    is_active: int = 0
    agent_id: Optional[str] = None
    soul_content: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
