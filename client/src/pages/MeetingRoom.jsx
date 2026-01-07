import React, { useState, useEffect, useRef } from "react";
import api from "../utils/api";
import MeetingStage from "./MeetingStage.jsx";
import MeetingSidePanel from "./MeetingSidePanel.jsx";
import MeetingControls from "./MeetingControls.jsx";
import io from "socket.io-client";
import meetingService from "../services/meetingService";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import notify from '../utils/notifications';

const SOCKET_SERVER_URL =
  import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

const MeetingRoom = () => {
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);
  const { meetingId } = useParams();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hostId, setHostId] = useState(null);

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [showCaptions, setShowCaptions] = useState(false);
  const [currentCaption, setCurrentCaption] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const [activePanel, setActivePanel] = useState(null);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const [remoteScreenSharerId, setRemoteScreenSharerId] = useState(null);

  const localVideoRef = useRef(null);

  const [mediaStream, setMediaStream] = useState(null);

  const [socket, setSocket] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [remoteStreams, setRemoteStreams] = useState({});
  const [cameraStates, setCameraStates] = useState({});
  const socketIdToUserId = useRef({});
  const peerConnections = useRef({});
  const iceServers = useRef(null);
  const [selfSocketId, setSelfSocketId] = useState(null);

  const [endingMeeting, setEndingMeeting] = useState(false);
  const [meetingEnded, setMeetingEnded] = useState(false);
  const [endMeetingError, setEndMeetingError] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isUploadingRecording, setIsUploadingRecording] = useState(false);
  const mediaRecorderRefForRecording = useRef(null);
  const recordedChunksRef = useRef([]);

  const handleEndMeeting = async () => {
    setEndingMeeting(true);
    setEndMeetingError("");
    try {
      const result = await meetingService.endMeeting(meetingId);
      if (result.success) {
        setMeetingEnded(true);

        setMeeting(result.meeting);

        notify.success('Meeting ended');

        if (mediaStream) {
          mediaStream.getTracks().forEach((track) => track.stop());
        }

        setTimeout(() => {
          navigate("/dashboard");
        }, 2000);
      } else {
        setEndMeetingError(result.message || "Failed to end meeting.");
        notify.error(result.message || "Failed to end meeting.");
      }
    } catch (err) {
      setEndMeetingError("Failed to end meeting.");
      notify.error('Failed to end meeting.');
    }
    setEndingMeeting(false);
  };

  const toggleMute = () => {
    const newMuted = !isMuted;
    if (mediaStream) {
      try {
        mediaStream.getAudioTracks().forEach((track) => {
          track.enabled = !newMuted;
        });
      } catch (e) {
        console.warn("Failed to toggle audio tracks", e);
      }
    }
    setIsMuted(newMuted);
  };
  const toggleVideo = () => {
    const newState = !isVideoOn;
    
    if (mediaStream) {
      const videoTracks = mediaStream.getVideoTracks();
      if (videoTracks.length > 0) {
        videoTracks.forEach((track) => {
          track.enabled = newState;
        });
      }

      if (newState && localVideoRef.current) {
        localVideoRef.current.srcObject = mediaStream;
      }

      if (!newState && localVideoRef.current) {
        localVideoRef.current.srcObject = null;
      }
    }
 
    if (socket) {
      const userId = user?._id || user?.id;
      console.log("[WWC] Emitting camera-state-changed:", { userId, isVideoOn: newState });
      socket.emit("camera-state-changed", {
        userId: userId,
        isVideoOn: newState,
      });
    }
    
    setIsVideoOn(newState);
  };
  const toggleCaptions = () => {
    setShowCaptions((prev) => {
      const next = !prev;
      try {
        if (socket) {
          if (next) {
            console.log('[WWC] emitting start_captions', { meetingId, language: selectedLanguage });
            socket.emit('start_captions', { meetingId, language: selectedLanguage });
          } else {
            console.log('[WWC] emitting stop_captions', { meetingId });
            socket.emit('stop_captions', { meetingId });
          }
        }
      } catch (e) {
        console.warn('Failed to toggle captions on server', e);
      }
      return next;
    });
  };

  useEffect(() => {
    let recorder = null;
    let intervalId = null;
    let audioCtx = null;
    let source = null;
    let processor = null;

    const useWavEncoding = true;

    const sendWavBuffer = async (float32Buffer, sampleRate) => {

      const buffer = encodeWAV(float32Buffer, sampleRate);
      try {
 
        if (showCaptions) {
          console.debug('[WWC] emitting audio-data (wav)', { meetingId, bytes: buffer.length });
          socket.emit('audio-data', {
            meetingId,
            audioData: buffer.buffer,
            mimeType: 'audio/wav',
            userId: user?._id,
            userName: user?.name || 'User',
            language: selectedLanguage || 'en',
          });
        }
      } catch (err) {
        console.error('Failed to send WAV buffer:', err);
      }
    };

    if (mediaStream && socket && showCaptions) {
      try {
 
        if (useWavEncoding && (window.AudioContext || window.webkitAudioContext)) {
          try {
            const AC = window.AudioContext || window.webkitAudioContext;
            audioCtx = new AC();
            source = audioCtx.createMediaStreamSource(mediaStream);
            const bufferSize = 4096;
            processor = audioCtx.createScriptProcessor
              ? audioCtx.createScriptProcessor(bufferSize, 1, 1)
              : audioCtx.createJavaScriptNode(bufferSize, 1, 1);

            const sampleRate = audioCtx.sampleRate || 48000;
 
            const targetSeconds = 1.0;
            const targetSamples = sampleRate * targetSeconds;
            let collected = [];
            let collectedSamples = 0;
            let lastVoice = false;
            const VAD_THRESHOLD = 0.01;

            processor.onaudioprocess = (e) => {
              try {
                const input = e.inputBuffer.getChannelData(0);
 
                const chunk = new Float32Array(input.length);
                chunk.set(input);
                collected.push(chunk);
                collectedSamples += chunk.length;

                if (collectedSamples >= targetSamples) {
                 
                  const out = new Float32Array(collectedSamples);
                  let offset = 0;
                  for (const c of collected) {
                    out.set(c, offset);
                    offset += c.length;
                  }
                
                  collected = [];
                  collectedSamples = 0;
      
                  let sum = 0;
                  for (let i = 0; i < out.length; i++) {
                    sum += out[i] * out[i];
                  }
                  const rms = Math.sqrt(sum / Math.max(1, out.length));
                  const isVoice = rms >= VAD_THRESHOLD;
                  if (isVoice) {
                    lastVoice = true;
                    sendWavBuffer(out, sampleRate);
                  } else {
 
                    if (lastVoice) {
                      sendWavBuffer(out, sampleRate);
                    }
                    lastVoice = false;
                  }
                }
              } catch (err) {
                console.error('Audio processing error:', err);
              }
            };

            source.connect(processor);
            processor.connect(audioCtx.destination);
          } catch (err) {
            console.warn('WebAudio WAV encoder not available, falling back to MediaRecorder', err);
          }
        }

        const audioStream = new MediaStream(mediaStream.getAudioTracks());
        const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : (MediaRecorder.isTypeSupported('audio/wav') ? 'audio/wav' : undefined);
        recorder = new MediaRecorder(audioStream, mimeType ? { mimeType } : undefined);
        const timeSlice = 8000; 
        recorder.ondataavailable = async (e) => {
          if (!e.data || e.data.size === 0) return;
          try {
            const arrayBuffer = await e.data.arrayBuffer();
            const chunkMime = recorder && recorder.mimeType ? recorder.mimeType : (mimeType || 'audio/webm');
 
            if (showCaptions) {
              console.debug('[WWC] emitting audio-data (chunk)', { meetingId, size: e.data.size, mime: chunkMime });
              socket.emit('audio-data', {
                meetingId,
                audioData: arrayBuffer,
                mimeType: chunkMime,
                userId: user?._id,
                userName: user?.name || 'User',
                language: selectedLanguage || 'en',
              });
            }
          } catch (err) {
            console.error('Failed to send MediaRecorder audio chunk:', err);
          }
        };

        recorder.start(timeSlice);
        mediaRecorderRef.current = recorder;
        intervalId = setInterval(() => {
          if (recorder && recorder.state === 'inactive') {
            try { recorder.start(timeSlice); } catch (e) {}
          }
        }, 5000);
      } catch (err) {
        console.warn('Background audio streaming not started:', err);
      }
    }

    return () => {
      if (processor) {
        try { processor.disconnect(); } catch (e) {}
        processor.onaudioprocess = null;
      }
      if (source) {
        try { source.disconnect(); } catch (e) {}
      }
      if (audioCtx) {
        try { audioCtx.close(); } catch (e) {}
      }
      if (recorder && recorder.state !== 'inactive') {
        try { recorder.stop(); } catch (e) {}
      }
      if (intervalId) clearInterval(intervalId);
    };
  }, [mediaStream, socket, meetingId, user, selectedLanguage, showCaptions]);


  const encodeWAV = (samples, sampleRate) => {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);
 writeString(view, 0, 'RIFF');
