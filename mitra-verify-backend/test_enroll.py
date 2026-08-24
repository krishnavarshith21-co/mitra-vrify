import requests
import time

# 1. Start Session
res1 = requests.post("http://localhost:8000/api/v1/liveness/session/start", json={"api_type": "enterprise"})
print("start session:", res1.status_code, res1.text)
session_id = res1.json().get("session_id")

# 2. Mock 15 high quality frames to populate enrollment_embeddings
dummy_base64 = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA="
for i in range(16):
    res_proc = requests.post("http://localhost:8000/api/v1/liveness/demo/process", json={
        "image": dummy_base64,
        "frame_id": str(i),
        "session_id": session_id,
        "api_type": "enterprise",
        "challenge_type": "face_centered"
    })
    print(f"process frame {i}:", res_proc.status_code)

# 3. Call enroll
res_enroll = requests.post("http://localhost:8000/api/v1/identity/enroll", json={
    "image": dummy_base64,
    "session_id": session_id
})
print("enroll:", res_enroll.status_code, res_enroll.text)
