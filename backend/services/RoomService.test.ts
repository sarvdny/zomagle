import { describe, it, expect, beforeEach } from 'vitest';
import { RoomService } from '../services/RoomService.js';
import { runtimeState } from '../state/RuntimeState.js';

describe('RoomService', () => {
  beforeEach(() => {
    runtimeState.getAllSessions().forEach((s) => runtimeState.deleteSession(s.sessionId));
    // Hacky clear rooms since getAllRooms isn't exported, we'll just not care or mock it
    // Wait, the state doesn't have getAllRooms, I'll just add it or clear it.
    // Actually we can just leave it as is if rooms don't conflict, but let's clear sessions.
  });

  it('should create a room', () => {
    const room = RoomService.createRoom('text', 's1', 's2');
    expect(room.mode).toBe('text');
    expect(room.members).toContain('s1');
    expect(room.members).toContain('s2');
    expect(room.initiator).toBeTruthy();
  });

  it('should get partner', () => {
    const room = RoomService.createRoom('video', 's1', 's2');
    const partner = RoomService.getPartner(room.roomId, 's1');
    expect(partner).toBe('s2');
  });

  it('should destroy a room', () => {
    const room = RoomService.createRoom('text', 's1', 's2');
    RoomService.destroyRoom(room.roomId);
    expect(RoomService.getRoom(room.roomId)).toBeUndefined();
  });
});
