export type SessionId = string;
export type RoomId = string;

export type ChatMode = 'text' | 'video';

export type SessionStatus = 'IDLE' | 'SEARCHING' | 'MATCHED' | 'DISCONNECTING';

export type RoomStatus = 'ACTIVE' | 'CLOSING';

export interface Session {
  sessionId: SessionId;
  socketId: string;
  mode: ChatMode;
  status: SessionStatus;
  roomId: RoomId | null;
  connectedAt: number;
  lastActivityAt: number;
}

export interface Room {
  roomId: RoomId;
  mode: ChatMode;
  members: [SessionId, SessionId];
  initiator: SessionId;
  status: RoomStatus;
  createdAt: number;
}

export interface WaitingQueue {
  ids: SessionId[];
  indexBySessionId: Map<SessionId, number>;
}

export interface WaitingQueues {
  text: WaitingQueue;
  video: WaitingQueue;
}

export interface RuntimeState {
  sessions: Map<SessionId, Session>;
  rooms: Map<RoomId, Room>;
  waitingQueues: WaitingQueues;
}
