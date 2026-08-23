import re

file_path = "/Users/krishnavarshithkamanaboina/Desktop/mitra-vrify/mitra-verify-backend/app/api/v1/identity/router.py"
with open(file_path, "r") as f:
    content = f.read()

# Update IdentityEnrollResponse definition
old_response_def = r"class IdentityEnrollResponse\(BaseModel\):\n    status: str\n    session_id: str\n    subject_id: str \| None = None\n    quality_score: float \| None = None\n    embedding_vector: list\[float\] \| None = None\n    enrollment_progress: EnrollmentProgress \| None = None"
new_response_def = """class IdentityEnrollResponse(BaseModel):
    status: str
    session_id: str
    subject_id: str | None = None
    quality_score: float | None = None
    enrollment_progress: EnrollmentProgress | None = None"""
content = re.sub(old_response_def, new_response_def, content)

# Save the embedding securely in SESSION_CACHE
session_cache_injection = r"""    # Transition session stage directly to IDENTITY_VERIFYING
    if data\.session_id and data\.session_id in SESSION_CACHE:
        SESSION_CACHE\[data\.session_id\]\["stage"\] = "IDENTITY_VERIFYING"
"""
new_session_cache_injection = """    # Transition session stage directly to IDENTITY_VERIFYING
    if data.session_id and data.session_id in SESSION_CACHE:
        SESSION_CACHE[data.session_id]["stage"] = "IDENTITY_VERIFYING"
        # STORE THE EMBEDDING SECURELY IN THE BACKEND SESSION
        SESSION_CACHE[data.session_id]["enrolled_embedding"] = best_embedding
        SESSION_CACHE[data.session_id]["enrolled_template_available"] = True
"""
content = re.sub(session_cache_injection, new_session_cache_injection, content)

# Remove embedding_vector from the return payload
old_return = r"""    response = IdentityEnrollResponse\(
        status="ENROLLMENT_SUCCESSFUL",
        session_id=data\.session_id,
        subject_id=data\.subject_id,
        quality_score=final_q,
        embedding_vector=best_embedding,
        enrollment_progress=progress
    \)"""
new_return = """    response = IdentityEnrollResponse(
        status="ENROLLMENT_SUCCESSFUL",
        session_id=data.session_id,
        subject_id=data.subject_id,
        quality_score=final_q,
        enrollment_progress=progress
    )"""
content = re.sub(old_return, new_return, content)

with open(file_path, "w") as f:
    f.write(content)
