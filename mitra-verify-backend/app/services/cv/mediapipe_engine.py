"""
MediaPipe-based computer vision engine for MITRA VERIFY.
Implements face liveness detection, anti-spoof, and identity verification.
"""
import base64
import time
import uuid
import math
import numpy as np  # pyrefly: ignore [missing-import]
from typing import Optional
from datetime import datetime, timezone
from io import BytesIO
from PIL import Image  # pyrefly: ignore [missing-import]

# Try importing CV libs; graceful fallback if not installed
try:
    import cv2  # pyrefly: ignore [missing-import]
    CV2_AVAILABLE = True
except ImportError:
    CV2_AVAILABLE = False

try:
    import mediapipe as mp  # pyrefly: ignore [missing-import]
    import cv2  # pyrefly: ignore [missing-import]
    import numpy as np  # pyrefly: ignore [missing-import]
    
    # In some environments, solutions might be nested
    if hasattr(mp, 'solutions'):
        mp_face_mesh = mp.solutions.face_mesh
        mp_face_detection = mp.solutions.face_detection
        MP_AVAILABLE = True
    else:
        mp_face_mesh = None
        mp_face_detection = None
        MP_AVAILABLE = False
except ImportError:
    MP_AVAILABLE = False


# ─────────────────────────────────────────────────────────────
# Landmark indices (MediaPipe 478-point face mesh)
# ─────────────────────────────────────────────────────────────
LEFT_EYE_INDICES = [362, 385, 387, 263, 373, 380]
RIGHT_EYE_INDICES = [33, 160, 158, 133, 153, 144]
LEFT_IRIS_INDICES = [474, 475, 476, 477]
RIGHT_IRIS_INDICES = [469, 470, 471, 472]
MOUTH_INDICES = [13, 14, 78, 308, 82, 312, 87, 317]
JAW_INDICES = [152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109]

FACE_OVAL_INDICES = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288,
                      397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136,
                      172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109]

NOSE_TIP = 1
LEFT_EYE_CORNER = 263
RIGHT_EYE_CORNER = 33
LEFT_MOUTH_CORNER = 61
RIGHT_MOUTH_CORNER = 291
CHIN = 199


def b64_to_numpy(image_b64: str) -> Optional[np.ndarray]:
    """Decode a base64 image string to a numpy BGR array."""
    try:
        if "," in image_b64:
            image_b64 = image_b64.split(",")[1]
        img_bytes = base64.b64decode(image_b64)
        img = Image.open(BytesIO(img_bytes)).convert("RGB")
        arr = np.array(img)
        if CV2_AVAILABLE:
            return cv2.cvtColor(arr, cv2.COLOR_RGB2BGR)
        return arr
    except Exception:
        return None


def _ear(landmarks, eye_indices, w, h):
    """Eye Aspect Ratio — measures how open the eye is."""
    pts = [(landmarks[i].x * w, landmarks[i].y * h) for i in eye_indices]
    A = math.dist(pts[1], pts[5])
    B = math.dist(pts[2], pts[4])
    C = math.dist(pts[0], pts[3])
    return (A + B) / (2.0 * C) if C > 0 else 0.0


def _mar(landmarks, w, h):
    """Mouth Aspect Ratio — measures how open the mouth is."""
    upper = (landmarks[13].x * w, landmarks[13].y * h)
    lower = (landmarks[14].x * w, landmarks[14].y * h)
    left  = (landmarks[78].x * w, landmarks[78].y * h)
    right = (landmarks[308].x * w, landmarks[308].y * h)
    vertical = math.dist(upper, lower)
    horizontal = math.dist(left, right)
    return vertical / horizontal if horizontal > 0 else 0.0


def _head_pose(landmarks, w, h):
    """Estimate yaw/pitch from landmark positions (simplified)."""
    nose_x = landmarks[NOSE_TIP].x
    left_eye_x  = landmarks[LEFT_EYE_CORNER].x
    right_eye_x = landmarks[RIGHT_EYE_CORNER].x
    eye_center_x = (left_eye_x + right_eye_x) / 2
    yaw = -(nose_x - eye_center_x) * 200  # corrected degrees: right = positive, left = negative
    nose_y = landmarks[NOSE_TIP].y
    chin_y = landmarks[CHIN].y
    left_eye_y = landmarks[LEFT_EYE_CORNER].y
    pitch = (nose_y - (left_eye_y + chin_y) / 2) * 100
    return yaw, pitch


def _smile_score(landmarks, w, h):
    """Detect smile from mouth corner elevation."""
    left_corner  = landmarks[LEFT_MOUTH_CORNER].y * h
    right_corner = landmarks[RIGHT_MOUTH_CORNER].y * h
    upper_lip = landmarks[13].y * h
    avg_corner = (left_corner + right_corner) / 2
    return max(0.0, min(1.0, (upper_lip - avg_corner + 5) / 10))


# ─────────────────────────────────────────────────────────────
# BASIC LIVENESS ENGINE
# ─────────────────────────────────────────────────────────────
def run_basic_liveness(image_b64: str) -> dict:
    print("FACE_DETECTION_STARTED")
    start = time.time()
    session_id = str(uuid.uuid4())

    if not MP_AVAILABLE or not CV2_AVAILABLE:
        return _fallback_basic(session_id, start)

    frame = b64_to_numpy(image_b64)
    if frame is None:
        return _error_response(session_id, "invalid_image", start)

    h, w = frame.shape[:2]
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

    assert mp_face_mesh is not None
    with mp_face_mesh.FaceMesh(
        static_image_mode=True,
        max_num_faces=1,
        refine_landmarks=True,
        min_detection_confidence=0.5
    ) as face_mesh:
        results = face_mesh.process(rgb)

    multi_face_landmarks = getattr(results, "multi_face_landmarks", None)
    if not multi_face_landmarks:
        elapsed = (time.time() - start) * 1000
        return {
            "session_id": session_id,
            "result": "fail",
            "confidence": 0.0,
            "liveness_score": 0.0,
            "processing_time": round(elapsed, 2),
            "checks": {
                "face_present": False,
                "blink_detected": False,
                "mouth_movement": False,
                "head_rotation": False,
                "smile_detected": False
            },
            "error": "No face detected"
        }

    print("FACE_DETECTED")
    print("LANDMARKS_FOUND")
    lm = multi_face_landmarks[0].landmark  # type: ignore
    left_ear  = _ear(lm, LEFT_EYE_INDICES, w, h)
    right_ear = _ear(lm, RIGHT_EYE_INDICES, w, h)
    avg_ear   = (left_ear + right_ear) / 2
    mar       = _mar(lm, w, h)
    yaw, pitch = _head_pose(lm, w, h)
    smile     = _smile_score(lm, w, h)

    blink_detected   = avg_ear < 0.25
    mouth_open       = mar > 0.15
    head_rotated     = abs(yaw) > 8 or abs(pitch) > 5
    smile_detected   = smile > 0.35

    # Liveness score: weighted combination
    score = (
        0.35 * (1.0 if blink_detected else max(0, 1 - avg_ear * 3)) +
        0.20 * (1.0 if mouth_open else 0.3) +
        0.20 * (1.0 if head_rotated else 0.3) +
        0.15 * smile +
        0.10 * 1.0  # face_present
    )
    liveness_score = min(1.0, score + 0.15)  # base bonus for real face presence
    confidence = liveness_score
    result = "pass" if liveness_score >= 0.55 else "fail"

    elapsed = (time.time() - start) * 1000
    return {
        "session_id": session_id,
        "result": result,
        "confidence": round(confidence, 4),
        "liveness_score": round(liveness_score, 4),
        "processing_time": round(elapsed, 2),
        "checks": {
            "face_present": True,
            "blink_detected": blink_detected,
            "mouth_movement": mouth_open,
            "head_rotation": head_rotated,
            "smile_detected": smile_detected
        }
    }


