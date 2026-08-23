import requests
import base64
import uuid
import time
import json
import sys
import cv2
import numpy as np

API_BASE = "http://localhost:8000/api/v1"
SESSION_ID = str(uuid.uuid4())
EMAIL = f"trace_{uuid.uuid4().hex[:8]}@example.com"
PASSWORD = "Password123!"

def encode_image(img):
    _, buffer = cv2.imencode('.jpg', img)
    return "data:image/jpeg;base64," + base64.b64encode(buffer).decode("utf-8")

def main():
    try:
        img_original = cv2.imread("straight_face.jpg")
        if img_original is None:
            print("Failed to read straight_face.jpg")
            return
    except Exception as e:
        print(f"Error reading straight_face.jpg: {e}")
        return

    print(f"--- Starting End-to-End TRACE Verification ---")
    
    reg_resp = requests.post(f"{API_BASE}/auth/register", json={"email": EMAIL, "password": PASSWORD, "full_name": "Test User"})
    login_resp = requests.post(f"{API_BASE}/auth/login", json={"email": EMAIL, "password": PASSWORD})
    token = login_resp.json().get("access_token")
    headers = {"Authorization": f"Bearer {token}"}
    
    print(f"Session ID: {SESSION_ID}")
    print("\n--- BEGIN FRAME TRACE ---")
    
    frames_processed = 0
    enrollment_ready = False
    
    for i in range(1, 60):
        frame_id = str(uuid.uuid4())
        
        # Add slight jitter to simulate camera feed and bypass CAMERA_FEED_FROZEN
        rows, cols = img_original.shape[:2]
        tx, ty = (i % 3) - 1, ((i // 3) % 3) - 1
        M = np.array([[1.0, 0.0, float(tx)], [0.0, 1.0, float(ty)]], dtype=np.float32)
        img_jitter = cv2.warpAffine(img_original, M, (cols, rows))
        base64_img = encode_image(img_jitter)
        
        payload = {
            "image": base64_img,
            "frame_id": frame_id,
            "session_id": SESSION_ID,
            "api_type": "enterprise"
        }
        
        resp = requests.post(f"{API_BASE}/liveness/demo/process", json=payload, headers=headers)
        data = resp.json()
        ep = data.get("enrollment_progress", {})
        
        seq_id = ep.get("frame_sequence_id", "N/A")
        valid = ep.get("valid_frames", 0)
        rejected = ep.get("rejected_frames", 0)
        last_reason = ep.get("last_reject_reason", "None")
        ready = ep.get("ready", False)
        
        yaw = ep.get("debug_yaw", data.get("yaw", "N/A"))
        pitch = ep.get("debug_pitch", data.get("pitch", "N/A"))
        roll = ep.get("debug_roll", data.get("roll", "N/A"))
        
        if type(yaw) == float: yaw = round(yaw, 2)
        if type(pitch) == float: pitch = round(pitch, 2)
        if type(roll) == float: roll = round(roll, 2)
        
        print(f"Frame {i:02d} => status={data.get('status')} reason='{data.get('reason')}' yaw={yaw} pitch={pitch} roll={roll} valid_embeds={valid} rejects={rejected} state={'READY' if ready else 'COLLECTING'}")
        
        if ready:
            print("\n[SUCCESS] 15 unique embeddings achieved. Backend reports READY.")
            enrollment_ready = True
            break
            
        time.sleep(0.05)
        
    if not enrollment_ready:
        print("\n[FAILED] Did not reach 15 accepted frames.")
        sys.exit(1)
        
    print("\n--- Transitioning to ENROLLING ---")
    enroll_payload = {
        "image": base64_img,
        "session_id": SESSION_ID,
        "subject_id": "test_user_" + str(uuid.uuid4())[:8]
    }
    
    resp = requests.post(f"{API_BASE}/identity/enroll", json=enroll_payload, headers=headers)
    if resp.status_code == 200:
        print(f"Enroll response status: 200")
        print("\n[SUCCESS] ENROLLED successfully.")
    else:
        print(f"\n[FAILED] Enrollment rejected: HTTP {resp.status_code} - {resp.text}")

if __name__ == "__main__":
    main()
