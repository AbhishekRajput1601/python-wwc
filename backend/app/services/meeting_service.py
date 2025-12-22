from datetime import datetime
from typing import Optional, List
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
import uuid

from app.db.models import MEETINGS_COLLECTION, USERS_COLLECTION
from app.models.meeting import MeetingCreate, MeetingUpdate
import tempfile
import os
import time
import asyncio
import logging

from app.core.cloudinary import upload_file as cloudinary_upload_file


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
            # Maintain backward compatibility with existing unique index on camelCase
            "meetingId": meeting_id,
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
            serialized = self._serialize_meeting(meeting)
            # enrich host info
            try:
                host_id = meeting.get("host")
                host_doc = None
                if host_id:
                    try:
                        host_doc = await self.users_collection.find_one({"_id": ObjectId(host_id)})
                    except Exception:
                        host_doc = await self.users_collection.find_one({"_id": host_id})

                if host_doc:
                    serialized["host"] = {"id": str(host_doc["_id"]), "name": host_doc.get("name"), "email": host_doc.get("email")}
                else:
                    # preserve any host_info if present
                    if meeting.get("host_info"):
                        serialized["host"] = meeting.get("host_info")
            except Exception:
                pass

            # enrich participants
            try:
                participant_details = await self.get_meeting_participants(meeting_id)
                serialized["participants"] = participant_details
            except Exception:
                pass

            return serialized
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

        serialized = [self._serialize_meeting(m) for m in meetings]

        # enrich host and participants for each meeting
        for idx, m in enumerate(meetings):
            try:
                host_id = m.get("host")
                host_doc = None
                if host_id:
                    try:
                        host_doc = await self.users_collection.find_one({"_id": ObjectId(host_id)})
                    except Exception:
                        host_doc = await self.users_collection.find_one({"_id": host_id})

                if host_doc:
                    serialized[idx]["host"] = {"id": str(host_doc["_id"]), "name": host_doc.get("name"), "email": host_doc.get("email")}
                else:
                    if m.get("host_info"):
                        serialized[idx]["host"] = m.get("host_info")
            except Exception:
                pass

            try:
                participant_details = await self.get_meeting_participants(m.get("meeting_id"))
                serialized[idx]["participants"] = participant_details
            except Exception:
                pass

        return serialized
    
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
            # After ending the meeting, gather captions (if any), generate a captions file,
            # upload it and attach its URL to the meeting document so it appears in user profiles.
            try:
                from app.services.caption_service import CaptionService
                db = self.db
                caption_service = CaptionService(db)
                caps = await caption_service.get_captions(meeting_id)
                if caps and caps.get("captions"):
                    formatted = caption_service.format_captions(caps.get("captions", []), format="txt")
                    # persist to temp file and upload via cloudinary helper
                    tmp_fd = None
                    tmp_path = None
                    try:
                        import tempfile, os
                        fd, tmp_path = tempfile.mkstemp(suffix=".txt", prefix="captions_")
                        tmp_fd = fd
                        with os.fdopen(fd, "w", encoding="utf-8") as f:
                            f.write(formatted)

                        # upload to cloudinary (use 'raw' resource type for text files)
                        from app.core.cloudinary import upload_file as cloudinary_upload_file
                        extra = {"resource_type": "raw", "folder": "captions", "use_filename": True, "unique_filename": True}
                        try:
                            upload_res = await asyncio.to_thread(cloudinary_upload_file, tmp_path, None, None, extra)
                            url = upload_res.get("secure_url") or upload_res.get("url")
                            if url:
                                await self.collection.update_one({"meeting_id": meeting_id}, {"$set": {"captions_text": formatted, "captions_file_path": url}})
                        except Exception:
                       
                            await self.collection.update_one({"meeting_id": meeting_id}, {"$set": {"captions_text": formatted}})
                    finally:
                        try:
                            if tmp_path and os.path.exists(tmp_path):
                                os.remove(tmp_path)
                        except Exception:
                            pass
            except Exception:

                pass

            updated = await self.collection.find_one({"meeting_id": meeting_id})
            return self._serialize_meeting(updated)
        return None

    async def add_user_in_meeting(self, meeting_id: str, user_id: str) -> Optional[dict]:
        """Add a user into meeting participants if not already present."""
        meeting = await self.collection.find_one({"meeting_id": meeting_id})
        if not meeting:
            return None

        already = any(p.get("user") == user_id for p in meeting.get("participants", []))
        if already:
            return self._serialize_meeting(meeting)

        participant = {
            "user": user_id,
            "joined_at": datetime.utcnow(),
            "left_at": None,
            "is_active": True
        }

        await self.collection.update_one({"meeting_id": meeting_id}, {"$push": {"participants": participant}})
        updated = await self.collection.find_one({"meeting_id": meeting_id})
        return self._serialize_meeting(updated)

    async def upload_recording(self, meeting_id: str, user_id: str, file_bytes: bytes, filename: str) -> Optional[dict]:

        meeting = await self.collection.find_one({"meeting_id": meeting_id})
        if not meeting:
            return None

        rec_id = str(ObjectId())
        file_size = len(file_bytes) if file_bytes is not None else 0

        placeholder = {
            "id": rec_id,
            "public_id": None,
            "url_high": None,
            "url_low": None,
            "duration": None,
            "bytes": file_size,
            "uploaded_at": datetime.utcnow(),
            "uploaded_by": user_id,
            "status": "processing"
        }

        await self.collection.update_one({"meeting_id": meeting_id}, {"$push": {"recordings": placeholder}})

        # Persist bytes to a temp file for upload
        tmp_path = None
        try:
            fd, tmp_path = tempfile.mkstemp(suffix=os.path.splitext(filename)[1] or ".mp4")
            with os.fdopen(fd, "wb") as tmp_file:
                tmp_file.write(file_bytes)

            upload_options = {
                "resource_type": "video",
                "folder": "meetings",
                "use_filename": True,
                "unique_filename": True,
                "overwrite": False,
                "eager": [{"format": "mp4", "quality": "auto:low", "width": 144, "crop": "limit"}]
            }

            RETRIES = 3
            upload_result = None
            for attempt in range(1, RETRIES + 1):
                try:

                    upload_result = await asyncio.to_thread(
                        cloudinary_upload_file,
                        tmp_path,
                        None,
                        None,
                        upload_options,
                    )
                    break
                except Exception as exc:
                    logging.exception("Cloudinary upload attempt %s failed", attempt)
                    if attempt == RETRIES:
                        raise
                    time.sleep(1 * attempt)

            if upload_result:
                update_fields = {
                    "recordings.$[r].public_id": upload_result.get("public_id"),
                    "recordings.$[r].url_high": upload_result.get("secure_url") or upload_result.get("url"),
                    "recordings.$[r].url_low": (upload_result.get("eager") and upload_result.get("eager")[0].get("secure_url")) or None,
                    "recordings.$[r].duration": upload_result.get("duration"),
                    "recordings.$[r].bytes": upload_result.get("bytes") or file_size,
                    "recordings.$[r].uploaded_at": datetime.utcnow(),
                    "recordings.$[r].status": "ready"
                }

                await self.collection.update_one({"meeting_id": meeting_id}, {"$set": update_fields}, array_filters=[{"r.id": rec_id}])
                updated_meeting = await self.collection.find_one({"meeting_id": meeting_id})
                # return the recording metadata
                recs = updated_meeting.get("recordings", [])
                for r in recs:
                    if r.get("id") == rec_id:
                        return r

        except Exception as exc:
            logging.exception("Failed to upload recording for meeting %s: %s", meeting_id, exc)
            # mark recording as failed
            try:
                await self.collection.update_one({"meeting_id": meeting_id}, {"$set": {"recordings.$[r].status": "failed"}}, array_filters=[{"r.id": rec_id}])
            except Exception:
                logging.exception("Failed to mark recording status as failed in DB for meeting %s", meeting_id)
            return None
        finally:
            try:
                if tmp_path and os.path.exists(tmp_path):
                    os.remove(tmp_path)
            except Exception:
                pass

        return None

    async def get_recordings_for_user(self, meeting_id: str, user_id: str) -> List[dict]:
        meeting = await self.collection.find_one({"meeting_id": meeting_id})
        if not meeting:
            return []
        recs = meeting.get("recordings", [])
        return [r for r in recs if r.get("uploaded_by") == user_id]

    async def get_recording_by_id(self, meeting_id: str, recording_id: str) -> Optional[dict]:
        meeting = await self.collection.find_one({"meeting_id": meeting_id})
        if not meeting:
            return None
        for r in meeting.get("recordings", []):
            if r.get("id") == recording_id:
                return r
        return None

    async def get_meeting_captions_text(self, meeting_id: str) -> Optional[str]:
        meeting = await self.collection.find_one({"meeting_id": meeting_id})
        if not meeting:
            return None
        return meeting.get("captions_text")
    
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
        def _fmt(dt):
            if not dt:
                return None
            try:
                if dt.tzinfo is None:
                    return dt.isoformat() + "Z"
                return dt.isoformat()
            except Exception:
                try:
                    return dt.isoformat()
                except Exception:
                    return None

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
            "startTime": _fmt(meeting.get("start_time")),
            "start_time": _fmt(meeting.get("start_time")),
            "endTime": _fmt(meeting.get("end_time")),
            "end_time": _fmt(meeting.get("end_time")),
            "captionsText": meeting.get("captions_text"),
            "captions_text": meeting.get("captions_text"),
            "captionsFilePath": meeting.get("captions_file_path"),
            "captions_file_path": meeting.get("captions_file_path"),
            "messages": meeting.get("messages", []),
            "createdAt": _fmt(meeting.get("created_at")),
            "created_at": _fmt(meeting.get("created_at"))
        }

    '''get all participants in a meeting '''
    async def get_meeting_participants(self, meeting_id: str) -> List[dict]:
        """Get all participants in a meeting."""
        meeting = await self.collection.find_one({"meeting_id": meeting_id})
        if not meeting:
            return []
        
        participants = meeting.get("participants", [])
        participant_details = []
        
        for participant in participants:
            user = await self.users_collection.find_one({"_id": ObjectId(participant["user"])})
            participant_details.append({
                "user_id": participant["user"],
                "name": user["name"] if user else "Unknown",
                "email": user["email"] if user else "Unknown",
                "joined_at": participant.get("joined_at").isoformat() if participant.get("joined_at") else None,
                "left_at": participant.get("left_at").isoformat() if participant.get("left_at") else None,
                "is_active": participant.get("is_active", False)
            })
        
        return participant_details