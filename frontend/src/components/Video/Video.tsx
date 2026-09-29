import React, { useEffect, useRef, useState } from 'react';
import { useWebRTC } from '../../hooks/useWebRTC.js';
import { useSocket } from '../../hooks/useSocket.js';
import { useAppState } from '../../state/sessionState.js';

function VideoSurface({
  stream,
  label,
  muted,
  fallback,
  isPip = false
}: {
  stream: MediaStream | null;
  label: string;
  muted?: boolean;
  fallback: string;
  isPip?: boolean;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (ref.current && stream) ref.current.srcObject = stream;
  }, [stream]);

  return (
    <div className={`relative ${isPip ? 'w-full h-auto' : 'h-full w-full'} overflow-hidden bg-[var(--color-background)] flex items-center justify-center`}>
      {stream ? (
        <video
          ref={ref}
          autoPlay
          playsInline
          muted={muted}
          className={`${isPip ? 'w-full h-auto block' : 'h-full w-full object-cover'}`}
        />
      ) : (
        <div className={`flex ${isPip ? 'aspect-video w-full' : 'h-full w-full'} items-center justify-center px-4`}>
          <span className={`brutal-display animate-hard-blink text-center ${isPip ? 'text-lg' : 'text-2xl md:text-4xl'} text-[var(--color-muted-foreground)]`}>
            {fallback}
          </span>
        </div>
      )}
      <span className="absolute top-0 left-0 bg-[var(--color-foreground)] px-2 py-1 font-mono text-[10px] font-bold tracking-[0.3em] text-[var(--color-background)] pointer-events-none">
        {label}
      </span>
    </div>
  );
}

function DraggablePIP({ children }: { children: React.ReactNode }) {
  const pipRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    dragStart.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    
    let nextX = e.clientX - dragStart.current.x;
    let nextY = e.clientY - dragStart.current.y;

    if (pipRef.current && pipRef.current.parentElement) {
      const parent = pipRef.current.parentElement;
      const maxX = Math.max(0, parent.clientWidth - pipRef.current.clientWidth);
      const maxY = Math.max(0, parent.clientHeight - pipRef.current.clientHeight);
      
      nextX = Math.max(0, Math.min(nextX, maxX));
      nextY = Math.max(0, Math.min(nextY, maxY));
    }

    setPosition({ x: nextX, y: nextY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);

    const finalX = e.clientX - dragStart.current.x;
    const finalY = e.clientY - dragStart.current.y;

    if (pipRef.current && pipRef.current.parentElement) {
      const parent = pipRef.current.parentElement;
      const maxX = Math.max(0, parent.clientWidth - pipRef.current.clientWidth);
      const maxY = Math.max(0, parent.clientHeight - pipRef.current.clientHeight);

      const boundedX = Math.max(0, Math.min(finalX, maxX));
      const boundedY = Math.max(0, Math.min(finalY, maxY));

      // Snap to closest corner (with 20px padding)
      const snapX = boundedX < maxX / 2 ? 20 : Math.max(20, maxX - 20);
      const snapY = boundedY < maxY / 2 ? 20 : Math.max(20, maxY - 20);

      setPosition({ x: snapX, y: snapY });
    }
  };

  useEffect(() => {
    const handleResize = () => {
      if (!isDragging && pipRef.current && pipRef.current.parentElement) {
        const parent = pipRef.current.parentElement;
        const maxX = Math.max(0, parent.clientWidth - pipRef.current.clientWidth);
        const maxY = Math.max(0, parent.clientHeight - pipRef.current.clientHeight);
        
        setPosition(prev => {
          // If we are resizing and the box gets pushed out of bounds, snap it back
          let newX = prev.x > maxX / 2 ? Math.max(20, maxX - 20) : 20;
          let newY = prev.y > maxY / 2 ? Math.max(20, maxY - 20) : 20;
          return { x: newX, y: newY };
        });
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isDragging]);

  return (
    <div
      ref={pipRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{ 
        transform: `translate(${position.x}px, ${position.y}px)`,
        transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0, 0, 1)'
      }}
      className="absolute top-0 left-0 z-50 cursor-grab active:cursor-grabbing shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] border-[4px] border-[var(--color-foreground)] w-32 md:w-48 bg-[var(--color-background)]"
    >
      {children}
    </div>
  );
}

export const Video: React.FC = () => {
  const { status, roomId, reset } = useAppState();
  const { socket } = useSocket();
  const { localStream, remoteStream, cameraEnabled, micEnabled, toggleCamera, toggleMic, error } =
    useWebRTC();

  const handleNext = () => {
    socket.emit('match:next', { roomId: roomId! });
  };

  const handleLeave = () => {
    socket.emit('session:leave');
    reset();
  };

  return (
    <div className="flex flex-col h-full w-full bg-[var(--color-background)] relative">
      {/* Pane 1: remote */}
      <div className="flex-1 min-h-0 min-w-0 overflow-hidden border-b-[8px] border-[var(--color-foreground)] relative">
        <VideoSurface
          stream={remoteStream}
          label="STRANGER"
          fallback={status === "CONNECTING_MEDIA" ? "CONNECTING..." : "NO SIGNAL"}
        />
        
        {/* PIP: local video floating over remote */}
        <DraggablePIP>
          <VideoSurface
            stream={localStream}
            label="YOU"
            muted
            fallback={error ?? "CAMERA OFF"}
            isPip
          />
        </DraggablePIP>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-center gap-3 px-4 py-3 bg-[var(--color-background)] shrink-0">
        <button
          type="button"
          onClick={toggleMic}
          className={`brutal-btn px-6 py-3 text-xs ${micEnabled ? "brutal-btn-on" : ""}`}
        >
          MIC {micEnabled ? "ON" : "OFF"}
        </button>
        <button
          type="button"
          onClick={toggleCamera}
          className={`brutal-btn px-6 py-3 text-xs ${cameraEnabled ? "brutal-btn-on" : ""}`}
        >
          CAM {cameraEnabled ? "ON" : "OFF"}
        </button>
        <button type="button" onClick={handleNext} className="brutal-btn px-6 py-3 text-xs">
          SKIP
        </button>
        <button
          type="button"
          onClick={handleLeave}
          className="brutal-btn brutal-btn-danger px-6 py-3 text-xs"
        >
          LEAVE
        </button>
      </div>
    </div>
  );
};
