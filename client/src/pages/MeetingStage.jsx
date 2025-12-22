import React from "react";

const VideoTile = ({ stream, label, isLocal = false, avatarChar = "U", participantCount = 1, sizePx, isHost = false, muted = false, cameraOn = undefined }) => {
  const ref = React.useRef(null);
  const [hasVideo, setHasVideo] = React.useState(false);

  React.useEffect(() => {
    const el = ref.current;
    if (el) {
      el.srcObject = stream || null;
      // Optimize for low latency
      if (el.srcObject && !isLocal) {
        el.play().catch(e => console.log('[WWC] Video play error:', e));
      }
    }

    const computeHasVideo = () => {
      if (!stream) return false;
      const v = stream.getVideoTracks();
      if (!v.length) return false;
      const t = v[0];
      return t && t.readyState === "live" && t.enabled !== false;
    };

    const update = () => setHasVideo(computeHasVideo());
    update();

    if (!stream) return;
    const onAdd = () => update();
    const onRemove = () => update();
    const track = stream.getVideoTracks()[0];
    const onMute = () => update();
    const onUnmute = () => update();
    const onEnded = () => update();
    stream.addEventListener?.("addtrack", onAdd);
    stream.addEventListener?.("removetrack", onRemove);
    track?.addEventListener?.("mute", onMute);
    track?.addEventListener?.("unmute", onUnmute);
    track?.addEventListener?.("ended", onEnded);

    const pollInterval = setInterval(() => update(), 400);

    return () => {
      stream.removeEventListener?.("addtrack", onAdd);
      stream.removeEventListener?.("removetrack", onRemove);
      track?.removeEventListener?.("mute", onMute);
      track?.removeEventListener?.("unmute", onUnmute);
      track?.removeEventListener?.("ended", onEnded);
      clearInterval(pollInterval);
    };
  }, [stream, isLocal]);

  const getCircleSize = () => {
    if (sizePx) return "";
    if (participantCount <= 2) return "w-48 h-48 sm:w-60 sm:h-60 md:w-80 md:h-80";
    if (participantCount <= 6) return "w-40 h-40 sm:w-44 sm:h-44 md:w-60 md:h-60";
    if (participantCount <= 12) return "w-36 h-36 sm:w-32 sm:h-32 md:w-40 md:h-40";
    return "w-32 h-32 sm:w-24 sm:h-24 md:w-28 md:h-28";
  };

  const getAvatarSize = () => {
    if (sizePx) return "";
    if (participantCount <= 2) return "text-3xl sm:text-3xl md:text-4xl";
    if (participantCount <= 6) return "text-2xl sm:text-2xl md:text-3xl";
    if (participantCount <= 12) return "text-xl sm:text-xl md:text-2xl";
    return "text-lg sm:text-lg md:text-xl";
  };

  const getLabelSize = () => {
    if (participantCount <= 4) return "text-xs sm:text-xs px-2 sm:px-2 py-1 sm:py-1";
    if (participantCount <= 9) return "text-[11px] sm:text-[10px] px-2 sm:px-2 py-0.5";
    return "text-[10px] sm:text-[9px] px-1.5 sm:px-1.5 py-0.5";
  };

  const circleStyle = sizePx ? { width: sizePx + "px", height: sizePx + "px" } : undefined;
  const avatarStyle = sizePx ? { fontSize: Math.max(18, Math.floor(sizePx / 3)) } : undefined;

  const borderClass = isHost ? "border-wwc-600" : "border-white/80";
  const ringClass = isHost ? "ring-2 ring-wwc-300/30" : "";

  return (
    <div className="flex flex-col items-center gap-1 sm:gap-2" style={sizePx ? { width: sizePx } : undefined}>
      <div className={`relative ${getCircleSize()} rounded-full border-2 sm:border-3 md:border-4 ${borderClass} ${ringClass} shadow-lg sm:shadow-xl overflow-hidden flex-shrink-0`} style={circleStyle}>
        <video 
          ref={ref} 
          autoPlay 
          playsInline 
          disablePictureInPicture
          className={`w-full h-full object-cover rounded-full ${hasVideo ? "" : "hidden"}`} 
          muted={isLocal}
          style={{ latency: 0 }}
        />
        {!hasVideo && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={`bg-gradient-to-br from-wwc-600 to-wwc-700 w-full h-full rounded-full flex items-center justify-center`}>
              <span className={`text-white font-bold ${getAvatarSize()}`} style={avatarStyle}>
                {avatarChar}
              </span>
            </div>
          </div>
        )}
        {/* (No overlay here) */}
      </div>
      <div className={`bg-white/90 text-neutral-900 ${getLabelSize()} rounded-lg font-semibold shadow whitespace-nowrap`}>
        {label}
      </div>
    </div>
  );
};

