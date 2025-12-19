from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Dict, Any
from bson import ObjectId

from app.db.session import get_db
from app.services.auth_service import AuthService
from app.services.meeting_service import MeetingService
from app.core.security import get_current_user_id

router = APIRouter()


async def _ensure_admin(user_id: str, db: AsyncIOMotorDatabase) -> None:
    auth_service = AuthService(db)
    user = await auth_service.get_user_by_id(user_id)
    if not user or user.get("role") != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admins only")


@router.put("/preferences", response_model=dict)
async def update_preferences(
    preferences: Dict[str, Any],
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Update current user's preferences."""
    auth_service = AuthService(db)
    updated = await auth_service.update_user(user_id, {"preferences": preferences})
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    return {
        "success": True,
        "user": {
            "id": str(updated["_id"]),
            "name": updated["name"],
            "email": updated["email"],
            "preferences": updated.get("preferences", {}),
        }
    }


@router.get("/users", response_model=dict)
async def get_all_users(
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Return all users (admin only)."""
    await _ensure_admin(current_user_id, db)
    auth_service = AuthService(db)
    users = await auth_service.get_users(skip=0, limit=1000)
    output = []
    for u in users:
        created = u.get("created_at") or u.get("createdAt")
        if hasattr(created, "isoformat"):
            created_val = created.isoformat()
        else:
            created_val = created

        output.append({
            "id": str(u["_id"]),
            "name": u.get("name"),
            "email": u.get("email"),
            "avatar": u.get("avatar", ""),
            "role": u.get("role", "user"),
            "createdAt": created_val,
        })
    return {"success": True, "users": output}


@router.get("/users-meetings", response_model=dict)
async def get_all_users_meetings(
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Return each user with their meetings (admin only)."""
    await _ensure_admin(current_user_id, db)
    auth_service = AuthService(db)
    meeting_service = MeetingService(db)

    users = await auth_service.get_users(skip=0, limit=1000)
    users_meetings = []
    for u in users:
        uid = str(u["_id"])
        meetings = await meeting_service.get_user_meetings(uid)
        users_meetings.append({"user": {"id": uid, "name": u["name"], "email": u["email"]}, "meetings": meetings})

    return {"success": True, "data": users_meetings}


@router.get("/meetings", response_model=dict)
async def get_all_meetings_with_users(
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Return all meetings with host and participant user info (admin only)."""
    await _ensure_admin(current_user_id, db)

    meetings = await db["meetings"].find().to_list(length=1000)
    users_coll = db["users"]

    out = []
    for m in meetings:
        # Host lookup: support ObjectId or string id
        host = None
        try:
            host_ref = m.get("host")
            host_doc = None
            if host_ref:
                # try direct lookup
                host_doc = await users_coll.find_one({"_id": host_ref})
                if not host_doc:
                    try:
                        host_doc = await users_coll.find_one({"_id": ObjectId(host_ref)})
                    except Exception:
                        host_doc = None

            if host_doc:
                host = {"id": str(host_doc["_id"]), "name": host_doc.get("name"), "email": host_doc.get("email")}
            else:
                # If host stored as dict with details, preserve useful keys
                if isinstance(host_ref, dict):
                    host = {"id": str(host_ref.get("_id") or host_ref.get("id") or ""), "name": host_ref.get("name"), "email": host_ref.get("email")}
                else:
                    host = host_ref
        except Exception:
            host = m.get("host")

        participants = []
        for p in m.get("participants", []):
            pu = p.get("user")
            try:
                user_doc = await users_coll.find_one({"_id": pu})
                if not user_doc:
                    try:
                        user_doc = await users_coll.find_one({"_id": ObjectId(pu)})
                    except Exception:
                        user_doc = None

                if user_doc:
                    participants.append({
                        "id": str(user_doc["_id"]),
                        "name": user_doc.get("name"),
                        "email": user_doc.get("email"),
                        "is_active": p.get("is_active", p.get("isActive", False)),
                    })
                else:
                    participants.append({"id": pu, "is_active": p.get("is_active", p.get("isActive", False))})
            except Exception:
                participants.append({"id": pu, "is_active": p.get("is_active", p.get("isActive", False))})

        created = m.get("created_at") or m.get("createdAt")
        if hasattr(created, "isoformat"):
            created_val = created.isoformat()
        else:
            created_val = created

        out.append({
            "meetingId": m.get("meeting_id") or m.get("meetingId"),
            "title": m.get("title"),
            "description": m.get("description"),
            "host": host,
            "participants": participants,
            "status": m.get("status"),
            "createdAt": created_val,
        })

    return {"success": True, "data": out}


@router.get("/meetings/{meeting_id}/captions/text", response_model=dict)
async def get_meeting_captions_text(
    meeting_id: str,
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Return captions text for a meeting (admin only)."""
    await _ensure_admin(current_user_id, db)

    meeting = await db["meetings"].find_one({"meeting_id": meeting_id})
    if not meeting:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting not found")

    captions_text = meeting.get("captions_text") or meeting.get("captionsText")
    if not captions_text:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No captions available for this meeting")

    return {"success": True, "captionsText": captions_text}
