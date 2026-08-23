import re

file_path = "/Users/krishnavarshithkamanaboina/Desktop/mitra-vrify/mitra-verify-backend/app/services/cv/mediapipe_engine.py"

with open(file_path, "r") as f:
    content = f.read()

# Find the spot after similarity calculation
target_pattern = re.compile(
r"""    if enrolled_matched == False and history and history.get\("wrong_person_frames", 0\) >= 15:
        ret_early = \{
            "face_present": True, "detected_faces": int\(detected_faces\), "face_confidence": float\(face_confidence\), "landmark_count": int\(landmark_count\),
            "bbox": bbox, "status": "UNAUTHORIZED_PERSON", "reason": match_reason, "challenge_passed": False, "enrolled_matched": False, "similarity_score": float\(similarity_score\), "distance": float\(embedding_distance\), "spoof_score": 1.0
        \}
        if api_type == "enterprise":
            ret_early\["enterprise_report"\] = _build_enterprise_report\(
                identity_match=similarity_score,
                confidence=face_confidence,
                liveness_score=0.0,
                spoof_score=spoof_score,
                fraud_result=\{\},
                verification_time_ms=0.0,
                challenge_results=\[\]\,
                pose_validation=\{\},
                quality_score=0.0,
                landmark_geometry=\{\},
                passive_liveness=\{\},
                session_id=session_id or "",
                enrolled_matched=False,
                id_metrics=id_metrics
            \)
        return ret_early"""
)

# We want to replace this early return with the strict state machine gates
replacement = """    if api_type == "enterprise" and session_id and session_id in SESSION_CACHE:
        session = SESSION_CACHE[session_id]
        current_stage = session.get("stage", "ENROLLMENT")
        
        # State transitions
        if current_stage == "IDENTITY_VERIFYING":
            if enrolled_matched:
                session["stage"] = "IDENTITY_VERIFIED"
                session["stage"] = "LIVENESS_CHALLENGES"  # Start challenges
            elif not enrolled_matched and history.get("wrong_person_frames", 0) >= 15:
                session["stage"] = "FAILED"
                status = "UNAUTHORIZED_PERSON"
                
        elif current_stage == "LIVENESS_CHALLENGES":
            # For simplicity, if they pass the current challenge, move to VERIFIED
            if challenge_passed:
                session["stage"] = "LIVENESS_VERIFIED"
                
                # Check ALL security conditions for ACCESS_GRANTED
                is_secure = (
                    enrolled_matched and
                    detected_faces == 1 and
                    spoof_score < 0.4 and
                    is_high_quality
                )
                if is_secure:
                    session["stage"] = "ACCESS_GRANTED"
                    session["stage"] = "CONTINUOUS_MONITORING"
                else:
                    session["stage"] = "FAILED"
                    status = "SECURITY_CHECK_FAILED"
                    
        elif current_stage == "CONTINUOUS_MONITORING":
            if not enrolled_matched and history.get("wrong_person_frames", 0) >= 15:
                session["stage"] = "ACCESS_REVOKED"
                status = "UNAUTHORIZED_PERSON"
            elif detected_faces != 1 and history.get("multiple_faces_frames", 0) >= 15:
                session["stage"] = "ACCESS_REVOKED"
                status = "MULTIPLE_FACES"
            elif spoof_score > 0.5:
                session["stage"] = "ACCESS_REVOKED"
                status = "SPOOF_DETECTED"

    # Default fallback for old unauthorized person block
    elif enrolled_matched == False and history and history.get("wrong_person_frames", 0) >= 15:
        status = "UNAUTHORIZED_PERSON"
        if api_type != "enterprise":
            ret_early = {
                "face_present": True, "detected_faces": int(detected_faces), "face_confidence": float(face_confidence), "landmark_count": int(landmark_count),
                "bbox": bbox, "status": "UNAUTHORIZED_PERSON", "reason": match_reason, "challenge_passed": False, "enrolled_matched": False, "similarity_score": float(similarity_score), "distance": float(embedding_distance), "spoof_score": 1.0
            }
            return ret_early"""

new_content = target_pattern.sub(replacement, content)
with open(file_path, "w") as f:
    f.write(new_content)
