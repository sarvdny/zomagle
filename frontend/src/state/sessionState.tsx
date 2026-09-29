import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ChatMode } from '@shared/models.js';

export type AppStatus = 
  | 'IDLE' 
  | 'CONNECTING' 
  | 'SEARCHING' 
  | 'MATCHED' 
  | 'CONNECTING_MEDIA' 
  | 'IN_CALL' 
  | 'PARTNER_LEFT' 
  | 'DISCONNECTED' 
  | 'ERROR';

interface AppState {
  status: AppStatus;
  mode: ChatMode;
  roomId: string | null;
  role: 'initiator' | 'receiver' | null;
  error: string | null;
  
  setStatus: (s: AppStatus) => void;
  setMode: (m: ChatMode) => void;
  setRoomId: (id: string | null) => void;
  setRole: (r: 'initiator' | 'receiver' | null) => void;
  setError: (e: string | null) => void;
  reset: () => void;
}

const AppStateContext = createContext<AppState | undefined>(undefined);

export const AppStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<AppStatus>('CONNECTING'); // start CONNECTING since socket auto-connects
  const [mode, setMode] = useState<ChatMode>('text');
  const [roomId, setRoomId] = useState<string | null>(null);
  const [role, setRole] = useState<'initiator' | 'receiver' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setStatus('IDLE');
    setRoomId(null);
    setRole(null);
    setError(null);
  };

  return (
    <AppStateContext.Provider value={{ status, mode, roomId, role, error, setStatus, setMode, setRoomId, setRole, setError, reset }}>
      {children}
    </AppStateContext.Provider>
  );
};

export const useAppState = () => {
  const context = useContext(AppStateContext);
  if (!context) throw new Error('useAppState must be used within AppStateProvider');
  return context;
};
