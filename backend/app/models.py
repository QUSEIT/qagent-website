from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(50), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    qagent_instance_id = Column(Integer, nullable=True)
    qagent_instance_type = Column(String(50), nullable=True)
    qagent_instance_name = Column(String(100), nullable=True)
    qagent_skill_template = Column(String(50), nullable=True)
    max_instances = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    instances = relationship("Instance", back_populates="user", cascade="all, delete-orphan")


class Instance(Base):
    __tablename__ = "instances"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    clawmanager_instance_id = Column(Integer, nullable=False)
    name = Column(String(100), nullable=False)
    instance_type = Column(String(50), nullable=False)
    skill_template = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="instances")
