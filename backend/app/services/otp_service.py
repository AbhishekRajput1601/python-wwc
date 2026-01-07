from datetime import datetime, timedelta
import random
import logging

from passlib.hash import bcrypt
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.config import settings

logger = logging.getLogger(__name__)

OTPS_COLLECTION = "otps"


class OTPService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.collection = db[OTPS_COLLECTION]

    async def _ensure_indexes(self):

        await self.collection.create_index("expires_at", expireAfterSeconds=0)
        await self.collection.create_index("email", unique=False)

    def _generate_otp(self, digits: int = 6) -> str:
        range_start = 10 ** (digits - 1)
        range_end = (10 ** digits) - 1
        return str(random.randint(range_start, range_end))

    async def create_registration_otp(self, email: str, name: str, password_hashed: str, ttl_seconds: int = 180) -> str:
        await self._ensure_indexes()

        otp = self._generate_otp()
        otp_hash = bcrypt.hash(otp)

        now = datetime.utcnow()
        doc = {
            "email": email,
            "name": name,
            "password_hashed": password_hashed,
            "otp_hash": otp_hash,
            "created_at": now,
            "expires_at": now + timedelta(seconds=ttl_seconds),
        }

        await self.collection.delete_many({"email": email})
        await self.collection.insert_one(doc)

        logger.info(f"Created registration OTP for {email}, expires in {ttl_seconds}s")
        return otp

    async def create_password_reset_otp(self, email: str, user_id: str, ttl_seconds: int = 180) -> str:
       
        await self._ensure_indexes()

        otp = self._generate_otp()
        otp_hash = bcrypt.hash(otp)

        now = datetime.utcnow()
        doc = {
            "email": email,
            "user_id": user_id,
            "purpose": "password_reset",
            "otp_hash": otp_hash,
            "created_at": now,
            "expires_at": now + timedelta(seconds=ttl_seconds),
        }

        await self.collection.delete_many({"email": email, "purpose": "password_reset"})
        await self.collection.insert_one(doc)

        logger.info(f"Created password reset OTP for {email}, expires in {ttl_seconds}s")
        return otp

    async def verify_password_reset_otp(self, email: str, otp: str) -> dict | None:
        
        doc = await self.collection.find_one({"email": email, "purpose": "password_reset"})
        if not doc:
            return None

        expires_at = doc.get("expires_at")
        if not expires_at or datetime.utcnow() > expires_at:
            await self.collection.delete_many({"email": email, "purpose": "password_reset"})
            return None

        otp_hash = doc.get("otp_hash")
        if not otp_hash:
            return None

        if not bcrypt.verify(otp, otp_hash):
            return None

        await self.collection.delete_many({"email": email, "purpose": "password_reset"})
        return {"email": doc.get("email"), "user_id": doc.get("user_id")}

    async def verify_registration_otp(self, email: str, otp: str) -> dict | None:
        doc = await self.collection.find_one({"email": email})
        if not doc:
            return None

        expires_at = doc.get("expires_at")
        if not expires_at or datetime.utcnow() > expires_at:
         
            await self.collection.delete_many({"email": email})
            return None

        otp_hash = doc.get("otp_hash")
        if not otp_hash:
            return None

        if not bcrypt.verify(otp, otp_hash):
            return None

        await self.collection.delete_many({"email": email})
        return {
            "email": doc.get("email"),
            "name": doc.get("name"),
            "password_hashed": doc.get("password_hashed"),
        }
