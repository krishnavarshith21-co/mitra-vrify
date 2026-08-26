import base64
import time
import uuid
import cv2
import numpy as np
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)
BASE_URL = "/api/v1"

def get_base64_image(img_path="straight_face.jpg"):
    img = cv2.imread(img_path)
    if img is None:
        raise ValueError("Image not found")
    img = cv2.resize(img, (640, 640))
    _, buffer = cv2.imencode('.jpg', img)
    return f"data:image/jpeg;base64,{base64.b64encode(buffer).decode('utf-8')}"

def test_trace():
    print("\n--- STARTING TRACE ---")
    session_id = f"trace_{uuid.uuid4().hex[:8]}"
    print(f"Session ID: {session_id}")
    
    # 1. Start session
    res = client.post(f"{BASE_URL}/liveness/session/start", json={"api_type": "enterprise", "session_id": session_id})
    assert res.status_code == 200
    
    # 2. Register & Login
    auth_payload = {"email": f"trace_{uuid.uuid4().hex[:8]}@example.com", "password": "password123", "full_name": "Test User"}
    client.post(f"{BASE_URL}/auth/register", json=auth_payload)
    login_res = client.post(f"{BASE_URL}/auth/login", json=auth_payload)
    token = login_res.json().get("access_token")
    headers = {"Authorization": f"Bearer {token}"}

    # 3. Simulate Enrollment
    b64_image = get_base64_image()
    
    from app.services.cv.mediapipe_engine import SESSION_CACHE, _calculate_face_embedding, global_face_mesh, b64_to_numpy
    frame = b64_to_numpy(b64_image)
    results = global_face_mesh.process(frame)
    real_embedding = _calculate_face_embedding(frame, results.multi_face_landmarks[0])
    
    SESSION_CACHE[session_id] = {
        "frame_count": 15,
        "valid_frames": 15,
        "rejected_frames": 0,
        "pose_coverage": {"Front", "Left 15", "Right 15", "Up", "Down"},
        "expression_coverage": {"Neutral", "Smile"},
        "enrollment_embeddings": [real_embedding] * 15,
        "stage": "ENROLLMENT",
        "baseline_eyebrow_ratio": 0.0,
        "baseline_smile_ratio": 0.0,
        "enrollment_last_capture": 0,
        "frames": []
    }
    
    enroll_payload = {"image": b64_image, "session_id": session_id, "api_type": "enterprise", "subject_id": "test_trace"}
    client.post(f"{BASE_URL}/identity/enroll", json=enroll_payload, headers=headers)
    
    print(f"[TRACE] ENROLLMENT Complete. Cache stage: {SESSION_CACHE[session_id]['stage']}")
    
    def process_frame(challenge_type=None):
        payload = {
            "image": b64_image,
            "session_id": session_id,
            "api_type": "enterprise",
            "challenge_type": challenge_type
        }
        res = client.post(f"{BASE_URL}/liveness/demo/process", json=payload)
        return res.json()
    
    # Send frames until IDENTITY_VERIFIED
    for i in range(5):
        data = process_frame(None)
        state = data.get("enrollment_progress", {}).get("state")
        sim = data.get("similarity_score")
        print(f"[TRACE] Frame {i} (No challenge) -> stage: {state} | sim: {sim} | enrolled_matched: {data.get('enrolled_matched')}")
        if state == "IDENTITY_VERIFIED":
            break
            
    print("[TRACE] Waiting 1.6s to trigger LIVENESS_CHALLENGES transition...")
    time.sleep(1.6)
    
    data = process_frame(None)
    state = data.get("enrollment_progress", {}).get("state")
    print(f"[TRACE] Frame (No challenge) -> stage: {state}")
    
    # Send liveness_verified challenge (simulating all challenges passed)
    data = process_frame("liveness_verified")
    state = data.get("enrollment_progress", {}).get("state")
    print(f"[TRACE] Frame (challenge=liveness_verified) -> stage: {state} | spoof_score: {data.get('spoof_score')} | is_secure_checked: True")
    
    print("[TRACE] Waiting 2.1s for auto-transition to CONTINUOUS_MONITORING...")
    time.sleep(2.1)
    
    data = process_frame(None)
    state = data.get("enrollment_progress", {}).get("state")
    print(f"[TRACE] Frame (No challenge) -> stage: {state}")

if __name__ == "__main__":
    test_trace()
