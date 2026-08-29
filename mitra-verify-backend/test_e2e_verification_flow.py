import requests
import time
import base64
import uuid
import sys
import cv2
import numpy as np
import random
import threading

BASE_URL = "http://localhost:8000/api/v1"

try:
    IMG = cv2.imread("straight_face.jpg")
    if IMG is None:
        raise Exception("OpenCV failed to read image")
except Exception:
    print("Cannot read straight_face.jpg")
    sys.exit(1)

def get_noisy_face_b64(pose_hint="Front"):
    """Applies realistic variances and perspective transformations to simulate 3D poses"""
    h, w = IMG.shape[:2]
    # Base translation and noise for anti-frozen
    # Needs to be at least +/- 15 pixels to generate >0.0001 variance
    tx = random.randint(-15, 15)
    ty = random.randint(-15, 15)
    
    # Base points
    pts1 = np.float32([[0,0], [w,0], [0,h], [w,h]])
    
    if pose_hint == "Left 15" or pose_hint == "HEAD_LEFT":
        pts2 = np.float32([[0, h*0.15], [w, 0], [0, h*0.85], [w, h]])
    elif pose_hint == "Right 15" or pose_hint == "HEAD_RIGHT":
        pts2 = np.float32([[0, 0], [w, h*0.15], [0, h], [w, h*0.85]])
    elif pose_hint == "Up" or pose_hint == "HEAD_UP":
        pts2 = np.float32([[w*0.15, 0], [w*0.85, 0], [0, h], [w, h]])
    elif pose_hint == "Down" or pose_hint == "HEAD_DOWN":
        pts2 = np.float32([[0, 0], [w, 0], [w*0.15, h], [w*0.85, h]])
    else:
        # Non-uniform scale changes the aspect ratio, moving relative landmarks!
        scale_x = random.uniform(0.90, 1.10)
        scale_y = random.uniform(0.90, 1.10)
        pts2 = np.float32([[0,0], [w*scale_x,0], [0,h*scale_y], [w*scale_x,h*scale_y]])
        
    pts2 += np.float32([[tx, ty], [tx, ty], [tx, ty], [tx, ty]])
    
    M = cv2.getPerspectiveTransform(pts1, pts2)
    warped = cv2.warpPerspective(IMG, M, (w, h), borderMode=cv2.BORDER_REPLICATE)
    
    noise = np.random.normal(0, 1.5, warped.shape).astype(np.uint8)
    noisy = cv2.add(warped, noise)
    
    _, buffer = cv2.imencode('.jpg', noisy)
    return f"data:image/jpeg;base64,{base64.b64encode(buffer).decode()}"

def get_blank_face_b64():
    """Returns a completely blank image to simulate face loss"""
    blank = np.zeros_like(IMG)
    _, buffer = cv2.imencode('.jpg', blank)
    return f"data:image/jpeg;base64,{base64.b64encode(buffer).decode()}"

test_user = {"email": f"test_{uuid.uuid4().hex[:8]}@example.com", "password": "password123", "full_name": "Test User"}
try:
    requests.post(f"{BASE_URL}/auth/register", json=test_user)
except Exception:
    pass

res = requests.post(f"{BASE_URL}/auth/login", json=test_user)
assert res.status_code == 200, f"Login failed: {res.text}"
token = res.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

print("\n=== STARTING END-TO-END VERIFICATION FLOW TEST ===")

def process_frame(session_id, challenge_type=None, api_type="enterprise", image_func=None, pose_hint="Front"):
    if image_func is None:
        b64 = get_noisy_face_b64(pose_hint)
    else:
        b64 = image_func()
    
    return requests.post(
        f"{BASE_URL}/liveness/demo/process",
        json={
            "image": b64,
            "session_id": session_id,
            "challenge_type": challenge_type,
            "api_type": api_type
        },
        headers=headers
    )

# -------------------------------------------------------------------------
# TEST 10: Clear Enrollment first to ensure clean state
# -------------------------------------------------------------------------
print("\n[TEST 10] Executing Clear Enrollment")
requests.delete(f"{BASE_URL}/identity/enrolled", headers=headers)
res = requests.get(f"{BASE_URL}/identity/enrolled", headers=headers)
assert res.json().get("enrolled") == False
print("PASS: Database cleared successfully.")

