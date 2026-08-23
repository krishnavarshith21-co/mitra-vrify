import re

file_path = "/Users/krishnavarshithkamanaboina/Desktop/mitra-vrify/mitra-verify-backend/app/services/cv/mediapipe_engine.py"
with open(file_path, "r") as f:
    content = f.read()

# Remove enrolled_embedding from function signatures
content = re.sub(
    r"def process_demo_frame\(\n    image_b64: str,\n    frame_id: str \| None = None,\n    session_id: str \| None = None,\n    challenge_type: str \| None = None,\n    enrolled_signature: list\[float\] \| None = None,\n    enrolled_embedding: list\[float\] \| None = None,\n    api_type: str \| None = None\n\):",
    r"def process_demo_frame(\n    image_b64: str,\n    frame_id: str | None = None,\n    session_id: str | None = None,\n    challenge_type: str | None = None,\n    enrolled_signature: list[float] | None = None,\n    api_type: str | None = None\n):",
    content
)

content = re.sub(
    r"def _process_demo_frame_inner\(\n    image_b64: str,\n    frame_id: str \| None = None,\n    session_id: str \| None = None,\n    challenge_type: str \| None = None,\n    enrolled_signature: list\[float\] \| None = None,\n    enrolled_embedding: list\[float\] \| None = None,\n    api_type: str \| None = None\n\):",
    r"def _process_demo_frame_inner(\n    image_b64: str,\n    frame_id: str | None = None,\n    session_id: str | None = None,\n    challenge_type: str | None = None,\n    enrolled_signature: list[float] | None = None,\n    api_type: str | None = None\n):",
    content
)

content = content.replace(
    "return _process_demo_frame_inner(",
    "return _process_demo_frame_inner("
)
content = re.sub(
    r"enrolled_embedding=enrolled_embedding,\n\s*api_type=api_type",
    r"api_type=api_type",
    content
)

# Replace any usage of enrolled_embedding passed via args with extracting it from session
# Wait, I already added logic in refactor_stage.py:
# if enrolled_embedding is None:
#     enrolled_embedding = session.get("enrolled_embedding")
# So I just need to make sure the local variable enrolled_embedding is populated from session
fix_inner = r"""    session = SESSION_CACHE\.get\(session_id\)
    if session is None:
        return \{"status": "SESSION_EXPIRED", "message": "Session expired or invalid"\}"""

new_inner = """    session = SESSION_CACHE.get(session_id)
    if session is None:
        return {"status": "SESSION_EXPIRED", "message": "Session expired or invalid"}
        
    enrolled_embedding = session.get("enrolled_embedding")
    enrolled_template_available = session.get("enrolled_template_available", False)
"""
content = re.sub(fix_inner, new_inner, content)

with open(file_path, "w") as f:
    f.write(content)
