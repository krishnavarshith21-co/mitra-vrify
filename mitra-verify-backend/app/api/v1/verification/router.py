import hashlib
import secrets
import time
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Header, HTTPException, Request
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.models import (
    ClientApplication,
    VerificationSession,
    VerificationSessionStatus,
)
from app.schemas.schemas import (
    VerificationSessionCreate,
    VerificationSessionCreatedOut,
    VerificationSessionPublicOut,
    VerificationSessionResultOut,
)

router = APIRouter(prefix="/verification", tags=["Verification Sessions"])

SESSION_TTL_MINUTES = 10


# ── Helpers ─────────────────────────────────────────────────────────────────

async def _get_app_by_api_key(
    x_api_key: str | None = Header(None),
    db: AsyncSession = Depends(get_db),
) -> ClientApplication:
    """Authenticate a client application using its API key."""
    if not x_api_key:
        raise HTTPException(status_code=401, detail="X-API-Key header required")
    key_hash = hashlib.sha256(x_api_key.encode()).hexdigest()
    result = await db.execute(
        select(ClientApplication).where(
            ClientApplication.api_key_hash == key_hash,
            ClientApplication.is_active == True,
        )
    )
    app = result.scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=401, detail="Invalid or revoked API key")
    return app


async def _get_app_by_server_secret(
    x_server_secret: str | None = Header(None),
    db: AsyncSession = Depends(get_db),
) -> ClientApplication:
    """Authenticate a client backend using its server secret."""
    if not x_server_secret:
        raise HTTPException(status_code=401, detail="X-Server-Secret header required")
    secret_hash = hashlib.sha256(x_server_secret.encode()).hexdigest()
    result = await db.execute(
        select(ClientApplication).where(
            ClientApplication.server_secret_hash == secret_hash,
            ClientApplication.is_active == True,
        )
    )
    app = result.scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=401, detail="Invalid or revoked server secret")
    return app


def _is_session_expired(session: VerificationSession) -> bool:
    now = datetime.now(timezone.utc)
    expires = session.expires_at
    if expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)
    return now > expires


# ── Session Creation ────────────────────────────────────────────────────────

@router.post("/sessions", response_model=VerificationSessionCreatedOut, status_code=201)
async def create_session(
    data: VerificationSessionCreate,
    request: Request,
    app: ClientApplication = Depends(_get_app_by_api_key),
    db: AsyncSession = Depends(get_db),
):
    """Create a new verification session. Authenticated by API key."""
    # Validate application_id matches the authenticated app
    if data.application_id != app.client_id and data.application_id != app.id:
        raise HTTPException(status_code=403, detail="application_id does not match authenticated API key")

    # Determine API level
    api_level = data.api_level or app.api_level
    if api_level not in ("api1", "api2", "api3"):
        raise HTTPException(status_code=400, detail="api_level must be api1, api2, or api3")

    # Validate redirect URI
    allowed_uris = app.allowed_redirect_uris or []
    if allowed_uris and data.redirect_uri not in allowed_uris:
        raise HTTPException(
            status_code=400,
            detail=f"redirect_uri is not in the application's allowed redirect URIs"
        )

    session_id = f"sess_{uuid.uuid4().hex}"
    now = datetime.now(timezone.utc)
    expires = now + timedelta(minutes=SESSION_TTL_MINUTES)

    session = VerificationSession(
        id=session_id,
        application_id=app.id,
        api_level=api_level,
        redirect_uri=data.redirect_uri,
        status=VerificationSessionStatus.CREATED,
        created_at=now,
        expires_at=expires,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )
    db.add(session)

    # Increment request count
    app.request_count = (app.request_count or 0) + 1
    await db.commit()
    await db.refresh(session)

    # Build verification URL — the frontend page that renders the verification UI
    base_url = str(request.base_url).rstrip("/")
    # The verification URL points to the Next.js frontend, not the API
    # Clients should configure this, but we return a relative path pattern
    verification_url = f"/verify/session/{session_id}"

    return VerificationSessionCreatedOut(
        session_id=session_id,
        verification_url=verification_url,
        expires_at=expires,
    )


# ── Public Session Metadata ────────────────────────────────────────────────

