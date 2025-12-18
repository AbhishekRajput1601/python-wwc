import React, { useState, useEffect, useRef } from "react";
import api from "../utils/api";
import MeetingStage from "./MeetingStage.jsx";
import MeetingSidePanel from "./MeetingSidePanel.jsx";
import MeetingControls from "./MeetingControls.jsx";
import io from "socket.io-client";
import meetingService from "../services/meetingService";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

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

        if (mediaStream) {
          mediaStream.getTracks().forEach((track) => track.stop());
        }

        setTimeout(() => {
          navigate("/dashboard");
        }, 2000);
      } else {
        setEndMeetingError(result.message || "Failed to end meeting.");
      }
    } catch (err) {
      setEndMeetingError("Failed to end meeting.");
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
    if (mediaStream) {
      const videoTracks = mediaStream.getVideoTracks();
      if (videoTracks.length > 0) {
        videoTracks.forEach((track) => {
          track.enabled = !isVideoOn;
        });
      }

      if (!isVideoOn && localVideoRef.current) {
        localVideoRef.current.srcObject = mediaStream;
      }

      if (isVideoOn && localVideoRef.current) {
        localVideoRef.current.srcObject = null;
      }
    }
    setIsVideoOn((prev) => !prev);
  };
  const toggleCaptions = () => {
    const next = !showCaptions;
    setShowCaptions(next);
    try {
      if (socket) {
        if (next) {
          socket.emit('start_captions', { meetingId, language: selectedLanguage || 'en' });
        } else {
          socket.emit('stop_captions', { meetingId });
        }
      }
    } catch (e) {
      console.warn('Failed to toggle captions on server', e);
    }
  };

  // Continuous background audio streaming to server (always active when joined)
  useEffect(() => {
    let recorder = null;
    let intervalId = null;
    let audioCtx = null;
    let source = null;
    let processor = null;

    const useWavEncoding = true; // prefer WAV encoding via WebAudio

    const sendWavBuffer = async (float32Buffer, sampleRate) => {
      // convert Float32Array to 16-bit PCM WAV
      const buffer = encodeWAV(float32Buffer, sampleRate);
      try {
          socket.emit('audio_data', {
          meetingId,
          audioData: buffer.buffer,
          mimeType: 'audio/wav',
          userId: user?._id,
          userName: user?.name || 'User',
          language: selectedLanguage || 'en',
        });
      } catch (err) {
        console.error('Failed to send WAV buffer:', err);
      }
    };

    if (mediaStream && socket) {
      try {
        // Try WebAudio capture + WAV encoding first
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
            // Aggregate into 0.5-2s speech segments; use 1s target
            const targetSeconds = 1.0;
            const targetSamples = sampleRate * targetSeconds;
            let collected = [];
            let collectedSamples = 0;
            let lastVoice = false;
            const VAD_THRESHOLD = 0.01; // RMS threshold, tweak if needed

            processor.onaudioprocess = (e) => {
              try {
                const input = e.inputBuffer.getChannelData(0);
                // copy input to a new Float32Array
                const chunk = new Float32Array(input.length);
                chunk.set(input);
                collected.push(chunk);
                collectedSamples += chunk.length;

                if (collectedSamples >= targetSamples) {
                  // concatenate
                  const out = new Float32Array(collectedSamples);
                  let offset = 0;
                  for (const c of collected) {
                    out.set(c, offset);
                    offset += c.length;
                  }
                  // reset
                  collected = [];
                  collectedSamples = 0;
                  // VAD: compute RMS and send only if likely speech
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
                    // short hangover: if we recently had voice, consider sending small non-voice to finish phrase
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

        // Always keep a MediaRecorder fallback (with longer timeslice)
        const audioStream = new MediaStream(mediaStream.getAudioTracks());
        const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : (MediaRecorder.isTypeSupported('audio/wav') ? 'audio/wav' : undefined);
        recorder = new MediaRecorder(audioStream, mimeType ? { mimeType } : undefined);
        const timeSlice = 8000; // increased chunk size for better container completeness

        recorder.ondataavailable = async (e) => {
          if (!e.data || e.data.size === 0) return;
          try {
            const arrayBuffer = await e.data.arrayBuffer();
            const chunkMime = recorder && recorder.mimeType ? recorder.mimeType : (mimeType || 'audio/webm');
            socket.emit('audio_data', {
              meetingId,
              audioData: arrayBuffer,
              mimeType: chunkMime,
              userId: user?._id,
              userName: user?.name || 'User',
              language: selectedLanguage || 'en',
            });
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
  }, [mediaStream, socket, meetingId, user, selectedLanguage]);

  // WAV encoder helpers
  const encodeWAV = (samples, sampleRate) => {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);

    /* RIFF identifier */ writeString(view, 0, 'RIFF');
    /* file length */ view.setUint32(4, 36 + samples.length * 2, true);
    /* RIFF type */ writeString(view, 8, 'WAVE');
    /* format chunk identifier */ writeString(view, 12, 'fmt ');
    /* format chunk length */ view.setUint32(16, 16, true);
    /* sample format (raw) */ view.setUint16(20, 1, true);
    /* channel count */ view.setUint16(22, 1, true);
    /* sample rate */ view.setUint32(24, sampleRate, true);
    /* byte rate (sampleRate * blockAlign) */ view.setUint32(28, sampleRate * 2, true);
    /* block align (channel count * bytes per sample) */ view.setUint16(32, 2, true);
    /* bits per sample */ view.setUint16(34, 16, true);
    /* data chunk identifier */ writeString(view, 36, 'data');
    /* data chunk length */ view.setUint32(40, samples.length * 2, true);

    // write the PCM samples
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
          alert(
            "Screen sharing is not supported on this device or browser. Try using a desktop browser."
          );
          return;
        }

        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });
        screenStreamRef.current = screenStream;
        setIsScreenSharing(true);

        Object.values(peerConnections.current).forEach((pc) => {
          const sender = pc
            .getSenders()
            .find((s) => s.track && s.track.kind === "video");
          if (sender) {
            sender.replaceTrack(screenStream.getVideoTracks()[0]);
          }
        });

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

  const stopScreenShare = () => {
    setIsScreenSharing(false);
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }

    if (mediaStream) {
      Object.values(peerConnections.current).forEach((pc) => {
        const sender = pc
          .getSenders()
          .find((s) => s.track && s.track.kind === "video");
        if (sender) {
          sender.replaceTrack(mediaStream.getVideoTracks()[0]);
        }
      });

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = mediaStream;
      }
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
          setSelfSocketId(sock.id);
        });

        sock.emit("join-meeting", {
          meetingId,
          userId: user?._id,
          userName: user?.name || "User",
        });
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
          const uniq = Array.from(
            new Map(existing.map((p) => [p.socketId, p])).values()
          ).filter((p) => p.socketId !== sock.id);
          setParticipants(uniq);

          uniq.forEach((p) => {
            createPeerConnection(p.socketId, localStream, sock, true);
          });
        });

        sock.on("user-joined", (data) => {
          if (data.socketId === sock.id) return;

          setParticipants((prev) => {
            const exists = prev.some((p) => p.socketId === data.socketId);
            if (exists) {
              return prev;
            }
            return [...prev, data];
          });

          createPeerConnection(data.socketId, localStream, sock, false);
        });

        // Offer
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

        sock.on("user-left", ({ socketId }) => {
          console.log("User left:", socketId);

          setParticipants((prev) =>
            prev.filter((p) => p.socketId !== socketId)
          );

          if (peerConnections.current[socketId]) {
            peerConnections.current[socketId].close();
            delete peerConnections.current[socketId];
          }

          setRemoteStreams((prev) => {
            const copy = { ...prev };
            delete copy[socketId];
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
    if (!socket) return;
    const onStart = ({ socketId }) => setRemoteScreenSharerId(socketId);
    const onStop = ({ socketId }) =>
      setRemoteScreenSharerId((prev) => (prev === socketId ? null : prev));
    socket.on("user-started-screen-share", onStart);
    socket.on("user-stopped-screen-share", onStop);

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
    };
  }, [socket]);

  // Listen for live caption updates and update UI
  useEffect(() => {
    if (!socket) return;
    const onCaptionUpdate = (payload) => {
      try {
        if (!payload) return;
        const text = payload.text || payload.caption || payload.original_text || '';
        setCurrentCaption(text);
        if (text) {
          setTimeout(() => {
            setCurrentCaption((cur) => (cur === text ? '' : cur));
          }, 5000);
        }
      } catch (e) {
        console.warn('Failed to handle caption-update', e);
      }
    };

    const onCaptionError = (payload) => {
      try {
        const msg = payload?.message || 'Transcription unavailable';
        // show briefly in caption area
        setCurrentCaption(msg);
        setTimeout(() => setCurrentCaption(''), 5000);
      } catch (e) {
        console.warn('Failed to handle caption-error', e);
      }
    };

    socket.on('caption-update', onCaptionUpdate);
    socket.on('caption-error', onCaptionError);
    return () => {
      socket.off('caption-update', onCaptionUpdate);
      socket.off('caption-error', onCaptionError);
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
      else hostId = String(meeting.host);
    }
    return hostId && String(hostId) === userId;
  })();
  const hostId = (() => {
    if (!meeting) return null;
    if (meeting.host) {
      if (typeof meeting.host === "string") return meeting.host;
      if (meeting.host._id) return String(meeting.host._id);
      return String(meeting.host);
    }
    return null;
  })();

  const startRecording = () => {
    if (!mediaStream) return alert("No media stream (microphone) available");
    (async () => {
      try {
        let screenStream = null;
        const isMobile = isMobileDevice();
        if (isMobile) {
          if (!supportsDisplayMedia()) {
            alert(
              "Screen recording is not supported on this mobile browser. Please use a browser that supports screen capture or use a desktop."
            );
            return;
          }
          try {
            screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
          } catch (e) {
            console.warn("Screen capture not started on mobile", e);
            alert("Screen recording was not started. Please allow screen capture or try again.");
            return;
          }
        } else {
          if (supportsDisplayMedia()) {
            try {
              screenStream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
              });
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

        // Always attach audio tracks from the user's media stream when available
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
              alert("Failed to upload recording: " + (uploadRes.message || ""));
            }
          } catch (err) {
            console.error("Upload error", err);
            alert("Upload error: " + (err.message || err));
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
        alert("Could not start screen recording: " + (err.message || err));
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

  const createPeerConnection = (socketId, localStream, sock, isInitiator) => {
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
      const inboundStream =
        event.streams && event.streams[0] ? event.streams[0] : null;
      if (inboundStream) {
        setRemoteStreams((prev) => ({ ...prev, [socketId]: inboundStream }));
      }
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
