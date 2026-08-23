from app.services.cv.mediapipe_engine import _process_demo_frame_inner, SESSION_CACHE
import numpy as np

# Mocking inputs
SESSION_CACHE["test1"] = {
    "enrollment_embeddings": [[]]*15,  # 15 valid frames
    "pose_coverage": {"Front", "Left 15", "Right 15", "Up"},
    "expression_coverage": {"Neutral", "Smile"},
}

# The question is: if _process_demo_frame_inner gets a frame with pitch=-21.3, does it add Down?
# Wait, I cannot easily mock _process_demo_frame_inner because it requires frame and landmarks.
