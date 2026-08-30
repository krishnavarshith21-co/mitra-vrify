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
async def start_session(data: SessionStartRequest, current_user: User | None = Depends(get_optional_user)):
    session_id = getattr(data, 'session_id', None) or str(uuid.uuid4())
    
    advanced_pool = ['BLINK_ONCE', 'BLINK_TWICE', 'HEAD_UP', 'HEAD_DOWN', 'HEAD_LEFT', 'HEAD_RIGHT', 'NOD_HEAD', 'OPEN_MOUTH', 'HEAD_ROTATION', 'EYEBROWS_UP']
    enterprise_pool = ['HEAD_UP', 'HEAD_DOWN', 'HEAD_LEFT', 'HEAD_RIGHT', 'NOD_HEAD', 'OPEN_MOUTH', 'HEAD_ROTATION', 'EYEBROWS_UP']
    
    if data.api_type == "enterprise":
        requested_count = secrets.choice([6, 7, 8])
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
        
    from app.services.cv.mediapipe_engine import SESSION_CACHE
    SESSION_CACHE[session_id] = {
        "landmarks": [],
        "ear": [],
        "stage": "ENROLLMENT",
        "mar": [],
        "yaw": [],
        "pitch": [],
        "roll": [],
        "eyebrow_ratios": [],
        "baseline_eyebrow_ratio": None,
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
    
    print(f"[ENROLL API INPUT]\nsession_id={data.session_id}\nphase={session.get('stage') if session else 'UNKNOWN'}\nhas_frame={bool(data.image)}\nframe_size={len(data.image) if data.image else 0}\ncontent_type=base64\nchallenge_type={data.challenge_type}")

    current_user = None
    if session and session.get("user_id"):
        from app.models.models import User
        res = await db.execute(select(User).where(User.id == session["user_id"]))
        current_user = res.scalar_one_or_none()
    from app.services.cv.mediapipe_engine import SESSION_CACHE, process_demo_frame
    
    # ── BACKEND AUTHORITATIVE CHALLENGE INJECTION ──
    # Ignore the frontend's requested challenge. Use the server-side state.
    server_challenge = None
    if session and "challenges" in session and "current_challenge_index" in session:
        idx = session["current_challenge_index"]
        if idx < len(session["challenges"]):
            server_challenge = session["challenges"][idx]["id"]
    
    cv_result = await run_in_threadpool(
        process_demo_frame,
        image_b64=data.image,
        frame_id=data.frame_id,
        session_id=data.session_id,
        challenge_type=server_challenge,
        enrolled_signature=data.enrolled_signature,
        api_type=data.api_type
    )
    
    # ── ADVANCE SEQUENCE ON SUCCESS ──
    if session and cv_result.get("challenge_passed") is True:
        session["current_challenge_index"] += 1
        cv_result["sequence_advanced"] = True
        
    if session and "challenges" in session and "current_challenge_index" in session:
        idx = session["current_challenge_index"]
        if idx < len(session["challenges"]):
            cv_result["active_challenge"] = session["challenges"][idx]
            cv_result["current_challenge_index"] = idx
        else:
            cv_result["active_challenge"] = None
            cv_result["sequence_complete"] = True
            cv_result["current_challenge_index"] = idx
    
    # Save verification logs if user is authenticated and session is terminal
    if current_user and data.session_id:
        session = SESSION_CACHE.get(data.session_id)
        if session and not session.get("logged"):
            is_terminal = False
            result_status = "FAILED"
            
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
                "NO_FACE_DETECTED"
            ]
            
            status = cv_result.get("status")
            reason = cv_result.get("reason")
            
            if status in terminal_statuses or status == "failed" and reason == "no_face_detected":
                is_terminal = True
                cv_result["result"] = "fail"
            
            challenges = session.get("challenges", [])
            if challenges and data.challenge_type == challenges[-1]["id"] and cv_result.get("challenge_passed"):
                is_terminal = True
                if status not in terminal_statuses:
                    spoof_val = cv_result.get("spoof_score", 0.0)
                    is_spoof = spoof_val > 0.45
                    
                    # For enterprise, check if identity matched (if there is an enrolled identity)
                    is_unauthorized = False
                    if data.api_type == "enterprise" and not cv_result.get("enrolled_matched", True):
                        is_unauthorized = True
                        
                    if is_spoof:
                        cv_result["result"] = "fail"
                        cv_result["status"] = "SPOOF_DETECTED"
                    elif is_unauthorized:
                        cv_result["result"] = "fail"
                        cv_result["status"] = "UNAUTHORIZED_PERSON"
                    else:
                        cv_result["result"] = "pass"
                
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

