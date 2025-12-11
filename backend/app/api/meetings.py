from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import Optional

from app.db.session import get_db
from app.models.meeting import MeetingCreate, MeetingUpdate
from app.services.meeting_service import MeetingService
from app.core.security import get_current_user_id

router = APIRouter()


@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_meeting(
    meeting_data: MeetingCreate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_db)
):

    meeting_service = MeetingService(db)
    meeting = await meeting_service.create_meeting(meeting_data, user_id)
    
    return {
        "success": True,
        "meeting": meeting
    }


@router.get("/", response_model=dict)
async def get_meetings(
    skip: int = 0,
    limit: int = 100,
    status_filter: Optional[str] = None,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_db)
):

    meeting_service = MeetingService(db)
    meetings = await meeting_service.get_user_meetings(user_id, skip, limit, status_filter)
    
    return {
        "success": True,
        "meetings": meetings
    }


@router.get("/{meeting_id}", response_model=dict)
async def get_meeting(
    meeting_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
 
    meeting_service = MeetingService(db)
    meeting = await meeting_service.get_meeting_by_id(meeting_id)
    
    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meeting not found"
        )
    
    return {
        "success": True,
        "meeting": meeting
    }


@router.post("/{meeting_id}/join", response_model=dict)
async def join_meeting(
    meeting_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_db)
):

    meeting_service = MeetingService(db)
    meeting = await meeting_service.join_meeting(meeting_id, user_id)
    
    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meeting not found"
        )
    
    return {
        "success": True,
        "meeting": meeting
    }


@router.post("/{meeting_id}/leave", response_model=dict)
async def leave_meeting(
    meeting_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_db)
):

    meeting_service = MeetingService(db)
    success = await meeting_service.leave_meeting(meeting_id, user_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meeting not found or user not in meeting"
        )
    
    return {
        "success": True,
        "message": "Left meeting successfully"
    }


@router.put("/{meeting_id}", response_model=dict)
async def update_meeting(
    meeting_id: str,
    meeting_data: MeetingUpdate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_db)
):

    meeting_service = MeetingService(db)
    
    meeting = await meeting_service.get_meeting_by_id(meeting_id)
    if not meeting or meeting["host"] != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this meeting"
        )
    
    updated_meeting = await meeting_service.update_meeting(meeting_id, meeting_data)
    
    return {
        "success": True,
        "meeting": updated_meeting
    }


@router.post("/{meeting_id}/end", response_model=dict)
async def end_meeting(
    meeting_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
   
    meeting_service = MeetingService(db)

    meeting = await meeting_service.get_meeting_by_id(meeting_id)
    if not meeting or meeting["host"] != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to end this meeting"
        )
    
    ended_meeting = await meeting_service.end_meeting(meeting_id)
    
    return {
        "success": True,
        "meeting": ended_meeting
    }


@router.delete("/{meeting_id}", response_model=dict)
async def delete_meeting(
    meeting_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_db)
):

    meeting_service = MeetingService(db)

    meeting = await meeting_service.get_meeting_by_id(meeting_id)
    if not meeting or meeting["host"] != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this meeting"
        )
    
    deleted = await meeting_service.delete_meeting(meeting_id)
    
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meeting not found"
        )
    
    return {
        "success": True,
        "message": "Meeting deleted successfully"
    }


@router.post("/{meeting_id}/chat", response_model=dict)
async def send_chat_message(
    meeting_id: str,
    message: dict,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
 
    meeting_service = MeetingService(db)
    success = await meeting_service.add_chat_message(meeting_id, user_id, message["text"])
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meeting not found"
        )
    
    return {
        "success": True,
        "message": "Message sent successfully"
    }


@router.get("/{meeting_id}/chat", response_model=dict)
async def get_chat_history(
    meeting_id: str,
    limit: int = 100,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get chat history for a meeting."""
    meeting_service = MeetingService(db)
    messages = await meeting_service.get_chat_history(meeting_id, limit)
    
    return {
        "success": True,
        "messages": messages
    }
