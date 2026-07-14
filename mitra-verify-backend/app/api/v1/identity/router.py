# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, Request, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from datetime import datetime, timezone
import uuid
import time
import numpy as np
from app.core.database import get_db
from app.models.models import ApiKey, VerificationLog, FaceProfile, User
from app.schemas.schemas import (
    IdentityVerifyRequest, IdentityVerifyResponse,
    IdentityEnrollRequest, IdentityEnrollResponse
)
from app.api.v1.auth.router import get_current_user
from app.services.cv.mediapipe_engine import run_identity_verify, map_verification_result

router = APIRouter(prefix="/identity", tags=["Identity Verification"])

@router.post("/verify", response_model=IdentityVerifyResponse)
async def identity_verify(
    data: IdentityVerifyRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Retrieve the enrolled face embedding for this subject from the database
    subject_id = str(data.subject_id or current_user.id)
    stmt = select(FaceProfile).where(FaceProfile.user_id == subject_id)
    res = await db.execute(stmt)
    enrolled = res.scalar_one_or_none()
    
    enrolled_vector = enrolled.embedding_vector if enrolled else None
    
    cv_result = run_identity_verify(data.image, subject_id, enrolled_vector)

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

    mapped_result = map_verification_result(cv_result, "enterprise")

    log = VerificationLog(
        id=str(uuid.uuid4()),
        api_key_id=api_key.id,
        session_id=cv_result.get("session_id"),
        api_type="enterprise",
        result=mapped_result,
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

    return IdentityVerifyResponse(
        session_id=cv_result.get("session_id", str(uuid.uuid4())),
        result=mapped_result,
        confidence=cv_result.get("confidence", 0.0),
        processing_time=cv_result.get("processing_time", 0.0),
        identity=cv_result.get("identity", {}),
        checks=cv_result.get("checks", {}),
        continuous_session=cv_result.get("continuous_session"),
        timestamp=datetime.now(timezone.utc)
    )

@router.post("/enroll", response_model=IdentityEnrollResponse)
async def identity_enroll(
    data: IdentityEnrollRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    from app.services.cv.mediapipe_engine import (
        b64_to_numpy, _calculate_face_embedding,
        _validate_enrollment_quality, MP_AVAILABLE, CV2_AVAILABLE
    )
    # pyrefly: ignore [missing-import]
    import cv2
    # pyrefly: ignore [missing-import]
    import mediapipe as mp
    
    if not MP_AVAILABLE or not CV2_AVAILABLE:
        raise HTTPException(status_code=500, detail="Computer vision engine is unavailable")
        
    # --- Stage 1: Camera initialized ---
    print("[Enrollment] Stage 1: Camera initialized")
    frame = b64_to_numpy(data.image)
    if frame is None:
        raise HTTPException(status_code=400, detail="Stage 1 Failed: Invalid image format")
        
    try:
        h, w = frame.shape[:2]
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Stage 1 Failed: Frame Decode Error - {str(e)}")
    
    from app.services.cv.mediapipe_engine import mp_face_mesh, SESSION_CACHE
    if mp_face_mesh is None:
        raise HTTPException(status_code=500, detail="CV Engine unavailable")

    try:
        with mp_face_mesh.FaceMesh(
            static_image_mode=True,
            max_num_faces=2,
            refine_landmarks=True,
            min_detection_confidence=0.5
        ) as face_mesh:
            results = face_mesh.process(rgb)
            
        multi_face_landmarks = getattr(results, "multi_face_landmarks", None)
        
        # --- Stage 2: Single face detected ---
        print("[Enrollment] Stage 2: Single face detected")
        if not multi_face_landmarks:
            raise HTTPException(status_code=400, detail="Stage 2 Failed: No face detected in frame")
        if len(multi_face_landmarks) > 1:
            raise HTTPException(status_code=400, detail="Stage 2 Failed: Multiple faces detected")
            
        landmarks = multi_face_landmarks[0].landmark  # type: ignore
        
        # --- Stage 3: 468/478 landmarks detected ---
        print("[Enrollment] Stage 3: 468/478 landmarks detected")
        if len(landmarks) < 468:
            raise HTTPException(status_code=400, detail=f"Stage 3 Failed: Incomplete landmarks ({len(landmarks)}/468)")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Stage 3 Failed: Landmark Detection Error - {str(e)}")

    quality = _validate_enrollment_quality(landmarks, frame, w, h)
    checks = quality.get("checks", {})
    
    # --- Stage 4: Face centered / Size ---
    print("[Enrollment] Stage 4: Face centered")
    bbox_x = min([lm.x for lm in landmarks])
    bbox_y = min([lm.y for lm in landmarks])
    bbox_w = max([lm.x for lm in landmarks]) - bbox_x
    bbox_h = max([lm.y for lm in landmarks]) - bbox_y
    if bbox_w < 0.25:
        raise HTTPException(status_code=400, detail="Stage 4 Failed: Face too small")
    if bbox_x < 0.05 or bbox_y < 0.05 or (bbox_x + bbox_w) > 0.95 or (bbox_y + bbox_h) > 0.95:
         raise HTTPException(status_code=400, detail="Stage 4 Failed: Face not centered")

    # --- Stage 5: Pose validation ---
    print("[Enrollment] Stage 5: Pose validation")
    if not checks.get("front_pose", True):
        raise HTTPException(status_code=400, detail="Stage 5 Failed: Head turned")
    if not checks.get("eyes_open", True):
        raise HTTPException(status_code=400, detail="Stage 5 Failed: Eyes closed")
    if not checks.get("neutral_expression", True):
        raise HTTPException(status_code=400, detail="Stage 5 Failed: Expression not neutral")

    # --- Stage 6: Lighting validation ---
    print("[Enrollment] Stage 6: Lighting validation")
    if not checks.get("good_lighting", True):
        raise HTTPException(status_code=400, detail="Stage 6 Failed: Lighting too dark")

    # --- Stage 7: Face stability for 2 continuous seconds ---
    print("[Enrollment] Stage 7: Face stability for 2 continuous seconds")
    if not data.session_id or data.session_id not in SESSION_CACHE:
        raise HTTPException(status_code=400, detail="Stage 7 Failed: Face stability for 2 continuous seconds (No active continuous session tracking)")
    
    session = SESSION_CACHE[data.session_id]
    created_at = session.get("created_at", time.time())
    elapsed = time.time() - created_at
    if elapsed < 2.0:
        raise HTTPException(status_code=400, detail="Stage 7 Failed: Face stability for 2 continuous seconds (Insufficient duration)")
    if session.get("last_face_seen", time.time()) < (time.time() - 0.5):
        raise HTTPException(status_code=400, detail="Stage 7 Failed: Face stability for 2 continuous seconds (Tracking lost during validation)")

    # --- Stage 8: Embedding generation ---
    print("[Enrollment] Stage 8: Embedding generation")
    try:
        embedding_vector = _calculate_face_embedding(frame, landmarks)
        if embedding_vector is None or len(embedding_vector) == 0:
            raise ValueError("Empty embedding returned")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Stage 8 Failed: Embedding Generation Error - {str(e)}")

    # --- Stage 9: Embedding normalization ---
    print("[Enrollment] Stage 9: Embedding normalization")
    try:
        norm = sum(x*x for x in embedding_vector) ** 0.5
        if abs(norm - 1.0) > 0.05:
            embedding_vector = np.array(embedding_vector) / norm
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Stage 9 Failed: Embedding Normalization Error - {str(e)}")

    # --- Stage 10: Embedding storage ---
    print("[Enrollment] Stage 10: Embedding storage")
    try:
        user_id = str(data.subject_id or current_user.id)
        await db.execute(delete(FaceProfile).where(FaceProfile.user_id == user_id))
        
        embedding_list = embedding_vector.tolist() if hasattr(embedding_vector, "tolist") else embedding_vector
        
        new_embedding = FaceProfile(
            id=str(uuid.uuid4()),
            user_id=user_id,
            embedding_vector=embedding_list,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        db.add(new_embedding)
        await db.commit()
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Stage 10 Failed: Embedding Storage Error - {str(e)}")

    # --- Stage 11: Enrollment successful ---
    print("[Enrollment] Stage 11: Enrollment successful")
    return IdentityEnrollResponse(
        status="success",
        message=f"Enrollment successful. Quality: {quality['quality_score']:.0%}",
        user_id=user_id,
        embedding_vector=embedding_list,
        created_at=datetime.now(timezone.utc)
    )

@router.get("/enrolled")
async def get_enrolled_identity(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(FaceProfile).where(FaceProfile.user_id == current_user.id)
    res = await db.execute(stmt)
    enrolled = res.scalar_one_or_none()
    
    if enrolled:
        return {
            "enrolled": True,
            "embedding_vector": enrolled.embedding_vector,
            "created_at": enrolled.created_at
        }
    return {"enrolled": False}
