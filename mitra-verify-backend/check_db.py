import asyncio
from app.core.database import AsyncSessionLocal
from app.models.models import FaceProfile
from sqlalchemy import select

async def run():
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(FaceProfile).limit(1))
        profile = res.scalar_one_or_none()
        if profile:
            print("Found profile! Columns:", dir(profile))
        else:
            print("No profiles found. Schema seems OK if no query error.")

asyncio.run(run())
