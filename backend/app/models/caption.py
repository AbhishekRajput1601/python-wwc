from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field
from bson import ObjectId


class Translation(BaseModel):
    language: str
    text: str
    confidence: float = 0.8


class CaptionEntry(BaseModel):
    speaker: Optional[str] = None
    speaker_name: Optional[str] = None
    original_text: str
    original_language: str = "en"
    translations: List[Translation] = []
    confidence: float = 0.8
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    duration: float = 0.0
    is_final: bool = False


class CaptionBase(BaseModel):
    meeting_id: str


class CaptionCreate(CaptionBase):
    pass


class CaptionInDB(CaptionBase):
    id: str = Field(alias="_id")
    captions: List[CaptionEntry] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}


class Caption(CaptionBase):
    id: str
    captions: List[CaptionEntry] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CaptionEntryCreate(BaseModel):
    speaker: Optional[str] = None
    speaker_name: Optional[str] = None
    original_text: str
    original_language: str = "en"
    translations: List[Translation] = []
    confidence: float = 0.8
    duration: float = 0.0
    is_final: bool = False
