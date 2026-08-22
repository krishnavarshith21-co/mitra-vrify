import hashlib
import secrets
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.auth.router import get_current_user
from app.core.database import get_db
from app.models.models import ClientApplication, User
from app.schemas.schemas import (
    ClientApplicationCreate,
    ClientApplicationCreatedOut,
    ClientApplicationOut,
    ClientApplicationUpdate,
)

router = APIRouter(prefix="/applications", tags=["Client Applications"])


def _generate_credential(prefix: str) -> tuple[str, str, str]:
    """Generate a credential. Returns (plaintext, hash, display_prefix)."""
    random_part = secrets.token_urlsafe(32)
    plaintext = f"{prefix}_{random_part}"
    key_hash = hashlib.sha256(plaintext.encode()).hexdigest()
    display_prefix = f"{prefix}_...{random_part[-6:]}"
    return plaintext, key_hash, display_prefix


@router.post("", response_model=ClientApplicationCreatedOut, status_code=201)
async def create_application(
    data: ClientApplicationCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if data.api_level not in ("api1", "api2", "api3"):
        raise HTTPException(status_code=400, detail="api_level must be api1, api2, or api3")

    # Validate redirect URIs
    for uri in data.allowed_redirect_uris:
        if not uri.startswith("http://") and not uri.startswith("https://"):
            raise HTTPException(status_code=400, detail=f"Invalid redirect URI: {uri}")

    client_id = f"app_{uuid.uuid4().hex[:16]}"
    api_key_plain, api_key_hash, api_key_prefix = _generate_credential("mvk")
    server_secret_plain, server_secret_hash, server_secret_prefix = _generate_credential("mvs")

    app = ClientApplication(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        name=data.name,
        api_level=data.api_level,
        client_id=client_id,
        api_key_hash=api_key_hash,
        api_key_prefix=api_key_prefix,
        server_secret_hash=server_secret_hash,
        server_secret_prefix=server_secret_prefix,
        allowed_redirect_uris=data.allowed_redirect_uris,
        is_active=True,
        created_at=datetime.now(timezone.utc),
    )
    db.add(app)
    await db.commit()
    await db.refresh(app)

    out = ClientApplicationCreatedOut(
        **ClientApplicationOut.model_validate(app).model_dump(),
        api_key=api_key_plain,
        server_secret=server_secret_plain
    )
    return out


@router.get("", response_model=list[ClientApplicationOut])
async def list_applications(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ClientApplication)
        .where(ClientApplication.user_id == current_user.id)
        .order_by(ClientApplication.created_at.desc())
    )
    return result.scalars().all()


@router.get("/{app_id}", response_model=ClientApplicationOut)
async def get_application(
    app_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ClientApplication).where(
            ClientApplication.id == app_id,
            ClientApplication.user_id == current_user.id,
        )
    )
    app = result.scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    return app


@router.put("/{app_id}", response_model=ClientApplicationOut)
async def update_application(
    app_id: str,
    data: ClientApplicationUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ClientApplication).where(
            ClientApplication.id == app_id,
            ClientApplication.user_id == current_user.id,
        )
    )
    app = result.scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    if data.name is not None:
        app.name = data.name
    if data.api_level is not None:
        if data.api_level not in ("api1", "api2", "api3"):
            raise HTTPException(status_code=400, detail="api_level must be api1, api2, or api3")
        app.api_level = data.api_level
    if data.allowed_redirect_uris is not None:
        for uri in data.allowed_redirect_uris:
            if not uri.startswith("http://") and not uri.startswith("https://"):
                raise HTTPException(status_code=400, detail=f"Invalid redirect URI: {uri}")
        app.allowed_redirect_uris = data.allowed_redirect_uris

    app.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(app)
    return app


@router.delete("/{app_id}")
async def delete_application(
    app_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ClientApplication).where(
            ClientApplication.id == app_id,
            ClientApplication.user_id == current_user.id,
        )
    )
    app = result.scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    await db.execute(
        update(ClientApplication)
        .where(ClientApplication.id == app_id)
        .values(is_active=False, updated_at=datetime.now(timezone.utc))
    )
    await db.commit()
    return {"message": "Application deactivated"}


@router.post("/{app_id}/rotate-keys")
async def rotate_keys(
    app_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ClientApplication).where(
            ClientApplication.id == app_id,
            ClientApplication.user_id == current_user.id,
        )
    )
    app = result.scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    api_key_plain, api_key_hash, api_key_prefix = _generate_credential("mvk")
    server_secret_plain, server_secret_hash, server_secret_prefix = _generate_credential("mvs")

    app.api_key_hash = api_key_hash
    app.api_key_prefix = api_key_prefix
    app.server_secret_hash = server_secret_hash
    app.server_secret_prefix = server_secret_prefix
    app.updated_at = datetime.now(timezone.utc)
    await db.commit()

    return {
        "message": "Keys rotated successfully",
        "api_key": api_key_plain,
        "server_secret": server_secret_plain,
        "api_key_prefix": api_key_prefix,
        "server_secret_prefix": server_secret_prefix,
    }
