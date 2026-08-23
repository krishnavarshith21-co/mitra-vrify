import requests
import base64
import uuid
import time
import json
import sys

API_BASE = "http://localhost:8000/api/v1"
SESSION_ID = str(uuid.uuid4())
EMAIL = f"test_{uuid.uuid4().hex[:8]}@example.com"
PASSWORD = "Password123!"

from PIL import Image
import io

def encode_image(image_path):
    with open(image_path, "rb") as f:
        return "data:image/jpeg;base64," + base64.b64encode(f.read()).decode("utf-8")

def main():
    try:
        base64_img = encode_image("face.jpg")
    except Exception as e:
        print(f"Error reading face.jpg: {e}")
        return

    print(f"--- Starting End-to-End Verification ---")
    
    # 0. Register and Login
    print(f"Registering user {EMAIL}...")
    reg_resp = requests.post(f"{API_BASE}/auth/register", json={"email": EMAIL, "password": PASSWORD, "full_name": "Test User"})
    if reg_resp.status_code not in (200, 201):
        print(f"Failed to register: {reg_resp.text}")
        sys.exit(1)
        
    print(f"Logging in...")
    login_resp = requests.post(f"{API_BASE}/auth/login", json={"email": EMAIL, "password": PASSWORD})
    if login_resp.status_code != 200:
        print(f"Failed to login: {login_resp.text}")
        sys.exit(1)
        
    token = login_resp.json().get("access_token")
    headers = {"Authorization": f"Bearer {token}"}
    
    print(f"Session ID: {SESSION_ID}")
    
    # 1. Feed frames until 15 high-quality frames are gathered
    frames_processed = 0
    enrollment_ready = False
    
    for i in range(1, 60):
        frame_id = str(uuid.uuid4())
        payload = {
            "image": base64_img,
            "frame_id": frame_id,
            "session_id": SESSION_ID,
            "api_type": "enterprise"
        }
        
        try:
            resp = requests.post(f"{API_BASE}/liveness/demo/process", json=payload, headers=headers)
            if resp.status_code != 200:
                print(f"Frame {i} HTTP {resp.status_code}: {resp.text}")
                sys.exit(1)
        except Exception as e:
            print(f"Exception during request for frame {i}: {e}")
            sys.exit(1)
            
        data = resp.json()
        if i == 1:
            data_clean = {k: v for k, v in data.items() if k not in ["landmarks", "enterprise_report", "enrollment_progress"]}
            print(f"Raw response 1: {json.dumps(data_clean, indent=2)}")
            
        frames_processed += 1
        
        ep = data.get("enrollment_progress", {})
        
        seq_id = ep.get("frame_sequence_id")
        valid = ep.get("valid_frames")
        rejected = ep.get("rejected_frames")
        last_reason = ep.get("last_reject_reason")
        ready = ep.get("ready")
        
        print(f"Frame {i:02d} => sequence_id={seq_id}, session_id={SESSION_ID}, accepted_frames={valid}, rejected_frames={rejected}, last_reason={last_reason}, ready={ready}")
        
        if ready:
            print("\n[SUCCESS] 15 unique embeddings achieved. Backend reports READY.")
            enrollment_ready = True
            break
            
        time.sleep(0.1) # Simulate 10fps
        
    if not enrollment_ready:
        print("\n[FAILED] Did not reach 15 accepted frames.")
        sys.exit(1)
        
    # 2. Call identity/enroll
    print("\n--- Transitioning to ENROLLING ---")
    enroll_payload = {
        "image": base64_img,
        "session_id": SESSION_ID,
        "subject_id": "test_user_" + str(uuid.uuid4())[:8]
    }
    
    try:
        resp = requests.post(f"{API_BASE}/identity/enroll", json=enroll_payload, headers=headers)
        print(f"Enroll response status: {resp.status_code}")
        
        if resp.status_code == 200:
            print(f"Enroll response body: {json.dumps(resp.json(), indent=2)}")
            print("\n[SUCCESS] ENROLLED successfully.")
        else:
            print(f"Enroll error body: {resp.text}")
            print("\n[FAILED] Enrollment rejected.")
    except Exception as e:
        print(f"Exception during /identity/enroll: {e}")

if __name__ == "__main__":
    main()
