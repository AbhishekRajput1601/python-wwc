import socketio
from typing import Dict, Set
import logging
import base64
from typing import Any

from app.core.config import settings
from app.db.base import get_database
from app.db.models import MEETINGS_COLLECTION
from datetime import datetime
from app.services.caption_service import CaptionService
from app.services.captions_whisper_service import transcribe_audio
from app.models.caption import CaptionEntryCreate


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
    # Check for an existing connection for this user in the same meeting.
    # If found, treat this as a reconnection (e.g. browser refresh) and
    # replace the old socket id mapping instead of creating a duplicate
    # participant entry.
    replaced_old_sid = None
    if meeting_id in active_meetings and user_id:
        for socket_id in list(active_meetings.get(meeting_id, set())):
            if socket_id in socket_to_user and socket_to_user[socket_id].get("id") == user_id:
                replaced_old_sid = socket_id
                break

    # If reconnection, remove old mappings for the previous socket id
    if replaced_old_sid:
        logger.info(f"User {user_name} ({user_id}) reconnecting: replacing socket {replaced_old_sid} -> {sid}")
        # remove old socket from room and internal maps if still present
        try:
            await sio.leave_room(replaced_old_sid, meeting_id)
        except Exception:
            # old socket may already be disconnected; ignore
            pass

        active_meetings[meeting_id].discard(replaced_old_sid)
        if replaced_old_sid in socket_to_meeting:
            del socket_to_meeting[replaced_old_sid]
        if replaced_old_sid in socket_to_user:
            del socket_to_user[replaced_old_sid]

        # Add the new socket id mappings
        socket_to_meeting[sid] = meeting_id
        socket_to_user[sid] = {"id": user_id, "name": user_name}
        if meeting_id not in active_meetings:
            active_meetings[meeting_id] = set()
        active_meetings[meeting_id].add(sid)

        # Notify other participants that this user reconnected and provide
        # the new socket id so peers can update their peer-connections.
        await sio.emit(
            "user-reconnected",
            {
                "userId": user_id,
                "userName": user_name,
                "oldSocketId": replaced_old_sid,
                "newSocketId": sid,
            },
            room=meeting_id,
            skip_sid=sid,
        )
    else:
        # Fresh join (no existing participant with same user id)
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

    # Send last 100 chat messages as history (if meeting doc exists)
    try:
        db = get_database()
        doc = await db[MEETINGS_COLLECTION].find_one({"meeting_id": meeting_id}, {"messages": {"$slice": -100}})
        history = []
        if doc and doc.get("messages"):
            for m in doc.get("messages", []):
                history.append({
                    "senderId": str(m.get("sender")) if m.get("sender") else None,
                    "senderName": m.get("senderName") or "User",
                    "text": m.get("text"),
                    "timestamp": int(m.get("timestamp").timestamp() * 1000) if m.get("timestamp") else None,
                })
        await sio.emit("chat-history", history, to=sid)
    except Exception:
        logger.exception("Failed to load chat history for meeting %s", meeting_id)


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
            "offer",
            {
                "offer": offer,
                "fromSocketId": sid
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
            "answer",
            {
                "answer": answer,
                "fromSocketId": sid
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
            "ice-candidate",
            {
                "candidate": candidate,
                "fromSocketId": sid
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
            "timestamp": data.get("timestamp") or int(datetime.utcnow().timestamp() * 1000)
        }

        # persist message to DB
        try:
            db = get_database()
            await db[MEETINGS_COLLECTION].update_one(
                {"meeting_id": meeting_id},
                {
                    "$push": {
                        "messages": {
                            "sender": user["id"] if user else None,
                            "senderName": payload["senderName"],
                            "text": payload["text"],
                            "timestamp": datetime.utcfromtimestamp(payload["timestamp"] / 1000.0),
                        }
                    }
                }
            )
        except Exception:
            logger.exception("Failed to persist chat message for meeting %s", meeting_id)

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
async def toggle_audio(sid, data):
    meeting_id = socket_to_meeting.get(sid)
    is_enabled = data.get("isEnabled") if isinstance(data, dict) else None
    if meeting_id:
        await sio.emit(
            "user-audio-toggle",
            {"socketId": sid, "isEnabled": is_enabled},
            room=meeting_id,
            skip_sid=sid,
        )


@sio.event
async def toggle_video(sid, data):
    meeting_id = socket_to_meeting.get(sid)
    is_enabled = data.get("isEnabled") if isinstance(data, dict) else None
    if meeting_id:
        await sio.emit(
            "user-video-toggle",
            {"socketId": sid, "isEnabled": is_enabled},
            room=meeting_id,
            skip_sid=sid,
        )


@sio.event
async def audio_data(sid, data):
    """Handle audio data for transcription."""
    meeting_id = data.get("meetingId")
    audio_data = data.get("audioData")
    language = data.get("language", "en")
    translate = data.get("translate", False)
    mime_type = data.get("mimeType")
    
    if not meeting_id or not audio_data:
        return

    # Normalize audio bytes (support base64 strings, list of ints, or bytes)
    audio_bytes = None
    try:
        if isinstance(audio_data, str):
            # handle data url like 'data:audio/ogg;base64,...'
            if audio_data.startswith("data:") and "," in audio_data:
                _, b64 = audio_data.split(",", 1)
            else:
                b64 = audio_data
            audio_bytes = base64.b64decode(b64)
        elif isinstance(audio_data, (bytes, bytearray)):
            audio_bytes = bytes(audio_data)
        elif isinstance(audio_data, list):
            audio_bytes = bytes(bytearray(audio_data))
        else:
            logger.warning("Unsupported audio data type: %s", type(audio_data))
            return
    except Exception as e:
        logger.exception("Failed to decode audio data: %s", e)
        return

    user = socket_to_user.get(sid)
    speaker_name = user["name"] if user else "Unknown"
    speaker_id = user["id"] if user else None

    logger.info(f"Received audio data from {speaker_name} in meeting {meeting_id}")

    # Transcribe using local faster_whisper model (no external service needed)
    try:
        db = get_database()
        caption_service = CaptionService(db)
        result = await caption_service.transcribe_audio(audio_bytes, language=language, translate=translate, mime_type=mime_type)
    except Exception as e:
        logger.exception("Transcription failed: %s", e)
        # notify clients in meeting that transcription failed
        try:
            await sio.emit('caption-error', {"meetingId": meeting_id, "message": str(e)}, room=meeting_id)
        except Exception:
            logger.exception('Failed to emit caption-error')
        return

    captions = result.get("captions") or []
    resp_lang = result.get("language") or language

    if not captions:
        return

    # Persist and emit each caption segment
    try:
        db = get_database()
        caption_service = CaptionService(db)

        for seg in captions:
            text = seg.get("text") or seg.get("sentence") or ""
            start = seg.get("start") or seg.get("t_start") or 0.0
            end = seg.get("end") or seg.get("t_end") or 0.0
            duration = max(0.0, float(end) - float(start))

            caption_entry = CaptionEntryCreate(
                speaker=speaker_id,
                speaker_name=speaker_name,
                original_text=text,
                original_language=resp_lang,
                translations=[],
                confidence=0.8,
                duration=duration,
                is_final=True,
            )

            try:
                await caption_service.add_caption(meeting_id, caption_entry)
            except Exception:
                logger.exception("Failed to save caption for meeting %s", meeting_id)

            payload: Any = {
                "meetingId": meeting_id,
                "speakerId": speaker_id,
                "speakerName": speaker_name,
                "text": text,
                "start": start,
                "end": end,
                "duration": duration,
            }

            await sio.emit("caption-update", payload, room=meeting_id)
    except Exception:
        logger.exception("Error processing captions for meeting %s", meeting_id)


@sio.event
async def new_caption(sid, data):
    """Handle new caption (from transcription service)."""
    meeting_id = data.get("meetingId")
    caption = data.get("caption")
    
    if meeting_id and caption:
 
        await sio.emit("caption-update", caption, room=meeting_id)


# Compatibility aliases for client event names (dashed)
@sio.on("join-meeting")
async def on_join_meeting(sid, data):
    return await join_meeting(sid, data)


@sio.on("leave-meeting")
async def on_leave_meeting(sid, data=None):
    return await leave_meeting(sid, data or {})


@sio.on("get-chat-history")
async def on_get_chat_history(sid):
    meeting_id = socket_to_meeting.get(sid)
    if not meeting_id:
        return
    try:
        db = get_database()
        doc = await db[MEETINGS_COLLECTION].find_one({"meeting_id": meeting_id}, {"messages": {"$slice": -100}})
        history = []
        if doc and doc.get("messages"):
            for m in doc.get("messages", []):
                history.append({
                    "senderId": str(m.get("sender")) if m.get("sender") else None,
                    "senderName": m.get("senderName") or "User",
                    "text": m.get("text"),
                    "timestamp": int(m.get("timestamp").timestamp() * 1000) if m.get("timestamp") else None,
                })
        await sio.emit("chat-history", history, to=sid)
    except Exception:
        logger.exception("Failed to load chat history (on-demand) for %s", meeting_id)


@sio.on("send-chat-message")
async def on_send_chat_message(sid, data):
    return await send_chat_message(sid, data)


@sio.on("offer")
async def on_offer(sid, data):
    return await webrtc_offer(sid, data)


@sio.on("answer")
async def on_answer(sid, data):
    return await webrtc_answer(sid, data)


@sio.on("ice-candidate")
async def on_ice_candidate(sid, data):
    return await webrtc_ice_candidate(sid, data)


@sio.on("toggle-audio")
async def on_toggle_audio(sid, data):
    return await toggle_audio(sid, data)


@sio.on("toggle-video")
async def on_toggle_video(sid, data):
    return await toggle_video(sid, data)


@sio.on("start-screen-share")
async def on_start_screen_share(sid, data=None):
    return await start_screen_share(sid)


@sio.on("stop-screen-share")
async def on_stop_screen_share(sid, data=None):
    return await stop_screen_share(sid)


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

        # mark meeting ended in DB and possibly generate captions file
        try:
            db = get_database()
            from app.services.meeting_service import MeetingService
            meeting_service = MeetingService(db)
            # this will update status and also attempt to gather/upload captions
            await meeting_service.end_meeting(meeting_id)
        except Exception:
            logger.exception("Failed to update meeting end state for %s", meeting_id)

        if meeting_id in active_meetings:
            del active_meetings[meeting_id]
