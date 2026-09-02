import pytest
from fastapi.testclient import TestClient
from app.main import app
import time
import os
import uuid

import base64
import cv2
import numpy as np

client = TestClient(app)

def _mutate_image(img_b64: str, seed: int) -> str:
    # Decode base64 to numpy array
    img_data = base64.b64decode(img_b64)
    nparr = np.frombuffer(img_data, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    if img is not None:
        # Jitter the image by a few pixels to simulate natural motion
        # This prevents the static photo anti-spoofing check from failing the enrollment test
        dx = (seed % 5) - 2
        dy = ((seed // 5) % 5) - 2
        M = np.array([[1, 0, dx], [0, 1, dy]], dtype=np.float32)
        shifted = cv2.warpAffine(img, M, (img.shape[1], img.shape[0]))
        _, buffer = cv2.imencode('.jpg', shifted)
        return base64.b64encode(buffer).decode('utf-8')
    return img_b64

@pytest.fixture(scope="module")
def valid_face_b64():
    base_dir = os.path.dirname(os.path.dirname(__file__))
    file_path = os.path.join(base_dir, "straight_face.jpg")
    if os.path.exists(file_path):
        with open(file_path, "rb") as f:
            return base64.b64encode(f.read()).decode("utf-8")
    return "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==" # 1x1 transparent png fallback

def enroll_user(face_b64: str) -> str:
    res = client.post("/api/v1/liveness/session/start", json={"api_type": "enterprise"})
    assert res.status_code == 200
    session_id = res.json()["session_id"]
    
    import unittest.mock as mock
    
    pose_angles = [
        (0.0, 0.0, 0.0),    # Front
        (0.0, 25.0, 0.0),   # Left 15+
        (0.0, -25.0, 0.0),  # Right 15+
        (15.0, 0.0, 0.0),   # Up
        (-15.0, 0.0, 0.0),  # Down
    ]
    
    expr_features = [
        (0.30, 0.0),  # Neutral
        (0.30, 0.06), # Smile (mar > 0.05, ear > 0.25)
        (0.30, 0.0),
        (0.30, 0.06),
        (0.30, 0.0)
    ]
    
    state = {"head_pose_idx": 0, "mar_idx": 0, "smile_idx": 0}
    
    def mock_head_pose_3d(*args, **kwargs):
        angles = pose_angles[state["head_pose_idx"] % len(pose_angles)]
        state["head_pose_idx"] += 1
        return angles[1], angles[0], angles[2]

    def mock_ear(*args, **kwargs):
        return 0.30

    def mock_mar(*args, **kwargs):
        val = 0.0 if (state["mar_idx"] % 2 == 0) else 0.06
        state["mar_idx"] += 1
        return val

    def mock_smile_score(*args, **kwargs):
        val = 0.2 if (state["smile_idx"] % 2 == 0) else 0.5
        state["smile_idx"] += 1
        return val

    with mock.patch("app.services.cv.mediapipe_engine._head_pose_3d", side_effect=mock_head_pose_3d), \
         mock.patch("app.services.cv.mediapipe_engine._ear", side_effect=mock_ear), \
         mock.patch("app.services.cv.mediapipe_engine._mar", side_effect=mock_mar), \
         mock.patch("app.services.cv.mediapipe_engine._calculate_smile_score", side_effect=mock_smile_score):
        # Process up to 60 frames for enrollment
        for i in range(60):
            mutated_b64 = _mutate_image(face_b64, i)
            res = client.post("/api/v1/liveness/demo/process", json={
                "image": f"data:image/jpeg;base64,{mutated_b64}",
                "session_id": session_id,
                "api_type": "enterprise"
            })
            data = res.json()
            if data.get("enrollment_progress", {}).get("state") == "READY":
                return session_id
            time.sleep(0.01)
    
    assert data.get("enrollment_progress", {}).get("state") == "READY", "Failed to enroll"
    return session_id

def test_camera_freeze_detection(valid_face_b64):
    """Test that submitting the exact same frame 30 times causes CAMERA_FREEZE"""
    session_id = enroll_user(valid_face_b64)
    
    for i in range(30):
        res = client.post("/api/v1/liveness/demo/process", json={
            "image": f"data:image/jpeg;base64,{valid_face_b64}",
            "session_id": session_id,
            "api_type": "enterprise"
        })
        assert res.status_code == 200
        data = res.json()
        
    assert data["status"] == "SESSION_TERMINATED"
    assert data["reason"] in ["CAMERA_FREEZE", "CAMERA_FEED_FROZEN", "SPOOF_DETECTED"]
    
def test_post_termination_rejection(valid_face_b64):
    """Test that once a session is terminated, it cannot be revived by valid frames."""
    session_id = enroll_user(valid_face_b64)
    
    # Force camera freeze to terminate session
    for _ in range(30):
        res = client.post("/api/v1/liveness/demo/process", json={
            "image": f"data:image/jpeg;base64,{valid_face_b64}",
            "session_id": session_id,
            "api_type": "enterprise"
        })
    
    # Try sending a new, modified frame
    modified_face = valid_face_b64[:-2] + "AA"
    res = client.post("/api/v1/liveness/demo/process", json={
        "image": f"data:image/jpeg;base64,{modified_face}",
        "session_id": session_id,
        "api_type": "enterprise"
    })
    data = res.json()
    assert data["status"] == "SESSION_TERMINATED"
    
def test_face_lost_termination(valid_face_b64):
    """Test that Face Lost for 30 frames terminates the session."""
    session_id = enroll_user(valid_face_b64)
    
    # Send frames with no face (1x1 transparent png)
    empty_face = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg=="
    for i in range(30):
        res = client.post("/api/v1/liveness/demo/process", json={
            "image": f"data:image/png;base64,{empty_face}",
            "session_id": session_id,
            "api_type": "enterprise"
        })
        data = res.json()
        
    assert data["status"] == "SESSION_TERMINATED"
    reason = data.get("reason", "")
    assert "security failure" in reason or "Face was lost" in reason or reason == "FACE_LOST"

def test_challenge_count(valid_face_b64):
    """Ensure exactly 3 random challenges are generated (plus FACE_CENTERED)."""
    res = client.post("/api/v1/liveness/session/start", json={"api_type": "enterprise"})
    assert res.status_code == 200
    data = res.json()
    assert len(data.get("challenges", [])) == 4  # 3 random + 1 FACE_CENTERED
