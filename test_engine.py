import sys
import os
import json

# Add backend to path
sys.path.append('/Users/krishnavarshithkamanaboina/Desktop/mitra-vrify/mitra-verify-backend')

from app.services.cv.mediapipe_engine import process_demo_frame, _calculate_spoof_risk, _compute_cosine_similarity
from app.services.cv.mediapipe_engine import NOSE_TIP

def run_tests():
    print("Testing Engine Updates...")
    
    # 1. Cosine Similarity
    v1 = [1.0] * 128
    v2 = [1.0] * 128
    sim_exact = _compute_cosine_similarity(v1, v2)
    print(f"Exact match similarity: {sim_exact}")
    
    # 2. Spoof Risk (Printed Photo)
    # We need a history with 5 frames of zero motion
    history_static = {
        "landmarks": [ [[0,0,0]] * 478 for _ in range(5) ],
        "ear": [0.3]*15,
        "mar": [0.1]*5
    }
    # For a printed photo, texture score might be low, but even if it's 1.0, the zero std_val should trigger +0.80 risk.
    risk = _calculate_spoof_risk(None, [], history_static, 1.0, 0.0)
    print(f"Static photo spoof risk: {risk}")
    
    # 3. Spoof Risk (Jump Cut)
    history_jump = {
        "landmarks": [ [[0,0,0]] * 478, [[0.15,0.15,0.15]] * 478 ], # Distance > 0.12
        "ear": [0.3]*15,
        "mar": [0.1]*5
    }
    risk_jump = _calculate_spoof_risk(None, [], history_jump, 1.0, 0.0)
    print(f"Jump cut spoof risk: {risk_jump}")

if __name__ == "__main__":
    run_tests()
