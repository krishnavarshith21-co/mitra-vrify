import time
from app.services.cv.mediapipe_engine import update_session_history, _update_session_history_internal
from app.services.session_manager import SessionProxy, SessionManager

class DummyManager:
    def __init__(self):
        self.data = {}
    def get_session(self, session_id):
        return self.data.get(session_id, {})
    def save_session(self, session_id, data):
        self.data[session_id] = data

def test_session_batch_update():
    manager = DummyManager()
    manager.save_session("test_sess", {"stage": "ENROLLMENT"})
    proxy = SessionProxy(manager, "test_sess", {"stage": "ENROLLMENT"})
    
    with proxy.batch_update():
        proxy["stage"] = "IDENTITY_VERIFYING"
        proxy["ear"] = [0.2]
    
    # After batch_update, it should be saved once
    assert manager.data["test_sess"]["stage"] == "IDENTITY_VERIFYING"
    assert manager.data["test_sess"]["ear"] == [0.2]

def test_identity_verified_transition():
    manager = DummyManager()
    manager.save_session("test_sess", {"stage": "IDENTITY_VERIFYING"})
    proxy = SessionProxy(manager, "test_sess", {"stage": "IDENTITY_VERIFYING"})
    
    # We simulate the state transition logic in mediapipe_engine
    # The engine accesses history which is the dict itself
    session = proxy
    enrolled_matched = True
    
    if session["stage"] == "IDENTITY_VERIFYING":
        if enrolled_matched:
            session["stage"] = "IDENTITY_VERIFIED"
            session["identity_verified_time"] = time.time() - 1.0 # mock time past 0.5s
            
    assert session["stage"] == "IDENTITY_VERIFIED"
    
    # Next frame
    if session["stage"] == "IDENTITY_VERIFIED":
        if time.time() - session.get("identity_verified_time", time.time()) > 0.5:
            session["stage"] = "LIVENESS_CHALLENGES"
            session["challenge_start_time"] = time.time()
            
    assert session["stage"] == "LIVENESS_CHALLENGES"

def test_liveness_verified_rolling_window():
    manager = DummyManager()
    manager.save_session("test_sess", {"stage": "LIVENESS_VERIFIED", "identity_history": [1, 1, 0, 1, 0]})
    session = SessionProxy(manager, "test_sess", {"stage": "LIVENESS_VERIFIED", "identity_history": [1, 1, 0, 1, 0]})
    
    enrolled_matched = False
    detected_faces = 1
    spoof_score = 0.1
    is_high_quality = True
    
    id_history = session.get("identity_history", [])[-5:]
    recent_matches = sum(id_history) if id_history else 0
    is_identity_secure = recent_matches >= 3 or enrolled_matched
    
    is_secure = (
        is_identity_secure and
        detected_faces == 1 and
        spoof_score < 0.4 and
        is_high_quality and
        session["stage"] == "LIVENESS_VERIFIED"
    )
    
    assert is_identity_secure == True
    assert is_secure == True


if __name__ == "__main__":
    test_session_batch_update()
    test_identity_verified_transition()
    test_liveness_verified_rolling_window()
    print("All basic logic tests passed!")