export default function MeetingStage({
  mediaStream,
  participants = [],
  remoteStreams = {},
  selfSocketId,
  socket,
  hostId = null,
  isScreenSharing,
  remoteScreenSharerId,
  screenStreamRef,
  localVideoRef,
  showCaptions,
  currentCaption,
  user,
  isMuted,
  isVideoOn,
}) {
  const stageRef = React.useRef(null);
  const [stageSize, setStageSize] = React.useState({ w: 800, h: 600 });

  React.useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const update = () => {
      const r = el.getBoundingClientRect();
      setStageSize({ w: r.width, h: r.height });
    };
    update();
    if (window.ResizeObserver) {
      const ro = new ResizeObserver(update);
      ro.observe(el);
      return () => ro.disconnect();
    }
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);


  const tiles = [];
  tiles.push({
    key: "local",
    stream: mediaStream,
    label: `${user?.name || "You"} (You)`,
    isLocal: true,
    userId: user?._id || user?.id || null,
    avatarChar: user?.name?.[0] || "U",
    muted: typeof isMuted !== 'undefined' ? isMuted : false,
    cameraOn: typeof isVideoOn !== 'undefined' ? isVideoOn : undefined,
  });

  const uniqueParticipants = Array.from(new Map(participants.map((p) => [p.socketId, p])).values()).filter(
    (p) => p.socketId !== selfSocketId && p.socketId !== socket?.id
  );
  uniqueParticipants.forEach((p) => {
    const s = remoteStreams[p.socketId];
    if (s) {
      tiles.push({
        key: p.socketId,
        stream: s,
        label: p.userName || "Participant",
        isLocal: false,
        userId: p.userId || null,
        avatarChar: (p.userName && p.userName[0]) || "P",
      });
    }
  });

  const activeShareId = isScreenSharing ? "local" : remoteScreenSharerId;
  const count = tiles.length;

  const getTilePixelSize = (count) => {
    if (count <= 2) return 230;
    if (count <= 6) return 160;
    if (count <= 12) return 120;
    if (count <= 20) return 90;
    return 64;
  };

  let hostTile = null;
  if (hostId) {
    // Try to match hostId to known userId first
    hostTile = tiles.find((t) => t.userId && String(t.userId) === String(hostId));

    // If no match by userId, try matching by tile key (socketId)
    if (!hostTile) {
      hostTile = tiles.find((t) => String(t.key) === String(hostId));
    }

    // As an additional fallback, check participants list for a matching userId or socketId
    if (!hostTile && Array.isArray(participants) && participants.length) {
      const hostParticipant = participants.find((p) => (p.userId && String(p.userId) === String(hostId)) || (p.socketId && String(p.socketId) === String(hostId)));
      if (hostParticipant && hostParticipant.socketId) {
        hostTile = tiles.find((t) => t.key === hostParticipant.socketId) || hostTile;
      }
    }
  }

  if (!hostTile) {
    if (!hostId) {
      hostTile = tiles.find((t) => t.isLocal) || tiles[0];
    } else {
      hostTile = tiles.find((t) => !t.isLocal) || tiles.find((t) => t.isLocal) || tiles[0];
    }
  }

  const others = tiles.filter((t) => t.key !== hostTile.key);

  const tilePx = getTilePixelSize(count);

  const hashKeyToAngle = (key, idx) => {
    let h = 0;
    for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
    h = (h + idx * 13) % 360;
    return (h * Math.PI) / 180;
  };

  const positions = React.useMemo(() => {
    const { w, h } = stageSize;
    const cx = w / 2;
    const cy = h / 2;

    const maxOuterRadius = Math.max(300, Math.min(w, h) / 2 - tilePx - 420);
    const minRadius = Math.max(tilePx * 4.0, 240);

    const perRing = 3;
    const rings = Math.max(1, Math.ceil(others.length / perRing));

    const assigned = [];
    let idx = 0;
    for (let r = 0; r < rings; r++) {
      const itemsInRing = Math.ceil((others.length - idx) / (rings - r));

      const ringRadius = rings === 1 ? maxOuterRadius : minRadius + ((maxOuterRadius - minRadius) * ((r + 1) / (rings + 1)));
      for (let j = 0; j < itemsInRing && idx < others.length; j++, idx++) {
        const o = others[idx];

        const baseAngle = (2 * Math.PI * j) / itemsInRing;
        const jitter = (hashKeyToAngle(o.key, idx) % (Math.PI * 2)) * 0.02; 
        const angle = baseAngle + jitter;
        const x = cx + Math.cos(angle) * ringRadius - tilePx / 2;
        const y = cy + Math.sin(angle) * ringRadius - tilePx / 2;
        assigned.push({ key: o.key, left: x, top: y });
      }
    }
    return assigned;
  }, [others, stageSize, tilePx]);

  if (activeShareId) {
    // For screen sharing view, we need to separate camera and screen tracks
    let screenStream, cameraStream;
    
    if (isScreenSharing) {
      // Local user is sharing
      screenStream = screenStreamRef.current;
      cameraStream = mediaStream;
    } else {
      // Remote user is sharing - need to split the tracks
      const remoteStream = remoteStreams[remoteScreenSharerId];
      if (remoteStream) {
        const videoTracks = remoteStream.getVideoTracks();
        // Typically: first track is camera, second is screen (or vice versa)
        // We can identify screen share track by checking track settings
        const screenTrack = videoTracks.find(t => {
          const settings = t.getSettings();
          // Screen shares typically have different aspect ratios or larger dimensions
          return settings.width > 1280 || settings.displaySurface === 'monitor';
        });
        const cameraTrack = videoTracks.find(t => t !== screenTrack);
        
        if (screenTrack) {
          screenStream = new MediaStream([screenTrack]);
          if (remoteStream.getAudioTracks().length > 0) {
            screenStream.addTrack(remoteStream.getAudioTracks()[0]);
          }
        }
        if (cameraTrack) {
          cameraStream = new MediaStream([cameraTrack]);
        }
      }
    }
    
    return (
      <div className="w-full h-full flex flex-col sm:flex-row items-center justify-center overflow-hidden px-2 sm:px-4 py-2">
        <div className="w-full h-full max-w-full sm:max-w-[1100px] max-h-full sm:max-h-[85vh] mb-12" style={{ aspectRatio: "16 / 9" }}>
          <div className="relative rounded-lg sm:rounded-xl md:rounded-2xl border-2 sm:border-3 md:border-4 border-white shadow-lg sm:shadow-xl overflow-hidden w-full h-full mb-0">
            <video
              autoPlay
              playsInline
              disablePictureInPicture
              muted={isScreenSharing}
              className="w-full h-full object-contain bg-neutral-900"
              style={{ latency: 0 }}
              ref={(el) => {
                if (!el) return;
                el.srcObject = screenStream || null;
                if (screenStream && !isScreenSharing) {
                  el.play().catch(e => console.log('[WWC] Screen share play error:', e));
                }
              }}
            />

            <div className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 md:bottom-6 md:right-6 flex flex-col sm:flex-row items-end sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 md:space-x-3">
              <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full border-2 sm:border-3 md:border-4 border-white shadow-medium sm:shadow-hard overflow-hidden bg-neutral-800">
                <video
                  autoPlay
                  playsInline
                  disablePictureInPicture
                  muted={isScreenSharing}
                  className="w-full h-full object-cover"
                  style={{ latency: 0 }}
                  ref={(el) => {
                    if (!el) return;
                    el.srcObject = cameraStream || null;
                    if (cameraStream && !isScreenSharing) {
                      el.play().catch(e => console.log('[WWC] Camera PIP play error:', e));
                    }
                  }}
                />
              </div>
              <div className="bg-white/90 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold text-neutral-900 shadow truncate max-w-[120px] sm:max-w-[200px]">
                {isScreenSharing ? user?.name || "You" : participants.find((p) => p.socketId === remoteScreenSharerId)?.userName || "Presenter"}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  

  return (
    <>
      {/* Mobile View - Vertical Scrollable Layout */}
      <div className="sm:hidden flex-1 flex flex-col h-full overflow-y-auto overflow-x-hidden p-2 space-y-3">
        {/* Host Tile */}
        <div className="flex flex-col items-center flex-shrink-0">
          <VideoTile
            stream={hostTile.stream}
            label={hostTile.label}
            isLocal={hostTile.isLocal}
            avatarChar={hostTile.avatarChar}
            participantCount={count}
            sizePx={null}
            isHost={true}
            muted={hostTile.muted}
            cameraOn={hostTile.cameraOn}
          />
          <div className="mt-1 px-2 py-0.5 rounded-full bg-wwc-600 text-white text-[10px] font-semibold">Host</div>
        </div>

      
        {others.map((tile) => (
          <div key={tile.key} className="flex flex-col items-center flex-shrink-0">
            <VideoTile
              stream={tile.stream}
              label={tile.label}
              isLocal={tile.isLocal}
              avatarChar={tile.avatarChar}
              participantCount={count}
              sizePx={null}
              muted={tile.muted}
              cameraOn={tile.cameraOn}
            />
          </div>
        ))}
      </div>

      <div ref={stageRef} className="hidden sm:flex flex-1 items-stretch justify-center bg-transparent h-full relative p-3 md:p-4 overflow-hidden">
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ zIndex: 25 }}
          viewBox={`0 0 ${stageSize.w} ${stageSize.h}`}
          preserveAspectRatio="none"
        >
          {positions.map((pos, idx) => {
            const tile = others.find((t) => t.key === pos.key);
            if (!tile) return null;

            const pCx = pos.left + tilePx / 2;
            const pCy = pos.top + tilePx / 2;
            const hostCx = stageSize.w / 2;
            const hostCy = stageSize.h / 2;

            let dx = hostCx - pCx;
            let dy = hostCy - pCy;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const partR = tilePx / 2;
            const hostR = tilePx / 2;
            const ux = dx / dist;
            const uy = dy / dist;

            // Start at participant edge, end at host edge (straight line)
            const startX = pCx + ux * partR;
            const startY = pCy + uy * partR;
            const endX = hostCx - ux * hostR;
            const endY = hostCy - uy * hostR;

            return (
              <line
                key={tile.key}
                x1={startX}
                y1={startY}
                x2={endX}
                y2={endY}
                stroke="#000"
                strokeWidth={1}
                strokeLinecap="round"
                opacity={0.95}
              />
            );
          })}
        </svg>
 
        <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", zIndex: 40 }}>
          <div className="flex flex-col items-center">
            <VideoTile
              stream={hostTile.stream}
              label={hostTile.label}
              isLocal={hostTile.isLocal}
              avatarChar={hostTile.avatarChar}
              participantCount={count}
              sizePx={tilePx}
              isHost={true}
              muted={hostTile.muted}
              cameraOn={hostTile.cameraOn}
            />
            <div className="mt-2 px-3 py-1 rounded-full bg-wwc-600 text-white text-xs font-semibold">Host</div>
          </div>
        </div>

        {positions.map((pos) => {
          const tile = others.find((t) => t.key === pos.key);
          if (!tile) return null;
          return (
            <div key={tile.key} style={{ position: "absolute", left: pos.left, top: pos.top, zIndex: 30 }}>
                  <VideoTile stream={tile.stream} label={tile.label} isLocal={tile.isLocal} avatarChar={tile.avatarChar} participantCount={count} sizePx={tilePx} muted={tile.muted} cameraOn={tile.cameraOn} />
            </div>
          );
        })}
      </div>

      {/* Captions - Show just above the control bar */}
      {showCaptions && (
        <div className="fixed bottom-[72px] sm:bottom-[80px] md:bottom-[88px] left-1/2 transform -translate-x-1/2 max-w-[90%] sm:max-w-xl md:max-w-2xl z-50 px-2">
          <div className="bg-white/95 backdrop-blur-md text-neutral-900 px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-xl sm:rounded-2xl border border-neutral-200 shadow-medium min-h-[40px] sm:min-h-[48px] flex items-center justify-center">
            <p className="text-center font-medium text-xs sm:text-sm md:text-base">{currentCaption ? currentCaption : <span className="text-neutral-400 italic">Listening...</span>}</p>
          </div>
        </div>
      )}
    </>
  );
}