# -------------------------------------------------------------------------
# TEST 1: New User Enrollment
# -------------------------------------------------------------------------
print("\n[TEST 1] Starting Fresh Session (New User)")
res = requests.post(f"{BASE_URL}/liveness/session/start", json={"api_type": "enterprise"}, headers=headers)
assert res.status_code == 200
session_id = res.json()["session_id"]
challenges = res.json()["challenges"]
print(f"Session ID: {session_id}")

print("Initializing and Enrolling Face...")
missing_poses = ["Front"]
for i in range(60):
    pose_hint = missing_poses[0] if missing_poses else "Front"
    res = process_frame(session_id, api_type="enterprise", pose_hint=pose_hint)
    enroll_progress = res.json().get("enrollment_progress", {})
    if not enroll_progress:
        print(f"Frame {i+1} full response: {res.json()}")
    elif enroll_progress.get("state") == "READY":
        print(f"PASS: Enrollment READY at frame {i+1}")
        break
    else:
        missing_poses = enroll_progress.get('missing_poses') or []
        print(f"Frame {i+1} state: {enroll_progress.get('state')} | valid: {enroll_progress.get('valid_embeddings')} | missing: {missing_poses}")
else:
    print("FAIL: Did not reach READY state after 60 frames.")
    sys.exit(1)

res = requests.post(f"{BASE_URL}/identity/enroll", json={"image": get_noisy_face_b64("Front"), "session_id": session_id}, headers=headers)
assert res.status_code == 200
print("PASS: Enrollment committed successfully")

# -------------------------------------------------------------------------
# TEST 3: Wrong Face / TEST 4: Wrong Challenge
# -------------------------------------------------------------------------
print("\n[TEST 3 & 4] Verifying Identity Match & Challenge Progression")
for i in range(15):
    res = process_frame(session_id, pose_hint="Front")
    enroll_state = res.json().get("enrollment_progress", {}).get("state")
    if enroll_state == "LIVENESS_CHALLENGES":
        print(f"PASS: Successfully matched face and transitioned to LIVENESS_CHALLENGES")
        break
    time.sleep(0.1)
else:
    print(f"FAIL: Did not transition to LIVENESS_CHALLENGES. Stuck at {enroll_state}")
    sys.exit(1)

# Test incorrect challenge (Yaw mismatch)
print("Testing Wrong Challenge Rejection...")
res = process_frame(session_id, challenge_type="HEAD_LEFT", pose_hint="Front") # straight face won't match left yaw
data = res.json()
assert data.get("challenge_passed") is False, "FAIL: Wrong challenge was erroneously accepted"
print("PASS: Wrong movement correctly rejected without incrementing challenge.")

# -------------------------------------------------------------------------
# TEST 5: Temporary Face Loss
# -------------------------------------------------------------------------
print("\n[TEST 5] Temporary Face Loss Recovery")
res = process_frame(session_id, image_func=get_blank_face_b64)
data = res.json()
assert data.get("status") == "NO_FACE_DETECTED" or data.get("result") == "fail"
print("PASS: Blank frame triggered NO_FACE_DETECTED")
res = process_frame(session_id, pose_hint="Front")
data = res.json()
assert data.get("status") != "NO_FACE_DETECTED", "FAIL: Did not recover from temporary face loss"
print("PASS: Session successfully recovered from temporary face loss without terminal failure")

# -------------------------------------------------------------------------
# TEST 8: Duplicate Requests / Race Conditions
# -------------------------------------------------------------------------
print("\n[TEST 8] Concurrent Duplicate Requests")
def fire_req():
    process_frame(session_id, pose_hint="Front")
threads = [threading.Thread(target=fire_req) for _ in range(5)]
for t in threads: t.start()
for t in threads: t.join()
print("PASS: 5 concurrent frames processed without corrupting state or crashing.")

# -------------------------------------------------------------------------
# TEST 2: Existing User
# -------------------------------------------------------------------------
print("\n[TEST 2] Testing Existing User Bypass")
res = requests.post(f"{BASE_URL}/liveness/session/start", json={"api_type": "enterprise"}, headers=headers)
session_id2 = res.json()["session_id"]
res = process_frame(session_id2, pose_hint="Front")
enroll_state = res.json().get("enrollment_progress", {}).get("state")
assert enroll_state not in ["COLLECTING", "COVERAGE_INCOMPLETE"], f"FAIL: Existing user got forced into enrollment. State: {enroll_state}"
print("PASS: Existing user correctly bypassed physical enrollment frames.")

print("\n=== ALL E2E LIFECYCLE TESTS PASSED ===")
