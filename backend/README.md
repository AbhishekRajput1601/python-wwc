# WWC Backend - Python Server

A complete Python backend server for WWC (Video Conference App) with integrated Whisper transcription service.

## Features

- **FastAPI** framework for high-performance REST API
- **Socket.IO** for real-time WebRTC signaling and chat
- **MongoDB** with Motor for async database operations
- **Integrated Whisper** service for real-time transcription
- **JWT Authentication** with secure password hashing
- **WebRTC Support** for video/audio communication
- **Real-time Captions** with translation support
- **Chat System** with message history
- **Meeting Management** with participant tracking

## Project Structure

```
backend/
├── app/
│   ├── main.py                 # Application entry point
│   ├── api/                    # API endpoints
│   │   ├── auth.py            # Authentication routes
│   │   ├── users.py           # User management routes
│   │   ├── meetings.py        # Meeting routes
│   │   └── captions.py        # Caption routes
│   ├── models/                 # Pydantic models
│   │   ├── user.py
│   │   ├── meeting.py
│   │   └── caption.py
│   ├── services/              # Business logic
│   │   ├── auth_service.py
│   │   ├── meeting_service.py
│   │   └── caption_service.py
│   ├── sockets/               # WebSocket handlers
│   │   └── socket_manager.py
│   ├── db/                    # Database configuration
│   │   ├── base.py
│   │   ├── session.py
│   │   └── models.py
│   ├── core/                  # Core configuration
│   │   ├── config.py
│   │   └── security.py
│   └── workers/               # Background tasks
│       └── celery_app.py
├── requirements.txt           # Python dependencies
├── .env                       # Environment variables
└── README.md                  # This file
```

## Installation

1. **Create virtual environment:**
```bash
python -m venv venv
```

2. **Activate virtual environment:**

Windows:
```bash
venv\Scripts\activate
```

Linux/Mac:
```bash
source venv/bin/activate
```

3. **Install dependencies:**
```bash
pip install -r requirements.txt
```

4. **Configure environment variables:**

Copy `.env.example` to `.env` and update the values:
- MongoDB connection string
- JWT secret key
- Cloudinary credentials
- Client URL for CORS

## Running the Server

**Development mode:**
```bash
uvicorn app.main:application --reload --host 0.0.0.0 --port 5000
```

**Production mode:**
```bash
uvicorn app.main:application --host 0.0.0.0 --port 5000 --workers 4
```

## API Documentation

Once the server is running, visit:
- Swagger UI: http://localhost:5000/api/docs
- ReDoc: http://localhost:5000/api/redoc

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users` - Get all users
- `GET /api/users/{user_id}` - Get user by ID
- `PUT /api/users/{user_id}` - Update user
- `DELETE /api/users/{user_id}` - Delete user

### Meetings
- `POST /api/meetings` - Create meeting
- `GET /api/meetings` - Get user's meetings
- `GET /api/meetings/{meeting_id}` - Get meeting details
- `POST /api/meetings/{meeting_id}/join` - Join meeting
- `POST /api/meetings/{meeting_id}/leave` - Leave meeting
- `PUT /api/meetings/{meeting_id}` - Update meeting
- `POST /api/meetings/{meeting_id}/end` - End meeting
- `DELETE /api/meetings/{meeting_id}` - Delete meeting
- `POST /api/meetings/{meeting_id}/chat` - Send chat message
- `GET /api/meetings/{meeting_id}/chat` - Get chat history

### Captions
- `GET /api/captions/{meeting_id}` - Get captions
- `POST /api/captions/{meeting_id}/transcribe` - Transcribe audio
- `DELETE /api/captions/{meeting_id}` - Delete captions
- `GET /api/captions/{meeting_id}/download` - Download captions

## WebSocket Events

### Client to Server
- `join-meeting` - Join a meeting room
- `leave-meeting` - Leave a meeting room
- `webrtc-offer` - Send WebRTC offer
- `webrtc-answer` - Send WebRTC answer
- `webrtc-ice-candidate` - Send ICE candidate
- `send-chat-message` - Send chat message
- `start-captions` - Start caption service
- `audio-data` - Send audio for transcription

### Server to Client
- `user-joined` - User joined meeting
- `user-left` - User left meeting
- `existing-participants` - List of existing participants
- `ice-servers` - STUN/TURN server configuration
- `webrtc-offer` - Received WebRTC offer
- `webrtc-answer` - Received WebRTC answer
- `webrtc-ice-candidate` - Received ICE candidate
- `chat-message` - New chat message
- `captions-started` - Captions service started
- `caption-update` - New caption available

## Integrated Whisper Service

The Whisper transcription service is now integrated directly into the backend:

- Uses `faster-whisper` for efficient transcription
- Supports multiple languages
- Can translate to English
- Processes audio in real-time
- Configurable model size (base, small, medium, large)

## Technologies

- **FastAPI** - Modern web framework
- **Motor** - Async MongoDB driver
- **Socket.IO** - Real-time bidirectional communication
- **Faster Whisper** - Speech-to-text transcription
- **Pydantic** - Data validation
- **JWT** - Secure authentication
- **Uvicorn** - ASGI server

## Environment Variables

See `.env` file for all configuration options:
- Database settings
- JWT configuration
- CORS settings
- Whisper model configuration
- File upload settings
- External service URLs

## Development

**Run tests:**
```bash
pytest
```

**Format code:**
```bash
black app/
```

**Lint code:**
```bash
flake8 app/
```

## License

MIT
