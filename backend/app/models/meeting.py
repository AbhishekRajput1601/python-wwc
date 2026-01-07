from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field
from bson import ObjectId


class MeetingSettings(BaseModel):
    allow_captions: bool = True
    allow_translation: bool = True
    max_participants: int = 50
    is_recording: bool = False


class Participant(BaseModel):
    user: str
    joined_at: datetime = Field(default_factory=datetime.utcnow)
    left_at: Optional[datetime] = None
    is_active: bool = True


class Recording(BaseModel):
    public_id: Optional[str] = None
    url_high: Optional[str] = None
    url_low: Optional[str] = None
    duration: Optional[int] = None
    bytes: Optional[int] = None
    uploaded_at: Optional[datetime] = None
    uploaded_by: Optional[str] = None
    status: str = "pending"


class ChatMessage(BaseModel):
    sender: Optional[str] = None
    sender_name: str
    text: str = Field(..., max_length=2000)
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class MeetingBase(BaseModel):
    title: str = Field(..., max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    settings: MeetingSettings = MeetingSettings()


class MeetingCreate(MeetingBase):
    pass


class MeetingUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    settings: Optional[MeetingSettings] = None
    status: Optional[str] = None


class MeetingInDB(MeetingBase):
    id: str = Field(alias="_id")
    meeting_id: str
    host: str
    participants: List[Participant] = []
    status: str = "scheduled"  
    recordings: List[Recording] = []
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    captions_text: Optional[str] = None
    captions_file_path: Optional[str] = None
    messages: List[ChatMessage] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}


class Meeting(MeetingBase):
    id: str
    meeting_id: str
    host: str
    participants: List[Participant] = []
    status: str = "scheduled"
    recordings: List[Recording] = []
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    captions_text: Optional[str] = None
    captions_file_path: Optional[str] = None
    messages: List[ChatMessage] = []
    created_at: datetime

    class Config:
        from_attributes = True
