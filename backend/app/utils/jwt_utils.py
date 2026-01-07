from datetime import datetime, timedelta
from typing import Optional
from jose import jwt, JWTError
from app.core.config import settings


def generate_token(user_id: str) -> str:
   
    expire = datetime.utcnow() + timedelta(days=getattr(settings, "JWT_EXPIRE_DAYS", 7))
    payload = {"sub": str(user_id), "exp": expire}
    token = jwt.encode(payload, settings.JWT_SECRET, algorithm=getattr(settings, "JWT_ALGORITHM", "HS256"))
    return token


def verify_token(token: str) -> Optional[dict]:
 
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[getattr(settings, "JWT_ALGORITHM", "HS256")])
        return payload
    except JWTError:
        return None


__all__ = ["generate_token", "verify_token"]
