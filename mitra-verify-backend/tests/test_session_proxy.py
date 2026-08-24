from app.services.session_manager import SessionManager, SessionCacheDict
import time

def test_session_proxy_stale_overwrite():
    manager = SessionManager()
    session_id = "test_proxy_overwrite"
    SESSION_CACHE = SessionCacheDict(manager)
    
    # Initialize the session
    SESSION_CACHE[session_id] = {"stage": "LIVENESS_CHALLENGES", "counter": 0}
    
    # 1. obtain session proxy A (history)
    proxy_a = SESSION_CACHE[session_id]
    
    # 2. obtain session proxy B (session)
    proxy_b = SESSION_CACHE[session_id]
    
    # 3. mutate state using proxy B
    proxy_b["stage"] = "CONTINUOUS_MONITORING"
    
    # 4. mutate history using proxy A
    proxy_a["counter"] = proxy_a.get("counter", 0) + 1
    
    # 5. Check the final stage in the underlying cache
    final_cache = manager.get_session(session_id)
    assert final_cache["stage"] == "CONTINUOUS_MONITORING", f"Bug reproduced! Stage reverted to {final_cache['stage']}"

if __name__ == "__main__":
    try:
        test_session_proxy_stale_overwrite()
        print("Session proxy regression test passed!")
    except AssertionError as e:
        print(e)
        exit(1)
