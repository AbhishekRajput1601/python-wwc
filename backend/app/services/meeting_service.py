from datetime import datetime
from typing import Optional, List
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
import uuid

from app.db.models import MEETINGS_COLLECTION, USERS_COLLECTION
from app.models.meeting import MeetingCreate, MeetingUpdate


class MeetingService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.collection = db[MEETINGS_COLLECTION]
        self.users_collection = db[USERS_COLLECTION]
    
    async def create_meeting(self, meeting_data: MeetingCreate, host_id: str) -> dict:
        """Create a new meeting."""
        meeting_id = str(uuid.uuid4())
        
        meeting_dict = {
            "meeting_id": meeting_id,
            "title": meeting_data.title,
            "description": meeting_data.description,
            "host": host_id,
            "participants": [],
            "status": "scheduled",
            "settings": {
                "allow_captions": meeting_data.settings.allow_captions,
                "allow_translation": meeting_data.settings.allow_translation,
                "max_participants": meeting_data.settings.max_participants,
                "is_recording": meeting_data.settings.is_recording
            },
            "recordings": [],
            "start_time": None,
            "end_time": None,
            "captions_text": None,
            "captions_file_path": None,
            "messages": [],
            "created_at": datetime.utcnow()
        }
        
        result = await self.collection.insert_one(meeting_dict)
        meeting_dict["_id"] = result.inserted_id
        
     
        host = await self.users_collection.find_one({"_id": ObjectId(host_id)})
        meeting_dict["host_info"] = {
            "id": host_id,
            "name": host["name"],
            "email": host["email"]
        } if host else None
        
        return self._serialize_meeting(meeting_dict)
    
    async def get_meeting_by_id(self, meeting_id: str) -> Optional[dict]:
        """Get meeting by meeting_id."""
        meeting = await self.collection.find_one({"meeting_id": meeting_id})
        if meeting:
            return self._serialize_meeting(meeting)
        return None
    
    async def get_user_meetings(
        self, 
        user_id: str, 
        skip: int = 0, 
        limit: int = 100,
        status_filter: Optional[str] = None
    ) -> List[dict]:
        """Get meetings for a user."""
        query = {
            "$or": [
                {"host": user_id},
                {"participants.user": user_id}
            ]
        }
        
        if status_filter:
            query["status"] = status_filter
        
        cursor = self.collection.find(query).sort("created_at", -1).skip(skip).limit(limit)
        meetings = await cursor.to_list(length=limit)
        
        return [self._serialize_meeting(m) for m in meetings]
    
    async def join_meeting(self, meeting_id: str, user_id: str) -> Optional[dict]:
        """Join a meeting."""
        meeting = await self.collection.find_one({"meeting_id": meeting_id})
        
        if not meeting:
            return None
        
        if meeting["status"] == "ended":
            return None
     
        existing_participant = None
        for p in meeting.get("participants", []):
            if p.get("user") == user_id:
                existing_participant = p
                break
        
        if existing_participant:
   
            await self.collection.update_one(
                {"meeting_id": meeting_id, "participants.user": user_id},
                {
                    "$set": {
                        "participants.$.is_active": True,
                        "participants.$.joined_at": datetime.utcnow(),
                        "participants.$.left_at": None
                    }
                }
            )
        else:

            participant = {
                "user": user_id,
                "joined_at": datetime.utcnow(),
                "left_at": None,
                "is_active": True
            }
            
            update_data = {"$push": {"participants": participant}}
            
       
            if meeting["host"] == user_id and meeting["status"] == "scheduled":
                update_data["$set"] = {
                    "status": "active",
                    "start_time": datetime.utcnow()
                }
            
            await self.collection.update_one(
                {"meeting_id": meeting_id},
                update_data
            )
   
        updated_meeting = await self.collection.find_one({"meeting_id": meeting_id})
        return self._serialize_meeting(updated_meeting)
    
    async def leave_meeting(self, meeting_id: str, user_id: str) -> bool:
        """Leave a meeting."""
        result = await self.collection.update_one(
            {"meeting_id": meeting_id, "participants.user": user_id},
            {
                "$set": {
                    "participants.$.is_active": False,
                    "participants.$.left_at": datetime.utcnow()
                }
            }
        )
        
        return result.modified_count > 0
    
    async def update_meeting(self, meeting_id: str, meeting_data: MeetingUpdate) -> Optional[dict]:
        """Update meeting."""
        update_dict = meeting_data.model_dump(exclude_unset=True)
        
        if not update_dict:
            return None
        
     
        if "settings" in update_dict and update_dict["settings"]:
            update_dict["settings"] = update_dict["settings"].model_dump()
        
        result = await self.collection.find_one_and_update(
            {"meeting_id": meeting_id},
            {"$set": update_dict},
            return_document=True
        )
        
        if result:
            return self._serialize_meeting(result)
        return None
    
    async def end_meeting(self, meeting_id: str) -> Optional[dict]:
        """End a meeting."""
        result = await self.collection.find_one_and_update(
            {"meeting_id": meeting_id},
            {
                "$set": {
                    "status": "ended",
                    "end_time": datetime.utcnow()
                }
            },
            return_document=True
        )
        
        if result:
            return self._serialize_meeting(result)
        return None
    
    async def delete_meeting(self, meeting_id: str) -> bool:
        """Delete a meeting."""
        result = await self.collection.delete_one({"meeting_id": meeting_id})
        return result.deleted_count > 0
    
    async def add_chat_message(self, meeting_id: str, user_id: str, text: str) -> bool:
        """Add a chat message to a meeting."""
        user = await self.users_collection.find_one({"_id": ObjectId(user_id)})
        
        message = {
            "sender": user_id,
            "sender_name": user["name"] if user else "Unknown",
            "text": text,
            "timestamp": datetime.utcnow()
        }
        
        result = await self.collection.update_one(
            {"meeting_id": meeting_id},
            {"$push": {"messages": message}}
        )
        
        return result.modified_count > 0
    
    async def get_chat_history(self, meeting_id: str, limit: int = 100) -> List[dict]:
        """Get chat history for a meeting."""
        meeting = await self.collection.find_one(
            {"meeting_id": meeting_id},
            {"messages": {"$slice": -limit}}
        )
        
        if not meeting:
            return []
        
        messages = meeting.get("messages", [])
        return [
            {
                "sender_id": str(m.get("sender")),
                "sender_name": m.get("sender_name", "Unknown"),
                "text": m.get("text"),
                "timestamp": m.get("timestamp").isoformat() if m.get("timestamp") else None
            }
            for m in messages
        ]
    
    def _serialize_meeting(self, meeting: dict) -> dict:
        """Serialize meeting for response."""
        return {
            "id": str(meeting["_id"]),
            "meetingId": meeting["meeting_id"],  
            "meeting_id": meeting["meeting_id"], 
            "title": meeting["title"],
            "description": meeting.get("description"),
            "host": meeting["host"],
            "participants": meeting.get("participants", []),
            "status": meeting["status"],
            "settings": meeting.get("settings", {}),
            "recordings": meeting.get("recordings", []),
            "startTime": meeting.get("start_time").isoformat() if meeting.get("start_time") else None,
            "start_time": meeting.get("start_time").isoformat() if meeting.get("start_time") else None,
            "endTime": meeting.get("end_time").isoformat() if meeting.get("end_time") else None,
            "end_time": meeting.get("end_time").isoformat() if meeting.get("end_time") else None,
            "captionsText": meeting.get("captions_text"),
            "captions_text": meeting.get("captions_text"),
            "captionsFilePath": meeting.get("captions_file_path"),
            "captions_file_path": meeting.get("captions_file_path"),
            "messages": meeting.get("messages", []),
            "createdAt": meeting["created_at"].isoformat() if meeting.get("created_at") else None,
            "created_at": meeting["created_at"].isoformat() if meeting.get("created_at") else None
        }
