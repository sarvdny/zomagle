import React from 'react';
import { useAppState } from '../../state/sessionState.js';
import { useSocket } from '../../hooks/useSocket.js';

export const Lobby: React.FC = () => {
  const { mode, setMode, setStatus, status } = useAppState();
  const { socket, isConnected } = useSocket();

  const handleStart = () => {
    if (!isConnected) return;
    setStatus('SEARCHING');
    socket.emit('match:find', { mode });
  };

  return (
    <div className="relative w-full overflow-hidden px-margin-desktop py-space-xl flex flex-col items-center justify-center transition-colors duration-200">
      {/* Hero */}
      <div className="relative max-w-4xl w-full flex flex-col items-center text-center space-y-space-md mb-space-xl">
        <h1 className="font-headline-lg text-headline-lg text-text-primary tracking-tight max-w-2xl">
          Find someone nearby. Talk. Connect. Move on.
        </h1>
        <p className="font-body-lg text-body-lg text-text-secondary max-w-xl mx-auto">
          Private conversations across your local network. No registration, no logs.
        </p>
      </div>

      {/* Mode Cards */}
      <div className="w-full max-w-3xl grid grid-cols-1 md:grid-cols-2 gap-space-lg mb-space-lg">
        {/* Text Chat */}
        <div 
          onClick={() => setMode('text')}
          className={`group relative cursor-pointer rounded-xl p-space-lg transition-all duration-200 hover:-translate-y-0.5 text-left border ${
            mode === 'text' 
              ? 'bg-bg-secondary border-accent shadow-md ring-1 ring-accent/30' 
              : 'bg-bg-tertiary border-transparent shadow-sm hover:shadow-md'
          }`}
        >
          {mode === 'text' && (
            <div className="absolute top-space-md right-space-md flex items-center justify-center w-6 h-6 rounded-full bg-accent text-[#ffffff] shadow-sm">
              <span className="material-symbols-outlined text-[16px]">check</span>
            </div>
          )}
          <div className="w-12 h-12 rounded-lg bg-bg-primary border border-border flex items-center justify-center mb-space-md text-accent">
            <span className="material-symbols-outlined text-[26px]">chat</span>
          </div>
          <h2 className="font-headline-md text-headline-md text-text-primary mb-space-xs">Text Chat</h2>
          <p className="font-body-md text-body-md text-text-secondary">
            Just text. No camera, no mic.
          </p>
        </div>

        {/* Video Chat */}
        <div 
          onClick={() => setMode('video')}
          className={`group relative cursor-pointer rounded-xl p-space-lg transition-all duration-200 hover:-translate-y-0.5 text-left border ${
            mode === 'video' 
              ? 'bg-bg-secondary border-accent shadow-md ring-1 ring-accent/30' 
              : 'bg-bg-tertiary border-transparent shadow-sm hover:shadow-md'
          }`}
        >
          {mode === 'video' && (
            <div className="absolute top-space-md right-space-md flex items-center justify-center w-6 h-6 rounded-full bg-accent text-[#ffffff] shadow-sm">
              <span className="material-symbols-outlined text-[16px]">check</span>
            </div>
          )}
          <div className="w-12 h-12 rounded-lg bg-bg-primary border border-border flex items-center justify-center mb-space-md text-text-muted">
            <span className="material-symbols-outlined text-[26px]">videocam</span>
          </div>
          <h2 className="font-headline-md text-headline-md text-text-primary mb-space-xs">Video Chat</h2>
          <p className="font-body-md text-body-md text-text-secondary">
            Face-to-face with camera and mic.
          </p>
        </div>
      </div>

      {/* CTA */}
      <div className="w-full max-w-md flex flex-col items-center">
        <button 
          onClick={handleStart}
          disabled={!isConnected || status !== 'IDLE'}
          className={`w-full h-13 py-3.5 px-space-xl rounded-xl bg-accent text-[#ffffff] font-headline-sm text-headline-sm flex items-center justify-center gap-space-sm transition-all shadow-md active:scale-[0.99] ${
            !isConnected ? 'opacity-50 cursor-not-allowed' : 'hover:brightness-95'
          }`}
        >
          <span>Start {mode === 'text' ? 'Text' : 'Video'} Chat</span>
          <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
        </button>
      </div>
    </div>
  );
};
