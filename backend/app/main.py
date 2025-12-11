from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import socketio
from contextlib import asynccontextmanager

from app.core.config import settings
from app.db.base import connect_to_mongo, close_mongo_connection
from app.api import auth, users, meetings, captions
from app.sockets.socket_manager import sio


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""

    await connect_to_mongo()
    print(f"Starting {settings.APP_NAME}")
    yield

    await close_mongo_connection()
    print(f"Shutting down {settings.APP_NAME}")


app = FastAPI(
    title=settings.APP_NAME,
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


socket_app = socketio.ASGIApp(
    sio,
    other_asgi_app=app,
    socketio_path="socket.io"
)


app.include_router(auth.router, prefix=f"{settings.API_V1_PREFIX}/auth", tags=["auth"])
app.include_router(users.router, prefix=f"{settings.API_V1_PREFIX}/users", tags=["users"])
app.include_router(meetings.router, prefix=f"{settings.API_V1_PREFIX}/meetings", tags=["meetings"])
app.include_router(captions.router, prefix=f"{settings.API_V1_PREFIX}/captions", tags=["captions"])


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": f"Welcome to {settings.APP_NAME}",
        "version": "1.0.0",
        "docs": "/api/docs"
    }


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "healthy"}


application = socket_app
