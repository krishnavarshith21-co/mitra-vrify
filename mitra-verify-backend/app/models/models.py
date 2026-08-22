import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import JSON as JSONType
from sqlalchemy import (
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped, backref, mapped_column, relationship

# Removed SQLite-specific JSON import; using generic JSONType
from app.core.database import Base


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
    full_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    role: Mapped[str] = mapped_column(SAEnum(UserRole), default=UserRole.user)
    email_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now, onupdate=utc_now)
    last_login: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
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
    last_used_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    request_count: Mapped[int] = mapped_column(Integer, default=0)
    rate_limit: Mapped[int] = mapped_column(Integer, default=100)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)
    user = relationship("User", back_populates="api_keys")
    organization = relationship("Organization", back_populates="api_keys")
    usage_logs = relationship("ApiUsage", back_populates="api_key")
    verification_logs = relationship("VerificationLog", back_populates="api_key")

class ApiUsage(Base):
    __tablename__ = "api_usage"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_uuid)
    api_key_id: Mapped[str] = mapped_column(String, ForeignKey("api_keys.id"), index=True)
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
    api_key_id: Mapped[str] = mapped_column(String, ForeignKey("api_keys.id"), index=True)
    session_id: Mapped[str] = mapped_column(String(255), index=True)
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
    verification_id: Mapped[str] = mapped_column(String, ForeignKey("verification_logs.id"), index=True)
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
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), index=True)
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
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), index=True)
    action: Mapped[str] = mapped_column(String(255))
    resource_type: Mapped[str] = mapped_column(String(100))
    resource_id: Mapped[str | None] = mapped_column(String, nullable=True)
    meta_data: Mapped[dict | list] = mapped_column(JSONType)
    ip_address: Mapped[str] = mapped_column(String(45))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)
    user = relationship("User", back_populates="audit_logs")

class Notification(Base):
    __tablename__ = "notifications"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_uuid)
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), index=True)
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
    original_embedding: Mapped[dict | list | None] = mapped_column(JSONType, nullable=True)
    embedding_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)
    template_version: Mapped[int] = mapped_column(Integer, default=1)
    template_metadata: Mapped[dict | list | None] = mapped_column(JSONType, nullable=True)
    is_encrypted: Mapped[bool] = mapped_column(Boolean, default=False)
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


# ── Platform: Verification-as-a-Service Models ──────────────────────────────

class ApiLevel(str, enum.Enum):
    api1 = "api1"
    api2 = "api2"
    api3 = "api3"

class VerificationSessionStatus(str, enum.Enum):
    CREATED = "CREATED"
    IN_PROGRESS = "IN_PROGRESS"
    VERIFIED = "VERIFIED"
    FAILED = "FAILED"
    EXPIRED = "EXPIRED"
    CANCELLED = "CANCELLED"

class VerificationFailureReason(str, enum.Enum):
    FACE_NOT_DETECTED = "FACE_NOT_DETECTED"
    MULTIPLE_FACES = "MULTIPLE_FACES"
    LIVENESS_FAILED = "LIVENESS_FAILED"
    SPOOF_DETECTED = "SPOOF_DETECTED"
    TIMEOUT = "TIMEOUT"
    SESSION_EXPIRED = "SESSION_EXPIRED"
    CANCELLED = "CANCELLED"
    PROCESSING_ERROR = "PROCESSING_ERROR"


class ClientApplication(Base):
    """Represents a client's registered application that uses MITRA VERIFY."""
    __tablename__ = "client_applications"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_uuid)
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    api_level: Mapped[str] = mapped_column(SAEnum(ApiLevel), nullable=False, default=ApiLevel.api1)
    client_id: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    api_key_hash: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    api_key_prefix: Mapped[str] = mapped_column(String(50), nullable=False)
    server_secret_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    server_secret_prefix: Mapped[str] = mapped_column(String(50), nullable=False)
    allowed_redirect_uris: Mapped[dict | list] = mapped_column(JSONType, nullable=False, default=list)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    request_count: Mapped[int] = mapped_column(Integer, default=0)
    verified_count: Mapped[int] = mapped_column(Integer, default=0)
    failed_count: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now, onupdate=utc_now)

    owner = relationship("User", backref="client_applications")
    verification_sessions = relationship("VerificationSession", back_populates="application")


class VerificationSession(Base):
    """Represents a single verification attempt initiated by a client application."""
    __tablename__ = "verification_sessions"
    id: Mapped[str] = mapped_column(String, primary_key=True)  # "sess_" + uuid
    application_id: Mapped[str] = mapped_column(String, ForeignKey("client_applications.id"), nullable=False, index=True)
    api_level: Mapped[str] = mapped_column(SAEnum(ApiLevel), nullable=False)
    redirect_uri: Mapped[str] = mapped_column(String(2048), nullable=False)
    status: Mapped[str] = mapped_column(
        SAEnum(VerificationSessionStatus),
        nullable=False,
        default=VerificationSessionStatus.CREATED
    )
    failure_reason: Mapped[str | None] = mapped_column(String(100), nullable=True)
    confidence: Mapped[float] = mapped_column(Float, default=0.0)
    liveness_session_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(String(512), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)
    started_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    result_retrieved: Mapped[bool] = mapped_column(Boolean, default=False)
    result_retrieved_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    application = relationship("ClientApplication", back_populates="verification_sessions")

