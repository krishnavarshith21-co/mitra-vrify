import uuid
from datetime import datetime, timezone
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import Column, String, Boolean, DateTime, Integer, Float, ForeignKey, Text, Enum as SAEnum, JSON as JSONType
from sqlalchemy.orm import relationship, backref
# Removed SQLite-specific JSON import; using generic JSONType
from app.core.database import Base
import enum

class UserRole(str, enum.Enum):
    user = "user"
    admin = "admin"
    enterprise = "enterprise"

class ApiKeyType(str, enum.Enum):
    basic = "basic"
    advanced = "advanced"
    enterprise = "enterprise"

class VerificationResult(str, enum.Enum):
    pass_ = "pass"
    fail = "fail"
    spoof = "spoof"
    error = "error"


def utc_now():
    return datetime.now(timezone.utc)

def gen_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_uuid)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(SAEnum(UserRole), default=UserRole.user)
    email_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now, onupdate=utc_now)
    last_login: Mapped[datetime] = mapped_column(DateTime)
    organizations = relationship("Organization", back_populates="owner")
    api_keys = relationship("ApiKey", back_populates="user")
    sessions = relationship("Session", back_populates="user")
    audit_logs = relationship("AuditLog", back_populates="user")
    notifications = relationship("Notification", back_populates="user")

class Organization(Base):
    __tablename__ = "organizations"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_uuid)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    owner_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"))
    plan: Mapped[str] = mapped_column(String, default="open")
    monthly_limit: Mapped[int] = mapped_column(Integer, default=999999)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)
    owner = relationship("User", back_populates="organizations")
    api_keys = relationship("ApiKey", back_populates="organization")

class ApiKey(Base):
    __tablename__ = "api_keys"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_uuid)
    organization_id: Mapped[str] = mapped_column(String, ForeignKey("organizations.id"), nullable=True)
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), default="My API Key")
    key_prefix: Mapped[str] = mapped_column(String(50))
    key_hash: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    api_type: Mapped[str] = mapped_column(SAEnum(ApiKeyType), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    last_used_at: Mapped[datetime] = mapped_column(DateTime)
    request_count: Mapped[int] = mapped_column(Integer, default=0)
    rate_limit: Mapped[int] = mapped_column(Integer, default=100)
    expires_at: Mapped[datetime] = mapped_column(DateTime)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)
    user = relationship("User", back_populates="api_keys")
    organization = relationship("Organization", back_populates="api_keys")
    usage_logs = relationship("ApiUsage", back_populates="api_key")
    verification_logs = relationship("VerificationLog", back_populates="api_key")

class ApiUsage(Base):
    __tablename__ = "api_usage"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_uuid)
    api_key_id: Mapped[str] = mapped_column(String, ForeignKey("api_keys.id"))
    endpoint: Mapped[str] = mapped_column(String(255))
    method: Mapped[str] = mapped_column(String(10))
    status_code: Mapped[int] = mapped_column(Integer)
    response_time: Mapped[float] = mapped_column(Float)
    ip_address: Mapped[str] = mapped_column(String(45))
    user_agent: Mapped[str] = mapped_column(String(512))
    request_size: Mapped[int] = mapped_column(Integer)
    response_size: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)
    api_key = relationship("ApiKey", back_populates="usage_logs")

class VerificationLog(Base):
    __tablename__ = "verification_logs"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_uuid)
    api_key_id: Mapped[str] = mapped_column(String, ForeignKey("api_keys.id"))
    session_id: Mapped[str] = mapped_column(String(255))
    api_type: Mapped[str] = mapped_column(String)
    result: Mapped[str] = mapped_column(String)
    confidence: Mapped[float] = mapped_column(Float)
    processing_time: Mapped[float] = mapped_column(Float)
    checks_performed: Mapped[dict | list] = mapped_column(JSONType)
    spoof_score: Mapped[float] = mapped_column(Float, default=0.0)
    deepfake_risk: Mapped[float] = mapped_column(Float, default=0.0)
    ip_address: Mapped[str] = mapped_column(String(45))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)
    api_key = relationship("ApiKey", back_populates="verification_logs")
    liveness_logs = relationship("LivenessLog", back_populates="verification")

class LivenessLog(Base):
    __tablename__ = "liveness_logs"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_uuid)
    verification_id: Mapped[str] = mapped_column(String, ForeignKey("verification_logs.id"))
    check_type: Mapped[str] = mapped_column(String(50))
    passed: Mapped[bool] = mapped_column(Boolean)
    confidence: Mapped[float] = mapped_column(Float)
    frame_count: Mapped[int] = mapped_column(Integer)
    duration_ms: Mapped[float] = mapped_column(Float)
    meta_data: Mapped[dict | list] = mapped_column(JSONType)
    verification = relationship("VerificationLog", back_populates="liveness_logs")

class Session(Base):
    __tablename__ = "sessions"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_uuid)
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"))
    access_token: Mapped[str] = mapped_column(String(512))
    refresh_token: Mapped[str] = mapped_column(String(512))
    ip_address: Mapped[str] = mapped_column(String(45))
    user_agent: Mapped[str] = mapped_column(String(512))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)
    expires_at: Mapped[datetime] = mapped_column(DateTime)
    user = relationship("User", back_populates="sessions")

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_uuid)
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"))
    action: Mapped[str] = mapped_column(String(255))
    resource_type: Mapped[str] = mapped_column(String(100))
    resource_id: Mapped[str] = mapped_column(String)
    meta_data: Mapped[dict | list] = mapped_column(JSONType)
    ip_address: Mapped[str] = mapped_column(String(45))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)
    user = relationship("User", back_populates="audit_logs")

class Notification(Base):
    __tablename__ = "notifications"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_uuid)
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"))
    type: Mapped[str] = mapped_column(String(100))
    title: Mapped[str] = mapped_column(String(255))
    message: Mapped[str] = mapped_column(Text)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)
    user = relationship("User", back_populates="notifications")

class SystemLog(Base):
    __tablename__ = "system_logs"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_uuid)
    level: Mapped[str] = mapped_column(String(20))
    message: Mapped[str] = mapped_column(Text)
    meta_data: Mapped[dict | list] = mapped_column(JSONType)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)


class FaceEmbedding(Base):
    __tablename__ = "face_embeddings"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_uuid)
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), nullable=False)
    embedding_vector: Mapped[dict | list] = mapped_column(JSONType, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now, onupdate=utc_now)
    
    user = relationship("User", backref="face_embeddings")

# New per‑user face profile (one‑to‑one with User)
class FaceProfile(Base):
    __tablename__ = "face_profiles"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_uuid)
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), nullable=False, unique=True)
    embedding_vector: Mapped[dict | list] = mapped_column(JSONType, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now, onupdate=utc_now)
    user = relationship("User", backref=backref("face_profile", uselist=False))

class FaceEnrollment(Base):
    __tablename__ = "face_enrollments"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_uuid)
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), nullable=False, unique=True)
    embedding: Mapped[dict | list] = mapped_column(JSONType, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)
    user = relationship("User", backref=backref("face_enrollment", uselist=False))
