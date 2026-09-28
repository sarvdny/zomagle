import { Socket, Server } from 'socket.io';
import { 
  ClientToServerEvents, ServerToClientEvents, 
  WebRTCOfferPayloadSchema, WebRTCAnswerPayloadSchema, WebRTCICECandidatePayloadSchema,
  ERROR_CODES 
} from '@shared/events.js';
import { SessionService } from '../services/SessionService.js';
import { RoomService } from '../services/RoomService.js';

export function setupSignaling(
  socket: Socket<ClientToServerEvents, ServerToClientEvents>,
  io: Server<ClientToServerEvents, ServerToClientEvents>
) {
  
  const validateAndGetPartner = (socketId: string, roomId: string) => {
    const session = SessionService.getSessionBySocketId(socketId);
    if (!session || session.roomId !== roomId) {
      return null;
    }

    const room = RoomService.getRoom(roomId);
    if (!room || room.status !== 'ACTIVE') {
      return null;
    }

    const partnerSessionId = RoomService.getPartner(roomId, session.sessionId);
    if (!partnerSessionId) return null;

    return SessionService.getSession(partnerSessionId);
  };

  socket.on('webrtc:offer', (payload) => {
    const parsed = WebRTCOfferPayloadSchema.safeParse(payload);
    if (!parsed.success) {
      socket.emit('server:error', { code: ERROR_CODES.INVALID_PAYLOAD, message: 'Invalid payload' });
      return;
    }

    const partnerSession = validateAndGetPartner(socket.id, parsed.data.roomId);
    if (partnerSession) {
      io.to(partnerSession.socketId).emit('webrtc:offer', parsed.data);
    } else {
      socket.emit('server:error', { code: ERROR_CODES.SIGNALING_REJECTED, message: 'Signaling rejected' });
    }
  });

  socket.on('webrtc:answer', (payload) => {
    const parsed = WebRTCAnswerPayloadSchema.safeParse(payload);
    if (!parsed.success) {
      socket.emit('server:error', { code: ERROR_CODES.INVALID_PAYLOAD, message: 'Invalid payload' });
      return;
    }

    const partnerSession = validateAndGetPartner(socket.id, parsed.data.roomId);
    if (partnerSession) {
      io.to(partnerSession.socketId).emit('webrtc:answer', parsed.data);
    } else {
      socket.emit('server:error', { code: ERROR_CODES.SIGNALING_REJECTED, message: 'Signaling rejected' });
    }
  });

  socket.on('webrtc:ice-candidate', (payload) => {
    const parsed = WebRTCICECandidatePayloadSchema.safeParse(payload);
    if (!parsed.success) {
      socket.emit('server:error', { code: ERROR_CODES.INVALID_PAYLOAD, message: 'Invalid payload' });
      return;
    }

    const partnerSession = validateAndGetPartner(socket.id, parsed.data.roomId);
    if (partnerSession) {
      io.to(partnerSession.socketId).emit('webrtc:ice-candidate', parsed.data);
    } else {
      // It's normal to get trailing ICE candidates after room closes; just drop them quietly, 
      // or send an error, but usually quiet dropping is better to avoid spam.
      // socket.emit('server:error', { code: ERROR_CODES.SIGNALING_REJECTED, message: 'Signaling rejected' });
    }
  });
}
