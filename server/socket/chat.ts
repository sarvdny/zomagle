import { Socket, Server } from 'socket.io';
import { 
  ClientToServerEvents, ServerToClientEvents, 
  ChatSendPayloadSchema, ERROR_CODES 
} from '@shared/events.js';
import { SessionService } from '../services/SessionService.js';
import { RoomService } from '../services/RoomService.js';
import { randomUUID } from 'crypto';

const MAX_MESSAGE_LENGTH = process.env.MAX_MESSAGE_LENGTH ? parseInt(process.env.MAX_MESSAGE_LENGTH, 10) : 1000;
const CHAT_RATE_LIMIT = process.env.CHAT_RATE_LIMIT ? parseInt(process.env.CHAT_RATE_LIMIT, 10) : 10;

// Simple rate limiter: counts messages per session ID in the last 10 seconds.
const rateLimitMap = new Map<string, number[]>();

function checkRateLimit(sessionId: string): boolean {
  const now = Date.now();
  let timestamps = rateLimitMap.get(sessionId) || [];
  timestamps = timestamps.filter(t => now - t < 10000); // keep last 10 seconds
  if (timestamps.length >= CHAT_RATE_LIMIT) {
    return false;
  }
  timestamps.push(now);
  rateLimitMap.set(sessionId, timestamps);
  return true;
}

export function setupChat(
  socket: Socket<ClientToServerEvents, ServerToClientEvents>,
  io: Server<ClientToServerEvents, ServerToClientEvents>
) {
  socket.on('chat:send', (payload) => {
    const parsed = ChatSendPayloadSchema.safeParse(payload);
    if (!parsed.success) {
      socket.emit('server:error', { code: ERROR_CODES.INVALID_PAYLOAD, message: 'Invalid payload' });
      return;
    }

    const { roomId, message } = parsed.data;
    
    if (message.length > MAX_MESSAGE_LENGTH) {
      socket.emit('server:error', { code: ERROR_CODES.MESSAGE_TOO_LONG, message: 'Message exceeds maximum length' });
      return;
    }

    const session = SessionService.getSessionBySocketId(socket.id);
    if (!session) {
      socket.emit('server:error', { code: ERROR_CODES.NOT_CONNECTED, message: 'Session not found' });
      return;
    }

    if (session.roomId !== roomId) {
      socket.emit('server:error', { code: ERROR_CODES.NOT_ROOM_MEMBER, message: 'Not a member of this room' });
      return;
    }

    const room = RoomService.getRoom(roomId);
    if (!room || room.status !== 'ACTIVE') {
      socket.emit('server:error', { code: ERROR_CODES.ROOM_NOT_FOUND, message: 'Room not active' });
      return;
    }

    if (!checkRateLimit(session.sessionId)) {
      socket.emit('server:error', { code: ERROR_CODES.RATE_LIMIT_EXCEEDED, message: 'Rate limit exceeded. Slow down.' });
      return;
    }

    const partnerSessionId = RoomService.getPartner(roomId, session.sessionId);
    if (!partnerSessionId) return;

    const partnerSession = SessionService.getSession(partnerSessionId);
    if (!partnerSession) return;

    const timestamp = Date.now();
    const messageId = randomUUID();

    // Send to partner
    io.to(partnerSession.socketId).emit('chat:message', {
      roomId,
      messageId,
      sender: 'stranger',
      message,
      timestamp,
    });
    
    // Optionally, could emit back to sender, but usually client renders locally immediately.
    // The requirements say: "Client renders the message locally and for received messages."
    // So we don't need to bounce it back to the sender.
  });
}
