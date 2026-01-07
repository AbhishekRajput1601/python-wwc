from pydantic_settings import BaseSettings
from typing import Optional
import json


class Settings(BaseSettings):
  
    APP_NAME: str = "WWC Backend"
    DEBUG: bool = False
    API_V1_PREFIX: str = "/api"
    
  
    HOST: str = "0.0.0.0"
    PORT: int = 5000
    
    MONGODB_URI: str
    DATABASE_NAME: str = "wwc"
    
    
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_DAYS: int = 7
    
  
    CLIENT_URL: str = "http://localhost:5174"
    ALLOWED_ORIGINS: list[str] = ["http://localhost:5174"]
    
   
    CLOUDINARY_CLOUD_NAME: str
    CLOUDINARY_API_KEY: str
    CLOUDINARY_API_SECRET: str
   
    WHISPER_MODEL_SIZE: str = "base"
    
    
    LIBRETRANSLATE_URL: str = "https://libretranslate.de/translate"
    
   
    UPLOAD_DIR: str = "uploads/captions"
    MAX_UPLOAD_SIZE: int = 100 * 1024 * 1024  
    
    SMTP_HOST: str | None = None
    SMTP_PORT: int | None = None
    SMTP_USER: str | None = None
    SMTP_PASS: str | None = None
    EMAIL_FROM: str | None = None
   
    SENDGRID_API_KEY: str | None = None
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        
        @classmethod
        def parse_env_var(cls, field_name: str, raw_val: str):
            if field_name == 'ALLOWED_ORIGINS':
            
                try:
                    return json.loads(raw_val)
                except json.JSONDecodeError:
                  
                    return [raw_val]
            return raw_val


settings = Settings()
