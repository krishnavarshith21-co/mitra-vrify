import requests
import json
import time
import base64

def run_test():
    base_url = "http://127.0.0.1:8000/api/v1"
    
    # 1. Start Session
    res = requests.post(f"{base_url}/liveness/session/start", json={"api_type": "enterprise"})
    assert res.status_code == 200, res.text
    session_id = res.json()["session_id"]
    print(f"Session started: {session_id}")
    
    # Get a dummy image
    try:
        with open("straight_face.jpg", "rb") as f:
            image_b64 = "data:image/jpeg;base64," + base64.b64encode(f.read()).decode('utf-8')
    except:
        image_b64 = "data:image/jpeg;base64," + ("A"*1000)  # Dummy if no real image
        
    # 2. Simulate Enrollment
    for i in range(15):
        # We need realistic frames to pass quality checks, but we just want to bypass it for test
        pass
        
    # Let's bypass enrollment and directly inject a fake template into the session cache
    # But wait, this is black-box testing. We can't inject.
    print("Test ready to run via UI.")

run_test()
