from datetime import datetime
from typing import Optional
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
    created_at: datetime

    class Config:
        from_attributes = True


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class HermesStatus(BaseModel):
    has_instance: bool
    instance_id: Optional[int] = None
    instance_type: Optional[str] = None


class QAgentCreateResponse(BaseModel):
    instance_id: int
    message: str


class HermesAccessResponse(BaseModel):
    token: str
    access_url: str
    proxy_url: str
    expires_at: str
