# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, Request, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from datetime import datetime
import uuid
from typing import Optional
from app.core.database import get_db
from app.models.models import ApiKey, VerificationLog, FaceProfile, User
from app.schemas.schemas import (
    IdentityVerifyRequest, IdentityVerifyResponse,
    IdentityEnrollRequest, IdentityEnrollResponse
)
from app.api.v1.keys.router import get_api_key_from_header
from app.api.v1.auth.router import get_current_user
from app.services.cv.mediapipe_engine import run_identity_verify, process_demo_frame, map_verification_result

router = APIRouter(prefix="/identity", tags=["Identity Verification"])

@router.post("/verify", response_model=IdentityVerifyResponse)
async def identity_verify(
    data: IdentityVerifyRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Retrieve the enrolled face embedding for this subject from the database
    subject_id = data.subject_id or current_user.id
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

    return IdentityVerifyResponse(
        session_id=cv_result.get("session_id", str(uuid.uuid4())),
        result=cv_result.get("result", "error"),
        confidence=cv_result.get("confidence", 0.0),
        processing_time=cv_result.get("processing_time", 0.0),
        identity=cv_result.get("identity", {}),
        checks=cv_result.get("checks", {}),
        continuous_session=cv_result.get("continuous_session"),
        timestamp=datetime.utcnow()
    )

@router.post("/enroll", response_model=IdentityEnrollResponse)
async def identity_enroll(
    data: IdentityEnrollRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    from app.services.cv.mediapipe_engine import b64_to_numpy, _calculate_face_embedding, MP_AVAILABLE, CV2_AVAILABLE
    # pyrefly: ignore [missing-import]
    import cv2
    # pyrefly: ignore [missing-import]
    import mediapipe as mp
    
    if not MP_AVAILABLE or not CV2_AVAILABLE:
        raise HTTPException(status_code=500, detail="Computer vision engine is unavailable")
        
    frame = b64_to_numpy(data.image)
    if frame is None:
        raise HTTPException(status_code=400, detail="Invalid image file or format")
        
    h, w = frame.shape[:2]
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    
    from app.services.cv.mediapipe_engine import mp_face_mesh
    with mp_face_mesh.FaceMesh(
        static_image_mode=True,
        max_num_faces=1,
        refine_landmarks=True,
        min_detection_confidence=0.5
    ) as face_mesh:
        results = face_mesh.process(rgb)
        
    if not results.multi_face_landmarks:
        raise HTTPException(status_code=400, detail="No face detected in enrollment frame")
        
    landmarks = results.multi_face_landmarks[0].landmark
    embedding_vector = _calculate_face_embedding(landmarks)
    
    user_id = data.subject_id or current_user.id
    
    # Delete any existing face embedding for this user
    await db.execute(delete(FaceProfile).where(FaceProfile.user_id == user_id))
    
    new_embedding = FaceProfile(
        id=str(uuid.uuid4()),
        user_id=user_id,
        embedding_vector=embedding_vector,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    db.add(new_embedding)
    await db.commit()
    print("ENROLLMENT_SUCCESS")
    
    # Convert NumPy array to a plain Python list for serialization
    embedding_list = embedding_vector.tolist() if hasattr(embedding_vector, "tolist") else embedding_vector
    return IdentityEnrollResponse(
        status="success",
        message="Face embedding enrolled successfully",
        user_id=user_id,
        embedding_vector=embedding_list,
        created_at=new_embedding.created_at
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
