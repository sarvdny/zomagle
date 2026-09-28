import { useEffect } from 'react';
import { useSocket } from './useSocket.js';
import { useAppState } from '../state/sessionState.js';
import { SessionReadyPayload, MatchSearchingPayload, MatchFoundPayload, PartnerLeftPayload, ServerErrorPayload } from '@shared/events.js';

export function useAppController() {
  const { socket, isConnected } = useSocket();
  const { setStatus, setRoomId, setRole, setError, status } = useAppState();

  useEffect(() => {
    if (isConnected && (status === 'CONNECTING' || status === 'DISCONNECTED')) {
      setStatus('IDLE');
    } else if (!isConnected && status !== 'DISCONNECTED') {
      setStatus('DISCONNECTED');
    }
  }, [isConnected, status, setStatus]);

  useEffect(() => {
    const onSessionReady = (_payload: SessionReadyPayload) => {
      // Could store sessionId if needed, but not strictly necessary for MVP
    };

    const onMatchSearching = (_payload: MatchSearchingPayload) => {
      setStatus('SEARCHING');
    };

    const onMatchFound = (payload: MatchFoundPayload) => {
      setRoomId(payload.roomId);
      setRole(payload.role);
      setStatus(payload.mode === 'video' ? 'CONNECTING_MEDIA' : 'MATCHED');
    };

    const onPartnerLeft = (_payload: PartnerLeftPayload) => {
      setStatus('PARTNER_LEFT');
    };

    const onServerError = (payload: ServerErrorPayload) => {
      setError(payload.message);
      // Optional: Handle specific error codes if needed
      if (payload.code === 'RATE_LIMIT_EXCEEDED') {
        setTimeout(() => setError(null), 3000);
      }
    };

    socket.on('session:ready', onSessionReady);
    socket.on('match:searching', onMatchSearching);
    socket.on('match:found', onMatchFound);
    socket.on('partner:left', onPartnerLeft);
    socket.on('server:error', onServerError);

    return () => {
      socket.off('session:ready', onSessionReady);
      socket.off('match:searching', onMatchSearching);
      socket.off('match:found', onMatchFound);
      socket.off('partner:left', onPartnerLeft);
      socket.off('server:error', onServerError);
    };
  }, [socket, setStatus, setRoomId, setRole, setError]);
}
