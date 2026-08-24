import re

with open("app/services/cv/mediapipe_engine.py", "r") as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    if "print(\"[DIAGNOSTICS]" in line:
        continue
    if "print(\"FACE_DETECTION_STARTED\")" in line:
        continue
    if "print(\"FACE_DETECTED\")" in line:
        continue
    if "print(\"LANDMARKS_FOUND\")" in line:
        continue
    if "print(f\"[POSE DEBUG]" in line:
        continue
    if "print(\"[Embedding]" in line or "print(f\"[Embedding]" in line:
        continue
    if "print(\"[ArcFace]" in line or "print(f\"[ArcFace]" in line:
        continue
    if "print(\"[Verification]" in line or "print(f\"[Verification]" in line:
        continue
    if line.strip().startswith("print(\"=\" * 52)"):
        continue
    if "Frame ID:" in line or "Backend received frame:" in line or "Image decoded:" in line:
        continue
    if "MediaPipe executed:" in line or "Face count:" in line or "Landmark count:" in line:
        continue
    if "Bounding box:" in line or "Face confidence:" in line or "Tracking state:" in line:
        continue
    if "Face present:" in line or "Spoof score:" in line or "Identity score:" in line:
        continue
    if "Result: {res.get" in line or "Status: {res.get" in line:
        continue
    if "print(f\"STOPPED PROCESSING. Reason" in line:
        continue
    new_lines.append(line)

with open("app/services/cv/mediapipe_engine.py", "w") as f:
    f.writelines(new_lines)
