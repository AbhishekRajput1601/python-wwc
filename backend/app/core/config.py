from pydantic_settings import BaseSettings
from typing import Optional
import json


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "WWC Backend"
    DEBUG: bool = False
    API_V1_PREFIX: str = "/api"
    
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 5000
    
    # Database
    MONGODB_URI: str
    DATABASE_NAME: str = "wwc"
    
    # JWT
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_DAYS: int = 7
    
    # CORS
    CLIENT_URL: str = "http://localhost:5174"
    ALLOWED_ORIGINS: list[str] = ["http://localhost:5174"]
    
    # Cloudinary
    CLOUDINARY_CLOUD_NAME: str
    CLOUDINARY_API_KEY: str
    CLOUDINARY_API_SECRET: str
    
    # Whisper Service
    WHISPER_MODEL_SIZE: str = "base"
    
    # LibreTranslate
    LIBRETRANSLATE_URL: str = "https://libretranslate.de/translate"
    
    # File Upload
    UPLOAD_DIR: str = "uploads/captions"
    MAX_UPLOAD_SIZE: int = 100 * 1024 * 1024  # 100MB
    # Email / SMTP
    SMTP_HOST: str | None = None
    SMTP_PORT: int | None = None
    SMTP_USER: str | None = None
    SMTP_PASS: str | None = None
    EMAIL_FROM: str | None = None
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        
        @classmethod
        def parse_env_var(cls, field_name: str, raw_val: str):
            if field_name == 'ALLOWED_ORIGINS':
                # Parse JSON list from environment
                try:
                    return json.loads(raw_val)
                except json.JSONDecodeError:
                    # Fallback to single URL
                    return [raw_val]
            return raw_val


settings = Settings()
