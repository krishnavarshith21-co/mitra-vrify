from fastapi import APIRouter, Depends, HTTPException, Header, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, func
from datetime import datetime, timezone
from typing import Optional
from app.core.database import get_db
from app.core.security import generate_api_key, hash_api_key, get_key_prefix
from app.models.models import ApiKey, User, AuditLog
from app.schemas.schemas import ApiKeyCreate, ApiKeyOut
from app.api.v1.auth.router import get_current_user
import uuid

router = APIRouter(prefix="/keys", tags=["API Keys"])

@router.post("", response_model=ApiKeyOut, status_code=201)
async def create_key(data: ApiKeyCreate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if data.api_type not in ("basic", "advanced", "enterprise"):
        raise HTTPException(status_code=400, detail="api_type must be basic, advanced, or enterprise")
    plaintext, key_hash = generate_api_key(data.api_type)
    prefix = get_key_prefix(plaintext)
    key = ApiKey(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        name=data.name,
        key_prefix=prefix,
        key_hash=key_hash,
        api_type=data.api_type,
        is_active=True,
        request_count=0,
        rate_limit=100,
        created_at=datetime.now(timezone.utc)
    )
    db.add(key)
    # Add Audit log
    audit = AuditLog(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        action="create_api_key",
        resource_type="api_key",
        resource_id=key.id,
        meta_data={"name": key.name, "api_type": key.api_type, "prefix": key.key_prefix},
        ip_address="internal",
        created_at=datetime.now(timezone.utc)
    )
    db.add(audit)
    await db.commit()
    await db.refresh(key)
    out = ApiKeyOut.model_validate(key)
    out.plaintext = plaintext  # returned once only
    return out

@router.get("", response_model=list[ApiKeyOut])
async def list_keys(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ApiKey).where(ApiKey.user_id == current_user.id).order_by(ApiKey.created_at.desc()))
    return result.scalars().all()

@router.delete("/{key_id}")
async def revoke_key(key_id: str, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ApiKey).where(ApiKey.id == key_id, ApiKey.user_id == current_user.id))
    key = result.scalar_one_or_none()
    if not key:
        raise HTTPException(status_code=404, detail="API key not found")
    await db.execute(update(ApiKey).where(ApiKey.id == key_id).values(is_active=False))
    
    # Add Audit log
    audit = AuditLog(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        action="revoke_api_key",
        resource_type="api_key",
        resource_id=key.id,
        meta_data={"name": key.name, "prefix": key.key_prefix},
        ip_address="internal",
        created_at=datetime.now(timezone.utc)
    )
    db.add(audit)
    await db.commit()
    return {"message": "API key revoked"}

async def get_api_key_from_header(x_api_key: Optional[str] = Header(None), db: AsyncSession = Depends(get_db)) -> ApiKey:
    if not x_api_key:
        raise HTTPException(status_code=401, detail="X-API-Key header required")
    key_hash = hash_api_key(x_api_key)
    result = await db.execute(select(ApiKey).where(ApiKey.key_hash == key_hash, ApiKey.is_active == True))
    key = result.scalar_one_or_none()
    if not key:
        raise HTTPException(status_code=401, detail="Invalid or revoked API key")
    # Update usage stats
    await db.execute(update(ApiKey).where(ApiKey.id == key.id).values(
        last_used_at=datetime.now(timezone.utc),
        request_count=ApiKey.request_count + 1
    ))
    await db.commit()
    return key
