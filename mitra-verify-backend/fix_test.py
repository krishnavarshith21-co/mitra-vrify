import base64
import requests
import uuid
import json

BASE_URL = "http://127.0.0.1:8000/api/v1"

with open("test_assets/straight_face.jpg", "rb") as f:
    b64_image = base64.b64encode(f.read()).decode()

session_id = f"test_session_{uuid.uuid4().hex[:8]}"

# Start session
client = requests.Session()
res = client.post(f"{BASE_URL}/liveness/session/start", json={"api_type": "enterprise", "session_id": session_id})
print(res.json())

# Call demo/process 15 times
for i in range(15):
    payload = {
        "image": b64_image,
        "session_id": session_id,
        "api_type": "enterprise",
        "challenge_type": "face_centered"
    }
    r = client.post(f"{BASE_URL}/liveness/demo/process", json=payload)
    print(i, r.json().get("stage"), r.json().get("enrolled_matched"))