@router.get("/sessions/{session_id}", response_model=VerificationSessionPublicOut)
async def get_session(session_id: str, db: AsyncSession = Depends(get_db)):
    """Get public session metadata. No authentication required (used by hosted verification page)."""
    result = await db.execute(
        select(VerificationSession).where(VerificationSession.id == session_id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Check expiry
    if _is_session_expired(session) and session.status == VerificationSessionStatus.CREATED:
        session.status = VerificationSessionStatus.EXPIRED
        await db.commit()

    # Load application name
    app_result = await db.execute(
        select(ClientApplication).where(ClientApplication.id == session.application_id)
    )
    app = app_result.scalar_one_or_none()

    return VerificationSessionPublicOut(
        session_id=session.id,
        api_level=session.api_level,
        application_name=app.name if app else "Unknown",
        status=session.status,
        expires_at=session.expires_at,
    )


# ── Start Verification ─────────────────────────────────────────────────────

@router.post("/sessions/{session_id}/start")
async def start_verification(session_id: str, db: AsyncSession = Depends(get_db)):
    """Initialize the CV session and return challenges. Marks session IN_PROGRESS."""
    result = await db.execute(
        select(VerificationSession).where(VerificationSession.id == session_id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    if _is_session_expired(session):
        session.status = VerificationSessionStatus.EXPIRED
        await db.commit()
        raise HTTPException(status_code=410, detail="Session has expired")

    if session.status not in (
        VerificationSessionStatus.CREATED,
        VerificationSessionStatus.IN_PROGRESS,
    ):
        raise HTTPException(status_code=409, detail=f"Session cannot be started (status: {session.status})")

    # Map api_level to the demo api_type
    api_type_map = {"api1": "basic", "api2": "advanced", "api3": "enterprise"}
    api_type = api_type_map.get(session.api_level, "basic")

    # Reuse the existing session/start logic from liveness router
    from app.api.v1.liveness.router import CHALLENGES_METADATA

    liveness_session_id = str(uuid.uuid4())

    advanced_pool = ['blink_once', 'blink_twice', 'open_mouth', 'smile', 'look_up', 'hold_still']
    enterprise_pool = ['blink_once', 'blink_twice', 'open_mouth', 'smile', 'look_up', 'look_down',
                       'turn_left', 'turn_right', 'turn_left_45', 'turn_right_45', 'turn_left_90',
                       'turn_right_90', 'raise_eyebrows', 'nod_head', 'shake_head', 'look_left',
                       'look_right', 'hold_still', 'follow_target']

    if api_type == "enterprise":
        selected = secrets.SystemRandom().sample(enterprise_pool, min(4, len(enterprise_pool)))
    elif api_type == "advanced":
        requested_count = secrets.choice([3, 4, 5])
        num_challenges = min(len(advanced_pool), requested_count)
        selected = secrets.SystemRandom().sample(advanced_pool, num_challenges)
    else:
        selected = ['blink_once', 'open_mouth', 'turn_left']

    challenges = [{
        "id": "face_centered",
        "label": "1. Face Centered",
        "instruction": CHALLENGES_METADATA["face_centered"]["instruction"],
        "icon": CHALLENGES_METADATA["face_centered"]["icon"],
    }]
    for idx, cid in enumerate(selected):
        meta = CHALLENGES_METADATA.get(cid, {"label": cid, "instruction": cid, "icon": "❓"})
        challenges.append({
            "id": cid,
            "label": f"{idx + 2}. {meta['label']}",
            "instruction": meta["instruction"],
            "icon": meta["icon"],
        })

    # Initialize the CV session cache
    from app.services.cv.mediapipe_engine import SESSION_CACHE
    SESSION_CACHE[liveness_session_id] = {
        "landmarks": [], "ear": [], "mar": [], "yaw": [], "pitch": [], "roll": [],
        "eyebrow_ratios": [], "baseline_eyebrow_ratio": None,
        "smile_ratios": [], "baseline_smile_ratio": None,
        "current_challenge": "face_centered", "challenges": challenges,
        "logged": False, "created_at": time.time(), "last_active": time.time(),
        "last_face_seen": time.time(), "ear_history": [], "mar_history": [],
        "yaw_history": [], "pitch_history": [], "roll_history": [],
        "blink_history": [], "mouth_history": [],
        "multiple_faces_frames": 0, "face_lost_frames": 0,
        "spoof_frames": 0, "wrong_person_frames": 0,
        "challenge_start_time": time.time(),
    }

    # Update session state
    session.status = VerificationSessionStatus.IN_PROGRESS
    session.started_at = datetime.now(timezone.utc)
    session.liveness_session_id = liveness_session_id
    await db.commit()

    return {
        "session_id": session_id,
        "liveness_session_id": liveness_session_id,
        "challenges": challenges,
        "api_level": session.api_level,
    }


# ── Process Verification Frame ─────────────────────────────────────────────

class VerificationFrameRequest(BaseModel):
    image: str
    frame_id: str | None = None
    challenge_type: str | None = None

@router.post("/sessions/{session_id}/process")
async def process_verification_frame(
    session_id: str,
    data: VerificationFrameRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Process a verification frame. No auth required (end-user's browser)."""
    result = await db.execute(
        select(VerificationSession).where(VerificationSession.id == session_id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    if session.status != VerificationSessionStatus.IN_PROGRESS:
        raise HTTPException(status_code=409, detail=f"Session is not in progress (status: {session.status})")

    if _is_session_expired(session):
        session.status = VerificationSessionStatus.EXPIRED
        await db.commit()
        raise HTTPException(status_code=410, detail="Session has expired")

    if not session.liveness_session_id:
        raise HTTPException(status_code=400, detail="Session not started — call /start first")

    api_type_map = {"api1": "basic", "api2": "advanced", "api3": "enterprise"}
    api_type = api_type_map.get(session.api_level, "basic")

    from app.services.cv.mediapipe_engine import SESSION_CACHE, process_demo_frame

    cv_result = await run_in_threadpool(
        process_demo_frame,
        image_b64=data.image,
        frame_id=data.frame_id,
        session_id=session.liveness_session_id,
        challenge_type=data.challenge_type,
        enrolled_signature=None,
        api_type=api_type,
    )

    # Check if the session has reached a terminal state
    terminal_statuses = [
        "MULTIPLE_FACES_DETECTED", "REPLAY_ATTACK_DETECTED", "DEEPFAKE_SUSPECTED",
        "SPOOF_DETECTED", "CAMERA_FEED_FROZEN", "UNAUTHORIZED_PERSON",
        "IDENTITY_CHANGED", "FACE_TOO_SMALL", "FACE_TOO_LARGE",
        "FACE_PARTIALLY_VISIBLE", "NO_FACE_DETECTED",
    ]

    status = cv_result.get("status")
    cv_session = SESSION_CACHE.get(session.liveness_session_id)
    challenges = cv_session.get("challenges", []) if cv_session else []

    is_terminal = False
    is_pass = False

    if status in terminal_statuses:
        is_terminal = True

    # Check if all challenges completed successfully
    if challenges and data.challenge_type == challenges[-1]["id"] and cv_result.get("challenge_passed"):
        is_terminal = True
        if status not in terminal_statuses:
            spoof_val = cv_result.get("spoof_score", 0.0)
            if spoof_val and spoof_val > 0.45:
                is_terminal = True
            else:
                is_pass = True

    if is_terminal:
        now = datetime.now(timezone.utc)
        if is_pass:
            session.status = VerificationSessionStatus.VERIFIED
            session.confidence = float(cv_result.get("face_confidence") or cv_result.get("confidence") or 0.95)
        else:
            session.status = VerificationSessionStatus.FAILED
            session.confidence = float(cv_result.get("face_confidence") or 0.0)
            # Map terminal status to failure reason
            reason_map = {
                "NO_FACE_DETECTED": "FACE_NOT_DETECTED",
                "MULTIPLE_FACES_DETECTED": "MULTIPLE_FACES",
                "SPOOF_DETECTED": "SPOOF_DETECTED",
                "REPLAY_ATTACK_DETECTED": "SPOOF_DETECTED",
                "DEEPFAKE_SUSPECTED": "SPOOF_DETECTED",
                "CAMERA_FEED_FROZEN": "PROCESSING_ERROR",
                "UNAUTHORIZED_PERSON": "LIVENESS_FAILED",
                "IDENTITY_CHANGED": "LIVENESS_FAILED",
            }
            status_str = str(status) if status is not None else ""
            session.failure_reason = reason_map.get(status_str, "LIVENESS_FAILED")

        session.completed_at = now

        # Update application counters
        app_result = await db.execute(
            select(ClientApplication).where(ClientApplication.id == session.application_id)
        )
        app = app_result.scalar_one_or_none()
        if app:
            if is_pass:
                app.verified_count = (app.verified_count or 0) + 1
            else:
                app.failed_count = (app.failed_count or 0) + 1

        await db.commit()

    # Add terminal info to response for the frontend
    cv_result["verification_complete"] = is_terminal
    cv_result["verification_passed"] = is_pass
    if is_terminal:
        cv_result["redirect_uri"] = session.redirect_uri
        cv_result["verification_session_id"] = session_id

    return cv_result


# ── Server-to-Server Result Retrieval ───────────────────────────────────────

@router.post("/sessions/{session_id}/result", response_model=VerificationSessionResultOut)
async def get_session_result(
    session_id: str,
    app: ClientApplication = Depends(_get_app_by_server_secret),
    db: AsyncSession = Depends(get_db),
):
    """Server-to-server endpoint to retrieve the authoritative verification result."""
    result = await db.execute(
        select(VerificationSession).where(
            VerificationSession.id == session_id,
            VerificationSession.application_id == app.id,
        )
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found or does not belong to this application")

    # Check if session is still pending
    if session.status in (VerificationSessionStatus.CREATED, VerificationSessionStatus.IN_PROGRESS):
        if _is_session_expired(session):
            session.status = VerificationSessionStatus.EXPIRED
            await db.commit()
        else:
            raise HTTPException(status_code=202, detail="Verification is still in progress")

    # Mark as retrieved
    if not session.result_retrieved:
        session.result_retrieved = True
        session.result_retrieved_at = datetime.now(timezone.utc)
        await db.commit()

    return VerificationSessionResultOut(
        session_id=session.id,
        status=session.status,
        api_level=session.api_level,
        confidence=session.confidence or 0.0,
        failure_reason=session.failure_reason,
        verified_at=session.completed_at,
        created_at=session.created_at,
    )
