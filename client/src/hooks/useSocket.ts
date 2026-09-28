import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { ClientToServerEvents, ServerToClientEvents } from '@shared/events.js';

let socketInstance: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

export const getSocket = () => {
  if (!socketInstance) {
    socketInstance = io({
      autoConnect: false,
    });
  }
  return socketInstance;
};

export function useSocket() {
  const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents>>(getSocket());
  const [isConnected, setIsConnected] = useState(socketRef.current.connected);

  useEffect(() => {
    const socket = socketRef.current;

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    if (!socket.connected) {
      socket.connect();
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
  };
}
