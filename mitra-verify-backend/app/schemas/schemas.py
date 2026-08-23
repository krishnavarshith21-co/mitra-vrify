from datetime import datetime

from pydantic import BaseModel, EmailStr


# ── Auth Schemas ──────────────────────────────────────────────
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str | None = None

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
    full_name: str | None
    role: str
    email_verified: bool | None = False
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
    last_used_at: datetime | None
    created_at: datetime
    plaintext: str | None = None  # only returned once on creation

    class Config:
        from_attributes = True

# ── Liveness / Verification Schemas ──────────────────────────
class BasicLivenessRequest(BaseModel):
    image: str  # base64 encoded image
    session_id: str | None = None

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
    challenge_type: str | None = None  # blink_twice | turn_left | turn_right | open_mouth
    session_id: str | None = None

class AdvancedLivenessResponse(BaseModel):
    session_id: str
    result: str
    confidence: float
    processing_time: float
    spoof_score: float
    deepfake_risk: float
    challenge_result: dict | None
    checks: dict
    timestamp: datetime

class IdentityVerifyRequest(BaseModel):
    image: str
    subject_id: str | None = None
    session_id: str | None = None

class IdentityVerifyResponse(BaseModel):
    session_id: str
    result: str
    confidence: float
    processing_time: float
    identity: dict
    checks: dict
    continuous_session: str | None
    timestamp: datetime


class IdentityEnrollRequest(BaseModel):
    image: str
    subject_id: str | None = None
    session_id: str | None = None


class IdentityEnrollResponse(BaseModel):
    status: str
    message: str
    user_id: str
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

class DashboardExecutiveOverview(BaseModel):
    total_requests: int
    successful_requests: int
    failed_requests: int
    spoof_attempts: int
    face_lost: int
    identity_mismatch: int
    active_sessions: int
    avg_latency: float
    avg_identity_score: float
    avg_liveness_score: float
    success_rate: float
    failure_rate: float

class DashboardVerificationSummary(BaseModel):
    passed: int
    failed: int
    spoof: int
    face_lost: int
    multiple_faces: int
    identity_mismatch: int
    timeout: int
    cancelled: int
    total: int

class DashboardApiStat(BaseModel):
    total_requests: int
    passed: int
    failed: int
    spoof: int | None = 0
    face_lost: int | None = 0
    identity_mismatch: int | None = 0
    avg_latency: float
    success_rate: float
    avg_identity_match: float | None = 0.0
    avg_confidence: float | None = 0.0

class DashboardApiStatistics(BaseModel):
    Basic: DashboardApiStat
    Advanced: DashboardApiStat
    Enterprise: DashboardApiStat

class DashboardTimelineNode(BaseModel):
    time: str
    total: int
    passed: int
    failed: int
    spoof: int
    face_lost: int
    identity_mismatch: int
    multiple_faces: int

class DashboardThreatStatistics(BaseModel):
    spoof_attempts: int
    photo_attack: int
    replay_attack: int
    face_lost: int
    multiple_faces: int
    identity_change: int
    timeout: int
    liveness_failure: int
    identity_failure: int
    threat_score: float
    threat_trend: str

class DashboardLiveActivity(BaseModel):
    id: str
    timestamp: datetime
    api: str
    user: str
    status: str
    latency: float
    identity_pct: float
    liveness_pct: float
    threat: float
    ip: str
    device: str

class DashboardAnalyticsResponse(BaseModel):
    executive_overview: DashboardExecutiveOverview
    verification_summary: DashboardVerificationSummary
    api_statistics: DashboardApiStatistics
    timeline: list[DashboardTimelineNode]
    threat_statistics: DashboardThreatStatistics
    live_activity: list[DashboardLiveActivity]


# ── Platform: Client Application Schemas ─────────────────────────────────────

class ClientApplicationCreate(BaseModel):
    name: str
    api_level: str = "api1"  # api1 | api2 | api3
    allowed_redirect_uris: list[str] = []

class ClientApplicationUpdate(BaseModel):
    name: str | None = None
    api_level: str | None = None
    allowed_redirect_uris: list[str] | None = None

class ClientApplicationOut(BaseModel):
    id: str
    name: str
    api_level: str
    client_id: str
    api_key_prefix: str
    server_secret_prefix: str
    allowed_redirect_uris: list[str]
    is_active: bool
    request_count: int
    verified_count: int
    failed_count: int
    created_at: datetime

    class Config:
        from_attributes = True

class ClientApplicationCreatedOut(ClientApplicationOut):
    """Returned only on creation — contains plaintext credentials (shown once)."""
    api_key: str
    server_secret: str

# ── Platform: Verification Session Schemas ───────────────────────────────────

class VerificationSessionCreate(BaseModel):
    application_id: str
    api_level: str | None = None  # Overrides app default if provided
    redirect_uri: str

class VerificationSessionCreatedOut(BaseModel):
    session_id: str
    verification_url: str
    expires_at: datetime

class VerificationSessionPublicOut(BaseModel):
    """Public session metadata (no secrets) — for the hosted verification page."""
    session_id: str
    api_level: str
    application_name: str
    status: str
    expires_at: datetime

class VerificationSessionResultOut(BaseModel):
    """Server-to-server authoritative result."""
    session_id: str
    status: str
    api_level: str
    confidence: float
    failure_reason: str | None = None
    verified_at: datetime | None = None
    created_at: datetime

