import { runtimeState } from '../state/RuntimeState.js';
import { SessionId, ChatMode, RoomId, Room, RoomStatus } from '@shared/models.js';
import { SessionService } from './SessionService.js';
import { randomUUID } from 'crypto';

export class RoomService {
  public static createRoom(mode: ChatMode, session1: SessionId, session2: SessionId): Room {
    const roomId: RoomId = randomUUID();
    // Randomly assign initiator
    const initiator = Math.random() > 0.5 ? session1 : session2;
    
    const room: Room = {
      roomId,
      mode,
      members: [session1, session2],
      initiator,
      status: 'ACTIVE',
      createdAt: Date.now(),
    };
    
    runtimeState.setRoom(roomId, room);
    
    // Update both sessions
    SessionService.updateRoom(session1, roomId);
    SessionService.updateStatus(session1, 'MATCHED');
    
    SessionService.updateRoom(session2, roomId);
    SessionService.updateStatus(session2, 'MATCHED');
    
    return room;
  }

  public static getRoom(roomId: RoomId): Room | undefined {
    return runtimeState.getRoom(roomId);
  }

  public static getPartner(roomId: RoomId, currentSessionId: SessionId): SessionId | undefined {
    const room = this.getRoom(roomId);
    if (!room || room.status !== 'ACTIVE') return undefined;
    if (room.members[0] === currentSessionId) return room.members[1];
    if (room.members[1] === currentSessionId) return room.members[0];
    return undefined;
  }

  public static destroyRoom(roomId: RoomId): void {
    const room = this.getRoom(roomId);
    if (room) {
      room.status = 'CLOSING';
      
      // Clear session room references
      room.members.forEach(memberId => {
        const session = SessionService.getSession(memberId);
        if (session && session.roomId === roomId) {
          SessionService.updateRoom(memberId, null);
          SessionService.updateStatus(memberId, 'IDLE'); // Assuming they go back to IDLE
        }
      });
      
      runtimeState.deleteRoom(roomId);
    }
  }
}
