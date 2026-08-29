import re

with open("mitra-verify-backend/app/api/v1/identity/router.py", "r") as f:
    content = f.read()

new_endpoint = """
@router.delete("/enrolled")
async def clear_enrolled_identity(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await db.execute(delete(FaceProfile).where(FaceProfile.user_id == current_user.id))
    await db.commit()
    return {"success": True}
"""

if "@router.delete(\"/enrolled\")" not in content:
    content = content + "\n" + new_endpoint
    with open("mitra-verify-backend/app/api/v1/identity/router.py", "w") as f:
        f.write(content)
