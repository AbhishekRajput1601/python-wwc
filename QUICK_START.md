# 🚀 WWC Quick Start Guide

## Prerequisites
- Python 3.9+ 
- Node.js 16+
- MongoDB (local or Atlas)

## Setup (5 minutes)

### 1️⃣ Clone & Install

```bash
# Backend
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt

# Client (new terminal)
cd client
npm install
```

### 2️⃣ Configure Environment

**Backend** - Create `backend/.env`:
```env
MONGODB_URI=mongodb://localhost:27017/wwc
JWT_SECRET=change-this-to-a-random-secret-string-in-production
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

**Client** - Create `client/.env`:
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

### 3️⃣ Run

**Terminal 1 - Backend:**
```bash
cd backend
venv\Scripts\activate
python run.py
```
✅ Backend running at http://localhost:5000

**Terminal 2 - Client:**
```bash
cd client
npm run dev
```
✅ Client running at http://localhost:5174

### 4️⃣ Test

1. Open http://localhost:5174
2. Register a new account
3. Create a meeting
4. Join the meeting
5. Enable camera/microphone
6. Start testing features!

## Features Available

✅ User Authentication (Register/Login)  
✅ Create & Join Meetings  
✅ Video/Audio Communication (WebRTC)  
✅ Real-time Chat  
✅ Screen Sharing  
✅ Meeting Recording  
✅ Live Transcription (Whisper)  
✅ Real-time Captions  

## API Documentation

Once backend is running, visit:
- **Swagger UI**: http://localhost:5000/api/docs
- **ReDoc**: http://localhost:5000/api/redoc

## Troubleshooting

**MongoDB Connection Error?**
- Install MongoDB locally OR use MongoDB Atlas (cloud)
- Update `MONGODB_URI` in backend/.env

**Port Already in Use?**
```bash
# Change ports in backend/.env and client/.env
# Backend: PORT=5001
# Client: Update vite.config.js server.port
```

**Camera/Microphone Not Working?**
- Use HTTPS in production (WebRTC requirement)
- Grant browser permissions
- Check browser console for errors

**WebRTC Connection Issues?**
- Check firewall settings
- Ensure both clients can reach Socket.IO server
- Check browser console for ICE connection errors

## Production Deployment

Before deploying:

1. **Security**:
   - Change `JWT_SECRET` to strong random string
   - Set `DEBUG=False` in backend
   - Enable HTTPS
   - Update CORS `ALLOWED_ORIGINS`

2. **Database**:
   - Use MongoDB Atlas or managed MongoDB
   - Set up proper indexes
   - Enable authentication

3. **File Storage**:
   - Configure Cloudinary for recordings
   - Set up proper file size limits

4. **WebRTC**:
   - Use TURN server for production (not just STUN)
   - Update ICE servers in Socket.IO handlers

## Support

Check `INTEGRATION_SUMMARY.md` for detailed API & Socket.IO mapping.

---

**Happy Coding! 🎉**