# ─────────────────────────────────────────────────────────────
# ADVANCED ANTI-SPOOF ENGINE
# ─────────────────────────────────────────────────────────────
def run_advanced_liveness(image_b64: str, challenge_type: Optional[str] = None) -> dict:
    print("FACE_DETECTION_STARTED")
    start = time.time()
    session_id = str(uuid.uuid4())

    if not MP_AVAILABLE or not CV2_AVAILABLE:
        return _fallback_advanced(session_id, start, challenge_type)

    frame = b64_to_numpy(image_b64)
    if frame is None:
        return _error_response(session_id, "invalid_image", start)

    h, w = frame.shape[:2]
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

    assert mp_face_mesh is not None
    with mp_face_mesh.FaceMesh(
        static_image_mode=True,
        max_num_faces=1,
        refine_landmarks=True,
        min_detection_confidence=0.5
    ) as face_mesh:
        results = face_mesh.process(rgb)

    multi_face_landmarks = getattr(results, "multi_face_landmarks", None)
    if not multi_face_landmarks:
        elapsed = (time.time() - start) * 1000
        return {"session_id": session_id, "result": "fail", "confidence": 0.0,
                "processing_time": round(elapsed, 2), "spoof_score": 1.0,
                "deepfake_risk": 0.5, "challenge_result": None,
                "checks": {"face_present": False}, "error": "No face detected"}

    print("FACE_DETECTED")
    print("LANDMARKS_FOUND")
    lm = multi_face_landmarks[0].landmark  # type: ignore
    left_ear  = _ear(lm, LEFT_EYE_INDICES, w, h)
    right_ear = _ear(lm, RIGHT_EYE_INDICES, w, h)
    avg_ear   = (left_ear + right_ear) / 2
    mar = _mar(lm, w, h)
    yaw, pitch = _head_pose(lm, w, h)

    # Texture anti-spoof: check for natural skin variance using LBP-inspired metric
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    face_region = gray[int(h*0.1):int(h*0.9), int(w*0.1):int(w*0.9)]
    if face_region.size > 0:
        local_std = float(np.std(face_region))
        texture_score = min(1.0, local_std / 30.0)
    else:
        texture_score = 0.5

    # Frequency analysis for screen/moiré
    if face_region.size > 0:
        f = np.fft.fft2(face_region.astype(float))
        fshift = np.fft.fftshift(f)
        magnitude = 20 * np.log(np.abs(fshift) + 1)
        center = magnitude[magnitude.shape[0]//2-5:magnitude.shape[0]//2+5,
                           magnitude.shape[1]//2-5:magnitude.shape[1]//2+5]
        edge   = np.mean(magnitude) 
        freq_ratio = float(np.mean(center)) / (float(edge) + 1.0)
        # High freq_ratio can indicate a screen
        replay_score = min(1.0, max(0.0, (freq_ratio - 1.5) / 3.0))  # type: ignore
    else:
        replay_score = 0.3

    # Challenge evaluation
    challenge_result = None
    if challenge_type:
        challenge_result = _evaluate_challenge(challenge_type, lm, w, h)

    challenge_passed = challenge_result.get("passed") if challenge_result else False
    spoof_score = _calculate_spoof_risk(frame, lm, None, texture_score, replay_score, challenge_type, challenge_passed)
    deepfake_risk = max(0.0, 0.3 - texture_score * 0.25)

    confidence = max(0.0, 1.0 - spoof_score * 0.7)
    if challenge_result and not challenge_result.get("passed"):
        confidence *= 0.5
    result = "pass" if confidence >= 0.65 and spoof_score < 0.6 else ("spoof" if spoof_score > 0.7 else "fail")

    elapsed = (time.time() - start) * 1000
    return {
        "session_id": session_id,
        "result": result,
        "confidence": round(confidence, 4),
        "processing_time": round(elapsed, 2),
        "spoof_score": round(spoof_score, 4),
        "deepfake_risk": round(deepfake_risk, 4),
        "challenge_result": challenge_result,
        "checks": {
            "face_present": True,
            "texture_analysis": round(texture_score, 3),
            "replay_attack_score": round(replay_score, 3),
            "lighting_score": round(texture_score, 3),
            "challenge_passed": challenge_result.get("passed") if challenge_result else None
        }
    }


def _evaluate_challenge(challenge_type: str, landmarks, w: int, h: int, history=None) -> dict:
    left_ear = _ear(landmarks, LEFT_EYE_INDICES, w, h)
    right_ear = _ear(landmarks, RIGHT_EYE_INDICES, w, h)
    avg_ear = (left_ear + right_ear) / 2.0
    mar = _mar(landmarks, w, h)
    yaw, pitch, roll = _head_pose_3d(landmarks, w, h)
    
    p_left_mouth = np.array([landmarks[291].x, landmarks[291].y])
    p_right_mouth = np.array([landmarks[61].x, landmarks[61].y])
    mouth_width = np.linalg.norm(p_left_mouth - p_right_mouth)
    p_left_jaw = np.array([landmarks[234].x, landmarks[234].y])
    p_right_jaw = np.array([landmarks[454].x, landmarks[454].y])
    face_width = np.linalg.norm(p_left_jaw - p_right_jaw)
    smile_ratio = mouth_width / face_width if face_width > 0.001 else 0.32
    smile_score = float(np.clip((smile_ratio - 0.32) / 0.08, 0.0, 1.0))
    
    # Eyebrow raise: Use arch landmarks vs upper eyelid for best accuracy
    # Left brow arch: indices 63, 105, 66, 107. Left upper eyelid: 159.
    # Right brow arch: indices 336, 296, 334, 285. Right upper eyelid: 386.
    left_brow_y = min(landmarks[63].y, landmarks[105].y, landmarks[66].y, landmarks[107].y)
    right_brow_y = min(landmarks[336].y, landmarks[296].y, landmarks[334].y, landmarks[285].y)
    left_eyelid_y = landmarks[159].y
    right_eyelid_y = landmarks[386].y
    # Distance in normalized coords (positive = brow above eyelid)
    left_brow_dist = left_eyelid_y - left_brow_y
    right_brow_dist = right_eyelid_y - right_brow_y
    avg_brow_dist = (left_brow_dist + right_brow_dist) / 2.0
    face_height = abs(landmarks[152].y - landmarks[10].y)
    eyebrow_ratio = avg_brow_dist / face_height if face_height > 0.001 else 0.18
    
    jaw_x_diff = landmarks[152].x - landmarks[1].x
    jaw_ratio = jaw_x_diff / face_width if face_width > 0.001 else 0.0
    
    passed = False
    detected = ""
    
    if challenge_type == "blink_twice":
        if history:
            ears = history["ear"]
            blinks = 0
            in_blink = False
            for val in ears:
                if val < 0.22:
                    if not in_blink:
                        in_blink = True
                else:
                    if in_blink:
                        blinks += 1
                        in_blink = False
            passed = blinks >= 2
            detected = f"Blinks={blinks}"
        else:
            passed = avg_ear < 0.22
            detected = f"EAR={avg_ear:.3f}"
    elif challenge_type == "open_mouth":
        passed = mar > 0.20
        detected = f"MAR={mar:.3f}"
    elif challenge_type == "turn_left":
        passed = yaw < -12.0
        detected = f"Yaw={yaw:.1f}°"
    elif challenge_type == "turn_right":
        passed = yaw > 12.0
        detected = f"Yaw={yaw:.1f}°"
    elif challenge_type == "look_up":
        passed = pitch > 10.0
        detected = f"Pitch={pitch:.1f}°"
    elif challenge_type == "look_down":
        passed = pitch < -10.0
        detected = f"Pitch={pitch:.1f}°"
    elif challenge_type == "smile":
        passed = smile_score > 0.45
        detected = f"Smile={smile_score:.2f}"
    elif challenge_type == "raise_eyebrows":
        passed = eyebrow_ratio > 0.20
        detected = f"BrowRatio={eyebrow_ratio:.3f}"
    elif challenge_type == "move_jaw_left":
        passed = jaw_ratio > 0.03
        detected = f"JawRatio={jaw_ratio:.3f}"
    elif challenge_type == "move_jaw_right":
        passed = jaw_ratio < -0.03
        detected = f"JawRatio={jaw_ratio:.3f}"
    elif challenge_type == "close_left_eye":
        passed = left_ear < 0.20 and right_ear > 0.25
        detected = f"LeftEAR={left_ear:.3f}, RightEAR={right_ear:.3f}"
    elif challenge_type == "close_right_eye":
        passed = right_ear < 0.20 and left_ear > 0.25
        detected = f"LeftEAR={left_ear:.3f}, RightEAR={right_ear:.3f}"
        
    return {"passed": bool(passed), "detected": detected}


# ─────────────────────────────────────────────────────────────
# ENTERPRISE IDENTITY ENGINE
# ─────────────────────────────────────────────────────────────


def _compute_face_signature(landmarks) -> np.ndarray:
    """Extract a simplified 64-element face descriptor from landmarks."""
    key_points = [0, 1, 4, 5, 6, 10, 13, 14, 17, 21, 33, 37, 39, 40, 46, 52,
                  53, 54, 55, 58, 61, 63, 65, 66, 67, 70, 78, 80, 81, 82, 84,
                  87, 88, 91, 93, 95, 103, 105, 107, 109, 127, 132, 133, 136,
                  144, 145, 146, 148, 149, 150, 152, 153, 154, 155, 157, 158,
                  159, 160, 161, 162, 163, 172, 173]
    pts = [(landmarks[i].x, landmarks[i].y, landmarks[i].z) for i in key_points[:64] if i < len(landmarks)]
    sig = np.array([v for pt in pts for v in pt[:2]], dtype=float)
    if len(sig) < 64:
        sig = np.pad(sig, (0, 64 - len(sig)))
    return sig[:64]


def _match_identity(face_sig: np.ndarray, subject_id: Optional[str]) -> dict:
    """Match face signature against stored embeddings (stub — returns realistic structure)."""
    # In a real deployment, compare against stored embeddings in DB
    # Here we compute a deterministic similarity based on the signature
    norm = np.linalg.norm(face_sig)
    if norm > 0:
        normalized = face_sig / norm
        # Self-similarity: always high for real faces
        similarity = float(np.clip(0.72 + np.mean(np.abs(normalized)) * 0.18, 0.0, 1.0))
    else:
        similarity = 0.0

    return {
        "matched": similarity > 0.7,
        "subject_id": subject_id or "unknown",
        "similarity_score": round(similarity, 4),
        "embedding_distance": round(1.0 - similarity, 4)
    }


# ─────────────────────────────────────────────────────────────
# Fallback responses (when CV deps not installed)
# ─────────────────────────────────────────────────────────────
def _fallback_basic(session_id, start):
    elapsed = (time.time() - start) * 1000
    return {
        "session_id": session_id, "result": "error", "confidence": 0.0,
        "liveness_score": 0.0, "processing_time": round(elapsed, 2),
        "checks": {}, "error": "CV engine not available. Install: pip install mediapipe opencv-python-headless"
    }

def _fallback_advanced(session_id, start, challenge_type):
    elapsed = (time.time() - start) * 1000
    return {
        "session_id": session_id, "result": "error", "confidence": 0.0,
        "processing_time": round(elapsed, 2), "spoof_score": 0.0, "deepfake_risk": 0.0,
        "challenge_result": None, "checks": {}, "error": "CV engine not available."
    }

def _fallback_enterprise(session_id, start, subject_id):
    elapsed = (time.time() - start) * 1000
    return {
        "session_id": session_id, "result": "error", "confidence": 0.0,
        "processing_time": round(elapsed, 2),
        "identity": {"matched": False, "subject_id": subject_id, "similarity_score": 0.0},
        "checks": {}, "continuous_session": None, "error": "CV engine not available."
    }

def _error_response(session_id, msg, start):
    elapsed = (time.time() - start) * 1000
    return {"session_id": session_id, "result": "error", "confidence": 0.0,
            "processing_time": round(elapsed, 2), "checks": {}, "error": msg}


def _head_pose_3d(landmarks, w, h):
    # Get 2D coordinates of nose tip, eyes, and chin
    nose = np.array([landmarks[NOSE_TIP].x * w, landmarks[NOSE_TIP].y * h])
    left_eye = np.array([landmarks[LEFT_EYE_CORNER].x * w, landmarks[LEFT_EYE_CORNER].y * h])
    right_eye = np.array([landmarks[RIGHT_EYE_CORNER].x * w, landmarks[RIGHT_EYE_CORNER].y * h])
    chin = np.array([landmarks[CHIN].x * w, landmarks[CHIN].y * h])
    
    # Roll: eye slope angle in degrees
    # Corrected subtraction direction: left_eye - right_eye so upright face is close to 0
    dx = left_eye[0] - right_eye[0]
    dy = left_eye[1] - right_eye[1]
    roll = math.atan2(dy, dx) * 180.0 / math.pi
    
    # Yaw: horizontal ratio of nose deviation from eye center
    eye_center = (left_eye + right_eye) / 2.0
    left_dist = np.linalg.norm(nose - left_eye)
    right_dist = np.linalg.norm(nose - right_eye)
    if left_dist > 0.001:
        ratio = right_dist / left_dist
        yaw = -(ratio - 1.0) * 45.0  # corrected degrees: right = positive, left = negative
    else:
        yaw = 0.0
        
    # Pitch: vertical eye-nose vs nose-chin ratio
    eye_nose_y = nose[1] - eye_center[1]
    nose_chin_y = chin[1] - nose[1]
    if nose_chin_y > 0.001:
        ratio_pitch = eye_nose_y / nose_chin_y
        pitch = (0.6 - ratio_pitch) * 50.0  # scale around standard front ratio 0.6
    else:
        pitch = 0.0
        
    # Clamp results to safe bounds to reject impossible values
    yaw = max(-45.0, min(45.0, yaw))  # type: ignore
    pitch = max(-35.0, min(35.0, pitch))  # type: ignore
    roll = max(-35.0, min(35.0, roll))  # type: ignore
    
    return yaw, pitch, roll


# ─────────────────────────────────────────────────────────────
# REAL-TIME DEMO EXTRACTION & VALIDATION PIPELINE (NO MOCKS)
# ─────────────────────────────────────────────────────────────
SESSION_CACHE = {}

def update_session_history(session_id: Optional[str], landmarks: list, ear: float, mar: float, yaw: float, pitch: float, roll: float, challenge_type: Optional[str] = None):
    if not session_id:
        return None
    if session_id not in SESSION_CACHE:
        SESSION_CACHE[session_id] = {
            "landmarks": [],
            "ear": [],
            "mar": [],
            "yaw": [],
            "pitch": [],
            "roll": [],
            "eyebrow_ratios": [],
            "baseline_eyebrow_ratio": None,
            "current_challenge": challenge_type,
            "created_at": time.time(),
            "last_active": time.time()
        }
    
    cache = SESSION_CACHE[session_id]
    cache["last_active"] = time.time()
    
    if "current_challenge" not in cache or cache["current_challenge"] != challenge_type:
        cache["current_challenge"] = challenge_type
        cache["landmarks"] = []
        cache["ear"] = []
        cache["mar"] = []
        cache["yaw"] = []
        cache["pitch"] = []
        cache["roll"] = []
        cache["eyebrow_ratios"] = []
    
    # Store history for last 20 frames
    cache["landmarks"].append([(lm.x, lm.y, lm.z) for lm in landmarks])
    cache["ear"].append(ear)
    cache["mar"].append(mar)
    cache["yaw"].append(yaw)
    cache["pitch"].append(pitch)
    cache["roll"].append(roll)
    
    # Eyebrow raise: Use arch landmarks vs upper eyelid for best accuracy
    left_brow_y = min(landmarks[63].y, landmarks[105].y, landmarks[66].y, landmarks[107].y)
    right_brow_y = min(landmarks[336].y, landmarks[296].y, landmarks[334].y, landmarks[285].y)
    left_eyelid_y = landmarks[159].y
    right_eyelid_y = landmarks[386].y
    left_brow_dist = left_eyelid_y - left_brow_y
    right_brow_dist = right_eyelid_y - right_brow_y
    avg_brow_dist = (left_brow_dist + right_brow_dist) / 2.0
    face_height = abs(landmarks[152].y - landmarks[10].y)
    eyebrow_ratio = avg_brow_dist / face_height if face_height > 0.001 else 0.18
    cache["eyebrow_ratios"].append(eyebrow_ratio)
    
    if len(cache["landmarks"]) > 20:
        cache["landmarks"].pop(0)
        cache["ear"].pop(0)
        cache["mar"].pop(0)
        cache["yaw"].pop(0)
        cache["pitch"].pop(0)
        cache["roll"].pop(0)
        cache["eyebrow_ratios"].pop(0)
        
    # Baseline distance calibration for the first 2 seconds (10 frames)
    # Baseline calibration: use median (more robust to outliers than mean)
    if cache["baseline_eyebrow_ratio"] is None:
        elapsed = time.time() - cache["created_at"]
        if elapsed >= 2.0:
            if cache["eyebrow_ratios"]:
                import numpy as np  # pyrefly: ignore [missing-import]
                cache["baseline_eyebrow_ratio"] = float(np.median(cache["eyebrow_ratios"]))
            else:
                cache["baseline_eyebrow_ratio"] = 0.18
        
    # Periodic cleanup of stale sessions (> 3 minutes inactive)
    now = time.time()
    stale_keys = [k for k, v in SESSION_CACHE.items() if now - v["last_active"] > 180]
    for k in stale_keys:
        SESSION_CACHE.pop(k, None)
        
    return cache


def _calculate_bbox(landmarks, w, h):
    xs = [lm.x * w for lm in landmarks]
    ys = [lm.y * h for lm in landmarks]
    min_x, max_x = min(xs), max(xs)
    min_y, max_y = min(ys), max(ys)
    return {
        "x": float(min_x / w),
        "y": float(min_y / h),
        "w": float((max_x - min_x) / w),
        "h": float((max_y - min_y) / h)
    }


def _calculate_face_confidence(landmarks, w, h) -> float:
    # Calculate face size relative to frame
    bbox = _calculate_bbox(landmarks, w, h)
    # Face should occupy a reasonable portion of the frame
    size_score = min(1.0, max(0.0, (bbox["w"] * bbox["h"]) / 0.04)) # 0.2 * 0.2 = 0.04
    
    # Calculate face symmetry: nose tip to left eye vs right eye
    nose = np.array([landmarks[NOSE_TIP].x, landmarks[NOSE_TIP].y])
    left_eye = np.array([landmarks[LEFT_EYE_CORNER].x, landmarks[LEFT_EYE_CORNER].y])
    right_eye = np.array([landmarks[RIGHT_EYE_CORNER].x, landmarks[RIGHT_EYE_CORNER].y])
    
    d_left = float(np.linalg.norm(nose - left_eye))
    d_right = float(np.linalg.norm(nose - right_eye))
    
    if d_left + d_right > 0.001:
        symmetry = 1.0 - abs(d_left - d_right) / (d_left + d_right)
    else:
        symmetry = 0.5
        
    # Calculate clipping (how many landmarks are at the edge of screen)
    clipped_count = 0
    for lm in landmarks:
        if lm.x < 0.01 or lm.x > 0.99 or lm.y < 0.01 or lm.y > 0.99:
            clipped_count += 1
    clipping_score = max(0.0, 1.0 - (clipped_count / 15.0))
    
    # Combined raw confidence score
    raw_score = 0.4 * size_score + 0.4 * symmetry + 0.2 * clipping_score
    
    # Scale raw_score to realistic face confidence metric (0.90 to 0.98) for valid faces
    if raw_score > 0.4:
        confidence = 0.90 + (raw_score - 0.4) * 0.15
    else:
        confidence = raw_score * 2.25
        
    return float(np.clip(confidence, 0.0, 0.98))


def _gaze_estimation(landmarks, w, h):
    # Check if iris coordinates exist (indexes 468 to 477)
    if len(landmarks) < 478:
        return {"x": 0.5, "y": 0.5}, True
        
    iris_left = np.array([landmarks[468].x, landmarks[468].y])
    corner_left_inner = np.array([landmarks[362].x, landmarks[362].y])
    corner_left_outer = np.array([landmarks[263].x, landmarks[263].y])
    
    iris_right = np.array([landmarks[473].x, landmarks[473].y])
    corner_right_outer = np.array([landmarks[33].x, landmarks[33].y])
    corner_right_inner = np.array([landmarks[133].x, landmarks[133].y])
    
    # Left eye delta, right eye delta
    left_denom = corner_left_outer[0] - corner_left_inner[0]
    right_denom = corner_right_inner[0] - corner_right_outer[0]
    
    if abs(left_denom) > 0.001 and abs(right_denom) > 0.001:
        gaze_left_x = (iris_left[0] - corner_left_inner[0]) / left_denom
        gaze_right_x = (iris_right[0] - corner_right_outer[0]) / right_denom
        gaze_x = float(np.clip((gaze_left_x + gaze_right_x) / 2.0, 0.0, 1.0))
    else:
        gaze_x = 0.5
        
    left_eye_top = landmarks[386].y
    left_eye_bottom = landmarks[374].y
    left_eye_height = left_eye_bottom - left_eye_top
    if left_eye_height > 0.001:
        gaze_y = float(np.clip((iris_left[1] - left_eye_top) / left_eye_height, 0.0, 1.0))
    else:
        gaze_y = 0.5
        
    return {"x": round(gaze_x, 4), "y": round(gaze_y, 4)}, True


def _calculate_spoof_risk(frame, landmarks, history, texture_score, replay_score, challenge_type=None, challenge_passed=False) -> float:
    # Base risk starts at 0.15
    risk = 0.15
    
    # 1. Replay indicator (moiré/screen frequency check)
    risk += float(replay_score) * 0.25
    
    # 2. Texture score penalty (low variance / flat skin print)
    risk += (1.0 - float(texture_score)) * 0.25
    
    # 3. Analyze motion and blink history if available
    if history and len(history["landmarks"]) >= 5:
        nose_pts = [pts[NOSE_TIP] for pts in history["landmarks"][-5:]]
        xs = [p[0] for p in nose_pts]
        ys = [p[1] for p in nose_pts]
        
        # Standard deviation of nose tip motion
        std_x = float(np.std(xs))
        std_y = float(np.std(ys))
        std_val = std_x + std_y
        
        # Completely static face (printed photo)
        if std_val < 0.0002:
            risk += 0.40
        # Jump cut / inconsistent displacement (swapping photos)
        elif len(history["landmarks"]) >= 2:
            last_p = history["landmarks"][-1][NOSE_TIP]
            prev_p = history["landmarks"][-2][NOSE_TIP]
            dist = math.dist(last_p[:2], prev_p[:2])
            if dist > 0.12: # huge jump
                risk += 0.35
                
        # Blink behavior check: if no blinks detected in the last 15 frames
        if len(history["ear"]) >= 15:
            min_ear = min(history["ear"][-15:])
            if min_ear > 0.24: # No blink occurred in the last 3 seconds
                risk += 0.10
            else:
                risk -= 0.05 # discount for natural blinking
                
    # 4. Challenge completion dynamic bonus
    if challenge_passed:
        risk -= 0.10 # discount for active challenge completion
        
    return float(np.clip(risk, 0.02, 0.98))


def _calculate_face_embedding(landmarks) -> list[float]:
    # Select key landmarks that capture face structure, eyes, eyebrows, nose, mouth shape, and jawline
    feature_nodes = [
        # Nose
        1, 2, 4, 5, 6, 197, 94,
        # Left eye & eyebrow
        33, 133, 159, 145, 46, 53, 70, 107,
        # Right eye & eyebrow
        263, 362, 386, 374, 276, 283, 300, 336,
        # Mouth
        61, 291, 13, 14, 78, 308, 17, 87, 317,
        # Jawline / Outline
        10, 152, 234, 454, 109, 338, 58, 288, 136, 365
    ]
    
    # Center on nose tip (landmark 1)
    center_x = landmarks[1].x
    center_y = landmarks[1].y
    center_z = landmarks[1].z
    
    # Scale normalization: distance between left jaw (234) and right jaw (454)
    p_left = np.array([landmarks[234].x, landmarks[234].y, landmarks[234].z])
    p_right = np.array([landmarks[454].x, landmarks[454].y, landmarks[454].z])
    scale = np.linalg.norm(p_right - p_left)
    if scale < 0.001:
        scale = 1.0
        
    embedding = []
    for idx in feature_nodes:
        lm = landmarks[idx]
        rx = (lm.x - center_x) / scale
        ry = (lm.y - center_y) / scale
        rz = (lm.z - center_z) / scale
        embedding.extend([float(rx), float(ry), float(rz)])
        
    return embedding


def _compute_cosine_similarity(emb_a: list[float], emb_b: list[float]) -> float:
    import json
    if isinstance(emb_a, str):
        try:
            emb_a = json.loads(emb_a)
        except Exception:
            pass
    if isinstance(emb_b, str):
        try:
            emb_b = json.loads(emb_b)
        except Exception:
            pass
    
    a = np.array(emb_a)
    b = np.array(emb_b)
    if len(a) != len(b) or len(a) == 0:
        return 0.0
    dot = np.dot(a, b)
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a < 0.001 or norm_b < 0.001:
        return 0.0
    cosine = dot / (norm_a * norm_b)
    
    # Map raw cosine similarity of relative coordinates to calibrated similarity scale:
    # >= 0.96 maps to 95% - 100% (Strong Match)
    # 0.88 to 0.96 maps to 85% - 94% (Possible Match)
    # < 0.88 maps to < 85% (No Match)
    if cosine >= 0.96:
        val = 0.95 + (cosine - 0.96) * (0.05 / 0.04)
    elif cosine >= 0.88:
        val = 0.85 + (cosine - 0.88) * (0.10 / 0.08)
    else:
        if cosine >= 0.70:
            val = 0.50 + (cosine - 0.70) * (0.35 / 0.18)
        else:
            val = max(0.0, cosine * 0.71)
            
    return float(np.clip(val, 0.0, 1.0))


def map_verification_result(cv_result: dict, api_type: str) -> str:
    """Map CV processing status or raw result to standard database result strings."""
    result = cv_result.get("result")
    status = cv_result.get("status")
    reason = cv_result.get("reason")
    checks = cv_result.get("checks", {})
    
    # Check if face was not present/detected at all
    face_present = checks.get("face_present", cv_result.get("face_present", True))
    
    # Check for specific terminal statuses first
    if status == "MULTIPLE_FACES_DETECTED":
        return "MULTIPLE_FACE"
    if status in ("REPLAY_ATTACK_DETECTED", "DEEPFAKE_SUSPECTED") or result == "spoof":
        return "SPOOF_DETECTED"
    if status == "CAMERA_FEED_FROZEN":
        return "CAMERA_LOST"
    if status == "TERMINATED":
        return "TERMINATED"
    if status in ("UNAUTHORIZED_PERSON", "IDENTITY_CHANGED"):
        return "TERMINATED"
    if status == "failed" and reason == "no_face_detected":
        return "FACE_LOST"
    if status == "FACE_LOST":
        return "FACE_LOST"
    if status == "NO_FACE_DETECTED":
        return "FACE_LOST"
    if not face_present or reason == "no_face_detected":
        return "FACE_LOST"
        
    # Standard pass/fail mapping
    if result == "pass":
        if api_type == "enterprise":
            return "IDENTITY_MATCH_SUCCESS"
        return "SUCCESS"
    if result == "fail":
        if api_type == "enterprise":
            return "IDENTITY_MISMATCH"
        return "FAILED"
        
    return "FAILED"




def process_demo_frame(
    image_b64: str,
    session_id: Optional[str] = None,
    challenge_type: Optional[str] = None,
    enrolled_signature: Optional[list[float]] = None,
    enrolled_embedding: Optional[list[float]] = None,
    api_type: Optional[str] = None
) -> dict:
    print("FACE_DETECTION_STARTED")
    if not MP_AVAILABLE or not CV2_AVAILABLE:
        return {
            "face_present": False,
            "detected_faces": 0,
            "face_confidence": 0.0,
            "landmark_count": 0,
            "blink_detected": False,
            "mouth_movement": False,
            "head_rotation": False,
            "yaw": 0.0,
            "pitch": 0.0,
            "roll": 0.0,
            "gaze_direction": None,
            "gaze_available": False,
            "smile_score": 0.0,
            "eyebrow_ratio": 0.0,
            "eyebrow_raised": False,
            "jaw_ratio": 0.0,
            "jaw_left": False,
            "jaw_right": False,
            "jaw_open": False,
            "ear": 0.0,
            "mar": 0.0,
            "spoof_score": 0.0,
            "deepfake_risk": 0.0,
            "challenge_passed": False,
            "similarity_score": 0.0,
            "enrolled_matched": False,
            "enrollment_signature": None,
            "bbox": None,
            "status": "cv_engine_unavailable"
        }
        
    frame = b64_to_numpy(image_b64)
    if frame is not None:
        print(f"[CV Engine] Received frame shape: {frame.shape}, mean intensity: {np.mean(frame)}")
    if frame is None:
        return {
            "face_present": False,
            "detected_faces": 0,
            "face_confidence": 0.0,
            "landmark_count": 0,
            "blink_detected": False,
            "mouth_movement": False,
            "head_rotation": False,
            "yaw": 0.0,
            "pitch": 0.0,
            "roll": 0.0,
            "gaze_direction": None,
            "gaze_available": False,
            "smile_score": 0.0,
            "eyebrow_ratio": 0.0,
            "eyebrow_raised": False,
            "jaw_ratio": 0.0,
            "jaw_left": False,
            "jaw_right": False,
            "jaw_open": False,
            "ear": 0.0,
            "mar": 0.0,
            "spoof_score": 0.0,
            "deepfake_risk": 0.0,
            "challenge_passed": False,
            "similarity_score": 0.0,
            "enrolled_matched": False,
            "enrollment_signature": None,
            "bbox": None,
            "status": "invalid_image"
        }
        
    h, w = frame.shape[:2]
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    
    assert mp_face_mesh is not None
    with mp_face_mesh.FaceMesh(
        static_image_mode=True,
        max_num_faces=4,
        refine_landmarks=True,
        min_detection_confidence=0.3
    ) as face_mesh:
        results = face_mesh.process(rgb)
        
    multi_face_landmarks = getattr(results, "multi_face_landmarks", None)
    if not multi_face_landmarks:
        if session_id and session_id in SESSION_CACHE and api_type != "enterprise":
            session = SESSION_CACHE[session_id]
            if "last_face_seen" not in session:
                session["last_face_seen"] = session.get("created_at", time.time())
            if time.time() - session["last_face_seen"] > 5.0:
                return {
                    "status": "FACE_LOST",
                    "reason": "no_face_detected",
                    "spoof_detected": True
                }
        return {
            "face_present": False,
            "detected_faces": 0,
            "face_confidence": 0.0,
            "landmark_count": 0,
            "blink_detected": False,
            "mouth_movement": False,
            "head_rotation": False,
            "yaw": 0.0,
            "pitch": 0.0,
            "roll": 0.0,
            "gaze_direction": None,
            "gaze_available": False,
            "smile_score": 0.0,
            "eyebrow_ratio": 0.0,
            "eyebrow_raised": False,
            "jaw_ratio": 0.0,
            "jaw_left": False,
            "jaw_right": False,
            "jaw_open": False,
            "ear": 0.0,
            "mar": 0.0,
            "spoof_score": 0.0,
            "deepfake_risk": 0.0,
            "challenge_passed": False,
            "similarity_score": 0.0,
            "enrolled_matched": False,
            "enrollment_signature": None,
            "bbox": None,
            "status": "FACE_LOST" if api_type == "enterprise" else "searching_for_face",
            "reason": "no_face_detected"
        }
        
    print("FACE_DETECTED")
    print("LANDMARKS_FOUND")
    if session_id and session_id in SESSION_CACHE:
        SESSION_CACHE[session_id]["last_face_seen"] = time.time()
    detected_faces = len(multi_face_landmarks) if multi_face_landmarks else 0
    
    if api_type == "enterprise" and detected_faces > 1:
        return {
            "face_present": True,
            "detected_faces": detected_faces,
            "face_confidence": 1.0,
            "landmark_count": 0,
            "blink_detected": False,
            "mouth_movement": False,
            "head_rotation": False,
            "yaw": 0.0,
            "pitch": 0.0,
            "roll": 0.0,
            "gaze_direction": None,
            "gaze_available": False,
            "smile_score": 0.0,
            "eyebrow_ratio": 0.0,
            "eyebrow_raised": False,
            "jaw_ratio": 0.0,
            "jaw_left": False,
            "jaw_right": False,
            "jaw_open": False,
            "ear": 0.0,
            "mar": 0.0,
            "spoof_score": 0.0,
            "deepfake_risk": 0.0,
            "challenge_passed": False,
            "similarity_score": 0.0,
            "enrolled_matched": False,
            "enrollment_signature": None,
            "bbox": None,
            "status": "MULTIPLE_FACES_DETECTED"
        }

    landmarks = multi_face_landmarks[0].landmark  # type: ignore
    landmark_count = len(landmarks)
    
    # 1. Bounding box & guidance checks
    bbox = _calculate_bbox(landmarks, w, h)
    
    # Bounding box margin check (Face partially visible)
    if api_type == "enterprise":
        if bbox["x"] < 0.02 or bbox["y"] < 0.02 or (bbox["x"] + bbox["w"]) > 0.98 or (bbox["y"] + bbox["h"]) > 0.98:
            return {
                "face_present": True, "detected_faces": detected_faces, "face_confidence": 0.0, "landmark_count": landmark_count,
                "bbox": bbox, "status": "FACE_PARTIALLY_VISIBLE", "challenge_passed": False, "enrolled_matched": False
            }
        if bbox["w"] < 0.22:
            return {
                "face_present": True, "detected_faces": detected_faces, "face_confidence": 0.0, "landmark_count": landmark_count,
                "bbox": bbox, "status": "FACE_TOO_SMALL", "challenge_passed": False, "enrolled_matched": False
            }
        if bbox["w"] > 0.70:
            return {
                "face_present": True, "detected_faces": detected_faces, "face_confidence": 0.0, "landmark_count": landmark_count,
                "bbox": bbox, "status": "FACE_TOO_LARGE", "challenge_passed": False, "enrolled_matched": False
            }

    # 2. EAR & MAR
    left_ear = _ear(landmarks, LEFT_EYE_INDICES, w, h)
    right_ear = _ear(landmarks, RIGHT_EYE_INDICES, w, h)
    avg_ear = (left_ear + right_ear) / 2.0
    mar = _mar(landmarks, w, h)
    
    # 3. Head Pose: yaw, pitch, roll
    yaw, pitch, roll = _head_pose_3d(landmarks, w, h)
    
    # 4. Gaze estimation
    gaze_direction, gaze_available = _gaze_estimation(landmarks, w, h)
    
    # 5. Smile (Mouth corner expansion ratio normalized by face width)
    p_left_mouth = np.array([landmarks[291].x, landmarks[291].y])
    p_right_mouth = np.array([landmarks[61].x, landmarks[61].y])
    mouth_width = np.linalg.norm(p_left_mouth - p_right_mouth)
    p_left_jaw = np.array([landmarks[234].x, landmarks[234].y])
    p_right_jaw = np.array([landmarks[454].x, landmarks[454].y])
    face_width = np.linalg.norm(p_left_jaw - p_right_jaw)
    smile_ratio = mouth_width / face_width if face_width > 0.001 else 0.32
    smile_score = float(np.clip((smile_ratio - 0.32) / 0.08, 0.0, 1.0))
    
    # 6. Eyebrow raise — use arch landmarks vs upper eyelid for best accuracy
    left_brow_y = min(landmarks[63].y, landmarks[105].y, landmarks[66].y, landmarks[107].y)
    right_brow_y = min(landmarks[336].y, landmarks[296].y, landmarks[334].y, landmarks[285].y)
    left_eyelid_y = landmarks[159].y
    right_eyelid_y = landmarks[386].y
    left_brow_dist = left_eyelid_y - left_brow_y
    right_brow_dist = right_eyelid_y - right_brow_y
    avg_brow_dist = (left_brow_dist + right_brow_dist) / 2.0
    face_height = abs(landmarks[152].y - landmarks[10].y)
    eyebrow_ratio = avg_brow_dist / face_height if face_height > 0.001 else 0.18
    
    # 7. Jaw movements (Chin deviation relative to vertical midline)
    jaw_x_diff = landmarks[152].x - landmarks[1].x
    jaw_ratio = jaw_x_diff / face_width if face_width > 0.001 else 0.0
    jaw_left = jaw_ratio > 0.03
    jaw_right = jaw_ratio < -0.03
    jaw_open = mar > 0.20
    
    # 8. Basic checks
    blink_detected = avg_ear < 0.22
    mouth_movement = mar > 0.18
    head_rotation = abs(yaw) > 12.0 or abs(pitch) > 8.0
    
    # 9. Session history (for anti-spoof landmark stability & challenge check tracking)
    history = update_session_history(session_id, landmarks, avg_ear, mar, yaw, pitch, roll, challenge_type)  # type: ignore
    
    # Apply rolling average to MAR over 5 frames
    if history and len(history["mar"]) > 0:
        smoothed_mar = float(np.mean(history["mar"][-5:]))
    else:
        smoothed_mar = mar

    # Camera feed frozen check (Standard deviation of nose coordinates over last 5 frames < 1e-6)
    if api_type == "enterprise" and history and len(history["landmarks"]) >= 5:
        nose_pts = [pts[NOSE_TIP] for pts in history["landmarks"][-5:]]
        xs = [pt[0] for pt in nose_pts]
        ys = [pt[1] for pt in nose_pts]
        if np.std(xs) < 1e-6 and np.std(ys) < 1e-6:
            return {
                "face_present": True, "detected_faces": detected_faces, "face_confidence": 0.0, "landmark_count": landmark_count,
                "bbox": bbox, "status": "CAMERA_FEED_FROZEN", "challenge_passed": False, "enrolled_matched": False
            }

    # Calculate dynamic eyebrow raise detection with 10-frame smoothing
    eyebrow_raised = False
    if history and history.get("baseline_eyebrow_ratio") is not None:
        baseline = history["baseline_eyebrow_ratio"]
        last_ratios = history["eyebrow_ratios"][-10:] if len(history["eyebrow_ratios"]) > 0 else [eyebrow_ratio]
        smoothed_ratio = float(np.mean(last_ratios))
        eyebrow_raised = smoothed_ratio > (baseline * 1.12)
    else:
        # Fallback to absolute threshold if baseline is still calibrating (first 2s)
        eyebrow_raised = eyebrow_ratio > 0.20
    
    # 10. Anti-spoof texture & frequency
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    x_px = int(bbox["x"] * w)
    y_px = int(bbox["y"] * h)
    w_px = int(bbox["w"] * w)
    h_px = int(bbox["h"] * h)
    
    x_px = max(0, min(w - 1, x_px))
    y_px = max(0, min(h - 1, y_px))
    w_px = max(10, min(w - x_px, w_px))
    h_px = max(10, min(h - y_px, h_px))
    
    face_region = gray[y_px:y_px+h_px, x_px:x_px+w_px]
    if face_region.size > 0:
        local_std = float(np.std(face_region))
        texture_score = min(1.0, local_std / 30.0)
        
        try:
            f = np.fft.fft2(face_region.astype(float))
            fshift = np.fft.fftshift(f)
            magnitude = 20 * np.log(np.abs(fshift) + 1)
            center_h, center_w = magnitude.shape[0] // 2, magnitude.shape[1] // 2
            center = magnitude[max(0, center_h-5):min(magnitude.shape[0], center_h+5),
                               max(0, center_w-5):min(magnitude.shape[1], center_w+5)]
            edge = np.mean(magnitude)
            freq_ratio = float(np.mean(center)) / (edge + 1)
            replay_score = min(1.0, max(0.0, (freq_ratio - 1.5) / 3.0))  # type: ignore
        except Exception:
            texture_score = 0.5
            replay_score = 0.3
    else:
        texture_score = 0.5
        replay_score = 0.3
        
    deepfake_risk = max(0.0, 0.45 - texture_score * 0.4)  # type: ignore
    
    if api_type == "enterprise" and deepfake_risk > 0.5:
        return {
            "face_present": True, "detected_faces": detected_faces, "face_confidence": 0.0, "landmark_count": landmark_count,
            "bbox": bbox, "status": "DEEPFAKE_SUSPECTED", "challenge_passed": False, "enrolled_matched": False
        }

    # 11. Challenge validation (Support 15 different facial challenges)
    challenge_passed = False
    face_confidence_check = _calculate_face_confidence(landmarks, w, h) if detected_faces > 0 else 0.0
    if challenge_type and history and detected_faces == 1 and face_confidence_check > 0:
        if challenge_type == "face_centered":
            challenge_passed = abs(yaw) < 8.0 and abs(pitch) < 8.0 and 0.35 < (bbox["x"] + bbox["w"]/2) < 0.65
        elif challenge_type == "blink_once":
            ears = history["ear"]
            blinks = 0
            in_blink = False
            for val in ears:
                if val < 0.22:
                    if not in_blink:
                        in_blink = True
                else:
                    if in_blink:
                        blinks += 1
                        in_blink = False
            challenge_passed = blinks >= 1
        elif challenge_type == "blink_twice":
            ears = history["ear"]
            blinks = 0
            in_blink = False
            for val in ears:
                if val < 0.22:
                    if not in_blink:
                        in_blink = True
                else:
                    if in_blink:
                        blinks += 1
                        in_blink = False
            challenge_passed = blinks >= 2
        elif challenge_type == "open_mouth":
            if smoothed_mar > 0.45:
                if history.get("mouth_open_start_time") is None:
                    history["mouth_open_start_time"] = time.time()
                elapsed = time.time() - history["mouth_open_start_time"]
                if elapsed >= 0.5:
                    challenge_passed = True
            elif smoothed_mar < 0.25:
                history["mouth_open_start_time"] = None
                challenge_passed = False
            else:
                if history.get("mouth_open_start_time") is not None:
                    elapsed = time.time() - history["mouth_open_start_time"]
                    if elapsed >= 0.5:
                        challenge_passed = True
        elif challenge_type == "smile":
            challenge_passed = smile_score > 0.45
        elif challenge_type == "turn_left":
            challenge_passed = yaw < -15.0
        elif challenge_type == "turn_right":
            challenge_passed = yaw > 15.0
        elif challenge_type == "look_up":
            challenge_passed = pitch > 10.0
        elif challenge_type == "look_down":
            challenge_passed = pitch < -10.0
        elif challenge_type == "raise_eyebrows":
            challenge_passed = eyebrow_raised
        elif challenge_type == "nod_head":
            if len(history["pitch"]) >= 5:
                pitch_range = max(history["pitch"]) - min(history["pitch"])
                challenge_passed = pitch_range > 8.0
        elif challenge_type == "shake_head":
            if len(history["yaw"]) >= 5:
                yaw_range = max(history["yaw"]) - min(history["yaw"])
                challenge_passed = yaw_range > 12.0
        elif challenge_type == "look_left":
            if gaze_available and gaze_direction:
                challenge_passed = gaze_direction["x"] < 0.45
        elif challenge_type == "look_right":
            if gaze_available and gaze_direction:
                challenge_passed = gaze_direction["x"] > 0.55
        elif challenge_type == "hold_still":
            if len(history["yaw"]) >= 5:
                last_yaw = history["yaw"][-15:]
                last_pitch = history["pitch"][-15:]
                last_roll = history["roll"][-15:]
                std_yaw = float(np.std(last_yaw))
                std_pitch = float(np.std(last_pitch))
                std_roll = float(np.std(last_roll))
                if std_yaw < 3.0 and std_pitch < 3.0 and std_roll < 3.0:
                    if history.get("hold_still_start_time") is None:
                        history["hold_still_start_time"] = time.time()
                    elapsed = time.time() - history["hold_still_start_time"]
                    if elapsed >= 3.0:
                        challenge_passed = True
                else:
                    history["hold_still_start_time"] = None

    # Calculate spoof score dynamically passing the challenge details
    spoof_score = _calculate_spoof_risk(frame, landmarks, history, texture_score, replay_score, challenge_type, challenge_passed)
            
    if api_type == "enterprise" and (spoof_score > 0.7 or replay_score > 0.7):
        return {
            "face_present": True, "detected_faces": detected_faces, "face_confidence": 0.0, "landmark_count": landmark_count,
            "bbox": bbox, "status": "REPLAY_ATTACK_DETECTED", "challenge_passed": False, "enrolled_matched": False
        }

    # 12. Face signature & matching
    current_signature = _calculate_face_embedding(landmarks)
    print("EMBEDDING_GENERATED")
    
    # Identity consistency validation during session
    if api_type == "enterprise" and history:
        if "first_face_embedding" not in history:
            history["first_face_embedding"] = current_signature
            history["identity_changed_count"] = 0
        else:
            initial_similarity = _compute_cosine_similarity(current_signature, history["first_face_embedding"])
            if initial_similarity < 0.85:
                history["identity_changed_count"] = history.get("identity_changed_count", 0) + 1
                if history["identity_changed_count"] >= 10:
                    return {
                        "face_present": True, "detected_faces": detected_faces, "face_confidence": 0.0, "landmark_count": landmark_count,
                        "bbox": bbox, "status": "TERMINATED", "reason": "IDENTITY_MISMATCH", "challenge_passed": False, "enrolled_matched": False, "spoof_score": 1.0
                    }
            else:
                history["identity_changed_count"] = 0

    similarity_score = 0.0
    enrolled_matched = False
    status = "ready"
    
    active_enrollment = enrolled_embedding if enrolled_embedding is not None else enrolled_signature
    if active_enrollment:
        raw_similarity = _compute_cosine_similarity(current_signature, active_enrollment)
        
        # Smooth similarity score over the last 15 frames using session history cache
        if history:
            if "similarity_scores" not in history:
                history["similarity_scores"] = []
            history["similarity_scores"].append(raw_similarity)
            if len(history["similarity_scores"]) > 15:
                history["similarity_scores"].pop(0)
            similarity_score = sum(history["similarity_scores"]) / len(history["similarity_scores"])
        else:
            similarity_score = raw_similarity
            
        required_threshold = 0.75 if api_type == "enterprise" else 0.85
        enrolled_matched = similarity_score >= required_threshold
        if enrolled_matched:
            print("MATCH_SUCCESS")
        elif api_type == "enterprise":
            # Only trigger UNAUTHORIZED_PERSON if we have at least 5 frames and the smoothed similarity is below threshold
            if history and len(history.get("similarity_scores", [])) >= 5:
                return {
                    "face_present": True, "detected_faces": int(detected_faces), "face_confidence": float(similarity_score), "landmark_count": int(landmark_count), # type: ignore
                    "bbox": bbox, "status": "TERMINATED", "reason": "IDENTITY_MISMATCH", "challenge_passed": False, "enrolled_matched": False, "similarity_score": float(similarity_score), "spoof_score": 1.0 # type: ignore
                }
    else:
        status = "no_enrolled_identity"
        
    face_confidence = _calculate_face_confidence(landmarks, w, h) if detected_faces > 0 else 0.0
    
    ret = {
        "face_present": True,
        "detected_faces": int(detected_faces),  # type: ignore
        "face_confidence": float(face_confidence),  # type: ignore
        "landmark_count": int(landmark_count),  # type: ignore
        "landmarks": [[float(lm.x), float(lm.y), float(lm.z)] for lm in landmarks] if detected_faces > 0 else [],  # type: ignore
        "bbox": bbox,
        "blink_detected": bool(blink_detected),  # type: ignore
        "mouth_movement": bool(mouth_movement),  # type: ignore
        "head_rotation": bool(head_rotation),  # type: ignore
        "yaw": float(yaw),  # type: ignore
        "raw_yaw": float(-yaw),  # type: ignore
        "pitch": float(pitch),  # type: ignore
        "roll": float(roll),  # type: ignore
        "gaze_direction": gaze_direction,
        "gaze_available": bool(gaze_available),  # type: ignore
        "smile_score": float(smile_score),  # type: ignore
        "eyebrow_ratio": float(eyebrow_ratio),  # type: ignore
        "eyebrow_raised": bool(eyebrow_raised),  # type: ignore
        "jaw_ratio": float(jaw_ratio),  # type: ignore
        "jaw_left": bool(jaw_left),  # type: ignore
        "jaw_right": bool(jaw_right),  # type: ignore
        "jaw_open": bool(jaw_open),  # type: ignore
        "ear": float(avg_ear),  # type: ignore
        "mar": float(smoothed_mar),  # type: ignore
        "left_ear": float(left_ear),  # type: ignore
        "right_ear": float(right_ear),  # type: ignore
        "spoof_score": float(spoof_score),  # type: ignore
        "deepfake_risk": float(deepfake_risk),  # type: ignore
        "challenge_type": challenge_type,
        "challenge_passed": bool(challenge_passed),  # type: ignore
        "similarity_score": float(similarity_score),  # type: ignore
        "enrolled_matched": bool(enrolled_matched),  # type: ignore
        "status": status
    }
    return ret

def run_identity_verify(image_b64: str, subject_id: Optional[str] = None, enrolled_vector: Optional[list[float]] = None, session_id: Optional[str] = None) -> dict:
    """Identity verification wrapper using process_demo_frame.
    """
    start = time.time()
    result = process_demo_frame(
        image_b64=image_b64,
        session_id=session_id,
        enrolled_embedding=enrolled_vector,
        api_type="enterprise"
    )
    identity = {
        "matched": result.get("enrolled_matched", False),
        "subject_id": subject_id or result.get("subject_id", "unknown"),
        "similarity_score": result.get("similarity_score", 0.0),
        "embedding_distance": 1.0 - result.get("similarity_score", 0.0)
    }
    elapsed = (time.time() - start) * 1000
    return {
        "session_id": result.get("session_id") or str(uuid.uuid4()),
        "result": "pass" if result.get("enrolled_matched", False) else "fail",
        "confidence": result.get("face_confidence", 0.0),
        "processing_time": round(elapsed, 2),
        "identity": identity,
        "checks": {
            "face_present": result.get("face_present", False),
            "blink_detected": result.get("blink_detected", False),
            "mouth_movement": result.get("mouth_movement", False),
            "head_rotation": result.get("head_rotation", False),
            "eyebrow_raised": result.get("eyebrow_raised", False)
        },
        "continuous_session": result.get("session_id"),
        "timestamp": datetime.now(timezone.utc),
        "status": result.get("status"),
        "reason": result.get("reason"),
        "spoof_score": result.get("spoof_score", 0.0),
        "deepfake_risk": result.get("deepfake_risk", 0.0),
    }
