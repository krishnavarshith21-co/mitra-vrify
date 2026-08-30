# pyrefly: ignore [missing-import]
import uuid
from datetime import datetime, timezone

import numpy as np
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.auth.router import get_current_user
from app.core.database import get_db
from app.models.models import ApiKey, FaceProfile, User, VerificationLog
from app.schemas.schemas import (
    IdentityEnrollRequest,
    IdentityEnrollResponse,
    IdentityVerifyRequest,
    IdentityVerifyResponse,
)
from app.services.cv.mediapipe_engine import (
    map_verification_result,
    run_identity_verify,
)

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
    
    from app.core.security import decrypt_template
    enrolled_vector = getattr(enrolled, "embedding_vector", None)
    if enrolled and getattr(enrolled, "is_encrypted", False) and isinstance(enrolled_vector, dict) and "encrypted_data" in enrolled_vector:
        enrolled_vector = decrypt_template(enrolled_vector["encrypted_data"])    
        
    if enrolled_vector is not None and not isinstance(enrolled_vector, list):
        print(f"RAISE: HTTPException(500, Corrupted enrolled template format for user {subject_id})")
        raise HTTPException(status_code=500, detail="Corrupted enrolled template format")
        
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
    
    # Continuous Template Learning
    import hashlib, json
    identity_match_flag = cv_result.get("identity", {}).get("identity_match", False)
    similarity = cv_result.get("identity", {}).get("similarity", 0.0)
    current_signature = cv_result.get("enrollment_signature")
    
    if enrolled and identity_match_flag and similarity > 0.92 and current_signature:
        if isinstance(enrolled_vector, list) and isinstance(enrolled_vector[0], list):
            # It's a multi-template, we can inject
            if len(enrolled_vector) < 30:
                enrolled_vector.append(current_signature)
            else:
                # Replace the oldest/weakest (FIFO approximation)
                enrolled_vector.pop(0)
                enrolled_vector.append(current_signature)
            
            from app.core.security import encrypt_template
            enrolled.template_version = enrolled.template_version + 1
            enrolled.embedding_hash = hashlib.sha256(json.dumps(enrolled_vector).encode()).hexdigest()
            
            if getattr(enrolled, "is_encrypted", False):
                enrolled.embedding_vector = {"encrypted_data": encrypt_template(enrolled_vector)}
            else:
                enrolled.embedding_vector = enrolled_vector
            
            # Drift Detection against Original
            original_vector = getattr(enrolled, "original_embedding", None)
            if original_vector and isinstance(original_vector, list) and isinstance(original_vector[0], list):
                from app.services.cv.mediapipe_engine import _compute_cosine_similarity
                drift_sims = []
                for orig_emb in original_vector:
                    s, _ = _compute_cosine_similarity(current_signature, orig_emb)
                    drift_sims.append(s)
                avg_orig_sim = sum(drift_sims) / len(drift_sims)
                
                # Update metadata if drifted
                meta = dict(enrolled.template_metadata) if enrolled.template_metadata else {}
                meta["drift_score"] = float(avg_orig_sim)
                if avg_orig_sim < 0.85:
                    meta["drift_status"] = "DRIFT_DETECTED"
                else:
                    meta["drift_status"] = "STABLE"
                enrolled.template_metadata = meta

            db.add(enrolled)

    await db.commit()

    
    # Inject template version and drift to response
    template_meta = getattr(enrolled, "template_metadata", {})
    if not isinstance(template_meta, dict):
        template_meta = {}
        
    if template_meta:
        if "identity" in cv_result:
            cv_result["identity"]["template_version"] = getattr(enrolled, "template_version", 1)
            cv_result["identity"]["drift_status"] = template_meta.get("drift_status", "STABLE")

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

