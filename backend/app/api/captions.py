from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import Optional

from app.db.session import get_db
from app.services.caption_service import CaptionService
from app.core.security import get_current_user_id

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
    """Transcribe audio file using Whisper."""
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


@router.delete("/{meeting_id}", response_model=dict)
async def delete_captions(
    meeting_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Delete captions for a meeting."""
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
    """Download captions in specified format."""
    caption_service = CaptionService(db)
    captions = await caption_service.get_captions(meeting_id)
    
    if not captions:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Captions not found"
        )
    
    # Format captions based on requested format
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
    """Export captions for a specific language in specified format."""
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
