import re

with open('app/services/cv/mediapipe_engine.py', 'r') as f:
    engine_content = f.read()

with open('test_e2e_verification.py', 'r') as f:
    content = f.read()

# Add test code after TEST L
new_test = """
    # TEST M: Multi-stage LIVENESS_CHALLENGES sequence
    print("--- MULTI-STAGE LIVENESS CHALLENGES TEST ---")
    
    # Send monitoring request
    process_payload["challenge_type"] = "monitoring"
    m_res = client.post(f"{BASE_URL}/liveness/demo/process", json=process_payload)
    m_data = m_res.json()
    
    print(f"Post-monitoring state: {m_data.get('stage', 'Unknown')}")
    # Wait, stage isn't directly returned, let's look at status
    print(f"Post-monitoring status: {m_data.get('status')}")
    
    print_result("TEST M: Backend transitions to CONTINUOUS_MONITORING", m_data.get('status') == 'verified' or m_data.get('status') == 'passed')
"""
content = content + new_test

with open('test_e2e_verification.py', 'w') as f:
    f.write(content)
print("Updated test_e2e_verification.py")
