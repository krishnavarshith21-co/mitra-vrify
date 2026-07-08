import hashlib
import secrets
import string
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def _prehash(password: str) -> str:
    """SHA-256 pre-hash so bcrypt never sees more than 64 bytes."""
    return hashlib.sha256(password.encode("utf-8")).hexdigest()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(_prehash(plain_password), hashed_password)

def hash_password(password: str) -> str:
    return pwd_context.hash(_prehash(password))

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def create_refresh_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def decode_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        return None

import json

def decode_supabase_token(token: str) -> Optional[dict]:
    try:
        secret = settings.SUPABASE_JWT_SECRET
        if secret.strip().startswith("{"):
            try:
                secret = json.loads(secret)
            except Exception:
                pass

        # Supabase JWTs use HS256 (Legacy) or ES256/RS256 (New Asymmetric Keys)
        return jwt.decode(
            token, 
            secret, 
            algorithms=["HS256", "ES256", "RS256"],
            options={"verify_aud": False}
        )
    except JWTError:
        return None

def generate_api_key(api_type: str) -> tuple[str, str]:
    """Returns (plaintext_key, key_hash)"""
    prefix_map = {"basic": "mv_basic", "advanced": "mv_adv", "enterprise": "mv_ent"}
    prefix = prefix_map.get(api_type, "mv_key")
    random_part = secrets.token_urlsafe(24)
    plaintext = f"{prefix}_{random_part}"
    key_hash = hashlib.sha256(plaintext.encode()).hexdigest()
    return plaintext, key_hash

def hash_api_key(plaintext_key: str) -> str:
    return hashlib.sha256(plaintext_key.encode()).hexdigest()

def get_key_prefix(plaintext_key: str) -> str:
    parts = plaintext_key.split("_")
    if len(parts) >= 3:
        suffix = parts[-1][-6:]
        return f"{parts[0]}_{parts[1]}...{suffix}"
    return plaintext_key[:12] + "..."
