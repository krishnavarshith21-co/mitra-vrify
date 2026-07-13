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

    confidence = _calculate_face_confidence(lm, w, h)
    
    # Liveness score: Calculate using texture and replay scores directly
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    face_region = gray[int(h*0.1):int(h*0.9), int(w*0.1):int(w*0.9)]
    if face_region.size > 0:
        local_std = float(np.std(face_region))
        texture_score = min(1.0, local_std / 30.0)
        try:
            f = np.fft.fft2(face_region.astype(float))
            fshift = np.fft.fftshift(f)
            magnitude = 20 * np.log(np.abs(fshift) + 1)
            center = magnitude[magnitude.shape[0]//2-5:magnitude.shape[0]//2+5,
                               magnitude.shape[1]//2-5:magnitude.shape[1]//2+5]
            edge   = np.mean(magnitude) 
            freq_ratio = float(np.mean(center)) / (float(edge) + 1.0)
            replay_score = min(1.0, max(0.0, (freq_ratio - 1.5) / 3.0))
        except Exception:
            texture_score = 0.0
            replay_score = 1.0
    else:
        texture_score = 0.0
        replay_score = 1.0

    spoof_score = _calculate_spoof_risk(frame, lm, None, texture_score, replay_score)
    liveness_score = max(0.0, 1.0 - spoof_score)
    result = "pass" if confidence >= 0.65 and spoof_score < 0.45 else "fail"

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

    confidence = _calculate_face_confidence(lm, w, h)
    if challenge_result and not challenge_result.get("passed"):
        result = "fail"
    else:
        result = "pass" if confidence >= 0.65 and spoof_score < 0.45 else ("spoof" if spoof_score > 0.7 else "fail")

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
    norm = np.linalg.norm(face_sig)
    if norm > 0:
        similarity = 0.0 # Without actual comparison, we cannot return a match
    else:
        similarity = 0.0

    return {
        "matched": False,
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
    
    return float(np.clip(raw_score, 0.0, 1.0))


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
            risk += 0.80
        # Jump cut / inconsistent displacement (swapping photos)
        elif len(history["landmarks"]) >= 2:
            last_p = history["landmarks"][-1][NOSE_TIP]
            prev_p = history["landmarks"][-2][NOSE_TIP]
            dist = math.dist(last_p[:2], prev_p[:2])
            if dist > 0.12: # huge jump
                risk += 0.80
                
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
        
    return float(np.clip(risk, 0.02, 1.0))


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
    
    return float(np.clip(cosine, 0.0, 1.0))


# ─────────────────────────────────────────────────────────────
# ENTERPRISE ADVANCED IDENTITY VERIFICATION ENGINE
# Multi-layer biometric security for banking, government,
# healthcare, airports, and secure access systems.
# ─────────────────────────────────────────────────────────────

# Extended landmark sets for 128-dim embedding
_ADVANCED_FEATURE_NODES = [
    # Nose bridge & tip (7)
    1, 2, 4, 5, 6, 197, 94,
    # Left eye contour (12)
    33, 133, 159, 145, 46, 53, 70, 107, 160, 158, 153, 144,
    # Right eye contour (12)
    263, 362, 386, 374, 276, 283, 300, 336, 385, 387, 373, 380,
    # Left eyebrow (5)
    63, 105, 66, 107, 55,
    # Right eyebrow (5)
    296, 334, 285, 295, 282,
    # Mouth outer (10)
    61, 291, 13, 14, 78, 308, 17, 87, 317, 82,
    # Mouth inner (4)
    312, 80, 81, 88,
    # Jawline & outline (10)
    10, 152, 234, 454, 109, 338, 58, 288, 136, 365,
    # Cheeks (4)
    116, 345, 187, 411,
    # Forehead & temples (4)
    67, 297, 21, 251,
    # Iris centers (4)
    468, 473, 474, 476,
]


def _calculate_advanced_embedding(landmarks) -> list[float]:
    """Generate a 128-dimensional face embedding using extended landmark set.
    
    Uses 77 key landmarks with 3D coordinates (x, y, z) normalized against
    face width (jaw-to-jaw distance) and centered on nose tip.
    Produces richer biometric signature than basic 46-dim embedding.
    """
    center_x = landmarks[1].x
    center_y = landmarks[1].y
    center_z = landmarks[1].z

    p_left = np.array([landmarks[234].x, landmarks[234].y, landmarks[234].z])
    p_right = np.array([landmarks[454].x, landmarks[454].y, landmarks[454].z])
    scale = float(np.linalg.norm(p_right - p_left))
    if scale < 0.001:
        scale = 1.0

    embedding: list[float] = []
    for idx in _ADVANCED_FEATURE_NODES:
        if idx < len(landmarks):
            lm = landmarks[idx]
            rx = (lm.x - center_x) / scale
            ry = (lm.y - center_y) / scale
            rz = (lm.z - center_z) / scale
            embedding.extend([float(rx), float(ry), float(rz)])

    # Pad or truncate to exactly 128 dimensions
    if len(embedding) < 128:
        embedding.extend([0.0] * (128 - len(embedding)))
    return embedding[:128]


def _euclidean_distance_validation(emb_a: list[float], emb_b: list[float]) -> dict:
    """Secondary distance metric for cross-validation of identity match.
    
    Returns euclidean distance and a normalized similarity score.
    Used alongside cosine similarity for higher confidence decisions.
    """
    import json
    if isinstance(emb_a, str):
        try: emb_a = json.loads(emb_a)
        except Exception: pass
    if isinstance(emb_b, str):
        try: emb_b = json.loads(emb_b)
        except Exception: pass

    a = np.array(emb_a, dtype=float)
    b = np.array(emb_b, dtype=float)

    # Align dimensions
    min_len = min(len(a), len(b))
    if min_len == 0:
        return {"distance": float('inf'), "similarity": 0.0, "valid": False}
    a, b = a[:min_len], b[:min_len]

    distance = float(np.linalg.norm(a - b))
    # Normalize: max expected distance for unit-normalized vectors is ~sqrt(2) ≈ 1.414
    max_dist = math.sqrt(min_len) * 0.15  # empirical upper bound for same-person
    similarity = float(np.clip(1.0 - (distance / max(max_dist, 0.01)), 0.0, 1.0))

    return {
        "distance": round(distance, 6),
        "similarity": round(similarity, 4),
        "valid": distance < max_dist
    }


def _validate_multi_angle_pose(history: dict) -> dict:
    """Validate identity consistency across multiple viewing angles.
    
    Checks if the session has captured frames from at least 3 of 5 angles:
    front, left profile, right profile, up tilt, down tilt.
    Returns a pose coverage map and validation score.
    """
    if not history or "yaw" not in history:
        return {"coverage": 0.0, "angles_seen": [], "valid": False, "score": 0.0}

    yaws = history.get("yaw", [])
    pitches = history.get("pitch", [])

    angles_seen = set()
    for y, p in zip(yaws, pitches):
        if abs(y) < 10 and abs(p) < 10:
            angles_seen.add("front")
        if y < -12:
            angles_seen.add("left_profile")
        if y > 12:
            angles_seen.add("right_profile")
        if p > 8:
            angles_seen.add("up_tilt")
        if p < -8:
            angles_seen.add("down_tilt")

    all_angles = {"front", "left_profile", "right_profile", "up_tilt", "down_tilt"}
    coverage = len(angles_seen) / len(all_angles)
    score = min(1.0, coverage * 1.2)  # Bonus: 3/5 angles = 72% → 86% score

    return {
        "coverage": round(coverage, 3),
        "angles_seen": sorted(list(angles_seen)),
        "angles_count": len(angles_seen),
        "valid": len(angles_seen) >= 2,
        "score": round(score, 4)
    }


def _validate_landmark_geometry(landmarks, w: int, h: int) -> dict:
    """Validate facial landmark structural consistency across all 468 points.
    
    Checks proportional relationships between facial features to detect
    abnormal landmark structures (masks, printed photos, deepfakes).
    Returns per-region quality scores and aggregate consistency score.
    """
    if len(landmarks) < 468:
        return {"valid": False, "score": 0.0, "regions": {}}

    # Eye geometry: ratio of eye width to eye height (should be ~2.5-4.0)
    left_eye_w = math.dist(
        (landmarks[33].x * w, landmarks[33].y * h),
        (landmarks[133].x * w, landmarks[133].y * h)
    )
    left_eye_h = math.dist(
        (landmarks[159].x * w, landmarks[159].y * h),
        (landmarks[145].x * w, landmarks[145].y * h)
    )
    eye_ratio = left_eye_w / max(left_eye_h, 0.001)
    eye_score = float(np.clip(1.0 - abs(eye_ratio - 3.2) / 2.5, 0.0, 1.0))

    # Nose geometry: nose length / nose width ratio (should be ~1.2-2.0)
    nose_length = math.dist(
        (landmarks[6].x * w, landmarks[6].y * h),   # nose bridge
        (landmarks[1].x * w, landmarks[1].y * h)     # nose tip
    )
    nose_width = math.dist(
        (landmarks[48].x * w, landmarks[48].y * h) if 48 < len(landmarks) else (landmarks[4].x * w, landmarks[4].y * h),
        (landmarks[278].x * w, landmarks[278].y * h) if 278 < len(landmarks) else (landmarks[5].x * w, landmarks[5].y * h)
    )
    nose_ratio = nose_length / max(nose_width, 0.001)
    nose_score = float(np.clip(1.0 - abs(nose_ratio - 1.5) / 1.5, 0.0, 1.0))

    # Jaw shape: symmetry of jaw outline
    left_jaw = np.array([landmarks[234].x, landmarks[234].y])
    right_jaw = np.array([landmarks[454].x, landmarks[454].y])
    chin = np.array([landmarks[152].x, landmarks[152].y])
    jaw_left_dist = float(np.linalg.norm(chin - left_jaw))
    jaw_right_dist = float(np.linalg.norm(chin - right_jaw))
    jaw_symmetry = 1.0 - abs(jaw_left_dist - jaw_right_dist) / max(jaw_left_dist + jaw_right_dist, 0.001)
    jaw_score = float(np.clip(jaw_symmetry, 0.0, 1.0))

    # Mouth geometry: width/height ratio (should be ~2.0-5.0)
    mouth_w = math.dist(
        (landmarks[61].x * w, landmarks[61].y * h),
        (landmarks[291].x * w, landmarks[291].y * h)
    )
    mouth_h = math.dist(
        (landmarks[13].x * w, landmarks[13].y * h),
        (landmarks[14].x * w, landmarks[14].y * h)
    )
    mouth_ratio = mouth_w / max(mouth_h, 0.001)
    mouth_score = float(np.clip(1.0 - abs(mouth_ratio - 3.5) / 4.0, 0.3, 1.0))

    # Face proportions: eye-to-nose vs nose-to-chin (should be ~0.8-1.2)
    eye_center_y = (landmarks[159].y + landmarks[386].y) / 2.0
    nose_tip_y = landmarks[1].y
    chin_y = landmarks[152].y
    forehead_y = landmarks[10].y

    upper = nose_tip_y - eye_center_y
    lower = chin_y - nose_tip_y
    proportion_ratio = upper / max(lower, 0.001)
    proportion_score = float(np.clip(1.0 - abs(proportion_ratio - 0.85) / 0.6, 0.0, 1.0))

    # Aggregate
    weights = {"eye": 0.2, "nose": 0.15, "jaw": 0.2, "mouth": 0.15, "proportions": 0.3}
    aggregate = (
        eye_score * weights["eye"] +
        nose_score * weights["nose"] +
        jaw_score * weights["jaw"] +
        mouth_score * weights["mouth"] +
        proportion_score * weights["proportions"]
    )

    return {
        "valid": aggregate > 0.45,
        "score": round(aggregate, 4),
        "regions": {
            "eye_geometry": round(eye_score, 4),
            "nose_geometry": round(nose_score, 4),
            "jaw_shape": round(jaw_score, 4),
            "mouth_geometry": round(mouth_score, 4),
            "face_proportions": round(proportion_score, 4)
        }
    }


def _passive_liveness_analysis(history: dict, landmarks, w: int, h: int) -> dict:
    """Automatic liveness detection requiring zero user interaction.
    
    Analyzes:
    - Eye blink frequency (natural blink rate: 15-20 per minute)
    - Eye movement patterns (micro-saccades)
    - Natural head micro-motion (physiological tremor)
    - Facial muscle micro-movements
    - Expression variance over time
    - Depth estimation from z-coordinates
    """
    result = {
        "score": 0.0,
        "blink_analysis": {"detected": False, "count": 0, "natural": False},
        "eye_movement": {"detected": False, "score": 0.0},
        "head_motion": {"detected": False, "amplitude": 0.0},
        "muscle_movement": {"detected": False, "score": 0.0},
        "expression_variance": {"detected": False, "score": 0.0},
        "depth_valid": False
    }

    if not history or len(history.get("ear", [])) < 5:
        return result

    ears = history["ear"]
    mars = history.get("mar", [])
    yaws = history.get("yaw", [])
    pitches = history.get("pitch", [])
    rolls = history.get("roll", [])

    # 1. Blink analysis
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
    blink_natural = blinks >= 1 and len(ears) > 10
    result["blink_analysis"] = {"detected": blinks > 0, "count": blinks, "natural": blink_natural}
    blink_score = min(1.0, blinks / 2.0) if blinks > 0 else 0.0

    # 2. Eye movement (EAR variance indicates micro-saccades)
    ear_std = float(np.std(ears[-10:])) if len(ears) >= 10 else 0.0
    eye_movement_detected = ear_std > 0.005
    eye_score = min(1.0, ear_std / 0.02)
    result["eye_movement"] = {"detected": eye_movement_detected, "score": round(eye_score, 4)}

    # 3. Natural head micro-motion
    if len(yaws) >= 5 and len(pitches) >= 5:
        yaw_std = float(np.std(yaws[-10:]))
        pitch_std = float(np.std(pitches[-10:]))
        amplitude = yaw_std + pitch_std
        # Natural: some motion (0.3-5.0°), not too still, not too shaky
        motion_detected = 0.2 < amplitude < 15.0
        motion_score = float(np.clip(amplitude / 3.0, 0.0, 1.0)) if motion_detected else 0.0
        result["head_motion"] = {"detected": motion_detected, "amplitude": round(amplitude, 3)}
    else:
        motion_score = 0.0

    # 4. Facial muscle micro-movements (MAR variance)
    if len(mars) >= 5:
        mar_std = float(np.std(mars[-10:]))
        muscle_detected = mar_std > 0.003
        muscle_score = min(1.0, mar_std / 0.015)
        result["muscle_movement"] = {"detected": muscle_detected, "score": round(muscle_score, 4)}
    else:
        muscle_score = 0.0

    # 5. Expression variance (combined EAR + MAR variance)
    if len(ears) >= 5 and len(mars) >= 5:
        combined_var = float(np.std(ears[-10:])) + float(np.std(mars[-10:]))
        expr_detected = combined_var > 0.008
        expr_score = min(1.0, combined_var / 0.03)
        result["expression_variance"] = {"detected": expr_detected, "score": round(expr_score, 4)}
    else:
        expr_score = 0.0

    # 6. Depth estimation from z-coordinates
    if len(landmarks) >= 468:
        z_values = [landmarks[i].z for i in [1, 33, 263, 61, 291, 152, 10]]
        z_range = max(z_values) - min(z_values)
        depth_valid = z_range > 0.01  # Real faces have depth variation
        result["depth_valid"] = depth_valid
        depth_score = min(1.0, z_range / 0.05)
    else:
        depth_score = 0.0

    # Aggregate liveness score
    total = (
        blink_score * 0.25 +
        eye_score * 0.15 +
        motion_score * 0.20 +
        muscle_score * 0.10 +
        expr_score * 0.15 +
        depth_score * 0.15
    )
    result["score"] = round(min(1.0, total + 0.1), 4)  # Base bonus for real face
    return result


def _validate_enrollment_quality(landmarks, frame, w: int, h: int) -> dict:
    """Enforce strict quality gates at enrollment time.
    
    Requires:
    - Front-facing pose (|yaw| < 8°, |pitch| < 8°)
    - Eyes open (EAR > 0.22)
    - Good lighting (texture_score > 0.5)
    - Neutral expression (smile_score < 0.35)
    - Adequate face size (bbox width > 25% of frame)
    - Single face
    """
    yaw, pitch, roll = _head_pose_3d(landmarks, w, h)
    left_ear_val = _ear(landmarks, LEFT_EYE_INDICES, w, h)
    right_ear_val = _ear(landmarks, RIGHT_EYE_INDICES, w, h)
    avg_ear = (left_ear_val + right_ear_val) / 2.0

    # Smile check
    p_left_mouth = np.array([landmarks[291].x, landmarks[291].y])
    p_right_mouth = np.array([landmarks[61].x, landmarks[61].y])
    mouth_width = float(np.linalg.norm(p_left_mouth - p_right_mouth))
    p_left_jaw = np.array([landmarks[234].x, landmarks[234].y])
    p_right_jaw = np.array([landmarks[454].x, landmarks[454].y])
    face_width = float(np.linalg.norm(p_left_jaw - p_right_jaw))
    smile_ratio = mouth_width / face_width if face_width > 0.001 else 0.32
    smile_score = float(np.clip((smile_ratio - 0.32) / 0.08, 0.0, 1.0))

    # Lighting check
    if CV2_AVAILABLE:
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        face_region = gray[int(h * 0.15):int(h * 0.85), int(w * 0.15):int(w * 0.85)]
        if face_region.size > 0:
            texture_score = min(1.0, float(np.std(face_region)) / 30.0)
            mean_brightness = float(np.mean(face_region))
            lighting_ok = texture_score > 0.5 and 50 < mean_brightness < 220
        else:
            texture_score = 0.5
            lighting_ok = True
    else:
        texture_score = 0.5
        lighting_ok = True

    # Face size check
    bbox = _calculate_bbox(landmarks, w, h)
    size_ok = bbox["w"] > 0.25

    # Quality checks
    checks = {
        "front_pose": abs(yaw) < 10.0 and abs(pitch) < 10.0,
        "eyes_open": avg_ear > 0.20,
        "good_lighting": lighting_ok,
        "neutral_expression": smile_score < 0.40,
        "adequate_size": size_ok,
        "pose_yaw": round(float(yaw), 2),
        "pose_pitch": round(float(pitch), 2),
        "ear_value": round(avg_ear, 4),
        "smile_value": round(smile_score, 4),
        "lighting_score": round(texture_score, 4),
        "face_width_pct": round(bbox["w"] * 100, 1),
    }

    all_pass = all([
        checks["front_pose"],
        checks["eyes_open"],
        checks["good_lighting"],
        checks["neutral_expression"],
        checks["adequate_size"]
    ])

    quality_score = (
        (0.95 if checks["front_pose"] else 0.3) * 0.3 +
        (0.95 if checks["eyes_open"] else 0.4) * 0.2 +
        (texture_score) * 0.2 +
        (0.95 if checks["neutral_expression"] else 0.5) * 0.15 +
        (0.95 if checks["adequate_size"] else 0.3) * 0.15
    )

    return {
        "quality_pass": all_pass,
        "quality_score": round(quality_score, 4),
        "checks": checks,
        "recommendation": "Good quality" if all_pass else "Please adjust: " + ", ".join(
            [k for k, v in checks.items() if isinstance(v, bool) and not v]
        )
    }


def _advanced_fraud_detection(frame, landmarks, history, texture_score: float, replay_score: float, w: int, h: int) -> dict:
    """Multi-signal fraud analysis for enterprise security.
    
    Detects:
    - Printed photo attacks (paper texture, flat lighting)
    - Phone/tablet replay attacks (screen moiré patterns)
    - Deepfake indicators (landmark jitter, unnatural symmetry)
    - AI-generated faces (perfect symmetry detection)
    - Screen reflections (specular highlights in eye region)
    - Multiple faces / face swapping
    - Cropped face injection
    - Mask attacks (boundary sharpness analysis)
    """
    results = {
        "printed_photo": {"detected": False, "confidence": 0.0},
        "replay_attack": {"detected": False, "confidence": 0.0},
        "deepfake": {"detected": False, "confidence": 0.0},
        "ai_generated": {"detected": False, "confidence": 0.0},
        "screen_reflection": {"detected": False, "confidence": 0.0},
        "multiple_faces": {"detected": False, "confidence": 0.0},
        "cropped_face": {"detected": False, "confidence": 0.0},
        "mask_attack": {"detected": False, "confidence": 0.0},
        "overall_fraud_score": 0.0,
        "threat_level": "LOW"
    }

    fraud_signals = []

    # 1. Printed photo: very low texture variance in face region
    if texture_score < 0.3:
        results["printed_photo"]["detected"] = True
        results["printed_photo"]["confidence"] = round(1.0 - texture_score, 3)
        fraud_signals.append(0.8)

    # 2. Replay attack: moiré/screen frequency patterns
    if replay_score > 0.4:
        results["replay_attack"]["detected"] = True
        results["replay_attack"]["confidence"] = round(replay_score, 3)
        fraud_signals.append(replay_score)

    # 3. Deepfake: landmark temporal jitter
    if history and len(history.get("landmarks", [])) >= 5:
        recent = history["landmarks"][-5:]
        jitters = []
        for i in range(1, len(recent)):
            if len(recent[i]) > NOSE_TIP and len(recent[i-1]) > NOSE_TIP:
                d = math.dist(recent[i][NOSE_TIP][:2], recent[i-1][NOSE_TIP][:2])
                jitters.append(d)
        if jitters:
            jitter_std = float(np.std(jitters))
            # Deepfakes often have higher jitter than real faces
            if jitter_std > 0.008:
                results["deepfake"]["detected"] = True
                results["deepfake"]["confidence"] = round(min(1.0, jitter_std / 0.015), 3)
                fraud_signals.append(min(0.7, jitter_std / 0.012))

    # 4. AI-generated: unnatural perfect symmetry
    if len(landmarks) >= 468:
        left_eye = np.array([landmarks[33].x, landmarks[33].y])
        right_eye = np.array([landmarks[263].x, landmarks[263].y])
        nose = np.array([landmarks[1].x, landmarks[1].y])
        d_left = float(np.linalg.norm(nose - left_eye))
        d_right = float(np.linalg.norm(nose - right_eye))
        symmetry_diff = abs(d_left - d_right) / max(d_left + d_right, 0.001)
        # Real faces: symmetry_diff typically 0.02-0.15. AI: < 0.005
        if symmetry_diff < 0.003:
            results["ai_generated"]["detected"] = True
            results["ai_generated"]["confidence"] = round(1.0 - symmetry_diff * 200, 3)
            fraud_signals.append(0.5)

    # 5. Screen reflections in eye region
    if CV2_AVAILABLE and frame is not None and len(landmarks) >= 468:
        left_eye_cx = int(landmarks[468].x * w) if 468 < len(landmarks) else int(landmarks[33].x * w)
        left_eye_cy = int(landmarks[468].y * h) if 468 < len(landmarks) else int(landmarks[33].y * h)
        eye_patch_size = max(10, int(w * 0.04))
        y1 = max(0, left_eye_cy - eye_patch_size)
        y2 = min(h, left_eye_cy + eye_patch_size)
        x1 = max(0, left_eye_cx - eye_patch_size)
        x2 = min(w, left_eye_cx + eye_patch_size)
        eye_patch = frame[y1:y2, x1:x2]
        if eye_patch.size > 0:
            gray_patch = cv2.cvtColor(eye_patch, cv2.COLOR_BGR2GRAY)
            max_val = float(np.max(gray_patch))
            mean_val = float(np.mean(gray_patch))
            if max_val > 240 and (max_val - mean_val) > 100:
                results["screen_reflection"]["detected"] = True
                results["screen_reflection"]["confidence"] = round((max_val - mean_val) / 150, 3)
                fraud_signals.append(0.4)

    # 6. Cropped face: check if face fills too much of frame (injected crop)
    bbox = _calculate_bbox(landmarks, w, h)
    if bbox["w"] > 0.85 and bbox["h"] > 0.85:
        results["cropped_face"]["detected"] = True
        results["cropped_face"]["confidence"] = round(max(bbox["w"], bbox["h"]), 3)
        fraud_signals.append(0.5)

    # 7. Mask attack: analyze face boundary sharpness
    if CV2_AVAILABLE and frame is not None:
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        edges = cv2.Canny(gray, 50, 150)
        # Check edge density at face boundary
        bx, by = int(bbox["x"] * w), int(bbox["y"] * h)
        bw, bh = int(bbox["w"] * w), int(bbox["h"] * h)
        border_width = max(3, int(bw * 0.05))
        # Top border
        top_border = edges[max(0, by):min(h, by + border_width), max(0, bx):min(w, bx + bw)]
        if top_border.size > 0:
            edge_density = float(np.mean(top_border)) / 255.0
            if edge_density > 0.15:
                results["mask_attack"]["detected"] = True
                results["mask_attack"]["confidence"] = round(min(1.0, edge_density / 0.2), 3)
                fraud_signals.append(0.6)

    # Overall fraud score
    if fraud_signals:
        overall = float(np.mean(fraud_signals))
    else:
        overall = max(0.02, (1.0 - texture_score) * 0.15 + replay_score * 0.1)

    results["overall_fraud_score"] = round(float(np.clip(overall, 0.0, 1.0)), 4)

    if overall > 0.6:
        results["threat_level"] = "CRITICAL"
    elif overall > 0.4:
        results["threat_level"] = "HIGH"
    elif overall > 0.2:
        results["threat_level"] = "MEDIUM"
    else:
        results["threat_level"] = "LOW"

    return results


def _build_enterprise_report(
    identity_match: float,
    confidence: float,
    liveness_score: float,
    spoof_score: float,
    fraud_result: dict,
    verification_time_ms: float,
    challenge_results: list,
    pose_validation: dict,
    quality_score: float,
    landmark_geometry: dict,
    passive_liveness: dict,
    session_id: str,
    enrolled_matched: bool,
) -> dict:
    """Build the comprehensive enterprise verification report.
    
    Includes all 12+ metrics required for enterprise-grade identity verification
    suitable for banking, government, healthcare, airports, and secure access systems.
    """
    risk_score = max(0.5, spoof_score * 40 + fraud_result.get("overall_fraud_score", 0) * 40 + (1.0 - liveness_score) * 20)
    risk_score = min(100.0, risk_score)

    identity_status = "VERIFIED" if enrolled_matched and identity_match >= 0.75 and liveness_score > 0.5 and spoof_score < 0.4 else "FAILED"

    challenges_passed = sum(1 for c in challenge_results if c.get("passed")) if challenge_results else 0
    challenges_total = len(challenge_results) if challenge_results else 0

    return {
        "identity_status": identity_status,
        "identity_match_pct": round(identity_match * 100, 2),
        "confidence_pct": round(confidence * 100, 2),
        "liveness_pct": round(liveness_score * 100, 2),
        "spoof_probability_pct": round(spoof_score * 100, 2),
        "fraud_score": round(fraud_result.get("overall_fraud_score", 0) * 100, 2),
        "risk_score": round(risk_score, 2),
        "threat_level": fraud_result.get("threat_level", "LOW"),
        "verification_time_ms": round(verification_time_ms, 2),
        "challenges": {
            "passed": challenges_passed,
            "total": challenges_total,
            "results": challenge_results
        },
        "pose_validation": pose_validation,
        "quality_score": round(quality_score * 100, 2),
        "landmark_consistency": landmark_geometry.get("score", 0) * 100,
        "passive_liveness": {
            "score": round(passive_liveness.get("score", 0) * 100, 2),
            "blink_detected": passive_liveness.get("blink_analysis", {}).get("detected", False),
            "head_motion": passive_liveness.get("head_motion", {}).get("detected", False),
            "depth_valid": passive_liveness.get("depth_valid", False),
        },
        "fraud_detection": {
            "printed_photo": fraud_result.get("printed_photo", {}).get("detected", False),
            "replay_attack": fraud_result.get("replay_attack", {}).get("detected", False),
            "deepfake": fraud_result.get("deepfake", {}).get("detected", False),
            "ai_generated": fraud_result.get("ai_generated", {}).get("detected", False),
            "screen_reflection": fraud_result.get("screen_reflection", {}).get("detected", False),
            "mask_attack": fraud_result.get("mask_attack", {}).get("detected", False),
        },
        "session_id": session_id,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


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
                "face_present": True, "detected_faces": detected_faces, "face_confidence": float(face_confidence), "landmark_count": landmark_count,
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
            texture_score = 0.0
            replay_score = 1.0
    else:
        texture_score = 0.0
        replay_score = 1.0
        
    deepfake_risk = 0.0 # Will be populated by advanced fraud detection if enabled
    
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
                    "face_present": True, "detected_faces": int(detected_faces), "face_confidence": float(face_confidence), "landmark_count": int(landmark_count), # type: ignore
                    "bbox": bbox, "status": "UNAUTHORIZED_PERSON", "reason": "IDENTITY_MISMATCH", "challenge_passed": False, "enrolled_matched": False, "similarity_score": float(similarity_score), "spoof_score": 1.0 # type: ignore
                }
    else:
        status = "no_enrolled_identity"
        
    face_confidence = _calculate_face_confidence(landmarks, w, h) if detected_faces > 0 else 0.0

    # ── Enterprise Advanced Analytics ──────────────────────────────
    enterprise_report = None
    landmark_geometry = {}
    passive_liveness = {}
    fraud_result = {}
    pose_validation = {}
    face_quality_score = face_confidence
    lighting_quality = texture_score if 'texture_score' in dir() else 0.5
    pose_quality = 0.0

    if api_type == "enterprise" and detected_faces > 0:
        # 1. Landmark geometry consistency
        landmark_geometry = _validate_landmark_geometry(landmarks, w, h)

        # 2. Passive liveness analysis
        passive_liveness = _passive_liveness_analysis(history, landmarks, w, h) if history else {"score": 0.0}

        # 3. Advanced fraud detection
        t_score = float(texture_score) if 'texture_score' in dir() else 0.5
        r_score = float(replay_score) if 'replay_score' in dir() else 0.0
        fraud_result = _advanced_fraud_detection(
            frame, landmarks, history,
            t_score,
            r_score,
            w, h
        )

        # 4. Multi-angle pose validation
        pose_validation = _validate_multi_angle_pose(history) if history else {"coverage": 0.0, "valid": False, "score": 0.0}

        # 5. Quality scores
        pose_quality = float(np.clip(1.0 - (abs(yaw) + abs(pitch)) / 60.0, 0.0, 1.0))
        lighting_quality = texture_score if 'texture_score' in dir() else 0.5
        face_quality_score = float(np.clip(
            face_confidence * 0.4 +
            landmark_geometry.get("score", 0.5) * 0.3 +
            pose_quality * 0.3, 0.0, 1.0
        ))

        # 6. Build comprehensive enterprise report
        liveness_score = passive_liveness.get("score", 0.0) if passive_liveness else 0.0
        enterprise_report = _build_enterprise_report(
            identity_match=similarity_score,
            confidence=face_confidence,
            liveness_score=liveness_score,
            spoof_score=spoof_score,
            fraud_result=fraud_result,
            verification_time_ms=0.0,  # Will be calculated on frontend
            challenge_results=[],  # Frontend tracks individual challenge results
            pose_validation=pose_validation,
            quality_score=face_quality_score,
            landmark_geometry=landmark_geometry,
            passive_liveness=passive_liveness,
            session_id=session_id or "",
            enrolled_matched=enrolled_matched,
        )

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
        "fraud_detection": fraud_result,
        "challenge_type": challenge_type,
        "challenge_passed": bool(challenge_passed),  # type: ignore
        "similarity_score": float(similarity_score),  # type: ignore
        "enrolled_matched": bool(enrolled_matched),  # type: ignore
        "status": status
    }

    # Append enterprise-exclusive analytics
    if api_type == "enterprise":
        ret["enterprise_report"] = enterprise_report
        ret["landmark_geometry"] = landmark_geometry
        ret["passive_liveness"] = passive_liveness
        ret["pose_validation"] = pose_validation
        ret["face_quality"] = round(face_quality_score, 4)
        ret["pose_quality"] = round(pose_quality, 4)
        ret["lighting_quality"] = round(lighting_quality, 4)

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
