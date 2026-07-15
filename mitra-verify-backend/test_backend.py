import asyncio
from app.services.cv.mediapipe_engine import update_session_history
import time

def test():
    # Test update_session_history with a fresh session_id
    session_id = "test_session_123"
    
    # Mock landmarks
    class MockLandmark:
        def __init__(self, x, y, z):
            self.x = x
            self.y = y
            self.z = z
            
    landmarks = [MockLandmark(0.5, 0.5, 0.5) for _ in range(478)]
    
    # Call it once to initialize
    cache = update_session_history(
        session_id=session_id,
        landmarks=landmarks,
        ear=0.2,
        mar=0.1,
        yaw=0.0,
        pitch=0.0,
        roll=0.0,
        challenge_type="face_centered"
    )
    assert cache is not None
    print("First call successful, smile_ratios length:", len(cache["smile_ratios"]))
    
    # Manually delete smile_ratios to simulate the old bug state
    del cache["smile_ratios"]
    
    # Call it again. This used to throw KeyError: 'smile_ratios'
    cache2 = update_session_history(
        session_id=session_id,
        landmarks=landmarks,
        ear=0.2,
        mar=0.1,
        yaw=0.0,
        pitch=0.0,
        roll=0.0,
        challenge_type="face_centered"
    )
    assert cache2 is not None
    print("Second call successful, smile_ratios length:", len(cache2["smile_ratios"]))

if __name__ == "__main__":
    test()
