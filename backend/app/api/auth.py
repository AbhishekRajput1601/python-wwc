from fastapi import APIRouter, Depends, HTTPException, status, Header
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import Optional
import logging

from app.db.session import get_db
from app.models.user import UserCreate, UserLogin, UserUpdate
from app.services.auth_service import AuthService
from app.services.otp_service import OTPService
from app.utils.email_sender import send_email, build_otp_email
from app.core.config import settings
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



@router.post("/request-registration-otp")
async def request_registration_otp(
    user_data: UserCreate,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Start registration by creating an OTP and sending it via email. The client must then verify the OTP to finalize registration."""
    try:
        if not user_data.name or not user_data.email or not user_data.password:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Please provide all required fields")

        auth_service = AuthService(db)
        existing_user = await auth_service.get_user_by_email(user_data.email)
        if existing_user:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User already exists")

        otp_service = OTPService(db)
        # store hashed password so it can be used once OTP is verified
        from app.core.security import get_password_hash
        password_hashed = get_password_hash(user_data.password)

        otp_code = await otp_service.create_registration_otp(user_data.email, user_data.name, password_hashed, ttl_seconds=180)

        # send email (HTML)
        subject = f"Your WWC verification code"
        body = f"Your verification code is: {otp_code}\nIt will expire in 3 minutes."
        html = build_otp_email(otp_code, expires_minutes=3)
        sent = send_email(subject, user_data.email, body, html=html)

        if not sent:
            # don't leak internal specifics
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to send verification email")

        return {"success": True, "message": "Verification code sent to email"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Request OTP error: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Server error requesting OTP")


@router.post("/verify-registration-otp")
async def verify_registration_otp(
    payload: dict,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Verify OTP and create user if OTP is valid. Payload expected: {email, otp} """
    try:
        email = payload.get("email")
        otp = payload.get("otp")
        if not email or not otp:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email and otp required")

        auth_service = AuthService(db)
        otp_service = OTPService(db)

        verified = await otp_service.verify_registration_otp(email, otp)
        if not verified:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired OTP")

        # create user with hashed password
        user = await auth_service.create_user_with_hashed_password(verified.get("name"), verified.get("email"), verified.get("password_hashed"))

        token = create_access_token(data={"sub": str(user["_id"])})

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
        logger.error(f"Verify OTP error: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Server error verifying OTP")



@router.post("/request-password-reset")
async def request_password_reset(
    payload: dict,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Request a password reset OTP for a registered email."""
    try:
        email = payload.get("email")
        if not email:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email required")

        auth_service = AuthService(db)
        user = await auth_service.get_user_by_email(email)
        if not user:
            # Do not reveal whether email exists
            return {"success": True, "message": "Verification code is sent to the email."}

        otp_service = OTPService(db)
        otp_code = await otp_service.create_password_reset_otp(email, str(user.get("_id")), ttl_seconds=180)

        subject = "WWC Password Reset Code"
        body = f"Your password reset code is: {otp_code}\nIt will expire in 3 minutes."
        html = build_otp_email(otp_code, expires_minutes=3)
        sent = send_email(subject, email, body, html=html)

        if not sent:
            logger.error(f"Failed to send password reset email to {email}")
            # mask error
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to send verification email")

        return {"success": True, "message": "Verification code is sent to the email."}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Request password reset error: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Server error requesting password reset")


@router.post("/reset-password")
async def reset_password(
    payload: dict,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Verify OTP and reset password. Payload: {email, otp, new_password} """
    try:
        email = payload.get("email")
        otp = payload.get("otp")
        new_password = payload.get("new_password")

        if not email or not otp or not new_password:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email, otp and new_password are required")

        otp_service = OTPService(db)
        verified = await otp_service.verify_password_reset_otp(email, otp)
        if not verified:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired OTP")

        user_id = verified.get("user_id")
        if not user_id:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Invalid reset payload")

        # hash new password and update user
        hashed = get_password_hash(new_password)
        auth_service = AuthService(db)
        updated = await auth_service.update_user(user_id, {"password": hashed})
        if not updated:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to update password")

        return {"success": True, "message": "Password updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Reset password error: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Server error resetting password")


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

        # Fetch user
        user = await auth_service.get_user_by_email(credentials.email)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )

        # --- Debug logging (safe to remove later) ---
        pw_type = type(credentials.password).__name__
        pw_len = len(credentials.password) if isinstance(credentials.password, str) else None

        stored = user.get("password")
        stored_type = type(stored).__name__
        stored_len = len(stored) if isinstance(stored, str) else None

        logger.error(f"LOGIN: credentials.password type={pw_type} len={pw_len}")
        logger.error(f"LOGIN: stored password type={stored_type} len={stored_len}")
        # -------------------------------------------

        # ✅ DO NOT manually validate hash format
        # ✅ Let passlib handle verification
        if not verify_password(credentials.password, stored):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )

        # Generate token
        token = create_access_token(
            data={"sub": str(user["_id"])}
        )

        logger.info(f"User logged in: {credentials.email}")

        return {
            "success": True,
            "token": token,
            "user": {
                "id": str(user["_id"]),
                "name": user.get("name"),
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
