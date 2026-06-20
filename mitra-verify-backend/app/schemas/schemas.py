from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

# ── Auth Schemas ──────────────────────────────────────────────
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class UserOut(BaseModel):
    id: str
    email: str
    full_name: Optional[str]
    role: str
    email_verified: bool
    created_at: datetime

    class Config:
        from_attributes = True

# ── API Key Schemas ───────────────────────────────────────────
class ApiKeyCreate(BaseModel):
    name: str = "My API Key"
    api_type: str  # basic | advanced | enterprise

class ApiKeyOut(BaseModel):
    id: str
    name: str
    key_prefix: str
    api_type: str
    is_active: bool
    request_count: int
    rate_limit: int
    last_used_at: Optional[datetime]
    created_at: datetime
    plaintext: Optional[str] = None  # only returned once on creation

    class Config:
        from_attributes = True

# ── Liveness / Verification Schemas ──────────────────────────
class BasicLivenessRequest(BaseModel):
    image: str  # base64 encoded image
    session_id: Optional[str] = None

class BasicLivenessResponse(BaseModel):
    session_id: str
    result: str
    confidence: float
    processing_time: float
    liveness_score: float
    checks: dict
    timestamp: datetime

class AdvancedLivenessRequest(BaseModel):
    image: str
    challenge_type: Optional[str] = None  # blink_twice | turn_left | turn_right | open_mouth
    session_id: Optional[str] = None

class AdvancedLivenessResponse(BaseModel):
    session_id: str
    result: str
    confidence: float
    processing_time: float
    spoof_score: float
    deepfake_risk: float
    challenge_result: Optional[dict]
    checks: dict
    timestamp: datetime

class IdentityVerifyRequest(BaseModel):
    image: str
    subject_id: Optional[str] = None
    session_id: Optional[str] = None

class IdentityVerifyResponse(BaseModel):
    session_id: str
    result: str
    confidence: float
    processing_time: float
    identity: dict
    checks: dict
    continuous_session: Optional[str]
    timestamp: datetime


class IdentityEnrollRequest(BaseModel):
    image: str
    subject_id: Optional[str] = None


class IdentityEnrollResponse(BaseModel):
    status: str
    message: str
    user_id: str
    embedding_vector: list[float]
    created_at: datetime


# ── Analytics Schemas ─────────────────────────────────────────
class AnalyticsOverview(BaseModel):
    total_requests: int
    successful_verifications: int
    failed_verifications: int
    spoof_attempts: int
    deepfake_attempts: int
    identity_matches: int
    no_face_detected: int
    success_rate: float
    avg_processing_time: float
    active_api_keys: int
