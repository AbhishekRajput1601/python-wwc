from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Header
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import Optional

from app.db.session import get_db
from app.services.caption_service import CaptionService
from app.core.security import get_current_user_id
from app.db.models import USERS_COLLECTION
from app.models.caption import CaptionEntryCreate
import re
from datetime import datetime

router = APIRouter()


@router.get("/{meeting_id}", response_model=dict)
async def get_captions(
    meeting_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    caption_service = CaptionService(db)
    captions = await caption_service.get_captions(meeting_id)
    
    if not captions:
        return {
            "success": True,
            "captions": []
        }
    
    return {
        "success": True,
        "captions": captions.get("captions", [])
    }


@router.post("/{meeting_id}/transcribe", response_model=dict)
async def transcribe_audio(
    meeting_id: str,
    audio: UploadFile = File(...),
    language: Optional[str] = "en",
    translate: Optional[bool] = False,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
   
    caption_service = CaptionService(db)
    audio_data = await audio.read()
    mime_type = audio.content_type
    result = await caption_service.transcribe_audio(
        audio_data, 
        language, 
        translate, 
        mime_type
    )
    
    if not result.get("success"):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=result.get("message", "Transcription failed")
        )
    
    return result



@router.post("/{meeting_id}/transcribe/save", response_model=dict)
async def transcribe_and_save(
    meeting_id: str,
    audio: UploadFile = File(...),
    language: Optional[str] = None,
    translate: Optional[bool] = False,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    
    caption_service = CaptionService(db)

    audio_data = await audio.read()
    mime_type = audio.content_type

    result = await caption_service.transcribe_audio(audio_data, language, translate, mime_type)
    if not result.get("success"):
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=result.get("message", "Transcription failed"))

    detected_language = result.get("language")
    segments = result.get("captions", []) or []

  
    speaker_name = "Unknown"
    try:
        user_doc = await db[USERS_COLLECTION].find_one({"_id": user_id})
        if user_doc and user_doc.get("name"):
            speaker_name = user_doc.get("name")
    except Exception:
        pass

    saved_count = 0
    filtered = []

    for seg in segments:
        text = (seg.get("text") or "").strip()
        if not text or len(text) <= 2:
            continue

     
        letters = len(re.findall(r"[A-Za-zÀ-ÖØ-öø-ÿ]", text))
        alpha_ratio = letters / max(1, len(text))
        MIN_LETTERS = 2
        MIN_ALPHA_RATIO = 0.4

        if letters < MIN_LETTERS or alpha_ratio < MIN_ALPHA_RATIO:
            continue

        start = seg.get("start") or 0
        end = seg.get("end") or 0
        timestamp = datetime.utcfromtimestamp(start)
        duration = float(end - start) if end and start else 0.0

        entry = CaptionEntryCreate(
            speaker=user_id,
            speaker_name=speaker_name,
            original_text=text,
            original_language=detected_language or (language or "en"),
            translations=[],
            confidence=0.8,
            duration=duration,
            is_final=True
        )

        ok = await caption_service.add_caption(meeting_id, entry)
        if ok:
            saved_count += 1
            filtered.append({"timestamp": timestamp.isoformat(), "text": text, "duration": duration})

    return {"success": True, "captions": filtered, "saved": saved_count, "language": detected_language or (language or "en")} 



@router.post("/transcribe", response_model=dict)
async def transcribe_global(
    audio: UploadFile = File(...),
    meetingId: Optional[str] = Form(None),
    language: Optional[str] = Form(None),
    translate: Optional[bool] = Form(False),
    x_meeting_id: Optional[str] = Header(None, convert_underscores=False),
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_db)
):

    caption_service = CaptionService(db)

    meeting_id = meetingId or x_meeting_id
   

    audio_data = await audio.read()
    mime_type = audio.content_type

    result = await caption_service.transcribe_audio(audio_data, language, translate, mime_type)
    if not result.get("success"):
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=result.get("message", "Transcription failed"))

    detected_language = result.get("language")
    segments = result.get("captions", []) or []

    speaker_name = "Unknown"
    try:
        user_doc = await db["users"].find_one({"_id": user_id})
        if user_doc and user_doc.get("name"):
            speaker_name = user_doc.get("name")
    except Exception:
        pass

    saved_count = 0
    filtered = []

   
    import re
    from datetime import datetime

    for seg in segments:
        text = (seg.get("text") or "").strip()
        if not text or len(text) <= 2:
            continue

        letters = len(re.findall(r"[A-Za-zÀ-ÖØ-öø-ÿ]", text))
        alpha_ratio = letters / max(1, len(text))
        MIN_LETTERS = 2
        MIN_ALPHA_RATIO = 0.4
        if letters < MIN_LETTERS or alpha_ratio < MIN_ALPHA_RATIO:
            continue

        start = seg.get("start") or 0
        end = seg.get("end") or 0
        timestamp = datetime.utcfromtimestamp(start)
        duration = float(end - start) if end and start else 0.0

        if not meeting_id:
   
            filtered.append({"timestamp": timestamp.isoformat(), "text": text, "duration": duration})
            continue

        entry = CaptionEntryCreate(
            speaker=user_id,
            speaker_name=speaker_name,
            original_text=text,
            original_language=detected_language or (language or "en"),
            translations=[],
            confidence=0.8,
            duration=duration,
            is_final=True
        )

        ok = await caption_service.add_caption(meeting_id, entry)
        if ok:
            saved_count += 1
            filtered.append({"timestamp": timestamp.isoformat(), "text": text, "duration": duration})

    return {"success": True, "captions": filtered, "saved": saved_count, "language": detected_language or (language or "en")} 


@router.delete("/{meeting_id}", response_model=dict)
async def delete_captions(
    meeting_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    
    caption_service = CaptionService(db)
    deleted = await caption_service.delete_captions(meeting_id)
    
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Captions not found"
        )
    
    return {
        "success": True,
        "message": "Captions deleted successfully"
    }


@router.get("/{meeting_id}/download", response_model=dict)
async def download_captions(
    meeting_id: str,
    format: str = "txt",
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
   
    caption_service = CaptionService(db)
    captions = await caption_service.get_captions(meeting_id)
    
    if not captions:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Captions not found"
        )

    formatted_captions = caption_service.format_captions(
        captions.get("captions", []), 
        format
    )
    
    return {
        "success": True,
        "format": format,
        "data": formatted_captions
    }


@router.get("/{meeting_id}/export", response_model=dict)
async def export_captions(
    meeting_id: str,
    language: str = "en",
    format: str = "txt",
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
   
    caption_service = CaptionService(db)
    captions = await caption_service.get_captions(meeting_id)
    
    if not captions:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Captions not found"
        )
    formatted_captions = caption_service.format_captions(
        captions.get("captions", []), 
        format
    )
    
    return {
        "success": True,
        "format": format,
        "language": language,
        "data": formatted_captions
    }
