from typing import Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field
from bson import ObjectId


class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)

    @classmethod
    def __modify_schema__(cls, field_schema):
        field_schema.update(type="string")


class UserPreferences(BaseModel):
    default_language: str = "en"
    captions_enabled: bool = True


class UserBase(BaseModel):
    name: str = Field(..., max_length=50)
    email: EmailStr


class UserCreate(UserBase):
    password: str = Field(..., min_length=4)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    userId: Optional[str] = None
    name: Optional[str] = Field(None, max_length=50)
    email: Optional[EmailStr] = None
    role: Optional[str] = None
    avatar: Optional[str] = None
    preferences: Optional[UserPreferences] = None


class UserInDB(UserBase):
    id: str = Field(alias="_id")
    password: str
    role: str = "user"
    avatar: str = ""
    preferences: UserPreferences = UserPreferences()
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}


class User(UserBase):
    id: str
    role: str = "user"
    avatar: str = ""
    preferences: UserPreferences = UserPreferences()
    created_at: datetime

    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: Optional[str] = None
