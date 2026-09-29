import { SessionId, ChatMode, Room } from '@shared/models.js';
import { QueueService } from './QueueService.js';
import { SessionService } from './SessionService.js';
import { RoomService } from './RoomService.js';

export interface MatchResult {
  room: Room;
  session1: SessionId;
  session2: SessionId;
}

export class MatchmakingService {
  public static findMatch(sessionId: SessionId, mode: ChatMode): MatchResult | null {
    const session = SessionService.getSession(sessionId);
    if (!session) return null;

    // Prevent searching if already matched or already searching
    if (session.status === 'MATCHED') return null;

    SessionService.updateMode(sessionId, mode);
    SessionService.updateStatus(sessionId, 'SEARCHING');
    QueueService.add(mode, sessionId);
    QueueService.cleanupStale(mode);

    if (QueueService.getLength(mode) >= 2) {
      const pair = QueueService.getRandomPair(mode);
      if (pair) {
        const [s1, s2] = pair;
        QueueService.remove(mode, s1);
        QueueService.remove(mode, s2);
        
        const room = RoomService.createRoom(mode, s1, s2);
        return { room, session1: s1, session2: s2 };
      }
    }
    return null;
  }

  public static cancelMatch(sessionId: SessionId, mode: ChatMode): void {
    const session = SessionService.getSession(sessionId);
    if (session && session.status === 'SEARCHING') {
      QueueService.remove(mode, sessionId);
      SessionService.updateStatus(sessionId, 'IDLE');
    }
  }

  public static handleDisconnect(sessionId: SessionId): void {
    const session = SessionService.getSession(sessionId);
    if (!session) return;

    if (session.status === 'SEARCHING') {
      QueueService.remove(session.mode, sessionId);
    }
    
    if (session.roomId) {
      // Handled by RoomService.destroyRoom in the connection handler usually,
      // but we will do it at a higher level in socket/connection.ts
    }
  }
}
