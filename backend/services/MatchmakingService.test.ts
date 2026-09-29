import { describe, it, expect, beforeEach } from 'vitest';
import { MatchmakingService } from '../services/MatchmakingService.js';
import { SessionService } from '../services/SessionService.js';
import { runtimeState } from '../state/RuntimeState.js';

describe('MatchmakingService', () => {
  beforeEach(() => {
    runtimeState.getAllSessions().forEach((s) => runtimeState.deleteSession(s.sessionId));
    runtimeState.getWaitingQueues().text.ids = [];
    runtimeState.getWaitingQueues().text.indexBySessionId.clear();
    runtimeState.getWaitingQueues().video.ids = [];
    runtimeState.getWaitingQueues().video.indexBySessionId.clear();
  });

  it('should match two users', () => {
    SessionService.createSession('socket1');
    SessionService.createSession('socket2');
    const session1 = SessionService.getSessionBySocketId('socket1')!.sessionId;
    const session2 = SessionService.getSessionBySocketId('socket2')!.sessionId;

    const result1 = MatchmakingService.findMatch(session1, 'text');
    expect(result1).toBeNull(); // Only 1 user in queue

    const result2 = MatchmakingService.findMatch(session2, 'text');
    expect(result2).not.toBeNull();
    expect(result2!.room).toBeTruthy();
    const sessions = [result2!.session1, result2!.session2];
    expect(sessions).toContain(session1);
    expect(sessions).toContain(session2);
  });
});
