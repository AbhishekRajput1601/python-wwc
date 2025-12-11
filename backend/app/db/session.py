from typing import AsyncGenerator
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.db.base import get_database


async def get_db() -> AsyncGenerator[AsyncIOMotorDatabase, None]:
    """Dependency for getting database session."""
    db = get_database()
    try:
        yield db
    finally:
        pass
