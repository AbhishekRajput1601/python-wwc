from datetime import datetime, timedelta
from typing import Optional
import logging
from passlib.context import CryptContext
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.config import settings
from app.db.session import get_db
from app.db.models import USERS_COLLECTION
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

logger = logging.getLogger(__name__)

pwd_context = CryptContext(schemes=["bcrypt_sha256"], deprecated="auto")
security = HTTPBearer()


def normalize_password(password: str) -> str:
    """Normalize and validate password input before hashing/verifying.

    - Ensures the value is a string
    - Strips surrounding whitespace
    - Truncates to 72 characters (bcrypt limit)
    - Logs length for temporary debugging
    """
    if not isinstance(password, str):
        raise ValueError("Password must be a string")

    # Log original length (temporary) to prove what is being hashed
    logger.error(f"PASSWORD LENGTH = {len(password)}")

    normalized = password.strip()[:72]
    logger.error(f"NORMALIZED PASSWORD LENGTH = {len(normalized)}")
    return normalized


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against a hashed password."""
    normalized = normalize_password(plain_password)
    return pwd_context.verify(normalized, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash a password.

    Normalizes the password before hashing to ensure we only ever pass
    the raw password string (max 72 bytes) into bcrypt.
    """
    normalized = normalize_password(password)
    return pwd_context.hash(normalized)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=settings.JWT_EXPIRE_DAYS)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> Optional[dict]:
    """Decode a JWT access token."""
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except JWTError:
        return None


async def get_current_user_id(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """Get the current user ID from the JWT token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    token = credentials.credentials
    payload = decode_access_token(token)
    
    if payload is None:
        raise credentials_exception
    
    user_id: str = payload.get("sub")
    if user_id is None:
        raise credentials_exception
    
    return user_id


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncIOMotorDatabase = Depends(get_db)
) -> dict:
    """Dependency that returns the current user document (raises 401 if invalid)."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not authorized to access this route",
        headers={"WWW-Authenticate": "Bearer"},
    )

    token = credentials.credentials
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception

    user_id: str = payload.get("sub")
    if not user_id:
        raise credentials_exception

    try:
        user = await db[USERS_COLLECTION].find_one({"_id": ObjectId(user_id)})
    except Exception:
        user = None

    if not user:
        raise credentials_exception

    return user


async def require_admin(
    user: dict = Depends(get_current_user)
) -> dict:
    """Dependency that ensures the current user has admin role."""
    if not user or user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Admins only."
        )
    return user
