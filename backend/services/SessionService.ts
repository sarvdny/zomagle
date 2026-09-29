import { runtimeState } from '../state/RuntimeState.js';
import { Session, SessionId, RoomId, SessionStatus, ChatMode } from '@shared/models.js';
import { randomUUID } from 'crypto';

export class SessionService {
  public static createSession(socketId: string): Session {
    const sessionId: SessionId = randomUUID();
    const now = Date.now();
    const session: Session = {
      sessionId,
      socketId,
      mode: 'text', // default mode, will be updated when searching
      status: 'IDLE',
      roomId: null,
      connectedAt: now,
      lastActivityAt: now,
    };
    
    runtimeState.setSession(sessionId, session);
    return session;
  }

  public static getSession(sessionId: SessionId): Session | undefined {
    return runtimeState.getSession(sessionId);
  }

  public static removeSession(sessionId: SessionId): void {
    runtimeState.deleteSession(sessionId);
  }

  public static updateStatus(sessionId: SessionId, status: SessionStatus): void {
    const session = this.getSession(sessionId);
    if (session) {
      session.status = status;
      session.lastActivityAt = Date.now();
    }
  }

  public static updateRoom(sessionId: SessionId, roomId: RoomId | null): void {
    const session = this.getSession(sessionId);
    if (session) {
      session.roomId = roomId;
      session.lastActivityAt = Date.now();
    }
  }

  public static updateMode(sessionId: SessionId, mode: ChatMode): void {
    const session = this.getSession(sessionId);
    if (session) {
      session.mode = mode;
      session.lastActivityAt = Date.now();
    }
  }

  public static getSessionBySocketId(socketId: string): Session | undefined {
    for (const session of runtimeState.getAllSessions().values()) {
      if (session.socketId === socketId) {
        return session;
      }
    }
    return undefined;
  }
}