view.setUint32(4, 36 + samples.length * 2, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
 view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, 'data');
  view.setUint32(40, samples.length * 2, true);

    floatTo16BitPCM(view, 44, samples);

    return new Uint8Array(buffer);
  };

  const floatTo16BitPCM = (output, offset, input) => {
    for (let i = 0; i < input.length; i++, offset += 2) {
      let s = Math.max(-1, Math.min(1, input[i]));
      s = s < 0 ? s * 0x8000 : s * 0x7fff;
      output.setInt16(offset, s, true);
    }
  };

  const writeString = (view, offset, string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  const screenStreamRef = useRef(null);
  const supportsDisplayMedia = () => {
    try {
      return !!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia);
    } catch (e) {
      return false;
    }
  };

  const isMobileDevice = () => {
    try {
      const ua = navigator.userAgent || navigator.vendor || window.opera || '';
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(ua);
    } catch (e) {
      return false;
    }
  };

  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        if (!supportsDisplayMedia()) {
          notify.error(
            "Screen sharing is not supported on this device or browser. Try using a desktop browser."
          );
          return;
        }

        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });
        screenStreamRef.current = screenStream;
        setIsScreenSharing(true);

        const screenTrack = screenStream.getVideoTracks()[0];
        
        for (const [socketId, pc] of Object.entries(peerConnections.current)) {
          if (screenTrack) {
            pc.addTrack(screenTrack, mediaStream);

            try {
              const offer = await pc.createOffer({
                offerToReceiveAudio: true,
                offerToReceiveVideo: true,
                voiceActivityDetection: false,
              });
              await pc.setLocalDescription(offer);
              socket.emit("offer", { offer, targetSocketId: socketId });
            } catch (e) {
              console.error('[WWC] Error renegotiating for screen share:', e);
            }
          }
        }

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }

        screenStream.getVideoTracks()[0].onended = () => {
          stopScreenShare();
        };

        if (socket) socket.emit("start-screen-share");
      } catch (err) {
        console.error("Error starting screen share:", err);
      }
    } else {
      stopScreenShare();
    }
  };

  const stopScreenShare = async () => {
    setIsScreenSharing(false);

    if (screenStreamRef.current) {
      const screenTrack = screenStreamRef.current.getVideoTracks()[0];
      
      for (const [socketId, pc] of Object.entries(peerConnections.current)) {
        const senders = pc.getSenders();
        const screenSender = senders.find(
          (s) => s.track && s.track.id === screenTrack?.id
        );
        if (screenSender) {
          pc.removeTrack(screenSender);
          
          try {
            const offer = await pc.createOffer({
              offerToReceiveAudio: true,
              offerToReceiveVideo: true,
              voiceActivityDetection: false,
            });
            await pc.setLocalDescription(offer);
            socket.emit("offer", { offer, targetSocketId: socketId });
          } catch (e) {
            console.error('[WWC] Error renegotiating after stopping screen share:', e);
          }
        }
      }
      
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }

    if (localVideoRef.current && mediaStream) {
      localVideoRef.current.srcObject = mediaStream;
    }

    if (socket) socket.emit("stop-screen-share");
  };

  useEffect(() => {
    const fetchMeeting = async () => {
      try {
        const res = await meetingService.getMeeting(meetingId);
        if (res.success) setMeeting(res.meeting);
      } catch (e) {
        console.error("Failed to fetch meeting metadata", e);
      }
    };
    fetchMeeting();

    if (socket) {
      socket.on("user-started-screen-share", ({ socketId }) => {
        setRemoteScreenSharerId(socketId);
      });
      socket.on("user-stopped-screen-share", ({ socketId }) => {
        setRemoteScreenSharerId((prev) => (prev === socketId ? null : prev));
      });
    }
    if (authLoading) return;
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    setLoading(false);

    let isMounted = true;
    let localStream;
    const startMediaAndSocket = async () => {
      try {
        localStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            latency: 0,
            sampleRate: 48000,
          },
        });
        if (!isMounted) return;
        console.log('[WWC] Local stream tracks:', localStream.getTracks().map(t => `${t.kind}/${t.id.substring(0, 8)}`));
        setMediaStream(localStream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStream;
        }

        const sock = io(SOCKET_SERVER_URL, { transports: ["websocket"] });
        setSocket(sock);
        sock.on("connect", () => {
          console.log('[WWC] socket connected', sock.id);
          setSelfSocketId(sock.id);
  
          Object.values(peerConnections.current).forEach((pc) => pc.close());
          peerConnections.current = {};
          setParticipants([]);
          setRemoteStreams({});
          socketIdToUserId.current = {};
        });

        const onCaptionUpdateEarly = (payload) => {
          try {
            console.log('[WWC] received caption-update', payload);
            const text = payload?.text || payload?.original_text || "";
            setCurrentCaption(text || "");
          } catch (e) {
            console.warn('caption-update early handler error', e);
          }
        };
        sock.on('caption-update', onCaptionUpdateEarly);

        const userIdToSend = user?._id || user?.id;
        console.log("[WWC] Joining meeting with user:", { userId: userIdToSend, userName: user?.name, fullUser: user });
        sock.emit("join-meeting", {
          meetingId,
          userId: userIdToSend,
          userName: user?.name || "User",
        });
 
        setTimeout(() => {
          sock.emit("camera-state-changed", {
            userId: userIdToSend,
            isVideoOn: true, 
          });
        }, 100);
        
        (async () => {
          try {
            const res = await meetingService.joinMeeting(meetingId);
            if (res && res.success && res.meeting) {
              setMeeting(res.meeting);
            }
          } catch (e) {
            console.warn("Could not persist join to meeting service", e);
          }
        })();

        sock.on("ice-servers", (config) => {
          iceServers.current = config;
        });

        sock.on("existing-participants", (existing) => {
          console.log("[WWC] existing-participants received:", existing);

          const mapped = existing.map(p => ({ ...p }));
          const uniqByUser = Array.from(
            new Map(mapped.map((p) => [p.userId || p.socketId, p])).values()
          ).filter((p) => p.socketId !== sock.id);

          uniqByUser.forEach(p => {
            if (p.userId) socketIdToUserId.current[p.socketId] = p.userId;
            else socketIdToUserId.current[p.socketId] = p.socketId;
          });

          setParticipants(uniqByUser);
          console.log("[WWC] participants set to:", uniqByUser);

          uniqByUser.forEach((p) => {
            createPeerConnection(p.socketId, localStream, sock, true, p.userId);
          });
        });

        sock.on("user-joined", (data) => {
          console.log("[WWC] user-joined received:", data);
          if (data.socketId === sock.id) return;

          setParticipants((prev) => {
            const filtered = prev.filter(
              (p) => String(p.userId) !== String(data.userId)
            );
            return [...filtered, data];
          });
          socketIdToUserId.current[data.socketId] = data.userId || data.socketId;
          createPeerConnection(data.socketId, localStream, sock, false, data.userId);
        });

        sock.on("user-reconnected", ({ userId, userName, oldSocketId, newSocketId }) => {
          console.log('[WWC] user-reconnected', { userId, oldSocketId, newSocketId });

          setParticipants(prev => prev.filter(p => p.socketId !== oldSocketId));

          if (peerConnections.current[oldSocketId]) {
            try { peerConnections.current[oldSocketId].close(); } catch (e) {}
            delete peerConnections.current[oldSocketId];
          }

          setRemoteStreams(prev => {
            const copy = { ...prev };
            delete copy[oldSocketId];
            delete copy[userId];
            return copy;
          });
          socketIdToUserId.current[newSocketId] = userId || newSocketId;
          setParticipants(prev => {
            const filtered = prev.filter(p => String(p.userId) !== String(userId));
            return [...filtered, { socketId: newSocketId, userId, userName }];
          });

          createPeerConnection(newSocketId, localStream, sock, false, userId);
        });

        sock.on("offer", async ({ offer, fromSocketId }) => {
          if (!peerConnections.current[fromSocketId]) {
            createPeerConnection(fromSocketId, localStream, sock, false);
          }
          await peerConnections.current[fromSocketId].setRemoteDescription(
            new RTCSessionDescription(offer)
          );
          const answer = await peerConnections.current[
            fromSocketId
          ].createAnswer({
            voiceActivityDetection: false,
          });
          await peerConnections.current[fromSocketId].setLocalDescription(
            answer
          );
          sock.emit("answer", { answer, targetSocketId: fromSocketId });
        });

        sock.on("answer", async ({ answer, fromSocketId }) => {
          if (peerConnections.current[fromSocketId]) {
            await peerConnections.current[fromSocketId].setRemoteDescription(
              new RTCSessionDescription(answer)
            );
          }
        });

        sock.on("ice-candidate", async ({ candidate, fromSocketId }) => {
          if (peerConnections.current[fromSocketId]) {
            try {
              await peerConnections.current[fromSocketId].addIceCandidate(
                new RTCIceCandidate(candidate)
              );
            } catch (e) {}
          }
        });

        sock.on("user-left", ({ socketId, userId }) => {
          console.log("User left:", socketId, userId);

          setParticipants((prev) => prev.filter((p) => p.socketId !== socketId && String(p.userId) !== String(userId)));

          if (peerConnections.current[socketId]) {
            peerConnections.current[socketId].close();
            delete peerConnections.current[socketId];
          }

          setRemoteStreams((prev) => {
            const copy = { ...prev };
            delete copy[socketId];
            if (userId) delete copy[userId];
            return copy;
          });

          setRemoteScreenSharerId((prev) => (prev === socketId ? null : prev));
        });

        sock.on("disconnect", () => {
          Object.values(peerConnections.current).forEach((pc) => pc.close());
          peerConnections.current = {};
          setRemoteStreams({});
        });
      } catch (err) {
        setError(
          "Could not access camera or microphone. Please check permissions."
        );
      }
    };
    startMediaAndSocket();
    return () => {
      isMounted = false;
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
      if (socket) {
        socket.disconnect();
      }
      Object.values(peerConnections.current).forEach((pc) => pc.close());
      peerConnections.current = {};
      setRemoteStreams({});
    };
  }, [authLoading, isAuthenticated, meetingId, navigate, user]);

  useEffect(() => {
    if (!meeting || hostId) return;

    if (meeting.host) {
      const id =
        typeof meeting.host === "string"
          ? meeting.host
          : meeting.host._id || meeting.host.id;

      if (id) {
        console.log("[WWC] Setting hostId from meeting data:", String(id));
        setHostId(String(id));
      }
    }
  }, [meeting, hostId]);

  useEffect(() => {
    if (!socket) return;

    const onHostUpdated = ({ hostId }) => {
      console.log("[WWC] host-updated event received:", hostId);
      setHostId(String(hostId));
    };

    socket.on("host-updated", onHostUpdated);

    return () => {
      socket.off("host-updated", onHostUpdated);
    };
  }, [socket]);

  useEffect(() => {
    if (!socket) return;
    const onStart = ({ socketId }) => setRemoteScreenSharerId(socketId);
    const onStop = ({ socketId }) =>
      setRemoteScreenSharerId((prev) => (prev === socketId ? null : prev));
    socket.on("user-started-screen-share", onStart);
    socket.on("user-stopped-screen-share", onStop);

    const onCameraStateChanged = ({ userId, isVideoOn }) => {
      console.log("[WWC] camera-state-changed received:", { userId, isVideoOn });
      setCameraStates(prev => {
        const updated = { ...prev, [userId]: isVideoOn };
        console.log("[WWC] Updated cameraStates:", updated);
        return updated;
      });
    };
    socket.on("camera-state-changed", onCameraStateChanged);

    const onCaptionUpdate = (payload) => {
      try {
    
        const text = payload?.text || payload?.original_text || "";
        setCurrentCaption(text || "");
      } catch (e) {
        console.warn('caption-update handler error', e);
      }
    };
    socket.on('caption-update', onCaptionUpdate);

    const onMeetingEnded = ({ meetingId: mid, reason }) => {
      console.log("Meeting ended event received", mid, reason);
      setMeetingEnded(true);

      try {
        if (mediaStream) {
          mediaStream.getTracks().forEach((t) => t.stop());
        }
      } catch (e) {}

      try {
        Object.values(peerConnections.current).forEach((pc) => pc.close());
        peerConnections.current = {};
      } catch (e) {}

      setTimeout(() => {
        navigate("/dashboard");
      }, 1500);
    };

    socket.on("meeting-ended", onMeetingEnded);

    return () => {
      socket.off("user-started-screen-share", onStart);
      socket.off("user-stopped-screen-share", onStop);
      socket.off("meeting-ended", onMeetingEnded);
      socket.off('caption-update', onCaptionUpdate);
      socket.off("camera-state-changed", onCameraStateChanged);
    };
  }, [socket]);

  useEffect(() => {
    const doFetch = async () => {
      try {
        const res = await meetingService.getMeeting(meetingId);
        if (res.success) setMeeting(res.meeting);
      } catch (e) {
        console.log("error", e);
      }
    };
    if (user) doFetch();
  }, [user, meetingId]);

  const isCreator = (() => {
    if (!user || !meeting) return false;
    const userId = String(user._id || user.id || user);
    let hostId = null;
    if (meeting.host) {
      if (typeof meeting.host === "string") hostId = meeting.host;
      else if (meeting.host._id) hostId = String(meeting.host._id);
      else if (meeting.host.id) hostId = String(meeting.host.id);
      else hostId = String(meeting.host);
    }
    console.log('[DEBUG] isCreator check:', { userId, hostId, isMatch: hostId && String(hostId) === userId });
    return hostId && String(hostId) === userId;
  })();


  const startRecording = () => {
    if (!mediaStream) {
      notify.error("No media stream (microphone) available");
      return;
    }
    (async () => {
      try {
        let screenStream = null;
        const isMobile = isMobileDevice();
        if (isMobile) {
          if (!supportsDisplayMedia()) {
            notify.error(
              "Screen recording is not supported on this mobile browser. Please use a browser that supports screen capture or use a desktop."
            );
            return;
          }
          try {
            screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });

            try {
              const vTrack = screenStream && screenStream.getVideoTracks && screenStream.getVideoTracks()[0];
              let looksLikeScreen = false;
              if (vTrack) {
                const settings = vTrack.getSettings ? vTrack.getSettings() : {};
                if (settings && settings.displaySurface) {
                  looksLikeScreen = true;
                } else {
                  const label = vTrack.label || '';
                  if (/screen|display|window|capture|presentation/i.test(label)) looksLikeScreen = true;
                }
              }
              if (!looksLikeScreen) {
                try { screenStream.getTracks().forEach(t => t.stop()); } catch (e) {}
                screenStream = null;
                notify.error(
                  'Screen recording was not started because Your mobile browser may not support true screen capture.'
                );
                return;
              }
            } catch (e) {
              console.warn('Could not validate displayMedia track:', e);
            }
          } catch (e) {
            console.warn("Screen capture not started on mobile", e);
            notify.error("Screen recording was not started. Please allow screen capture or try again.");
            return;
          }
        } else {
          if (supportsDisplayMedia()) {
            try {
              screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });

              try {
                const vTrack = screenStream && screenStream.getVideoTracks && screenStream.getVideoTracks()[0];
                let looksLikeScreen = false;
                if (vTrack) {
                  const settings = vTrack.getSettings ? vTrack.getSettings() : {};
                  if (settings && settings.displaySurface) {
                    looksLikeScreen = true;
                  } else {
                    const label = vTrack.label || '';
                    if (/screen|display|window|capture|presentation/i.test(label)) looksLikeScreen = true;
                  }
                }
                if (!looksLikeScreen) {
                  try { screenStream.getTracks().forEach(t => t.stop()); } catch (e) {}
                  screenStream = null;
                  console.warn('getDisplayMedia returned a non-screen stream; falling back to camera.');
                }
              } catch (e) {
                console.warn('Could not validate displayMedia track:', e);
              }
            } catch (e) {
              screenStream = null;
              console.warn("Screen capture not started, falling back to camera", e);
            }
          }
        }

        const mixedStream = new MediaStream();
        if (screenStream && screenStream.getVideoTracks().length > 0) {
          screenStream.getVideoTracks().forEach((t) => mixedStream.addTrack(t));
        } else if (mediaStream && mediaStream.getVideoTracks().length > 0) {
          mediaStream.getVideoTracks().forEach((t) => mixedStream.addTrack(t));
        }

        if (mediaStream.getAudioTracks && mediaStream.getAudioTracks().length > 0) {
          mediaStream.getAudioTracks().forEach((t) => mixedStream.addTrack(t));
        }

        recordedChunksRef.current = [];
        const options = {};
        if (MediaRecorder.isTypeSupported("video/webm;codecs=vp9")) {
          options.mimeType = "video/webm;codecs=vp9";
        } else if (MediaRecorder.isTypeSupported("video/webm;codecs=vp8")) {
          options.mimeType = "video/webm;codecs=vp8";
        } else if (MediaRecorder.isTypeSupported("video/webm")) {
          options.mimeType = "video/webm";
        }

        const mr = new MediaRecorder(mixedStream, options);
        mediaRecorderRefForRecording.current = { recorder: mr, screenStream };

        mr.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) recordedChunksRef.current.push(e.data);
        };

        mr.onstart = () => {
          setIsRecording(true);
          setIsRecordingLocal(true);
          setRecordingStartTime(Date.now());
        };

        mr.onstop = async () => {
          setIsRecording(false);
          setIsRecordingLocal(false);
          setRecordingStartTime(null);
          try {
            screenStream.getTracks().forEach((t) => t.stop());
          } catch (e) {}

          const blob = new Blob(recordedChunksRef.current, {
            type: recordedChunksRef.current[0]?.type || "video/webm",
          });
          recordedChunksRef.current = [];

          try {
            setIsUploadingRecording(true);
            const uploadRes = await meetingService.uploadRecording(
              meetingId,
              blob
            );
            if (uploadRes.success) {
              console.log("Recording uploaded successfully");
              const m = await meetingService.getMeeting(meetingId);
              if (m.success) setMeeting(m.meeting);
            } else {
              console.error("Failed to upload recording:", uploadRes.message);
              notify.error("Failed to upload recording: " + (uploadRes.message || ""));
            }
          } catch (err) {
            console.error("Upload error", err);
            notify.error("Upload error: " + (err.message || err));
          } finally {
            setIsUploadingRecording(false);
          }
        };

        if (screenStream) {
          const screenTrack = screenStream.getVideoTracks()[0];
          if (screenTrack) {
            screenTrack.addEventListener("ended", () => {
              try {
                const wrapped = mediaRecorderRefForRecording.current;
                const rr =
                  wrapped && wrapped.recorder ? wrapped.recorder : wrapped;
                if (rr && rr.state !== "inactive") rr.stop();
              } catch (e) {}
            });
          }
        }

        mr.start(1000);
      } catch (err) {
        console.error("Start recording failed", err);
        notify.error("Could not start screen recording: " + (err.message || err));
      }
    })();
  };

    const [showRecordConfirm, setShowRecordConfirm] = useState(false);
    const [isRecordingLocal, setIsRecordingLocal] = useState(false);
    const [recordingStartTime, setRecordingStartTime] = useState(null);
    const timerIntervalRef = useRef(null);
    const [recordingElapsed, setRecordingElapsed] = useState(0);

    const handleStartRecordingClick = () => {
      if (isRecording) return;
      setShowRecordConfirm(true);
    };

    const formatElapsed = (secs) => {
      const s = Math.floor(secs % 60).toString().padStart(2, '0');
      const m = Math.floor((secs / 60) % 60).toString().padStart(2, '0');
      const h = Math.floor(secs / 3600).toString().padStart(2, '0');
      return `${h}:${m}:${s}`;
    };

    useEffect(() => {
      if (isRecordingLocal && recordingStartTime) {
        setRecordingElapsed(Math.floor((Date.now() - recordingStartTime) / 1000));
        timerIntervalRef.current = setInterval(() => {
          setRecordingElapsed(Math.floor((Date.now() - recordingStartTime) / 1000));
        }, 1000);
      }
      return () => {
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }
      };
    }, [isRecordingLocal, recordingStartTime]);

  const stopRecording = () => {
    const wrapped = mediaRecorderRefForRecording.current;
    if (!wrapped) return;
    const mr = wrapped.recorder ? wrapped.recorder : wrapped;
    if (mr && mr.state !== "inactive") mr.stop();
  };

  const createPeerConnection = (socketId, localStream, sock, isInitiator, userId) => {
    if (peerConnections.current[socketId]) return;
    const rtcConfig = iceServers.current || {
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    };

    rtcConfig.sdpSemantics = 'unified-plan';
    rtcConfig.bundlePolicy = 'max-bundle';
    rtcConfig.rtcpMuxPolicy = 'require';
    rtcConfig.iceTransportPolicy = 'all';
    
    const pc = new RTCPeerConnection(rtcConfig);
    peerConnections.current[socketId] = pc;
    console.log('[WWC] Created peer connection for:', socketId, '| Total peers:', Object.keys(peerConnections.current).length);

    localStream.getTracks().forEach((track) => {
      console.log('[WWC] Adding track to peer:', track.kind, track.id.substring(0, 8), '-> socketId:', socketId);
      pc.addTrack(track, localStream);
    });

    pc.ontrack = (event) => {
      console.log('[WWC] Received track:', event.track.kind, event.track.id.substring(0, 8), 'from:', socketId);
      const uid = socketIdToUserId.current[socketId] || userId || null;
      const key = uid || socketId;

      setRemoteStreams((prev) => {
        const existingStream = prev[key];
        if (existingStream) {
          const trackExists = existingStream.getTracks().some(t => t.id === event.track.id);
          if (!trackExists) {
            try { existingStream.addTrack(event.track); } catch (e) {}
            console.log('[WWC] Added track to existing stream. Total tracks:', existingStream.getTracks().length);
          }
          return { ...prev };
        } else {
          const newStream = new MediaStream([event.track]);
          console.log('[WWC] Created new stream for key:', key);
          return { ...prev, [key]: newStream };
        }
      });
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sock.emit("ice-candidate", {
          candidate: event.candidate,
          targetSocketId: socketId,
        });
      }
    };

    if (isInitiator) {
      pc.onnegotiationneeded = async () => {
        try {
          const offer = await pc.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: true,
            voiceActivityDetection: false,
          });
          await pc.setLocalDescription(offer);
          sock.emit("offer", { offer, targetSocketId: socketId });
        } catch (e) {
          console.error('[WWC] Error creating offer:', e);
        }
      };
    }
  };

  const handleSendMessage = (e) => {
    if (e) e.preventDefault();
    if (newMessage.trim()) {
      setMessages([
        ...messages,
        {
          id: Date.now(),
          sender: user?.name || "You",
          text: newMessage,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
      setNewMessage("");
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-wwc-50 via-white to-accent-50 flex items-center justify-center px-4">
        <div className="text-center animate-fade-in">
          <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-wwc-600 to-wwc-700 rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-hard mb-4 sm:mb-6">
            <div className="animate-pulse-soft">
              <span className="text-white font-bold text-xl sm:text-2xl font-display">
                W
              </span>
            </div>
          </div>
          <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-wwc-500 mx-auto mb-3 sm:mb-4"></div>
          <p className="text-neutral-900 font-semibold text-base sm:text-lg">
            Connecting to WWC Meeting...
          </p>
          <p className="text-neutral-600 text-xs sm:text-sm mt-1 truncate max-w-[280px] sm:max-w-none">
            Meeting ID: {meetingId}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-error-950 flex items-center justify-center px-4">
        <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-6 sm:p-8 max-w-md mx-4">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-error-500 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <svg
              className="w-6 h-6 sm:w-8 sm:h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 sm:mb-3">
            Connection Failed
          </h2>
          <p className="text-neutral-300 mb-4 sm:mb-6 text-sm sm:text-base">{error}</p>
          <button
            onClick={() => navigate("/dashboard")}
            className="bg-gradient-to-r from-wwc-600 to-wwc-700 text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-sm sm:text-base font-semibold hover:from-wwc-700 hover:to-wwc-800 transition-all duration-200 shadow-soft hover:shadow-medium w-full sm:w-auto"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (meetingEnded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-wwc-50 via-white to-accent-50 px-4">
        <div className="bg-white/90 rounded-xl sm:rounded-2xl shadow-medium p-6 sm:p-8 text-center max-w-md">
          <h2 className="text-xl sm:text-2xl font-bold text-success-700 mb-3 sm:mb-4">
            Meeting Ended
          </h2>
          <p className="text-neutral-700 mb-1.5 sm:mb-2 text-sm sm:text-base">
            The meeting has been successfully ended.
          </p>
          <p className="text-neutral-500 text-xs sm:text-sm">
            Redirecting to dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-wwc-50 via-white to-accent-50 overflow-hidden relative">
      <div className="flex-1 flex mt-3 sm:mt-4 md:mt-6">
        <div className="flex w-full h-[calc(100vh-60px)] sm:h-[calc(100vh-68px)] md:h-[calc(100vh-72px)]">
          <MeetingStage
            mediaStream={mediaStream}
            participants={participants}
            remoteStreams={remoteStreams}
            selfSocketId={selfSocketId}
            socket={socket}
            hostId={hostId}
            isScreenSharing={isScreenSharing}
            remoteScreenSharerId={remoteScreenSharerId}
            screenStreamRef={screenStreamRef}
            localVideoRef={localVideoRef}
            showCaptions={showCaptions}
            currentCaption={currentCaption}
            user={user}
            isMuted={isMuted}
            isVideoOn={isVideoOn}
            cameraStates={cameraStates}
          />

          <MeetingSidePanel
            activePanel={activePanel}
            socket={socket}
            user={user}
            isMuted={isMuted}
            participants={participants}
            setActivePanel={setActivePanel}
          />
        </div>
      </div>

        {isUploadingRecording && (
          <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
            <div className="bg-black/60 backdrop-blur-sm rounded-lg p-4 flex items-center space-x-3 pointer-events-auto">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" />
              <div className="text-white font-medium">Uploading recording...</div>
            </div>
          </div>
        )}

        {isRecordingLocal && (
          <div className="fixed top-4 right-4 z-[9998]">
            <div className="bg-black/75 text-white px-3 py-1 rounded-lg shadow-md font-mono text-sm">
              Recording {formatElapsed(recordingElapsed)}
            </div>
          </div>
        )}

        {/* Control Bar */}
      <MeetingControls
        isMuted={isMuted}
        isVideoOn={isVideoOn}
        showCaptions={showCaptions}
        selectedLanguage={selectedLanguage}
        isScreenSharing={isScreenSharing}
        endingMeeting={endingMeeting}
        endMeetingError={endMeetingError}
        toggleMute={toggleMute}
        toggleVideo={toggleVideo}
        toggleCaptions={toggleCaptions}
        setSelectedLanguage={setSelectedLanguage}
        toggleScreenShare={toggleScreenShare}
        handleEndMeeting={handleEndMeeting}
        isCreator={isCreator}
        isRecording={isRecording}
        onStartRecording={handleStartRecordingClick}
        onStopRecording={stopRecording}
        isUploadingRecording={isUploadingRecording}
        activePanel={activePanel}
        setActivePanel={setActivePanel}
        mediaStream={mediaStream}
        socket={socket}
        navigate={navigate}
        user={user}
        meetingId={meetingId}
      />
      {/* Confirmation modal for recording start */}
      {showRecordConfirm && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 pointer-events-auto" role="dialog" aria-modal="true">
          <div className="bg-white rounded-lg p-4 max-w-sm w-full mx-4 pointer-events-auto">
            <h3 className="text-lg font-semibold mb-2">Start Recording</h3>
            <p className="text-sm text-neutral-700 mb-4">Are you sure you want to record the meeting?</p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowRecordConfirm(false)}
                className="px-3 py-1 rounded-md border border-neutral-300"
              >
                No
              </button>
              <button
                onClick={() => {
                  setShowRecordConfirm(false);
                try { startRecording(); } catch (e) { console.error(e); }
                }}
                className="px-3 py-1 rounded-md bg-wwc-600 text-white"
              >
                Yes, start
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeetingRoom;
