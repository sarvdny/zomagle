import { RuntimeState, Session, Room, SessionId, RoomId } from '@shared/models.js';

class StateManager {
  private state: RuntimeState = {
    sessions: new Map<SessionId, Session>(),
    rooms: new Map<RoomId, Room>(),
    waitingQueues: {
      text: {
        ids: [],
        indexBySessionId: new Map<SessionId, number>(),
      },
      video: {
        ids: [],
        indexBySessionId: new Map<SessionId, number>(),
      }
    }
  };

  // Sessions
  public getSession(sessionId: SessionId): Session | undefined {
    return this.state.sessions.get(sessionId);
  }

  public setSession(sessionId: SessionId, session: Session): void {
    this.state.sessions.set(sessionId, session);
  }

  public deleteSession(sessionId: SessionId): void {
    this.state.sessions.delete(sessionId);
  }

  public getAllSessions(): Map<SessionId, Session> {
    return this.state.sessions;
  }

  // Rooms
  public getRoom(roomId: RoomId): Room | undefined {
    return this.state.rooms.get(roomId);
  }

  public setRoom(roomId: RoomId, room: Room): void {
    this.state.rooms.set(roomId, room);
  }

  public deleteRoom(roomId: RoomId): void {
    this.state.rooms.delete(roomId);
  }

  // Queues
  public getWaitingQueues() {
    return this.state.waitingQueues;
  }
}

export const runtimeState = new StateManager();
