from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import socketio
from contextlib import asynccontextmanager

from app.core.config import settings
from app.db.base import connect_to_mongo, close_mongo_connection
from app.api import auth, users, meetings, captions, admin
from app.sockets.socket_manager import sio
from app.utils.io import set_io
import logging
import app.core.cloudinary  # ensure Cloudinary configured on startup


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""

    await connect_to_mongo()
    logging.info(f"Starting {settings.APP_NAME}")
    logging.info(f"Allowed origins: {settings.ALLOWED_ORIGINS}")
    yield

    await close_mongo_connection()
    logging.info(f"Shutting down {settings.APP_NAME}")


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

# expose the socket.io server to other modules
set_io(sio)


app.include_router(auth.router, prefix=f"{settings.API_V1_PREFIX}/auth", tags=["auth"])
app.include_router(users.router, prefix=f"{settings.API_V1_PREFIX}/users", tags=["users"])
app.include_router(meetings.router, prefix=f"{settings.API_V1_PREFIX}/meetings", tags=["meetings"])
app.include_router(captions.router, prefix=f"{settings.API_V1_PREFIX}/captions", tags=["captions"])
app.include_router(admin.router, prefix=f"{settings.API_V1_PREFIX}/admin", tags=["admin"])


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
