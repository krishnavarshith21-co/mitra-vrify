# pyrefly: ignore [missing-import]
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Request
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.auth.router import get_current_user
from app.core.database import get_db
from app.models.models import ApiKey, User, VerificationLog
from app.schemas.schemas import (
    AdvancedLivenessRequest,
    AdvancedLivenessResponse,
    BasicLivenessRequest,
    BasicLivenessResponse,
)
from app.services.cv.mediapipe_engine import (
    SESSION_CACHE,
    map_verification_result,
    run_advanced_liveness,
    run_basic_liveness,
)

router = APIRouter(prefix="/liveness", tags=["Liveness Detection"])

@router.post("/basic", response_model=BasicLivenessResponse)
async def basic_liveness(
    data: BasicLivenessRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    cv_result = run_basic_liveness(data.image)
    
    # Get a dummy API key for logging purposes
    stmt = select(ApiKey).where(ApiKey.user_id == current_user.id)
    res = await db.execute(stmt)
    api_key = res.scalars().first()
    if not api_key:
        api_key = ApiKey(
            id=str(uuid.uuid4()),
            user_id=current_user.id,
            name="Default Key",
            key_prefix="mv_",
            key_hash=str(uuid.uuid4()),
            api_type="basic",
            is_active=True
        )
        db.add(api_key)
        try:
            await db.commit()
            await db.refresh(api_key)
        except Exception:
            await db.rollback()
            raise

    # Log verification
    log = VerificationLog(
        id=str(uuid.uuid4()),
        api_key_id=api_key.id,
        session_id=cv_result.get("session_id"),
        api_type="basic",
        result=map_verification_result(cv_result, "basic"),
        confidence=cv_result.get("confidence", 0.0),
        processing_time=cv_result.get("processing_time", 0.0),
        checks_performed=cv_result.get("checks", {}),
        spoof_score=0.0,
        deepfake_risk=0.0,
        ip_address=request.client.host if request.client else "unknown",
        created_at=datetime.now(timezone.utc)
    )
    db.add(log)
    await db.commit()

    return BasicLivenessResponse(
        session_id=cv_result.get("session_id", str(uuid.uuid4())),
        result=cv_result.get("result", "error"),
        confidence=cv_result.get("confidence", 0.0),
        processing_time=cv_result.get("processing_time", 0.0),
        liveness_score=cv_result.get("liveness_score", 0.0),
        checks=cv_result.get("checks", {}),
        timestamp=datetime.now(timezone.utc)
    )

@router.post("/advanced", response_model=AdvancedLivenessResponse)
async def advanced_liveness(
    data: AdvancedLivenessRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    cv_result = run_advanced_liveness(data.image, data.challenge_type)

    stmt = select(ApiKey).where(ApiKey.user_id == current_user.id)
    res = await db.execute(stmt)
    api_key = res.scalars().first()
    if not api_key:
        api_key = ApiKey(
            id=str(uuid.uuid4()),
            user_id=current_user.id,
            name="Default Key",
            key_prefix="mv_",
            key_hash=str(uuid.uuid4()),
            api_type="advanced",
            is_active=True
        )
        db.add(api_key)
        try:
            await db.commit()
            await db.refresh(api_key)
        except Exception:
            await db.rollback()
            raise

    log = VerificationLog(
        id=str(uuid.uuid4()),
        api_key_id=api_key.id,
        session_id=cv_result.get("session_id"),
        api_type="advanced",
        result=map_verification_result(cv_result, "advanced"),
        confidence=cv_result.get("confidence", 0.0),
        processing_time=cv_result.get("processing_time", 0.0),
        checks_performed=cv_result.get("checks", {}),
        spoof_score=cv_result.get("spoof_score", 0.0),
        deepfake_risk=cv_result.get("deepfake_risk", 0.0),
        ip_address=request.client.host if request.client else "unknown",
        created_at=datetime.now(timezone.utc)
    )
    db.add(log)
    await db.commit()

    return AdvancedLivenessResponse(
        session_id=cv_result.get("session_id", str(uuid.uuid4())),
        result=cv_result.get("result", "error"),
        confidence=cv_result.get("confidence", 0.0),
        processing_time=cv_result.get("processing_time", 0.0),
        spoof_score=cv_result.get("spoof_score", 0.0),
        deepfake_risk=cv_result.get("deepfake_risk", 0.0),
        challenge_result=cv_result.get("challenge_result"),
        checks=cv_result.get("checks", {}),
        timestamp=datetime.now(timezone.utc)
    )
@router.post("/enterprise", response_model=AdvancedLivenessResponse)
async def enterprise_liveness(
    data: AdvancedLivenessRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Reuse advanced CV engine; future implementation may add continuous heartbeat verification
    cv_result = run_advanced_liveness(data.image, data.challenge_type)

    stmt = select(ApiKey).where(ApiKey.user_id == current_user.id)
    res = await db.execute(stmt)
    api_key = res.scalars().first()
    if not api_key:
        api_key = ApiKey(
            id=str(uuid.uuid4()),
            user_id=current_user.id,
            name="Default Key",
            key_prefix="mv_",
            key_hash=str(uuid.uuid4()),
            api_type="enterprise",
            is_active=True
        )
        db.add(api_key)
        try:
            await db.commit()
            await db.refresh(api_key)
        except Exception:
            await db.rollback()
            raise

    # Log verification, marking api_type as "enterprise"
    log = VerificationLog(
        id=str(uuid.uuid4()),
        api_key_id=api_key.id,
        session_id=cv_result.get("session_id"),
        api_type="enterprise",
        result=map_verification_result(cv_result, "enterprise"),
        confidence=cv_result.get("confidence", 0.0),
        processing_time=cv_result.get("processing_time", 0.0),
        checks_performed=cv_result.get("checks", {}),
        spoof_score=cv_result.get("spoof_score", 0.0),
        deepfake_risk=cv_result.get("deepfake_risk", 0.0),
        ip_address=request.client.host if request.client else "unknown",
        created_at=datetime.now(timezone.utc)
    )
    db.add(log)
    await db.commit()

    # Placeholder for continuous verification (heartbeat) logic – client would poll a dedicated endpoint.
    return AdvancedLivenessResponse(
        session_id=cv_result.get("session_id", str(uuid.uuid4())),
        result=cv_result.get("result", "error"),
        confidence=cv_result.get("confidence", 0.0),
        processing_time=cv_result.get("processing_time", 0.0),
        spoof_score=cv_result.get("spoof_score", 0.0),
        deepfake_risk=cv_result.get("deepfake_risk", 0.0),
        challenge_result=cv_result.get("challenge_result"),
        checks=cv_result.get("checks", {}),
        timestamp=datetime.now(timezone.utc)
    )


import secrets
import time

CHALLENGES_METADATA = {
    "FACE_CENTERED": { "label": "Face Centered", "instruction": "Center your face inside the guides", "icon": "👤" },
    "BLINK_ONCE": { "label": "Blink Once", "instruction": "Blink your eyes once slowly", "icon": "👁️" },
    "BLINK_TWICE": { "label": "Blink Twice", "instruction": "Blink your eyes twice", "icon": "👁️" },
    "HEAD_UP": { "label": "Look Up", "instruction": "Look up with your head", "icon": "👆" },
    "HEAD_DOWN": { "label": "Look Down", "instruction": "Look down with your head", "icon": "👇" },
    "HEAD_LEFT": { "label": "Turn Head Left", "instruction": "Turn your head to the left", "icon": "👈" },
    "HEAD_RIGHT": { "label": "Turn Head Right", "instruction": "Turn your head to the right", "icon": "👉" },
    "NOD_HEAD": { "label": "Nod Head", "instruction": "Nod your head up and down", "icon": "👍" },
    "OPEN_MOUTH": { "label": "Open Mouth", "instruction": "Open your mouth wide", "icon": "👄" },
    "HEAD_ROTATION": { "label": "Rotate Head", "instruction": "Slowly rotate your head in a circle", "icon": "🔄" },
    "EYEBROWS_UP": { "label": "Raise Eyebrows", "instruction": "Raise your eyebrows", "icon": "🤨" }
}


async def get_optional_user(request: Request, db: AsyncSession = Depends(get_db)) -> User | None:
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    token = auth_header.split(" ")[1]
    try:
        from app.api.v1.auth.router import get_current_user
        return await get_current_user(token, db)
    except Exception:
        return None

class SessionStartRequest(BaseModel):
    api_type: str = "advanced"
    session_id: str | None = None

class DemoProcessRequest(BaseModel):
    image: str
    frame_id: str | None = None
    session_id: str | None = None
    challenge_type: str | None = None
    enrolled_signature: list[float] | None = None
    api_type: str | None = None
    action: str | None = None

@router.get("/debug_cv", tags=["Demo"])
async def debug_cv():
    """Complete CV engine runtime diagnostics. Returns the exact state of every dependency,
    the complete init traceback if any failed, and a live FaceMesh test result."""
    import platform
    import sys
    import traceback

    import numpy as np

    from app.services.cv.mediapipe_engine import (
        CV2_AVAILABLE,
        MP_AVAILABLE,
        MP_INIT_ERROR,
        global_face_mesh,
    )
    # Also import the new CV2_INIT_ERROR if available
    try:
        from app.services.cv.mediapipe_engine import CV2_INIT_ERROR
    except ImportError:
        CV2_INIT_ERROR = None
    try:
        from app.services.cv.mediapipe_engine import INSIGHTFACE_INIT_ERROR
    except ImportError:
        INSIGHTFACE_INIT_ERROR = None
    
    from typing import Any
    result: dict[str, Any] = {
        "python_version": sys.version,
        "platform": platform.platform(),
        "architecture": platform.machine(),
        "processor": platform.processor(),
        "MP_AVAILABLE": MP_AVAILABLE,
        "CV2_AVAILABLE": CV2_AVAILABLE,
        "global_face_mesh_loaded": global_face_mesh is not None,
        "mp_init_error": MP_INIT_ERROR,
        "cv2_init_error": CV2_INIT_ERROR,
        "insightface_init_error": INSIGHTFACE_INIT_ERROR,
        "dependency_versions": {},
        "import_tests": {},
        "facemesh_live_test": None,
    }
    
    # Test each dependency import individually
    for pkg_name in ["cv2", "mediapipe", "numpy", "insightface", "onnxruntime", "PIL", "scipy"]:
        try:
            mod = __import__(pkg_name)
            ver = getattr(mod, "__version__", "unknown")
            result["dependency_versions"][pkg_name] = ver
            result["import_tests"][pkg_name] = "OK"
        except Exception as e:
            result["dependency_versions"][pkg_name] = None
            result["import_tests"][pkg_name] = f"{type(e).__name__}: {e}"
    
    # Live FaceMesh test: create a blank image and run process()
    if global_face_mesh is not None:
        try:
            test_img = np.zeros((240, 320, 3), dtype=np.uint8)
            test_result = global_face_mesh.process(test_img)
            faces = getattr(test_result, 'multi_face_landmarks', None) or []
            result["facemesh_live_test"] = {
                "status": "OK",
                "faces_detected": len(faces),
                "note": "Blank image used — 0 faces expected. This confirms FaceMesh runs without crashing."
            }
        except Exception as e:
            result["facemesh_live_test"] = {
                "status": "FAILED",
                "exception_type": type(e).__name__,
                "exception_message": str(e),
                "traceback": traceback.format_exc()
            }
    else:
        result["facemesh_live_test"] = {
            "status": "NOT_LOADED",
            "reason": "global_face_mesh is None — see mp_init_error for details"
        }
    
    return result

@router.post("/session/start", tags=["Demo"])
async def start_session(
    data: SessionStartRequest,
    current_user: User | None = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db)
):
    session_id = getattr(data, 'session_id', None) or str(uuid.uuid4())
    
    advanced_pool = ['BLINK_ONCE', 'BLINK_TWICE', 'HEAD_UP', 'HEAD_DOWN', 'HEAD_LEFT', 'HEAD_RIGHT', 'NOD_HEAD', 'OPEN_MOUTH', 'HEAD_ROTATION', 'EYEBROWS_UP']
    enterprise_pool = ['HEAD_UP', 'HEAD_DOWN', 'HEAD_LEFT', 'HEAD_RIGHT', 'NOD_HEAD', 'OPEN_MOUTH', 'HEAD_ROTATION', 'EYEBROWS_UP']
    
    if data.api_type == "enterprise":
        requested_count = 3
        selected = secrets.SystemRandom().sample(enterprise_pool, requested_count)
    elif data.api_type == "advanced":
        requested_count = secrets.choice([3, 4, 5])
        num_challenges = min(len(advanced_pool), requested_count)
        selected = secrets.SystemRandom().sample(advanced_pool, num_challenges)
    else:
        # basic
        selected = ['BLINK_ONCE', 'OPEN_MOUTH', 'HEAD_LEFT']
        
    challenges = []
    challenges.append({
        "id": "FACE_CENTERED",
        "label": "1. Face Centered",
        "instruction": CHALLENGES_METADATA["FACE_CENTERED"]["instruction"],
        "icon": CHALLENGES_METADATA["FACE_CENTERED"]["icon"]
    })
    
    for idx, cid in enumerate(selected):
        meta = CHALLENGES_METADATA.get(cid, {"label": cid, "instruction": cid, "icon": "❓"})
        challenges.append({
            "id": cid,
            "label": f"{idx + 2}. {meta['label']}",
            "instruction": meta["instruction"],
            "icon": meta["icon"]
        })
        
    is_enrolled = False
    enrolled_signature = None
    if current_user and data.api_type == "enterprise":
        from app.models.models import FaceProfile
        from app.core.security import decrypt_template
        f_res = await db.execute(select(FaceProfile).where(FaceProfile.user_id == current_user.id))
        enrolled_prof = f_res.scalar_one_or_none()
        if enrolled_prof:
            is_enrolled = True
            vec = getattr(enrolled_prof, "embedding_vector", None)
            if getattr(enrolled_prof, "is_encrypted", False) and isinstance(vec, dict) and "encrypted_data" in vec:
                vec = decrypt_template(vec["encrypted_data"])
            enrolled_signature = vec
            
    from app.services.cv.mediapipe_engine import SESSION_CACHE
    SESSION_CACHE[session_id] = {
        "landmarks": [],
        "ear": [],
        "stage": "IDENTITY_VERIFYING" if is_enrolled else "ENROLLMENT",
        "enrolled_signature": enrolled_signature,
        "mar": [],
        "yaw": [],
        "pitch": [],
        "roll": [],
        "eyebrow_ratios": [],
        "baseline_eyebrow_ratio": None,
        "challenge_started_at": time.time(),
        "smile_ratios": [],
        "baseline_smile_ratio": None,
        "current_challenge": "FACE_CENTERED",
        "current_challenge_index": 0,
        "challenges": challenges,
        "logged": False,
        "created_at": time.time(),
        "last_active": time.time(),
        "last_face_seen": time.time(),
        "ear_history": [],
        "mar_history": [],
        "yaw_history": [],
        "pitch_history": [],
        "roll_history": [],
        "blink_history": [],
        "mouth_history": [],
        "multiple_faces_frames": 0,
        "face_lost_frames": 0,
        "spoof_frames": 0,
        "wrong_person_frames": 0,
        "challenge_start_time": time.time(),
        "user_id": current_user.id if current_user else None
    }
    
    return {
        "session_id": session_id,
        "challenges": challenges
    }

@router.post("/demo/process", tags=["Demo"])
async def demo_process(
    data: DemoProcessRequest,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    from app.services.cv.mediapipe_engine import SESSION_CACHE, process_demo_frame
    session = SESSION_CACHE.get(data.session_id) if data.session_id else None
    
    if session and data.action == "start_enrollment_capture":
        session["enrollment_capture_started"] = True
    
    print(f"[ENROLL API INPUT]\nsession_id={data.session_id}\nphase={session.get('stage') if session else 'UNKNOWN'}\nhas_frame={bool(data.image)}\nframe_size={len(data.image) if data.image else 0}\ncontent_type=base64\nchallenge_type={data.challenge_type}\naction={data.action}")

    current_user = None
    enrolled_signature_db = None
    if session and session.get("user_id"):
        from app.models.models import User, FaceProfile
        res = await db.execute(select(User).where(User.id == session["user_id"]))
        current_user = res.scalar_one_or_none()
        if current_user and data.api_type == "enterprise":
            from app.core.security import decrypt_template
            f_res = await db.execute(select(FaceProfile).where(FaceProfile.user_id == current_user.id))
            enrolled_prof = f_res.scalar_one_or_none()
            if enrolled_prof:
                vec = getattr(enrolled_prof, "embedding_vector", None)
                if getattr(enrolled_prof, "is_encrypted", False) and isinstance(vec, dict) and "encrypted_data" in vec:
                    vec = decrypt_template(vec["encrypted_data"])
                enrolled_signature_db = vec

    from app.services.cv.mediapipe_engine import SESSION_CACHE, process_demo_frame
    
    # ── BACKEND AUTHORITATIVE CHALLENGE INJECTION ──
    # Ignore the frontend's requested challenge. Use the server-side state.
    server_challenge = None
    challenge_timeout_reached = False
    time_remaining = 30
    
    if session and "challenges" in session and "current_challenge_index" in session:
        idx = session["current_challenge_index"]
        if idx < len(session["challenges"]):
            server_challenge = session["challenges"][idx]["id"]
        else:
            server_challenge = "liveness_verified"
            
        if "challenge_started_at" in session:
            elapsed = time.time() - session["challenge_started_at"]
            time_remaining = max(0, 30 - int(elapsed))
            if elapsed > 30:
                challenge_timeout_reached = True
    
    cv_result = await run_in_threadpool(
        process_demo_frame,
        image_b64=data.image,
        frame_id=data.frame_id,
        session_id=data.session_id,
        challenge_type=server_challenge,
        enrolled_signature=list(enrolled_signature_db) if enrolled_signature_db else data.enrolled_signature,
        api_type=data.api_type
    )
    
    # ── ADVANCE STATE FROM ENROLLMENT TO IDENTITY VERIFICATION ──
    if session and session.get("stage") == "ENROLLMENT":
        enroll_state = cv_result.get("enrollment_progress", {}).get("state")
        if enroll_state == "READY":
            session["stage"] = "FACE_IDENTITY"
            
    # ── CONTINUOUS LIVENESS VALIDATION ──
    # These statuses indicate a liveness violation that MUST block challenge advancement.
    LIVENESS_VIOLATION_STATUSES = {
        "NO_FACE_DETECTED", "FACE_LOST", "MULTIPLE_FACES_DETECTED",
        "FACE_NOT_CENTERED", "FACE_TOO_SMALL", "FACE_TOO_LARGE",
        "FACE_PARTIALLY_VISIBLE", "BLUR_DETECTED", "LOW_CONFIDENCE",
        "POSE_INVALID", "IDENTITY_LOST", "UNAUTHORIZED_PERSON",
        "SPOOF_DETECTED", "CAMERA_FEED_FROZEN", "DEEPFAKE_SUSPECTED",
        "REPLAY_ATTACK_DETECTED", "SECURITY_CHECK_FAILED",
        "searching_for_face",
    }
    
    # Human-readable warning messages for each violation
    LIVENESS_WARNING_MESSAGES = {
        "NO_FACE_DETECTED": "No face detected. Please look at the camera.",
        "FACE_LOST": "Face lost. Please look at the camera.",
        "searching_for_face": "Searching for face. Please look at the camera.",
        "MULTIPLE_FACES_DETECTED": "Multiple faces detected. Only one person should be visible.",
        "FACE_NOT_CENTERED": "Face not centered. Move your face to the center of the frame.",
        "FACE_TOO_SMALL": "Face too small. Move closer to the camera.",
        "FACE_TOO_LARGE": "Face too large. Move further from the camera.",
        "FACE_PARTIALLY_VISIBLE": "Face partially visible. Ensure your full face is in frame.",
        "BLUR_DETECTED": "Image is blurry. Please hold still.",
        "LOW_CONFIDENCE": "Low detection confidence. Improve lighting conditions.",
        "POSE_INVALID": "Head turned too far. Return to a neutral position.",
        "IDENTITY_LOST": "Identity verification lost. Please face the camera directly.",
        "UNAUTHORIZED_PERSON": "Face mismatch detected. Unauthorized person.",
        "SPOOF_DETECTED": "Spoof attempt detected.",
        "CAMERA_FEED_FROZEN": "Camera feed appears frozen.",
        "DEEPFAKE_SUSPECTED": "Deepfake suspected.",
        "REPLAY_ATTACK_DETECTED": "Replay attack detected.",
        "SECURITY_CHECK_FAILED": "Security check failed.",
    }
    
    cv_status = cv_result.get("status", "")
    has_liveness_violation = cv_status in LIVENESS_VIOLATION_STATUSES
    face_present = cv_result.get("face_present", False)
    
    # Track continuous face presence during challenges
    if session and data.api_type == "enterprise":
        if not face_present or cv_status in ("NO_FACE_DETECTED", "FACE_LOST", "searching_for_face"):
            session["challenge_face_lost_frames"] = session.get("challenge_face_lost_frames", 0) + 1
        else:
            session["challenge_face_lost_frames"] = 0
            
        if cv_status == "MULTIPLE_FACES_DETECTED":
            session["challenge_multi_face_frames"] = session.get("challenge_multi_face_frames", 0) + 1
        else:
            session["challenge_multi_face_frames"] = 0
    
    # Determine liveness_status for the frontend
    if has_liveness_violation:
        cv_result["liveness_status"] = cv_status.lower()
        cv_result["liveness_warning"] = LIVENESS_WARNING_MESSAGES.get(cv_status, f"Liveness check issue: {cv_status}")
    else:
        cv_result["liveness_status"] = "ok"
        cv_result["liveness_warning"] = None
    
    # ── CHECK FOR TERMINAL LIVENESS FAILURES DURING CHALLENGES ──
    if session and data.api_type == "enterprise":
        # Too many consecutive frames with no face → terminate
        if session.get("challenge_face_lost_frames", 0) >= 30:
            cv_result["status"] = "NO_FACE_DETECTED"
            cv_result["challenge_passed"] = False
            cv_result["result"] = "fail"
            cv_result["reason"] = "Face was lost for too long during verification."
            cv_result["liveness_status"] = "face_lost"
            cv_result["liveness_warning"] = "Face lost for too long. Session terminated."
            has_liveness_violation = True
            
        # Too many consecutive frames with multiple faces → terminate
        if session.get("challenge_multi_face_frames", 0) >= 10:
            cv_result["status"] = "MULTIPLE_FACES_DETECTED"
            cv_result["challenge_passed"] = False
            cv_result["result"] = "fail"
            cv_result["reason"] = "Multiple faces detected during verification."
            cv_result["liveness_status"] = "multiple_faces"
            cv_result["liveness_warning"] = "Multiple faces detected. Session terminated."
            has_liveness_violation = True
    
    # ── ADVANCE SEQUENCE ON SUCCESS ──
    # CRITICAL: Only advance if challenge passed AND no liveness violation
    if session and cv_result.get("challenge_passed") is True and not has_liveness_violation:
        session["current_challenge_index"] += 1
        session["challenge_started_at"] = time.time()  # Reset timer for next challenge
        session["challenge_face_lost_frames"] = 0  # Reset on advancement
        session["challenge_multi_face_frames"] = 0
        session["challenge_timeout_attempts"] = 0  # Reset timeout counter on advancement
        cv_result["sequence_advanced"] = True
    elif session and cv_result.get("challenge_passed") is True and has_liveness_violation:
        # Challenge would have passed but liveness violation blocks it
        cv_result["challenge_passed"] = False
        cv_result["sequence_advanced"] = False
        print(f"[LIVENESS GATE] Challenge blocked due to liveness violation: {cv_status}")
    elif session and challenge_timeout_reached and not cv_result.get("challenge_passed"):
        # ── FORCE SPOOF FAILURE ON TIMEOUT ──
        cv_result["status"] = "SPOOF_DETECTED"
        cv_result["challenge_passed"] = False
        cv_result["reason"] = "User did not perform the challenge within 30 seconds. Spoof detected."
        cv_result["result"] = "fail"
        cv_result["liveness_status"] = "spoof"
        cv_result["liveness_warning"] = "Spoof attempt detected."
        time_remaining = 0
        
    cv_result["time_remaining"] = time_remaining
        
    if session and "challenges" in session and "current_challenge_index" in session:
        idx = session["current_challenge_index"]
        if idx < len(session["challenges"]):
            cv_result["active_challenge"] = session["challenges"][idx]
            cv_result["current_challenge_index"] = idx
        else:
            cv_result["active_challenge"] = None
            cv_result["sequence_complete"] = True
            cv_result["current_challenge_index"] = idx
    
    # Handle terminal statuses regardless of whether they have been logged yet
    terminal_statuses = [
        "MULTIPLE_FACES_DETECTED",
        "REPLAY_ATTACK_DETECTED",
        "DEEPFAKE_SUSPECTED",
        "SPOOF_DETECTED",
        "CAMERA_FEED_FROZEN",
        "UNAUTHORIZED_PERSON",
        "IDENTITY_CHANGED",
        "FACE_TOO_SMALL",
        "FACE_TOO_LARGE",
        "FACE_PARTIALLY_VISIBLE",
        "NO_FACE_DETECTED",
        "FACE_LOST",
        "FACE_LOST_TIMEOUT",
    ]
    
    status = cv_result.get("status")
    reason = cv_result.get("reason")
    is_terminal = False
    
    if status in terminal_statuses or status == "failed" and reason == "no_face_detected":
        is_terminal = True
        cv_result["result"] = "fail"
        
        # Security Requirement: Any terminal failure MUST result in SESSION_TERMINATED
        original_status = cv_result.get("status")
        if original_status != "SESSION_TERMINATED":
            cv_result["reason"] = cv_result.get("reason") or original_status
            cv_result["status"] = "SESSION_TERMINATED"
        
    session = SESSION_CACHE.get(data.session_id) if current_user and data.session_id else None
    
    if session:
        challenges = session.get("challenges", [])
        if challenges and data.challenge_type == challenges[-1]["id"] and cv_result.get("challenge_passed"):
            is_terminal = True
            if status not in terminal_statuses:
                spoof_val = cv_result.get("spoof_score", 0.0)
                is_spoof = spoof_val > 0.45
                
                print(f"[MITRA VERIFY] Challenge Sequence Complete. Score: {cv_result.get('similarity_score')}, Confidence: {cv_result.get('face_confidence')}, Enrolled Matched: {cv_result.get('enrolled_matched')}")
                
                if is_spoof:
                    cv_result["result"] = "fail"
                    cv_result["status"] = "SPOOF_DETECTED"
                else:
                    cv_result["result"] = "pass"

    # Save verification logs if user is authenticated and session is terminal
    if current_user and session and not session.get("logged"):
        if is_terminal:
            result_status = map_verification_result(cv_result, data.api_type or "basic")
            print(f"verification_result: status={cv_result.get('status')} result={cv_result.get('result')}")
            print(f"analytics_result: mapped_result={result_status}")
            print(f"dashboard_result: logged_as={result_status}")
                
            stmt = select(ApiKey).where(ApiKey.user_id == current_user.id)
            res = await db.execute(stmt)
            api_key = res.scalars().first()
            if not api_key:
                api_key = ApiKey(
                    id=str(uuid.uuid4()),
                    user_id=current_user.id,
                    name="Default Key",
                    key_prefix="mv_",
                    key_hash=str(uuid.uuid4()),
                    api_type="enterprise",
                    is_active=True
                )
                db.add(api_key)
                try:
                    await db.commit()
                    await db.refresh(api_key)
                except Exception:
                    await db.rollback()
                    raise
            
            # Check for float fields
            spoof_val = cv_result.get("spoof_score")
            if spoof_val is None:
                spoof_val = 0.0
            deepfake_val = cv_result.get("deepfake_risk")
            if deepfake_val is None:
                deepfake_val = 0.0
            
            log = VerificationLog(
                id=str(uuid.uuid4()),
                api_key_id=api_key.id,
                session_id=data.session_id,
                api_type=data.api_type or "basic",
                result=result_status,
                confidence=float(cv_result.get("face_confidence") or 0.0),
                processing_time=float(cv_result.get("processing_time") or 0.0),
                checks_performed=cv_result,
                spoof_score=float(spoof_val),
                deepfake_risk=float(deepfake_val),
                ip_address=request.client.host if request.client else "127.0.0.1",
                created_at=datetime.now(timezone.utc)
            )
            db.add(log)
            try:
                await db.commit()
                await db.refresh(log)
                print(f"[VERIFICATION LOG] verification_id: {log.session_id}")
                print(f"[VERIFICATION LOG] api_type: {log.api_type}")
                print("[VERIFICATION LOG] database INSERT success: True")
                print(f"[VERIFICATION LOG] row ID: {log.id}")
                print(f"[VERIFICATION LOG] timestamp: {log.created_at}")
                session["logged"] = True
            except Exception:
                await db.rollback()
                print("[VERIFICATION LOG ERROR] database INSERT success: False")
                raise
                    
    return cv_result


class LogEventRequest(BaseModel):
    session_id: str
    event_type: str
    api_type: str

@router.post("/demo/log_event", tags=["Demo"])
async def demo_log_event(
    data: LogEventRequest,
    request: Request,
    current_user: User | None = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if not current_user:
        return {"status": "ignored", "reason": "user_not_authenticated"}
        
    session_id = data.session_id
    session = SESSION_CACHE.get(session_id)
    if session and session.get("logged"):
        return {"status": "ignored", "reason": "already_logged"}
        
    stmt = select(ApiKey).where(ApiKey.user_id == current_user.id)
    res = await db.execute(stmt)
    api_key = res.scalars().first()
    if not api_key:
        api_key = ApiKey(
            id=str(uuid.uuid4()),
            user_id=current_user.id,
            name="Default Key",
            key_prefix="mv_",
            key_hash=str(uuid.uuid4()),
            api_type="enterprise",
            is_active=True
        )
        db.add(api_key)
        try:
            await db.commit()
            await db.refresh(api_key)
        except Exception:
            await db.rollback()
            raise
            
    log = VerificationLog(
        id=str(uuid.uuid4()),
        api_key_id=api_key.id,
        session_id=session_id,
        api_type=data.api_type or "basic",
        result=data.event_type,
        confidence=0.0,
        processing_time=0.0,
        checks_performed={"manual_event": data.event_type},
        spoof_score=1.0 if data.event_type in ("SPOOF_DETECTED", "CAMERA_LOST") else 0.0,
        deepfake_risk=0.0,
        ip_address=request.client.host if request.client else "127.0.0.1",
        created_at=datetime.now(timezone.utc)
    )
    db.add(log)
    try:
        await db.commit()
        if session:
            session["logged"] = True
        return {"status": "success", "log_id": log.id}
    except Exception:
        await db.rollback()
        raise

