import React from "react";

const VideoTile = ({ stream, label, isLocal = false, avatarChar = "U", participantCount = 1, sizePx, isHost = false, muted = false, cameraOn = undefined, userId = null }) => {
  const ref = React.useRef(null);

  const hasVideo = cameraOn !== false && !!stream;

  React.useEffect(() => {
    if (!isLocal) {
      console.log(`[WWC] VideoTile ${label}:`, { userId, cameraOn, hasStream: !!stream, hasVideo });
    }
  }, [cameraOn, hasVideo, stream, isLocal, label, userId]);

  React.useEffect(() => {

    if (!hasVideo || !stream) return;
    
    const el = ref.current;
    if (el) {
      el.srcObject = stream;
  
      if (!isLocal) {
        el.play().catch(e => console.log('[WWC] Video play error:', e));
      }
    }

    return () => {
      if (el) {
        el.srcObject = null;
      }
    };
  }, [stream, isLocal, hasVideo]);

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
        {hasVideo ? (
          <video 
            ref={ref} 
            autoPlay 
            playsInline 
            disablePictureInPicture
            className="w-full h-full object-cover rounded-full" 
            muted={isLocal}
            style={{ latency: 0 }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={`bg-gradient-to-br from-wwc-600 to-wwc-700 w-full h-full rounded-full flex items-center justify-center`}>
              <span className={`text-white font-bold ${getAvatarSize()}`} style={avatarStyle}>
                {avatarChar}
              </span>
            </div>
          </div>
        )}
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
  cameraStates = {},
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
    isHost: hostId && String(user?._id || user?.id) === String(hostId),
  });

  const uniqueParticipants = Array.from(new Map(participants.map((p) => [p.socketId, p])).values()).filter(
    (p) => p.socketId !== selfSocketId && p.socketId !== socket?.id
  );

  const uniqByUser = Array.from(new Map(participants.map((p) => [p.userId || p.socketId, p])).values()).filter(
    (p) => p.socketId !== selfSocketId && p.socketId !== socket?.id
  );
  uniqByUser.forEach((p) => {
    const streamKey = p.userId || p.socketId;
    const s = remoteStreams[streamKey] || remoteStreams[p.socketId];

    tiles.push({
      key: streamKey,
      stream: s || null,
      label: p.userName || "Participant",
      isLocal: false,
      userId: p.userId || null,
      avatarChar: (p.userName && p.userName[0]) || "P",
      isHost: hostId && String(p.userId || streamKey) === String(hostId),

      cameraOn: p.userId ? (cameraStates[p.userId] !== false) : true,
    });
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
    hostTile = tiles.find(
      (t) =>
        (t.userId && String(t.userId) === String(hostId)) ||
        String(t.key) === String(hostId)
    );
 
    if (!hostTile) {
      console.log("[WWC] HOST RESOLVE DEBUG", {
        hostId,
        tiles: tiles.map(t => ({ key: t.key, userId: t.userId, label: t.label, isLocal: t.isLocal }))
      });
    }
  }

  if (!hostTile) {
    hostTile = {
      key: "virtual-host",
      stream: null,
      label: "Host",
      isLocal: false,
      avatarChar: "H",
      isHost: true,
      muted: true,
      cameraOn: false,
    };
  }

  const others = tiles.filter(
    (t) => t.key !== hostTile.key && t.key !== "virtual-host"
  );

  const tilePx = getTilePixelSize(count);

  const hashKeyToAngle = (key, idx) => {
    let h = 0;
    for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
    h = (h + idx * 13) % 360;
    return (h * Math.PI) / 180;
  };

  const positionMapRef = React.useRef(new Map());
  const lastParticipantSetRef = React.useRef("");
  const lastLayoutRef = React.useRef({ stageSize: null, tilePx: null });

  const positions = React.useMemo(() => {
    const currentParticipantSet = others.map((t) => t.key).sort().join("|");
    const sizeValid = stageSize && stageSize.w > 0 && stageSize.h > 0;
    const prevStage = lastLayoutRef.current.stageSize;
    const prevValid = prevStage && prevStage.w > 0 && prevStage.h > 0;

    let layoutChanged = false;
    if (sizeValid) {
      layoutChanged = !prevStage || prevStage.w !== stageSize.w || prevStage.h !== stageSize.h || lastLayoutRef.current.tilePx !== tilePx;
    } else {
      layoutChanged = false;
    }

    const participantsChanged = currentParticipantSet !== lastParticipantSetRef.current;

    if (participantsChanged || layoutChanged) {
      console.debug('[WWC] positions recompute', { participantsChanged, layoutChanged, currentParticipantSet, lastParticipantSet: lastParticipantSetRef.current, stageSize, tilePx, othersOrder: others.map(t=>t.key) });
      lastParticipantSetRef.current = currentParticipantSet;
      lastLayoutRef.current = { stageSize: { ...stageSize }, tilePx };

      const { w, h } = stageSize || { w: 0, h: 0 };
      const cx = w / 2 || 0;
      const cy = h / 2 || 0;

      const MIN_DISTANCE = tilePx * 0.85;
      const RING_GAP = tilePx * 0.9;

      const sortedOthers = [...others].sort((a, b) => a.key.localeCompare(b.key));
      
      let ringIndex = 1;
      let placed = 0;

      // Build a new map first so we never leave the global map empty during computation
      const newMap = new Map(positionMapRef.current);

      while (placed < sortedOthers.length) {

        const radius = ringIndex * RING_GAP + tilePx * 0.5;
        const circumference = 2 * Math.PI * radius;

        const maxInRing = Math.max(1, Math.floor(circumference / MIN_DISTANCE));
        const count = Math.min(maxInRing, sortedOthers.length - placed);

        for (let i = 0; i < count; i++) {
          const angle = (2 * Math.PI * i) / count + ringIndex * 0.35; 

          let x = cx + Math.cos(angle) * radius - tilePx / 2;
          let y = cy + Math.sin(angle) * radius - tilePx / 2;

          // Clamp positions so tiles remain inside the stage bounds
          x = Math.max(0, Math.min(x, Math.max(0, w - tilePx)));
          y = Math.max(0, Math.min(y, Math.max(0, h - tilePx)));

          newMap.set(sortedOthers[placed].key, { left: x, top: y });
          placed++;
        }

        ringIndex++;
    
        if (ringIndex > 100) break;
      }

      // Swap the computed map in once complete
      positionMapRef.current = newMap;
    } else {
      console.debug('[WWC] positions cached used', { currentParticipantSet, stageSize, tilePx, othersOrder: others.map(t=>t.key) });
    }

    // Ensure we return a sensible fallback (center) if a participant has no computed position yet
    const fallbackX = (stageSize && stageSize.w ? stageSize.w / 2 - tilePx / 2 : 0);
    const fallbackY = (stageSize && stageSize.h ? stageSize.h / 2 - tilePx / 2 : 0);

    return others.map(t => ({
      key: t.key,
      ...(positionMapRef.current.get(t.key) || { left: fallbackX, top: fallbackY })
    }));
  }, [others, stageSize, tilePx]);

  if (activeShareId) {
    let screenStream, cameraStream;
    
    if (isScreenSharing) {
 
      screenStream = screenStreamRef.current;
      cameraStream = mediaStream;
    } else {

      let remoteStream = remoteStreams[remoteScreenSharerId] || null;
      if (!remoteStream) {
        const participant = participants.find((p) => p.socketId === remoteScreenSharerId);
        if (participant) {
          remoteStream = remoteStreams[participant.userId] || remoteStreams[participant.socketId] || null;
        }
      }

      if (!remoteStream) {
        for (const s of Object.values(remoteStreams)) {
          try {
            const vt = s.getVideoTracks();
            const st = vt.find(t => {
              const settings = t.getSettings ? t.getSettings() : {};
              return (settings && (settings.displaySurface === 'monitor' || settings.width > 1280));
            });
            if (st) {
              remoteStream = s;
              break;
            }
          } catch (e) {
            console.log('[WWC] Screen share detection error:', e);
          }
        }
      }

      if (remoteStream) {
        const videoTracks = remoteStream.getVideoTracks();
        const screenTrack = videoTracks.find(t => {
          const settings = t.getSettings ? t.getSettings() : {};
          return (settings && (settings.width > 1280 || settings.displaySurface === 'monitor'));
        });
        const cameraTrack = videoTracks.find(t => t !== screenTrack);

        if (screenTrack) {
          screenStream = new MediaStream([screenTrack]);
          if (remoteStream.getAudioTracks().length > 0) {
            try { screenStream.addTrack(remoteStream.getAudioTracks()[0]); } catch (e) {}
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
            userId={hostTile.userId}
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
              userId={tile.userId}
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
              userId={hostTile.userId}
            />
            <div className="mt-2 px-3 py-1 rounded-full bg-wwc-600 text-white text-xs font-semibold">Host</div>
          </div>
        </div>

        {positions.map((pos) => {
          const tile = others.find((t) => t.key === pos.key);
          if (!tile) return null;
          return (
            <div key={tile.key} style={{ position: "absolute", left: pos.left, top: pos.top, zIndex: 30 }}>
                  <VideoTile stream={tile.stream} label={tile.label} isLocal={tile.isLocal} avatarChar={tile.avatarChar} participantCount={count} sizePx={tilePx} muted={tile.muted} cameraOn={tile.cameraOn} userId={tile.userId} />
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

