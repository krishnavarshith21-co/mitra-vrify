import re

with open('app/services/cv/mediapipe_engine.py', 'r') as f:
    content = f.read()

# Replace the LIVENESS_CHALLENGES transition logic
old_logic = """            elif current_stage == "LIVENESS_CHALLENGES":
                # For simplicity, if they pass the current challenge, move to VERIFIED
                if challenge_passed:
                    session["stage"] = "LIVENESS_VERIFIED"
"""

new_logic = """            elif current_stage == "LIVENESS_CHALLENGES":
                # The frontend tracks challenge sequence. We only transition when the frontend requests monitoring, 
                # or if the frontend specifically tells us it is verified.
                if challenge_type == "monitoring":
                    session["stage"] = "CONTINUOUS_MONITORING"
                    session["access_granted_time"] = time.time()
                elif challenge_type == "liveness_verified":
                    session["stage"] = "LIVENESS_VERIFIED"
"""

content = content.replace(old_logic, new_logic)

with open('app/services/cv/mediapipe_engine.py', 'w') as f:
    f.write(content)
print("Updated mediapipe_engine.py")
