from fastapi import FastAPI
from fastapi.testclient import TestClient
from app.services.session_manager import SESSION_CACHE

app = FastAPI()

@app.post("/test")
def test_route(session_id: str):
    if session_id not in SESSION_CACHE:
        SESSION_CACHE[session_id] = {}
        
    session = SESSION_CACHE[session_id]
    fc = session.get("frame_count", 0) + 1
    session["frame_count"] = fc
    
    return {"frame_count": fc}

client = TestClient(app)

print(client.post("/test?session_id=s1").json())
print(client.post("/test?session_id=s1").json())
print(client.post("/test?session_id=s1").json())
