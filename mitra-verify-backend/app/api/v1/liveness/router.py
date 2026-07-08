# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime
import uuid
from typing import Optional
from pydantic import BaseModel
from app.core.database import get_db
from app.models.models import ApiKey, VerificationLog, ApiUsage, User
from app.schemas.schemas import BasicLivenessRequest, BasicLivenessResponse, AdvancedLivenessRequest, AdvancedLivenessResponse
from app.api.v1.keys.router import get_api_key_from_header
from app.api.v1.auth.router import get_current_user
from app.services.cv.mediapipe_engine import run_basic_liveness, run_advanced_liveness, map_verification_result, SESSION_CACHE


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
        created_at=datetime.utcnow()
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
        timestamp=datetime.utcnow()
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
        created_at=datetime.utcnow()
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
        timestamp=datetime.utcnow()
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
        created_at=datetime.utcnow()
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
        timestamp=datetime.utcnow()
    )


from pydantic import BaseModel
import random
import time

CHALLENGES_METADATA = {
    "face_centered": { "label": "Face Centered", "instruction": "Center your face inside the guides", "icon": "👤" },
    "blink_once": { "label": "Blink Once", "instruction": "Blink your eyes once slowly", "icon": "👁️" },
    "blink_twice": { "label": "Blink Twice", "instruction": "Blink your eyes twice slowly", "icon": "👁️" },
    "open_mouth": { "label": "Open Mouth", "instruction": "Open your mouth wide", "icon": "👄" },
    "smile": { "label": "Smile", "instruction": "Smile warmly", "icon": "😊" },
    "turn_left": { "label": "Turn Head Left", "instruction": "Turn your head to the left", "icon": "👈" },
    "turn_right": { "label": "Turn Head Right", "instruction": "Turn your head to the right", "icon": "👉" },
    "look_up": { "label": "Look Up", "instruction": "Look up with your head", "icon": "👆" },
    "look_down": { "label": "Look Down", "instruction": "Look down with your head", "icon": "👇" },
    "raise_eyebrows": { "label": "Raise Eyebrows", "instruction": "Raise your eyebrows upward", "icon": "🤨" },
    "nod_head": { "label": "Nod Head", "instruction": "Nod your head up and down", "icon": "👍" },
    "shake_head": { "label": "Shake Head", "instruction": "Shake your head left and right", "icon": "👎" },
    "look_left": { "label": "Look Left", "instruction": "Look left with your eyes", "icon": "👀" },
    "look_right": { "label": "Look Right", "instruction": "Look right with your eyes", "icon": "👀" },
    "hold_still": { "label": "Hold Still", "instruction": "Hold still for 3 seconds", "icon": "⏱️" }
}

class SessionStartRequest(BaseModel):
    api_type: str

class DemoProcessRequest(BaseModel):
    image: str
    session_id: Optional[str] = None
    challenge_type: Optional[str] = None
    enrolled_signature: Optional[list[float]] = None
    enrolled_embedding: Optional[list[float]] = None
    api_type: Optional[str] = None

@router.post("/session/start", tags=["Demo"])
async def start_session(data: SessionStartRequest):
    session_id = str(uuid.uuid4())
    
    advanced_pool = ['blink_twice', 'open_mouth', 'turn_left', 'turn_right', 'raise_eyebrows', 'smile', 'look_up', 'look_down']
    enterprise_pool = ['blink_once', 'blink_twice', 'open_mouth', 'smile', 'turn_left', 'turn_right', 'look_up', 'look_down', 'raise_eyebrows', 'nod_head', 'shake_head', 'look_left', 'look_right', 'hold_still']
    
    if data.api_type == "enterprise":
        num_challenges = random.randint(7, 8)
        selected = random.sample(enterprise_pool, num_challenges)
    elif data.api_type == "advanced":
        num_challenges = random.randint(5, 6)
        selected = random.sample(advanced_pool, num_challenges)
    else:
        # basic
        selected = ['blink_once', 'open_mouth', 'turn_left']
        
    challenges = []
    challenges.append({
        "id": "face_centered",
        "label": "1. Face Centered",
        "instruction": CHALLENGES_METADATA["face_centered"]["instruction"],
        "icon": CHALLENGES_METADATA["face_centered"]["icon"]
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
        "mar": [],
        "yaw": [],
        "pitch": [],
        "roll": [],
        "eyebrow_ratios": [],
        "baseline_eyebrow_ratio": None,
        "current_challenge": "face_centered",
        "challenges": challenges,
        "logged": False,
        "created_at": time.time(),
        "last_active": time.time(),
        "last_face_seen": time.time()
    }
    
    return {
        "session_id": session_id,
        "challenges": challenges
    }

@router.post("/demo/process", tags=["Demo"])
async def demo_process(
    data: DemoProcessRequest,
    current_user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    from app.services.cv.mediapipe_engine import process_demo_frame, SESSION_CACHE
    
    cv_result = process_demo_frame(
        image_b64=data.image,
        session_id=data.session_id,
        challenge_type=data.challenge_type,
        enrolled_signature=data.enrolled_signature,
        enrolled_embedding=data.enrolled_embedding,
        api_type=data.api_type
    )
    
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
            
            if status in terminal_statuses:
                is_terminal = True
            elif status == "failed" and reason == "no_face_detected":
                is_terminal = True
            
            challenges = session.get("challenges", [])
            if challenges and data.challenge_type == challenges[-1]["id"] and cv_result.get("challenge_passed"):
                is_terminal = True
                if status not in terminal_statuses:
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
                    ip_address="127.0.0.1",
                    created_at=datetime.utcnow()
                )
                db.add(log)
                try:
                    await db.commit()
                    session["logged"] = True
                except Exception:
                    await db.rollback()
                    raise
                    
    return cv_result


class LogEventRequest(BaseModel):
    session_id: str
    event_type: str
    api_type: str

@router.post("/demo/log_event", tags=["Demo"])
async def log_demo_event(
    data: LogEventRequest,
    current_user: Optional[User] = Depends(get_current_user),
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
        ip_address="127.0.0.1",
        created_at=datetime.utcnow()
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

