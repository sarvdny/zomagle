import { Socket, Server } from 'socket.io';
import { ClientToServerEvents, ServerToClientEvents } from '@shared/events.js';
import { SessionService } from '../services/SessionService.js';
import { MatchmakingService } from '../services/MatchmakingService.js';
import { RoomService } from '../services/RoomService.js';
import { setupMatchmaking } from './matchmaking.js';
import { setupChat } from './chat.js';
import { setupSignaling } from './signaling.js';

export function setupConnection(io: Server<ClientToServerEvents, ServerToClientEvents>) {
  io.on('connection', (socket: Socket<ClientToServerEvents, ServerToClientEvents>) => {
    console.log(`[Socket] Client connected: ${socket.id}`);
    
    // Create server-side session
    const session = SessionService.createSession(socket.id);
    
    // Emit session:ready
    socket.emit('session:ready', { sessionId: session.sessionId });

    setupMatchmaking(socket, io);
    setupChat(socket, io);
    setupSignaling(socket, io);
    
    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
      
      const currentSession = SessionService.getSessionBySocketId(socket.id);
      if (currentSession) {
        MatchmakingService.handleDisconnect(currentSession.sessionId);
        
        if (currentSession.roomId) {
          const partnerSessionId = RoomService.getPartner(currentSession.roomId, currentSession.sessionId);
          if (partnerSessionId) {
            const partnerSession = SessionService.getSession(partnerSessionId);
            if (partnerSession) {
              io.to(partnerSession.socketId).emit('partner:left', { roomId: currentSession.roomId });
            }
          }
          RoomService.destroyRoom(currentSession.roomId);
        }
        
        SessionService.removeSession(currentSession.sessionId);
      }
    });
  });
}
