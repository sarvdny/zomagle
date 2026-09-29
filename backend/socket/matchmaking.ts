import { Socket, Server } from 'socket.io';
import { 
  ClientToServerEvents, ServerToClientEvents, 
  MatchFindPayloadSchema, MatchCancelPayloadSchema, MatchNextPayloadSchema,
  ERROR_CODES 
} from '@shared/events.js';
import { MatchmakingService } from '../services/MatchmakingService.js';
import { SessionService } from '../services/SessionService.js';
import { RoomService } from '../services/RoomService.js';

export function setupMatchmaking(
  socket: Socket<ClientToServerEvents, ServerToClientEvents>,
  io: Server<ClientToServerEvents, ServerToClientEvents>
) {
  socket.on('match:find', (payload) => {
    const parsed = MatchFindPayloadSchema.safeParse(payload);
    if (!parsed.success) {
      socket.emit('server:error', { code: ERROR_CODES.INVALID_PAYLOAD, message: 'Invalid payload' });
      return;
    }

    const { mode } = parsed.data;
    const session = SessionService.getSessionBySocketId(socket.id);
    if (!session) {
      socket.emit('server:error', { code: ERROR_CODES.NOT_CONNECTED, message: 'Session not found' });
      return;
    }

    if (session.status === 'SEARCHING') {
      socket.emit('server:error', { code: ERROR_CODES.ALREADY_SEARCHING, message: 'Already searching' });
      return;
    }

    if (session.status === 'MATCHED') {
      socket.emit('server:error', { code: ERROR_CODES.ALREADY_MATCHED, message: 'Already matched' });
      return;
    }

    const matchResult = MatchmakingService.findMatch(session.sessionId, mode);
    
    if (matchResult) {
      const { room, session1, session2 } = matchResult;
      
      const s1 = SessionService.getSession(session1);
      const s2 = SessionService.getSession(session2);
      
      if (s1 && s2) {
        // Emit to session1
        io.to(s1.socketId).emit('match:found', {
          roomId: room.roomId,
          mode: room.mode,
          role: room.initiator === s1.sessionId ? 'initiator' : 'receiver',
        });
        // Emit to session2
        io.to(s2.socketId).emit('match:found', {
          roomId: room.roomId,
          mode: room.mode,
          role: room.initiator === s2.sessionId ? 'initiator' : 'receiver',
        });
      }
    } else {
      socket.emit('match:searching', { mode });
    }
  });

  socket.on('match:cancel', (payload) => {
    const parsed = MatchCancelPayloadSchema.safeParse(payload);
    if (!parsed.success) {
      socket.emit('server:error', { code: ERROR_CODES.INVALID_PAYLOAD, message: 'Invalid payload' });
      return;
    }

    const session = SessionService.getSessionBySocketId(socket.id);
    if (!session) return;

    if (session.status === 'SEARCHING') {
      MatchmakingService.cancelMatch(session.sessionId, parsed.data.mode);
    }
  });

  socket.on('match:next', (payload) => {
    const parsed = MatchNextPayloadSchema.safeParse(payload);
    if (!parsed.success) {
      socket.emit('server:error', { code: ERROR_CODES.INVALID_PAYLOAD, message: 'Invalid payload' });
      return;
    }

    const session = SessionService.getSessionBySocketId(socket.id);
    if (!session) return;

    if (session.roomId && session.roomId === parsed.data.roomId) {
      const partnerSessionId = RoomService.getPartner(session.roomId, session.sessionId);
      if (partnerSessionId) {
        const partnerSession = SessionService.getSession(partnerSessionId);
        if (partnerSession) {
          io.to(partnerSession.socketId).emit('partner:left', { roomId: session.roomId });
        }
      }
      RoomService.destroyRoom(session.roomId);
      
      // Start matchmaking again
      const matchResult = MatchmakingService.findMatch(session.sessionId, session.mode);
      if (matchResult) {
        const { room, session1, session2 } = matchResult;
        const s1 = SessionService.getSession(session1);
        const s2 = SessionService.getSession(session2);
        
        if (s1 && s2) {
          io.to(s1.socketId).emit('match:found', {
            roomId: room.roomId,
            mode: room.mode,
            role: room.initiator === s1.sessionId ? 'initiator' : 'receiver',
          });
          io.to(s2.socketId).emit('match:found', {
            roomId: room.roomId,
            mode: room.mode,
            role: room.initiator === s2.sessionId ? 'initiator' : 'receiver',
          });
        }
      } else {
        socket.emit('match:searching', { mode: session.mode });
      }
    } else {
      socket.emit('server:error', { code: ERROR_CODES.NOT_ROOM_MEMBER, message: 'Invalid room' });
    }
  });

  socket.on('session:leave', (payload) => {
    const session = SessionService.getSessionBySocketId(socket.id);
    if (!session) return;

    if (session.status === 'SEARCHING') {
      MatchmakingService.cancelMatch(session.sessionId, session.mode);
    }

    if (session.roomId) {
      const partnerSessionId = RoomService.getPartner(session.roomId, session.sessionId);
      if (partnerSessionId) {
        const partnerSession = SessionService.getSession(partnerSessionId);
        if (partnerSession) {
          io.to(partnerSession.socketId).emit('partner:left', { roomId: session.roomId });
        }
      }
      RoomService.destroyRoom(session.roomId);
    }
  });
}
