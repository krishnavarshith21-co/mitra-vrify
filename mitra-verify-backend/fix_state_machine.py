import re

file_path = "/Users/krishnavarshithkamanaboina/Desktop/mitra-vrify/mitra-verify-backend/app/services/cv/mediapipe_engine.py"
with open(file_path, "r") as f:
    content = f.read()

# Update state transitions in _process_demo_frame_inner
old_transitions = r"""        # State transitions
        if current_stage == "IDENTITY_VERIFYING":
            if enrolled_matched:
                session\["stage"\] = "IDENTITY_VERIFIED"
                session\["stage"\] = "LIVENESS_CHALLENGES"  # Start challenges
            elif not enrolled_matched and history\.get\("wrong_person_frames", 0\) >= 15:
                session\["stage"\] = "FAILED"
                status = "UNAUTHORIZED_PERSON"
                
        elif current_stage == "LIVENESS_CHALLENGES":"""

new_transitions = """        # State transitions
        if current_stage == "IDENTITY_VERIFYING":
            if enrolled_matched:
                session["stage"] = "IDENTITY_VERIFIED"
                session["identity_verified_time"] = time.time()
            elif not enrolled_matched and history.get("wrong_person_frames", 0) >= 30:
                session["stage"] = "FAILED"
                status = "UNAUTHORIZED_PERSON"
                
        elif current_stage == "IDENTITY_VERIFIED":
            if time.time() - session.get("identity_verified_time", 0) > 1.5:
                session["stage"] = "LIVENESS_CHALLENGES"
                
        elif current_stage == "LIVENESS_CHALLENGES":"""

content = re.sub(old_transitions, new_transitions, content)

with open(file_path, "w") as f:
    f.write(content)
