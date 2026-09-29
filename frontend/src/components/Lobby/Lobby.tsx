import React from 'react';
import { useAppState } from '../../state/sessionState.js';
import { useSocket } from '../../hooks/useSocket.js';

export const Lobby: React.FC = () => {
  const { setMode, setStatus } = useAppState();
  const { socket, isConnected } = useSocket();

  const handleStart = (selectedMode: 'text' | 'video') => {
    if (!isConnected) return;
    setMode(selectedMode);
    setStatus('SEARCHING');
    socket.emit('match:find', { mode: selectedMode });
  };

  return (
    <main className="grid h-screen w-screen grid-rows-2 md:grid-cols-2 md:grid-rows-1 overflow-hidden">
      <button
        type="button"
        onClick={() => handleStart('text')}
        disabled={!isConnected}
        className="lobby-block border-b-[8px] border-[var(--color-foreground)] md:border-b-0 md:border-r-[8px]"
      >
        <span className="brutal-display text-[22vw] md:text-[14vw]">TEXT</span>
      </button>
      <button 
        type="button" 
        onClick={() => handleStart('video')} 
        disabled={!isConnected}
        className="lobby-block"
      >
        <span className="brutal-display text-[22vw] md:text-[14vw]">VIDEO</span>
      </button>
    </main>
  );
};
