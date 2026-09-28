import React, { useEffect, useRef } from 'react';
import { useWebRTC } from '../../hooks/useWebRTC.js';
import { VideoLoader } from '../VideoLoader.js';

export const Video: React.FC = () => {
  const { localStream, remoteStream, cameraEnabled, micEnabled, toggleCamera, toggleMic } = useWebRTC();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  return (
    <div className="relative w-full h-full bg-bg-primary overflow-hidden group">
      {/* Remote Video (Main) */}
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        className="w-full h-full object-cover"
      />
      {!remoteStream && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-text-secondary gap-space-sm bg-bg-secondary">
          <VideoLoader className="w-24 h-24 object-contain text-accent mb-space-sm" />
          <p className="font-label-md text-label-md text-text-secondary">Waiting for partner's video...</p>
        </div>
      )}

      {/* Local Video (PIP) */}
      <div className="absolute bottom-space-lg right-space-lg w-32 h-44 bg-bg-tertiary rounded-xl overflow-hidden border-2 border-border shadow-lg transition-transform hover:scale-105">
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover -scale-x-100"
        />
        {/* Local Video Status overlay */}
        <div className="absolute bottom-1 left-1 right-1 flex justify-between items-center px-1">
          {!cameraEnabled && <span className="material-symbols-outlined text-[16px] text-danger drop-shadow-md">videocam_off</span>}
          {!micEnabled && <span className="material-symbols-outlined text-[16px] text-danger drop-shadow-md ml-auto">mic_off</span>}
        </div>
      </div>

      {/* Controls — always visible on mobile, fade-in on desktop hover */}
      <div className="absolute bottom-space-lg left-1/2 -translate-x-1/2 flex items-center gap-space-sm bg-bg-tertiary/90 backdrop-blur-md px-space-sm py-1.5 rounded-xl shadow-xl md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
        <button 
          onClick={toggleMic}
          className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-colors ${micEnabled ? 'bg-bg-secondary text-text-primary hover:brightness-95' : 'bg-danger text-[#ffffff] hover:brightness-95'}`}
          title={micEnabled ? 'Mute' : 'Unmute'}
        >
          <span className="material-symbols-outlined text-[24px]">{micEnabled ? 'mic' : 'mic_off'}</span>
        </button>
        <button 
          onClick={toggleCamera}
          className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-colors ${cameraEnabled ? 'bg-bg-secondary text-text-primary hover:brightness-95' : 'bg-danger text-[#ffffff] hover:brightness-95'}`}
          title={cameraEnabled ? 'Turn off camera' : 'Turn on camera'}
        >
          <span className="material-symbols-outlined text-[24px]">{cameraEnabled ? 'videocam' : 'videocam_off'}</span>
        </button>
      </div>
    </div>
  );
};
