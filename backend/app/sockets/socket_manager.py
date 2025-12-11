import socketio
from typing import Dict, Set
import logging

from app.core.config import settings


sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins=settings.ALLOWED_ORIGINS,
    logger=True,
    engineio_logger=True
)

# Store active connections
active_meetings: Dict[str, Set[str]] = {}  
socket_to_meeting: Dict[str, str] = {} 
socket_to_user: Dict[str, dict] = {}  

logger = logging.getLogger(__name__)


@sio.event
async def connect(sid, environ):
    """Handle client connection."""
    logger.info(f"Socket connected: {sid}")


@sio.event
async def disconnect(sid):
    """Handle client disconnection."""
    logger.info(f"Socket disconnected: {sid}")
 
    if sid in socket_to_meeting:
        meeting_id = socket_to_meeting[sid]
        
        if meeting_id in active_meetings:
            active_meetings[meeting_id].discard(sid)
            
            if not active_meetings[meeting_id]:
                del active_meetings[meeting_id]
        
        del socket_to_meeting[sid]
    
    if sid in socket_to_user:
        del socket_to_user[sid]


@sio.event
async def join_meeting(sid, data):
    """Handle user joining a meeting."""
    meeting_id = data.get("meetingId")
    user_id = data.get("userId")
    user_name = data.get("userName", "User")
    
    logger.info(f"User {user_name} ({user_id}) joining meeting: {meeting_id}")

    await sio.enter_room(sid, meeting_id)
 
    socket_to_meeting[sid] = meeting_id
    socket_to_user[sid] = {"id": user_id, "name": user_name}
    
    if meeting_id not in active_meetings:
        active_meetings[meeting_id] = set()
    active_meetings[meeting_id].add(sid)
    

    await sio.emit(
        "user-joined",
        {
            "userId": user_id,
            "userName": user_name,
            "socketId": sid
        },
        room=meeting_id,
        skip_sid=sid
    )
    
 
    await sio.emit(
        "ice-servers",
        {
            "iceServers": [
                {"urls": "stun:stun.l.google.com:19302"},
                {"urls": "stun:stun1.l.google.com:19302"}
            ]
        },
        to=sid
    )

    existing_participants = []
    for socket_id in active_meetings.get(meeting_id, set()):
        if socket_id != sid and socket_id in socket_to_user:
            user = socket_to_user[socket_id]
            existing_participants.append({
                "socketId": socket_id,
                "userId": user["id"],
                "userName": user["name"]
            })
    
    await sio.emit("existing-participants", existing_participants, to=sid)


@sio.event
async def leave_meeting(sid, data):
    """Handle user leaving a meeting."""
    meeting_id = socket_to_meeting.get(sid)
    
    if meeting_id:
        user = socket_to_user.get(sid)

        await sio.leave_room(sid, meeting_id)

        await sio.emit(
            "user-left",
            {
                "userId": user["id"] if user else None,
                "socketId": sid
            },
            room=meeting_id
        )
        

        if meeting_id in active_meetings:
            active_meetings[meeting_id].discard(sid)
            if not active_meetings[meeting_id]:
                del active_meetings[meeting_id]
        
        del socket_to_meeting[sid]
        if sid in socket_to_user:
            del socket_to_user[sid]


@sio.event
async def webrtc_offer(sid, data):
    """Handle WebRTC offer."""
    target_sid = data.get("targetSocketId")
    offer = data.get("offer")
    
    if target_sid:
        await sio.emit(
            "webrtc-offer",
            {
                "offer": offer,
                "senderSocketId": sid
            },
            to=target_sid
        )


@sio.event
async def webrtc_answer(sid, data):
    """Handle WebRTC answer."""
    target_sid = data.get("targetSocketId")
    answer = data.get("answer")
    
    if target_sid:
        await sio.emit(
            "webrtc-answer",
            {
                "answer": answer,
                "senderSocketId": sid
            },
            to=target_sid
        )


@sio.event
async def webrtc_ice_candidate(sid, data):
    """Handle ICE candidate."""
    target_sid = data.get("targetSocketId")
    candidate = data.get("candidate")
    
    if target_sid:
        await sio.emit(
            "webrtc-ice-candidate",
            {
                "candidate": candidate,
                "senderSocketId": sid
            },
            to=target_sid
        )


@sio.event
async def send_chat_message(sid, data):
    """Handle chat message."""
    meeting_id = socket_to_meeting.get(sid)
    user = socket_to_user.get(sid)
    text = data.get("text", "").strip()
    
    if meeting_id and text:
        payload = {
            "senderId": user["id"] if user else None,
            "senderName": user["name"] if user else "User",
            "text": text,
            "timestamp": data.get("timestamp")
        }

        await sio.emit("chat-message", payload, room=meeting_id)


@sio.event
async def start_captions(sid, data):
    """Handle start captions request."""
    meeting_id = data.get("meetingId")
    language = data.get("language", "en")
    
    logger.info(f"Starting captions for meeting {meeting_id} in language {language}")
 
    await sio.enter_room(sid, f"captions-{meeting_id}")

    await sio.emit(
        "captions-started",
        {
            "socketId": sid,
            "language": language
        },
        room=meeting_id
    )


@sio.event
async def audio_data(sid, data):
    """Handle audio data for transcription."""
    meeting_id = data.get("meetingId")
    audio_data = data.get("audioData")
    language = data.get("language", "en")
    translate = data.get("translate", False)
    
    if not meeting_id or not audio_data:
        return
    

    user = socket_to_user.get(sid)
    speaker_name = user["name"] if user else "Unknown"
    speaker_id = user["id"] if user else None
    
    logger.info(f"Received audio data from {speaker_name} in meeting {meeting_id}")


@sio.event
async def new_caption(sid, data):
    """Handle new caption (from transcription service)."""
    meeting_id = data.get("meetingId")
    caption = data.get("caption")
    
    if meeting_id and caption:
 
        await sio.emit("caption-update", caption, room=meeting_id)


@sio.event
async def start_screen_share(sid):
    """Handle user starting screen share."""
    meeting_id = socket_to_meeting.get(sid)
    
    if meeting_id:
        logger.info(f"User {sid} started screen sharing in meeting {meeting_id}")

        await sio.emit(
            "user-started-screen-share",
            {"socketId": sid},
            room=meeting_id,
            skip_sid=sid
        )


@sio.event
async def stop_screen_share(sid):
    """Handle user stopping screen share."""
    meeting_id = socket_to_meeting.get(sid)
    
    if meeting_id:
        logger.info(f"User {sid} stopped screen sharing in meeting {meeting_id}")

        await sio.emit(
            "user-stopped-screen-share",
            {"socketId": sid},
            room=meeting_id,
            skip_sid=sid
        )


@sio.event
async def end_meeting(sid, data):
    """Handle meeting end by host."""
    meeting_id = data.get("meetingId")
    
    if not meeting_id:
        meeting_id = socket_to_meeting.get(sid)
    
    if meeting_id:
        logger.info(f"Meeting {meeting_id} ended by {sid}")
 
        await sio.emit(
            "meeting-ended",
            {
                "meetingId": meeting_id,
                "reason": "Host ended the meeting"
            },
            room=meeting_id
        )

        if meeting_id in active_meetings:
            del active_meetings[meeting_id]
