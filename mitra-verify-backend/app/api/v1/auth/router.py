from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from datetime import datetime, timedelta
from app.core.database import get_db
from app.core.security import verify_password, hash_password, create_access_token, create_refresh_token, decode_token, decode_supabase_token
from app.models.models import User, Session as UserSession, AuditLog
from app.schemas.schemas import UserRegister, UserLogin, TokenResponse, UserOut
import uuid

router = APIRouter(prefix="/auth", tags=["Authentication"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)) -> User:
    # First, try to decode as internal access token
    payload = decode_token(token)
    user_id = None
    if payload and payload.get("type") == "access":
        user_id = payload.get("sub")
    
    # If internal fails, try Supabase JWT
    if not user_id:
        supabase_payload = decode_supabase_token(token)
        if supabase_payload:
            user_id = supabase_payload.get("sub")
            if user_id:
                # JIT User Provisioning for Supabase Auth
                result = await db.execute(select(User).where(User.id == user_id))
                user = result.scalar_one_or_none()
                if not user:
                    # Create the user on the fly and auto-promote to admin for this demo
                    email = supabase_payload.get("email", "unknown@supabase.com")
                    user = User(
                        id=user_id,
                        email=email,
                        password_hash="supabase_managed",
                        full_name=supabase_payload.get("user_metadata", {}).get("full_name"),
                        role="admin", # AUTO-PROMOTED TO ADMIN
                        email_verified=supabase_payload.get("email_verified", False),
                        is_active=True,
                        created_at=datetime.utcnow()
                    )
                    db.add(user)
                    await db.commit()
                    await db.refresh(user)
                    return user
                elif user.role != "admin":
                    # Upgrade existing demo users to admin automatically
                    user.role = "admin"
                    await db.commit()
                    await db.refresh(user)
                    return user
                return user
    
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
        
    result = await db.execute(select(User).where(User.id == user_id, User.is_active == True))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="User not found or inactive")
    return user

@router.post("/register", response_model=UserOut, status_code=201)
async def register(data: UserRegister, request: Request, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(User).where(User.email == data.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(
        id=str(uuid.uuid4()),
        email=data.email,
        password_hash=hash_password(data.password),
        full_name=data.full_name,
        role="user",
        email_verified=False,
        is_active=True,
        created_at=datetime.utcnow()
    )
    db.add(user)
    # Add Audit log
    audit = AuditLog(
        id=str(uuid.uuid4()),
        user_id=user.id,
        action="register",
        resource_type="user",
        resource_id=user.id,
        meta_data={"email": user.email},
        ip_address=request.client.host if request.client else "unknown",
        created_at=datetime.utcnow()
    )
    db.add(audit)
    await db.commit()
    await db.refresh(user)
    return user

@router.post("/login", response_model=TokenResponse)
async def login(data: UserLogin, request: Request, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == data.email, User.is_active == True))
    user = result.scalar_one_or_none()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    access_token  = create_access_token({"sub": user.id, "email": user.email, "role": user.role})
    refresh_token = create_refresh_token({"sub": user.id})
    # Update last login
    await db.execute(update(User).where(User.id == user.id).values(last_login=datetime.utcnow()))
    # Store session
    session = UserSession(
        id=str(uuid.uuid4()),
        user_id=user.id,
        access_token=access_token,
        refresh_token=refresh_token,
        ip_address=request.client.host if request.client else "unknown",
        user_agent=request.headers.get("user-agent", ""),
        is_active=True,
        created_at=datetime.utcnow(),
        expires_at=datetime.utcnow() + timedelta(minutes=60)
    )
    db.add(session)
    # Add Audit log
    audit = AuditLog(
        id=str(uuid.uuid4()),
        user_id=user.id,
        action="login",
        resource_type="session",
        resource_id=session.id,
        meta_data={"user_agent": request.headers.get("user-agent", "")},
        ip_address=request.client.host if request.client else "unknown",
        created_at=datetime.utcnow()
    )
    db.add(audit)
    await db.commit()
    return TokenResponse(access_token=access_token, refresh_token=refresh_token)

@router.get("/me", response_model=UserOut)
async def me(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/logout")
async def logout(current_user: User = Depends(get_current_user), token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)):
    await db.execute(update(UserSession).where(UserSession.access_token == token).values(is_active=False))
    # Add Audit log
    audit = AuditLog(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        action="logout",
        resource_type="session",
        meta_data={"email": current_user.email},
        ip_address="internal",
        created_at=datetime.utcnow()
    )
    db.add(audit)
    await db.commit()
    return {"message": "Logged out successfully"}
