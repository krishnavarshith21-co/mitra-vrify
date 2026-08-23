import requests, json, base64, cv2, numpy as np, time
import sys, os

# Add backend to path so we can import mediapipe_engine for unit tests
sys.path.append('/Users/krishnavarshithkamanaboina/Desktop/mitra-vrify/mitra-verify-backend')
from app.services.cv.mediapipe_engine import _build_enrollment_progress, SESSION_CACHE

def unit_test(name, expected_state, valid, poses, exprs):
    session_id = "test_session_unit_" + name
    SESSION_CACHE[session_id] = {
        "enrollment_embeddings": [np.zeros(128)] * valid,
        "pose_coverage": set(poses),
        "expression_coverage": set(exprs)
    }
    prog = _build_enrollment_progress(session_id)
    if prog["state"] == expected_state:
        print(f"✅ {name} PASSED: {prog['state']} (valid={valid}, poses={poses}, exprs={exprs})")
        return True
    else:
        print(f"❌ {name} FAILED: Expected {expected_state}, got {prog['state']}")
        print(f"   Missing poses: {prog.get('missing_poses')}")
        print(f"   Missing exprs: {prog.get('missing_expressions')}")
        return False

print("=== UNIT TESTS (State Machine) ===")
# TEST 1: 0 frames
unit_test("TEST 1 (0 frames)", "IDLE", 0, [], [])
# TEST 2: 14 frames + complete poses
unit_test("TEST 2 (14 frames)", "COLLECTING", 14, ["Front", "Left 15", "Right 15", "Up", "Down"], ["Neutral", "Smile"])
# TEST 3: 15+ frames + missing Right 15
unit_test("TEST 3 (15 frames, missing Right 15)", "COVERAGE_INCOMPLETE", 15, ["Front", "Left 15", "Up", "Down"], ["Neutral", "Smile"])
# TEST 4: 15+ frames + missing Down
unit_test("TEST 4 (15 frames, missing Down)", "COVERAGE_INCOMPLETE", 15, ["Front", "Left 15", "Right 15", "Up"], ["Neutral", "Smile"])
# TEST 5: 15+ frames + all poses + missing Smile
unit_test("TEST 5 (15 frames, missing Smile)", "COVERAGE_INCOMPLETE", 15, ["Front", "Left 15", "Right 15", "Up", "Down"], ["Neutral"])
# TEST 6: 15+ frames + all poses + Neutral + Smile
unit_test("TEST 6 (15 frames, all present)", "READY", 15, ["Front", "Left 15", "Right 15", "Up", "Down"], ["Neutral", "Smile"])

print("\n=== INTEGRATION TESTS (Live Backend) ===")
BASE = 'http://localhost:8000/api/v1'
s = requests.Session()
token = s.post(f'{BASE}/auth/login', json={'email': 'admin@mitraverify.com', 'password': 'admin123'}).json().get('access_token','')
s.headers['Authorization'] = f'Bearer {token}'

def img_to_b64(img, noise_seed=0):
    noisy = img.copy()
    rng = np.random.RandomState(noise_seed)
    noise = rng.randint(-3, 4, size=noisy.shape, dtype=np.int16)
    noisy = np.clip(noisy.astype(np.int16) + noise, 0, 255).astype(np.uint8)
    _, buf = cv2.imencode('.jpg', noisy, [cv2.IMWRITE_JPEG_QUALITY, 80])
    return 'data:image/jpeg;base64,' + base64.b64encode(buf).decode()

face_img = cv2.imread('/Users/krishnavarshithkamanaboina/Desktop/mitra-vrify/mitra-verify-backend/straight_face.jpg')
b64 = img_to_b64(face_img)

sess = s.post(f'{BASE}/liveness/session/start', json={'api_type': 'enterprise'}).json()
session_id = sess['session_id']

# Accumulate 15 frames to trigger COVERAGE_INCOMPLETE (Test 8)
print(f"Populating 15 frames for session {session_id} to trigger COVERAGE_INCOMPLETE...")
for i in range(50):
    r = s.post(f'{BASE}/liveness/demo/process', json={'image': img_to_b64(face_img, i), 'session_id': session_id, 'api_type': 'enterprise'}).json()
    ep = r.get('enrollment_progress', {})
    if ep.get('valid_frames', 0) >= 15:
        print(f"Reached {ep.get('valid_frames')} valid frames.")
        print(f"Current State: {ep.get('state')} (Expected: COVERAGE_INCOMPLETE)")
        print(f"Missing Poses: {ep.get('missing_poses')}")
        break
    time.sleep(0.02)

print("\nTEST 8: Attempt /identity/enroll with missing poses")
er8 = s.post(f'{BASE}/identity/enroll', json={'image': b64, 'session_id': session_id}).json()
if er8.get("success") == False and er8.get("code") == "INSUFFICIENT_POSE_COVERAGE":
    print("✅ TEST 8 PASSED: Properly rejected with INSUFFICIENT_POSE_COVERAGE")
else:
    print(f"❌ TEST 8 FAILED: {er8}")

print("\nTEST 9: Attempt with expired session")
er9 = s.post(f'{BASE}/identity/enroll', json={'image': b64, 'session_id': 'expired-123'}).json()
if er9.get("success") == False and er9.get("code") == "SESSION_EXPIRED":
    print("✅ TEST 9 PASSED: Properly rejected with SESSION_EXPIRED")
else:
    print(f"❌ TEST 9 FAILED: {er9}")

print("\nTEST 10: No face / excessive yaw")
blank_b64 = 'data:image/jpeg;base64,' + base64.b64encode(cv2.imencode('.jpg', np.zeros((480,640,3), dtype=np.uint8))[1]).decode()
er10a = s.post(f'{BASE}/liveness/demo/process', json={'image': blank_b64, 'session_id': session_id, 'api_type': 'enterprise'}).json()
if er10a.get("face_present") == False:
    print("✅ TEST 10a PASSED: No face correctly detected")
else:
    print(f"❌ TEST 10a FAILED: {er10a}")

face_turned = cv2.imread('/Users/krishnavarshithkamanaboina/Desktop/mitra-vrify/mitra-verify-backend/face.jpg')
er10b = s.post(f'{BASE}/liveness/demo/process', json={'image': img_to_b64(face_turned), 'session_id': session_id, 'api_type': 'enterprise'}).json()
if er10b.get("status") == "POSE_INVALID":
    print("✅ TEST 10b PASSED: Excessive yaw correctly blocked (POSE_INVALID)")
else:
    print(f"❌ TEST 10b FAILED: {er10b}")

# TEST 7: READY -> ENROLLED
print("\nTEST 7: READY -> click enroll")
# We'll inject the remaining poses into the live cache to simulate TEST 7
print("Injecting missing poses into session cache to trigger READY...")
SESSION_CACHE[session_id]["pose_coverage"] = {"Front", "Left 15", "Right 15", "Up", "Down"}
SESSION_CACHE[session_id]["expression_coverage"] = {"Neutral", "Smile"}
ep_ready = _build_enrollment_progress(session_id)
print(f"Injected state: {ep_ready['state']} (Expected: READY)")

er7 = s.post(f'{BASE}/identity/enroll', json={'image': b64, 'session_id': session_id}).json()
if "embedding_vector" in er7:
    print("✅ TEST 7 PASSED: Enrollment succeeded after READY")
else:
    print(f"❌ TEST 7 FAILED: {er7}")

