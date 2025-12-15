from datetime import datetime
from typing import Optional, List
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
import tempfile
import os
from faster_whisper import WhisperModel

from app.db.models import CAPTIONS_COLLECTION
from app.core.config import settings
from app.models.caption import CaptionEntryCreate


class CaptionService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.collection = db[CAPTIONS_COLLECTION]
  
        self.whisper_model = WhisperModel(
            settings.WHISPER_MODEL_SIZE,
            device="cpu",
            compute_type="int8"
        )
    
    async def get_captions(self, meeting_id: str) -> Optional[dict]:
        """Get captions for a meeting."""
        captions = await self.collection.find_one({"meeting_id": meeting_id})
        if captions:
            return self._serialize_captions(captions)
        return None
    
    async def create_captions(self, meeting_id: str) -> dict:
        """Create captions document for a meeting."""
        captions_dict = {
            "meeting_id": meeting_id,
            "captions": [],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        result = await self.collection.insert_one(captions_dict)
        captions_dict["_id"] = result.inserted_id
        return self._serialize_captions(captions_dict)
    
    async def add_caption(self, meeting_id: str, caption: CaptionEntryCreate) -> bool:
        """Add a caption entry to a meeting."""
     
        existing = await self.collection.find_one({"meeting_id": meeting_id})
        
        if not existing:
       
            await self.create_captions(meeting_id)
        
        caption_entry = {
            "speaker": caption.speaker,
            "speaker_name": caption.speaker_name,
            "original_text": caption.original_text,
            "original_language": caption.original_language,
            "translations": [t.model_dump() for t in caption.translations],
            "confidence": caption.confidence,
            "timestamp": datetime.utcnow(),
            "duration": caption.duration,
            "is_final": caption.is_final
        }
        
        result = await self.collection.update_one(
            {"meeting_id": meeting_id},
            {
                "$push": {"captions": caption_entry},
                "$set": {"updated_at": datetime.utcnow()}
            }
        )
        
        return result.modified_count > 0
    
    async def transcribe_audio(
        self,
        audio_data: bytes,
        language: Optional[str] = None,
        translate: bool = False,
        mime_type: Optional[str] = None
    ) -> dict:
        """Transcribe audio using Whisper model."""
        try:
  
            fd, temp_path = tempfile.mkstemp(suffix='.wav', prefix='whisper_tmp_')
            os.close(fd)
            
            try:
        
                with open(temp_path, 'wb') as f:
                    f.write(audio_data)
                
           
                if not os.path.exists(temp_path):
                    raise FileNotFoundError(f"Saved temp file not found: {temp_path}")
                
           
                segments, info = self.whisper_model.transcribe(
                    temp_path,
                    language=language,
                    task='translate' if translate else 'transcribe'
                )
                
    
                captions = []
                for segment in segments:
                    captions.append({
                        'start': segment.start,
                        'end': segment.end,
                        'text': segment.text
                    })
                
                return {
                    'success': True,
                    'language': info.language,
                    'captions': captions
                }
            
            finally:
  
                try:
                    if os.path.exists(temp_path):
                        os.remove(temp_path)
                except Exception:
                    pass
        
        except Exception as e:
            print(f'Whisper transcription error: {e}')
            return {
                'success': False,
                'message': 'Transcription failed',
                'error': str(e)
            }
    
    async def delete_captions(self, meeting_id: str) -> bool:
        """Delete captions for a meeting."""
        result = await self.collection.delete_one({"meeting_id": meeting_id})
        return result.deleted_count > 0
    
    def format_captions(self, captions: List[dict], format: str = "txt") -> str:
        """Format captions for download."""
        if format == "txt":
            lines = []
            for caption in captions:
                timestamp = caption.get("timestamp", "")
                speaker = caption.get("speaker_name", "Unknown")
                text = caption.get("original_text", "")
                lines.append(f"[{timestamp}] {speaker}: {text}")
            return "\n".join(lines)
        
        elif format == "srt":
            lines = []
            for i, caption in enumerate(captions, 1):
                start = caption.get("timestamp", "00:00:00,000")
                duration = caption.get("duration", 0)
            
                end = start
                text = caption.get("original_text", "")
                
                lines.append(str(i))
                lines.append(f"{start} --> {end}")
                lines.append(text)
                lines.append("")
            return "\n".join(lines)
        
        elif format == "vtt":
            lines = ["WEBVTT", ""]
            for caption in captions:
                start = caption.get("timestamp", "00:00:00.000")
                duration = caption.get("duration", 0)
                end = start
                text = caption.get("original_text", "")
                
                lines.append(f"{start} --> {end}")
                lines.append(text)
                lines.append("")
            return "\n".join(lines)
        
        else:
            return ""
    
    def _serialize_captions(self, captions: dict) -> dict:
        """Serialize captions for response."""
        return {
            "id": str(captions["_id"]),
            "meeting_id": captions["meeting_id"],
            "captions": captions.get("captions", []),
            "created_at": captions["created_at"].isoformat() if captions.get("created_at") else None,
            "updated_at": captions["updated_at"].isoformat() if captions.get("updated_at") else None
        }
