from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List

from app.db.session import get_db
from app.models.user import UserUpdate
from app.services.auth_service import AuthService
from app.core.security import get_current_user_id
from app.db.models import USERS_COLLECTION
from bson import ObjectId

router = APIRouter()


@router.get("/", response_model=dict)
async def get_users(
    skip: int = 0,
    limit: int = 100,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
 
    auth_service = AuthService(db)
    users = await auth_service.get_users(skip=skip, limit=limit)
    
    return {
        "success": True,
        "users": [
            {
                "id": str(u["_id"]),
                "name": u["name"],
                "email": u["email"],
                "avatar": u.get("avatar", "")
            }
            for u in users
        ]
    }


@router.get("/{user_id}", response_model=dict)
async def get_user(
    user_id: str,
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    
    auth_service = AuthService(db)
    user = await auth_service.get_user_by_id(user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return {
        "success": True,
        "user": {
            "id": str(user["_id"]),
            "name": user["name"],
            "email": user["email"],
            "role": user.get("role", "user"),
            "avatar": user.get("avatar", ""),
            "preferences": user.get("preferences", {})
        }
    }


@router.put("/{user_id}", response_model=dict)
async def update_user(
    user_id: str,
    user_data: UserUpdate,
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
 
    if user_id != current_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this user"
        )
    
    auth_service = AuthService(db)

    update_data = user_data.model_dump(exclude_unset=True)
    updated_user = await auth_service.update_user(user_id, update_data)
    
    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return {
        "success": True,
        "user": {
            "id": str(updated_user["_id"]),
            "name": updated_user["name"],
            "email": updated_user["email"],
            "avatar": updated_user.get("avatar", ""),
            "preferences": updated_user.get("preferences", {})
        }
    }


@router.delete("/{user_id}", response_model=dict)
async def delete_user(
    user_id: str,
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_db)
):

    if user_id != current_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this user"
        )
    
    auth_service = AuthService(db)
    deleted = await auth_service.delete_user(user_id)
    
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return {
        "success": True,
        "message": "User deleted successfully"
    }


@router.post("/me/recent/{meeting_id}/remove", response_model=dict)
async def remove_recent_meeting(
    meeting_id: str,
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
 
    users_coll = db[USERS_COLLECTION]
    try:
        try:
            result = await users_coll.update_one({"_id": ObjectId(current_user_id)}, {"$addToSet": {"hidden_meetings": meeting_id}})
        except Exception:
            result = await users_coll.update_one({"_id": current_user_id}, {"$addToSet": {"hidden_meetings": meeting_id}})

        if result.modified_count == 0:
        
            pass

        return {"success": True, "message": "Meeting removed from your recent list"}
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to remove meeting from recent list")
