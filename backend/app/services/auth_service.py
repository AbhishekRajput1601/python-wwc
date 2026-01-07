from datetime import datetime, timedelta
from typing import Optional, List
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.db.models import USERS_COLLECTION
from app.core.security import get_password_hash, verify_password, create_access_token
from app.models.user import UserCreate


class AuthService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.collection = db[USERS_COLLECTION]
    
    async def create_user(self, user_data: UserCreate) -> dict:
      
        user_dict = {
            "name": user_data.name,
            "email": user_data.email,
            "password": get_password_hash(user_data.password),
            "role": "user",
            "avatar": "",
            "preferences": {
                "default_language": "en",
                "captions_enabled": True
            },
            "created_at": datetime.utcnow()
        }
        
        result = await self.collection.insert_one(user_dict)
        user_dict["_id"] = result.inserted_id
        return user_dict

    async def create_user_with_hashed_password(self, name: str, email: str, password_hashed: str) -> dict:
  
        user_dict = {
            "name": name,
            "email": email,
            "password": password_hashed,
            "role": "user",
            "avatar": "",
            "preferences": {
                "default_language": "en",
                "captions_enabled": True
            },
            "created_at": datetime.utcnow()
        }

        result = await self.collection.insert_one(user_dict)
        user_dict["_id"] = result.inserted_id
        return user_dict
    
    async def get_user_by_email(self, email: str) -> Optional[dict]:
      
        return await self.collection.find_one({"email": email})
    
    async def get_user_by_id(self, user_id: str) -> Optional[dict]:
        
        return await self.collection.find_one({"_id": ObjectId(user_id)})
    
    async def get_users(self, skip: int = 0, limit: int = 100) -> List[dict]:
       
        cursor = self.collection.find().skip(skip).limit(limit)
        return await cursor.to_list(length=limit)
    
    async def update_user(self, user_id: str, update_data: dict) -> Optional[dict]:
       
        if not update_data:
            return None
        
        result = await self.collection.find_one_and_update(
            {"_id": ObjectId(user_id)},
            {"$set": update_data},
            return_document=True
        )
        return result
    
    async def delete_user(self, user_id: str) -> bool:
     
        result = await self.collection.delete_one({"_id": ObjectId(user_id)})
        return result.deleted_count > 0
    
    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
       
        return verify_password(plain_password, hashed_password)
    
    def create_token(self, user_id: str) -> str:
        
        return create_access_token({"sub": user_id})