@router.post("/enroll", tags=["Identity"])
async def identity_enroll(
    data: IdentityEnrollRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    print("ENTER: identity_enroll")
    """Enroll a face for enterprise identity verification. Generates a master embedding."""
    print("=== ENROLL REQUEST RECEIVED ===")
    print(f"Request payload: session_id={data.session_id}, subject_id={data.subject_id}, image length={len(data.image)}")

    # pyrefly: ignore [missing-import]
    import cv2

    # pyrefly: ignore [missing-import]
    from app.services.cv.mediapipe_engine import (
        CV2_AVAILABLE,
        MP_AVAILABLE,
        _calculate_face_embedding,
        _validate_enrollment_quality,
        b64_to_numpy,
        _build_enrollment_progress,
    )
    from app.services.session_manager import SESSION_CACHE

    if not MP_AVAILABLE or not CV2_AVAILABLE:
        try:
            from app.services.cv.mediapipe_engine import MP_INIT_ERROR
        except ImportError:
            MP_INIT_ERROR = None
        error_msg = f"Computer vision engine is unavailable. Details: {MP_INIT_ERROR}" if MP_INIT_ERROR else "Computer vision engine is unavailable."
        print(f"RAISE: HTTPException(500, {error_msg})")
        raise HTTPException(status_code=500, detail=error_msg)
        
    # --- Stage 0: Session pre-validation (hard guard) ---
    print("[Enrollment] Stage 0: Session pre-validation")
    if data.session_id:
        if data.session_id not in SESSION_CACHE:
            print(f"[Enrollment] BLOCKED — Session {data.session_id} not found or expired")
            return {
                "success": False,
                "code": "SESSION_EXPIRED",
                "state": "FAILED",
                "valid_embeddings": 0,
                "required_embeddings": 15,
                "message": "Enrollment session expired. Restart enrollment.",
            }

    # --- Stage 1: Camera initialized ---
    print("[Enrollment] Stage 1: Camera initialized")
    
    if data.session_id and data.session_id in SESSION_CACHE:
        print(f"Session found: {data.session_id}")
        session_data = SESSION_CACHE[data.session_id]
        print(f"Challenge state: {session_data.get('challenges')}")
    else:
        print("Session NOT found in cache!")

    frame = b64_to_numpy(data.image)
    if frame is None:
        print("RAISE: HTTPException(400, Stage 1 Failed: Invalid image format)")
        raise HTTPException(status_code=400, detail="Stage 1 Failed: Invalid image format")
        
    try:
        h, w = frame.shape[:2]
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    except Exception as e:
        print(f"RAISE: HTTPException(400, Stage 1 Failed: Frame Decode Error - {e!s})")
        raise HTTPException(status_code=400, detail=f"Stage 1 Failed: Frame Decode Error - {e!s}")
    
    from app.services.cv.mediapipe_engine import MP_INIT_ERROR, global_face_mesh
    if global_face_mesh is None:
        error_msg = f"CV Engine unavailable. Details: {MP_INIT_ERROR}" if MP_INIT_ERROR else "CV Engine unavailable"
        print(f"RAISE: HTTPException(500, {error_msg})")
        raise HTTPException(status_code=500, detail=error_msg)

    try:
        results = global_face_mesh.process(rgb)
            
        multi_face_landmarks = getattr(results, "multi_face_landmarks", None)
        
        print("ENTER validate_face")
        # --- Stage 2: Single face detected ---
        print("[Enrollment] Stage 2: Single face detected")
        if not multi_face_landmarks:
            print("RAISE: HTTPException(400, Stage 2 Failed: No face detected in frame)")
            raise HTTPException(status_code=400, detail="Stage 2 Failed: No face detected in frame")
        if len(multi_face_landmarks) > 1:
            print("RAISE: HTTPException(400, Stage 2 Failed: Multiple faces detected)")
            raise HTTPException(status_code=400, detail="Stage 2 Failed: Multiple faces detected")
            
        landmarks = multi_face_landmarks[0].landmark
        
        # --- Stage 3: 468/478 landmarks detected ---
        print("[Enrollment] Stage 3: 468/478 landmarks detected")
        if len(landmarks) < 468:
            print(f"RAISE: HTTPException(400, Stage 3 Failed: Incomplete landmarks ({len(landmarks)}/468))")
            raise HTTPException(status_code=400, detail=f"Stage 3 Failed: Incomplete landmarks ({len(landmarks)}/468)")
    except HTTPException:
        raise
    except Exception as e:
        print(f"RAISE: HTTPException(400, Stage 3 Failed: Landmark Detection Error - {e!s})")
        raise HTTPException(status_code=400, detail=f"Stage 3 Failed: Landmark Detection Error - {e!s}")

    print("ENTER quality_check")
    quality = _validate_enrollment_quality(landmarks, frame, w, h)
    checks = quality.get("checks", {})
    
    # --- Stage 4: Face centered / Size ---
    print("[Enrollment] Stage 4: Face centered")
    bbox_x = min([lm.x for lm in landmarks])
    bbox_y = min([lm.y for lm in landmarks])
    bbox_w = max([lm.x for lm in landmarks]) - bbox_x
    bbox_h = max([lm.y for lm in landmarks]) - bbox_y
    if bbox_w < 0.25:
        print("RAISE: HTTPException(400, Enrollment Failed: Face too small)")
        raise HTTPException(status_code=400, detail="Enrollment Failed: Face too small")
    if bbox_x < 0.05 or bbox_y < 0.05 or (bbox_x + bbox_w) > 0.95 or (bbox_y + bbox_h) > 0.95:
         print("RAISE: HTTPException(400, Enrollment Failed: Face not centered)")
         raise HTTPException(status_code=400, detail="Enrollment Failed: Face not centered")

    # --- Stage 6: Lighting validation ---
    print("ENTER lighting_check")
    print("[Enrollment] Stage 6: Lighting validation")
    if not checks.get("good_lighting", True):
        print("RAISE: HTTPException(400, Enrollment Failed: Lighting too dark)")
        raise HTTPException(status_code=400, detail="Enrollment Failed: Lighting too dark")

    # --- Stage 8: Embedding generation ---
    print("ENTER embedding_generation")
    print("[Enrollment] Stage 8: Embedding generation")
    print("=== EMBEDDING GENERATED ===")
    try:
        if data.session_id and data.session_id in SESSION_CACHE:
            session_data = SESSION_CACHE[data.session_id]
            cached_embeddings = session_data.get("enrollment_embeddings", [])
            pose_coverage = set(session_data.get("pose_coverage", []))
            expr_coverage = set(session_data.get("expression_coverage", []))
            
            # Enterprise strict coverage requirements
            required_poses = {"Front", "Left 15", "Right 15", "Up", "Down"}
            missing_poses = required_poses - pose_coverage
            
            required_exprs = {"Neutral", "Smile"}
            missing_exprs = required_exprs - expr_coverage

            # Determine enrollment readiness state
            enrollment_state = "COLLECTING"
            if len(cached_embeddings) >= 15 and not missing_poses and not missing_exprs:
                enrollment_state = "READY"
            
            if len(cached_embeddings) < 15:
                msg = f"Continue enrollment. {len(cached_embeddings)}/15 valid frames collected."
                print(f"[Enrollment] BLOCKED — {msg}")
                return {
                    "success": False,
                    "code": "ENROLLMENT_NOT_READY",
                    "state": enrollment_state,
                    "valid_embeddings": len(cached_embeddings),
                    "required_embeddings": 15,
                    "pose_coverage": list(pose_coverage),
                    "expression_coverage": list(expr_coverage),
                    "missing_poses": list(missing_poses),
                    "missing_expressions": list(missing_exprs),
                    "message": msg,
                }
                
            if missing_poses:
                msg = f"Insufficient pose coverage. Missing: {', '.join(missing_poses)}"
                print(f"[Enrollment] BLOCKED — {msg}")
                return {
                    "success": False,
                    "code": "INSUFFICIENT_POSE_COVERAGE",
                    "state": enrollment_state,
                    "valid_embeddings": len(cached_embeddings),
                    "required_embeddings": 15,
                    "pose_coverage": list(pose_coverage),
                    "expression_coverage": list(expr_coverage),
                    "missing_poses": list(missing_poses),
                    "missing_expressions": list(missing_exprs),
                    "message": msg,
                }
                
            if missing_exprs:
                msg = f"Insufficient expression coverage. Missing: {', '.join(missing_exprs)}"
                print(f"[Enrollment] BLOCKED — {msg}")
                return {
                    "success": False,
                    "code": "INSUFFICIENT_EXPRESSION_COVERAGE",
                    "state": enrollment_state,
                    "valid_embeddings": len(cached_embeddings),
                    "required_embeddings": 15,
                    "pose_coverage": list(pose_coverage),
                    "expression_coverage": list(expr_coverage),
                    "missing_poses": list(missing_poses),
                    "missing_expressions": list(missing_exprs),
                    "message": msg,
                }
                
            # Use robust multi-sample enterprise template
            embedding_vector = cached_embeddings
            
            # Calculate Enterprise Quality Score
            quality_score = min(100.0, (len(cached_embeddings) / 30.0) * 40.0 + (len(pose_coverage) / 7.0) * 40.0 + (len(expr_coverage) / 4.0) * 20.0)
            session_data["template_quality_score"] = quality_score
            session_data["pose_coverage_list"] = list(pose_coverage)
            session_data["expression_coverage_list"] = list(expr_coverage)
            
            print(f"[Enrollment] Stored robust multi-sample template with {len(cached_embeddings)} high-quality frames. Quality Score: {quality_score:.2f}")
        else:
            # Fallback for tests or missing session
            print("[Enrollment] No session cache, using single-frame embedding")
            embedding_vector = _calculate_face_embedding(frame, landmarks)
            
        print("=== EMBEDDING GENERATED ===")
            
        if embedding_vector is None or len(embedding_vector) == 0:
            print("RAISE: ValueError(Empty embedding returned)")
            raise ValueError("Empty embedding returned")
            
        # Logging baseline similarity to itself
        if isinstance(embedding_vector[0], list):
            print(f"[Enrollment] Baseline Similarity: 1.0000 (Multi-Template Size: {len(embedding_vector)})")
        else:
            emb_arr = np.array(embedding_vector)
            dist = np.linalg.norm(emb_arr - emb_arr)
            print(f"[Enrollment] Baseline Similarity: 1.0000 (Distance: {dist:.4f})")
    except HTTPException:
        raise
    except Exception as e:
        print(f"RAISE: HTTPException(500, Embedding Generation Error - {e!s})")
        raise HTTPException(status_code=500, detail=f"Enrollment Failed: Embedding Generation Error - {e!s}")

    # --- Stage 9: Embedding normalization ---
    print("[Enrollment] Stage 9: Embedding normalization")
    try:
        if isinstance(embedding_vector[0], list):
            # Normalize all embeddings in the multi-template
            normalized_list = []
            for emb in embedding_vector:
                norm = sum(x*x for x in emb) ** 0.5 # pyright: ignore
                if norm > 0 and abs(norm - 1.0) > 0.05:
                    normalized_list.append((np.array(emb) / norm).tolist())
                else:
                    normalized_list.append(emb)
            embedding_vector = normalized_list
        else:
            norm = sum(x*x for x in embedding_vector) ** 0.5
            if norm > 0 and abs(norm - 1.0) > 0.05:
                embedding_vector = (np.array(embedding_vector) / norm).tolist()
    except Exception as e:
        print(f"RAISE: HTTPException(500, Embedding Normalization Error - {e!s})")
        raise HTTPException(status_code=500, detail=f"Stage 9 Failed: Embedding Normalization Error - {e!s}")

    # --- Stage 10: Embedding storage ---
    print("ENTER database_save")
    print("[Enrollment] Stage 10: Embedding storage")
    print("=== DATABASE SAVE STARTED ===")
    try:
        user_id = str(data.subject_id or current_user.id)
        await db.execute(delete(FaceProfile).where(FaceProfile.user_id == user_id))
        
        embedding_list = list(embedding_vector)
        import hashlib
        import json
        emb_hash = hashlib.sha256(json.dumps(embedding_list).encode()).hexdigest()
        
        # Use the session_data already populated above (do NOT re-fetch — would lose template_quality_score)
        db_session_data = SESSION_CACHE.get(data.session_id, {}) if (data.session_id) else {}
        template_meta = {
            "quality_score": db_session_data.get("template_quality_score", 100.0),
            "pose_coverage": db_session_data.get("pose_coverage_list", ["Front"]),
            "expression_coverage": db_session_data.get("expression_coverage_list", ["Neutral"])
        }
        
        from app.core.security import encrypt_template
        encrypted_embedding_list = {"encrypted_data": encrypt_template(embedding_list)}
        
        # Diagnostic: log shape/dimension without exposing values
        if isinstance(embedding_list[0], list):
            print(f"[Enrollment] Embedding type: multi-template, {len(embedding_list)} vectors, dim={len(embedding_list[0])}")
        else:
            print(f"[Enrollment] Embedding type: single-vector, dim={len(embedding_list)}")
        
        new_embedding = FaceProfile(
            id=str(uuid.uuid4()),
            user_id=user_id,
            embedding_vector=encrypted_embedding_list,
            original_embedding=embedding_list,
            embedding_hash=emb_hash,
            template_version=1,
            template_metadata=template_meta,
            is_encrypted=True,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        db.add(new_embedding)
        await db.commit()
        print("=== DATABASE SAVE COMPLETE ===")
    except Exception as e:
        await db.rollback()
        print(f"RAISE: HTTPException(500, Embedding Storage Error - {e!s})")
        raise HTTPException(status_code=500, detail=f"Stage 10 Failed: Embedding Storage Error - {e!s}")

    # --- Stage 11: Session transition to IDENTITY_VERIFYING ---
    print("[Enrollment] Stage 11: Enrollment successful — transitioning session")
    
    # FIX: `embedding_vector` is the correctly normalized template.
    # Store it in SESSION_CACHE so the process_demo_frame loop can compare
    # the current face against the enrolled template in IDENTITY_VERIFYING.
    # The raw values are NEVER returned to the frontend.
    if data.session_id and data.session_id in SESSION_CACHE:
        SESSION_CACHE[data.session_id]["stage"] = "IDENTITY_VERIFYING"
        SESSION_CACHE[data.session_id]["enrolled_embedding"] = embedding_vector
        SESSION_CACHE[data.session_id]["enrolled_template_available"] = True
        
        # Prevent TypeError on first frame if the user is slightly blurry/misaligned
        # (Removed cached_signature injection from here because it pollutes live tracking state)
            
        print(f"[Enrollment] SESSION_CACHE[{data.session_id[:8]}...] stage=IDENTITY_VERIFYING, enrolled_embedding stored (not returned to client)")
    else:
        print(f"[Enrollment] WARNING: session_id={data.session_id!r} not in SESSION_CACHE — cannot set stage")


    
    # Calculate final quality score for the response message
    final_q = quality.get('quality_score', 0.0)
    db_session_data = SESSION_CACHE.get(data.session_id, {}) if (data.session_id) else {}
    if 'template_quality_score' in db_session_data:
        final_q = db_session_data['template_quality_score']
    
    # Return ONLY metadata — never the embedding values themselves
    response = IdentityEnrollResponse(
        status="success",
        message=f"Enrollment successful. Quality: {final_q:.0f}/100",
        user_id=user_id,
        created_at=datetime.now(timezone.utc)
    )
    print("RETURN:", response)
    print("EXIT: identity_enroll")
    return response

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
            "created_at": enrolled.created_at
        }
    return {"enrolled": False}


@router.delete("/enrolled")
async def clear_enrolled_identity(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await db.execute(delete(FaceProfile).where(FaceProfile.user_id == current_user.id))
    await db.commit()
    return {"success": True}
