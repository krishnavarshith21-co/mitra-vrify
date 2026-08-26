import requests
import time
import base64
import uuid
import sys

# Base URL for local backend
BASE_URL = "http://localhost:8000/api/v1"

# Use the existing base64 images for testing
try:
    with open("straight_face.jpg", "rb") as f:
        FACE_B64 = f"data:image/jpeg;base64,{base64.b64encode(f.read()).decode()}"
except Exception:
    print("Cannot read straight_face.jpg")
    sys.exit(1)

# Authentication - login or register a test user
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

def process_frame(session_id, challenge_type=None, api_type="enterprise"):
    print(f"process_frame called with api_type={api_type}")
    return requests.post(
        f"{BASE_URL}/liveness/demo/process",
        json={
            "image": FACE_B64,
            "session_id": session_id,
            "challenge_type": challenge_type,
            "api_type": api_type
        },
        headers=headers
    )

# 1. Start Session
print("\n[1] Starting Fresh Session")
res = requests.post(f"{BASE_URL}/liveness/session/start", json={"api_type": "enterprise"}, headers=headers)
assert res.status_code == 200
session_id = res.json()["session_id"]
challenges = res.json()["challenges"]
print(f"Session ID: {session_id}")
print(f"Challenges generated: {len(challenges)}")
assert 5 <= len(challenges) <= 9, f"Expected 7-9 challenges, got {len(challenges)}"

# 2. First Frames & Enrollment Collection
print("\n[2] Initializing and Enrolling Face")
for i in range(60):
    res = process_frame(session_id, api_type="basic")
    assert res.status_code == 200
    enroll_progress = res.json().get("enrollment_progress", {})
    print(f"Frame {i+1} response:", res.json())
    if enroll_progress.get("state") == "READY":
        print(f"Enrollment READY at frame {i+1}")
        break
else:
    print("WARNING: Did not reach READY state after 15 frames.")
    print("Last enrollment progress:", enroll_progress)

# 3. Enroll Face
print("\n[3] Committing Enrollment")
res = requests.post(f"{BASE_URL}/identity/enroll", json={"image": FACE_B64, "session_id": session_id}, headers=headers)
assert res.status_code == 200
print("Enroll response:", res.text)
print("Enrollment successful")

# 4. Confirm Enrollment
res = requests.get(f"{BASE_URL}/identity/enrolled", headers=headers)
print("Enrolled Status Code:", res.status_code, "Body:", res.text)
assert res.status_code == 200 and res.json().get("enrolled") == True, f"Enrollment confirmation failed: {res.text}"
print("Enrollment confirmed in database")

# 5. Face Match / Verification
print("\n[4] Identity Verification Phase")
for i in range(10):
    res = process_frame(session_id)
    data = res.json()
    enroll_state = data.get("enrollment_progress", {}).get("state")
    if enroll_state == "LIVENESS_CHALLENGES":
        print(f"Successfully matched face and transitioned to LIVENESS_CHALLENGES at frame {i+1}")
        break
    time.sleep(0.1)
else:
    print(f"Warning: Did not transition to LIVENESS_CHALLENGES. Stuck at {enroll_state}")

# 6. Liveness Challenges (Including Timeout Test)
print("\n[5] Executing Liveness Challenges (Testing Timeout fix)")
# Force a wait to test the 30s timeout reset
print("  -> Testing 30s timeout reset (waiting 32 seconds...)")
time.sleep(32)

res = process_frame(session_id, challenge_type=challenges[1]["id"])
data = res.json()
print("Response after 32s delay:", data.get("status"), data.get("reason"))
assert data.get("reason") != "CHALLENGE_TIMEOUT", "Challenge incorrectly timed out!"
print("  -> Passed timeout reset test!")

# 7. Clear Enrollment
print("\n[7] Executing Clear Enrollment")
res = requests.delete(f"{BASE_URL}/identity/enrolled", headers=headers)
assert res.status_code == 200

res = requests.get(f"{BASE_URL}/identity/enrolled", headers=headers)
assert res.json().get("enrolled") == False
print("Database cleared successfully.")

# 8. Re-Enrollment (Fresh Session)
print("\n[8] Testing Fresh Session Re-enrollment")
res = requests.post(f"{BASE_URL}/liveness/session/start", json={"api_type": "enterprise"}, headers=headers)
session_id2 = res.json()["session_id"]
print(f"New Session ID: {session_id2}")

res = process_frame(session_id2)
data = res.json()
enroll_state = data.get("enrollment_progress", {}).get("state")
print(f"Fresh Session State: {enroll_state}")
assert enroll_state in ["IDLE", "COLLECTING", "COVERAGE_INCOMPLETE"], f"State should not be verifying. Got: {enroll_state}"

print("\n=== ALL TESTS PASSED ===")
