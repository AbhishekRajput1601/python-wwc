from fastapi import APIRouter, Depends, HTTPException, status, Header
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import Optional
import logging

from app.db.session import get_db
from app.models.user import UserCreate, UserLogin, UserUpdate
from app.services.auth_service import AuthService
from app.core.security import (
    get_current_user_id,
    verify_password,
    create_access_token,
    get_password_hash
)

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserCreate,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Register a new user"""
    try:
        # Validate required fields
        if not user_data.name or not user_data.email or not user_data.password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Please provide all required fields"
            )
        
        auth_service = AuthService(db)
        
        # Check if user exists
        existing_user = await auth_service.get_user_by_email(user_data.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User already exists"
            )
        
        # Create user
        user = await auth_service.create_user(user_data)
        
        # Generate token
        token = create_access_token(data={"sub": str(user["_id"])})
        
        logger.info(f"New user registered: {user_data.email}")
        
        return {
            "success": True,
            "token": token,
            "user": {
                "id": str(user["_id"]),
                "name": user["name"],
                "email": user["email"],
                "preferences": user.get("preferences", {}),
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Registration error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Server error during registration"
        )


@router.post("/login")
async def login(
    credentials: UserLogin,
    db: AsyncIOMotorDatabase = Depends(get_db),
    authorization: Optional[str] = Header(None)
):
    """Login user"""
    try:
        # Validate email & password
        if not credentials.email or not credentials.password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Please provide an email and password"
            )
        
        # Check if user is already logged in
        if authorization and authorization.startswith("Bearer "):
            token = authorization.split(" ")[1]
            if token:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="User already logged in"
                )
        
        auth_service = AuthService(db)
        
        # Check for user
        user = await auth_service.get_user_by_email(credentials.email)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )
        
        # Check if password matches
        if not verify_password(credentials.password, user["password"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )
        
        # Generate token
        token = create_access_token(data={"sub": str(user["_id"])})
        
        logger.info(f"User logged in: {credentials.email}")
        
        return {
            "success": True,
            "token": token,
            "user": {
                "id": str(user["_id"]),
                "name": user["name"],
                "email": user["email"],
                "preferences": user.get("preferences", {}),
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Server error during login"
        )


@router.post("/logout")
async def logout(
    user_id: str = Depends(get_current_user_id)
):
    """Logout user"""
    try:
        return {
            "success": True,
            "userid": user_id,
            "message": "User logged out successfully"
        }
    except Exception as e:
        logger.error(f"Logout error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Server error during logout"
        )


@router.get("/me")
async def get_me(
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get current user details"""
    try:
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
                "preferences": user.get("preferences", {}),
                "role": user.get("role", "user"),
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get user error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Server error getting user data"
        )


@router.put("/update-user")
async def update_user_details(
    user_data: UserUpdate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id)
):
    """Update user details"""
    try:
        from bson import ObjectId
        
        # Use provided userId or current user's ID
        user_id = user_data.userId if user_data.userId else current_user_id
        
        logger.info(f"Update details for userId: {user_id}, {user_data.name}, {user_data.email}, {user_data.role}")
        
        auth_service = AuthService(db)
        user = await auth_service.get_user_by_id(user_id)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Build update data
        update_data = {}
        if user_data.name:
            update_data["name"] = user_data.name
        if user_data.email:
            update_data["email"] = user_data.email
        if user_data.role:
            update_data["role"] = user_data.role
        if user_data.avatar:
            update_data["avatar"] = user_data.avatar
        if user_data.preferences:
            update_data["preferences"] = user_data.preferences.dict()
        
        # Update user
        if update_data:
            updated_user = await auth_service.update_user(user_id, update_data)
            if not updated_user:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to update user"
                )
        
        return {
            "success": True,
            "message": "User details updated successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Update user details error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Server error updating user details"
        )
