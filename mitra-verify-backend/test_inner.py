from app.services.cv.mediapipe_engine import _process_demo_frame_inner, SESSION_CACHE
import numpy as np

SESSION_CACHE["test"] = {
    "pose_coverage": set(),
    "expression_coverage": set(),
    "enrollment_embeddings": [1]*15,
    "frame_count": 0,
    "enrollment_last_capture": 0,
}

# Create dummy frame and landmarks
frame = np.zeros((720, 1280, 3), dtype=np.uint8)
class Landmark:
    def __init__(self, x, y, z):
        self.x = x
        self.y = y
        self.z = z
        
# I can't easily mock landmarks to produce specific pitch... 
# Let me mock _head_pose_3d using unittest.mock
from unittest.mock import patch

with patch('app.services.cv.mediapipe_engine._head_pose_3d') as mock_pose:
    mock_pose.return_value = (0.9, -21.3, -3.2)
    # also mock other things if they crash
    try:
        from app.services.cv.mediapipe_engine import CV2_AVAILABLE
    except ImportError:
        pass
