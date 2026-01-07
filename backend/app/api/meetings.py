from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import Optional

from app.db.session import get_db
from app.models.meeting import MeetingCreate, MeetingUpdate
from app.services.meeting_service import MeetingService
from app.sockets.socket_manager import sio
from app.core.security import get_current_user_id
from fastapi.responses import PlainTextResponse

router = APIRouter()


def _host_id_from_meeting(meeting: dict) -> Optional[str]:

    if not meeting:
        return None
    host = meeting.get("host")
    if isinstance(host, dict):
        return host.get("id")
    return str(host) if host is not None else None


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
   
    meeting = await meeting_service.get_meeting_by_id(meeting_id)
    if not meeting:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting not found")

    if meeting.get("status") == "ended":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This meeting has ended.")

    meeting = await meeting_service.join_meeting(meeting_id, user_id)
    if not meeting:
    
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to join meeting")
    
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
    host_id = _host_id_from_meeting(meeting)
    if not meeting or host_id != user_id:
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
    host_id = _host_id_from_meeting(meeting)
    if not meeting or host_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to end this meeting"
        )
    
    ended_meeting = await meeting_service.end_meeting(meeting_id)
   
    try:
        await sio.emit("meeting-ended", {"meetingId": meeting_id, "reason": "ended_by_host"}, room=meeting_id)
    except Exception:
    
        pass

    return {
        "success": True,
        "meeting": ended_meeting
    }


@router.delete("/{meeting_id}", response_model=dict)
@router.delete("/delete-meeting/{meeting_id}", response_model=dict)
async def delete_meeting(
    meeting_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_db)
):

    meeting_service = MeetingService(db)

    meeting = await meeting_service.get_meeting_by_id(meeting_id)
    host_id = _host_id_from_meeting(meeting)
    if not meeting or host_id != user_id:
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



@router.post("/add-user-in-meeting", response_model=dict)
async def add_user_in_meeting(
    payload: dict,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_db)
):

    meeting_id = payload.get("meetingId") or payload.get("meeting_id")
    target_user = payload.get("userId") or payload.get("user_id")
    if not meeting_id or not target_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="meetingId and userId are required")

    meeting_service = MeetingService(db)
    meeting = await meeting_service.get_meeting_by_id(meeting_id)
    if not meeting:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting not found")

    if meeting.get("status") == "ended":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This meeting has ended.")

    host_id = _host_id_from_meeting(meeting)
    is_host = host_id == user_id
    if str(target_user) != str(user_id) and not is_host:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to add users to this meeting")

    updated = await meeting_service.add_user_in_meeting(meeting_id, target_user)
    if not updated:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to add user to meeting")

    return {"success": True, "message": "User added to meeting", "data": updated}




@router.post("/{meeting_id}/recordings", response_model=dict)
async def upload_recording(
    meeting_id: str,
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    meeting_service = MeetingService(db)

   
    meeting = await meeting_service.get_meeting_by_id(meeting_id)
    if not meeting:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting not found")
    host_id = _host_id_from_meeting(meeting)
    is_host = host_id == user_id
    participants = meeting.get("participants", [])
    is_participant = any((p.get("user") == user_id) for p in participants)
    

    if not (is_host or is_participant):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to upload recordings for this meeting")

    contents = await file.read()
    recording = await meeting_service.upload_recording(meeting_id, user_id, contents, file.filename or "upload.mp4")

    if not recording:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to upload recording")

    return {"success": True, "recording": recording}


@router.get("/{meeting_id}/recordings", response_model=dict)
async def get_recordings(
    meeting_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    meeting_service = MeetingService(db)
    recs = await meeting_service.get_recordings_for_user(meeting_id, user_id)
    return {"success": True, "recordings": recs}


@router.get("/{meeting_id}/recordings/{recording_id}", response_model=dict)
async def get_recording(
    meeting_id: str,
    recording_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    meeting_service = MeetingService(db)
    rec = await meeting_service.get_recording_by_id(meeting_id, recording_id)
    if not rec:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recording not found")

  
    if rec.get("uploaded_by") != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to view this recording")

    return {"success": True, "recording": rec}


@router.get("/{meeting_id}/captions", response_model=dict)
async def get_meeting_captions(
    meeting_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    
    meeting_service = MeetingService(db)
    meeting = await meeting_service.get_meeting_by_id(meeting_id)
    if not meeting:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting not found")

    host_id = _host_id_from_meeting(meeting)
    is_host = host_id == user_id
    participants = meeting.get("participants", [])
    is_participant = any((p.get("user") == user_id) for p in participants)

    if not (is_host or is_participant):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to view captions")

    captions_text = meeting.get("captions_text")
    captions_file_path = meeting.get("captions_file_path")
    
    if not captions_text and not captions_file_path:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No captions available for this meeting")

    return {
        "success": True,
        "captions_text": captions_text or "",
        "captions_file_path": captions_file_path,
        "meeting_id": meeting_id
    }


@router.get("/{meeting_id}/captions/text", response_class=PlainTextResponse)
async def get_meeting_captions_text(
    meeting_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    meeting_service = MeetingService(db)
    meeting = await meeting_service.get_meeting_by_id(meeting_id)
    if not meeting:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting not found")

    is_host = meeting.get("host") == user_id
    participants = meeting.get("participants", [])
    is_participant = any((p.get("user") == user_id) for p in participants)

    if not (is_host or is_participant):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to view captions")

    text = await meeting_service.get_meeting_captions_text(meeting_id)
    if not text:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No captions available for this meeting")

    return PlainTextResponse(content=text)


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
    
    meeting_service = MeetingService(db)
    messages = await meeting_service.get_chat_history(meeting_id, limit)
    
    return {
        "success": True,
        "messages": messages
    }
