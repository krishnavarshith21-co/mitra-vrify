from app.services.session_manager import SESSION_CACHE
import uuid

sid = f"test_{uuid.uuid4().hex[:6]}"
SESSION_CACHE[sid] = {"enrolled_embedding": [1.0, 2.0]}

for i in range(3):
    session = SESSION_CACHE[sid]
    frame_count = session.get("embedding_frame_count", 0) + 1
    session["embedding_frame_count"] = frame_count
    print(f"Loop {i}: frame_count = {frame_count}")
    print(f"Dict inside cache: {SESSION_CACHE.manager.fallback_cache[sid]}")

