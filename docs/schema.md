# Runtime Schema — LAN Stranger Chat

## 1. Persistence Policy

There is no persistent database in the MVP.

All models below are runtime-only.

When the Node.js process stops or restarts:
- all sessions disappear
- all rooms disappear
- all waiting queues disappear
- no chat history remains

Do not create database migrations, ORM models, SQL schemas, or MongoDB collections.

---

## 2. Primitive Types

```ts
type SessionId = string;
type RoomId = string;

type ChatMode = "text" | "video";

type SessionStatus =
  | "IDLE"
  | "SEARCHING"
  | "MATCHED"
  | "DISCONNECTING";

type RoomStatus =
  | "ACTIVE"
  | "CLOSING";
```

IDs must be generated server-side.

Use `crypto.randomUUID()` or an equivalent cryptographically strong identifier mechanism.

---

## 3. Session

```ts
interface Session {
  sessionId: SessionId;
  socketId: string;

  mode: ChatMode;

  status: SessionStatus;

  roomId: RoomId | null;

  connectedAt: number;
  lastActivityAt: number;
}
```

Rules:
- one session maps to one active Socket.IO connection
- one session has at most one room
- `roomId` must be `null` unless status is `MATCHED`
- `SEARCHING` sessions must exist in exactly one waiting queue
- `IDLE` sessions must not exist in any waiting queue
- session IDs are never client-controlled

---

## 4. Room

```ts
interface Room {
  roomId: RoomId;

  mode: ChatMode;

  members: [SessionId, SessionId];

  initiator: SessionId;

  status: RoomStatus;

  createdAt: number;
}
```

Rules:
- exactly two members
- both members must exist in `sessions`
- both members must use the room's mode
- initiator must be one of the members
- room IDs are unique
- room must not be reused after destruction

---

## 5. Waiting Queue

Use separate queues:

```ts
interface WaitingQueue {
  ids: SessionId[];
  indexBySessionId: Map<SessionId, number>;
}
```

Queues:

```ts
interface WaitingQueues {
  text: WaitingQueue;
  video: WaitingQueue;
}
```

Rules:
- session may exist in at most one queue
- a session in a queue must have `status === "SEARCHING"`
- remove operations must update `indexBySessionId`
- stale session IDs must be removed during cleanup

---

## 6. Runtime State

```ts
interface RuntimeState {
  sessions: Map<SessionId, Session>;

  rooms: Map<RoomId, Room>;

  waitingQueues: WaitingQueues;
}
```

There is no persistent global state.

Avoid duplicating authoritative information in multiple structures unless required for lookup efficiency.

---

## 7. Chat Message

Chat messages are transient events, not stored records.

```ts
interface ChatMessagePayload {
  roomId: RoomId;
  message: string;
}
```

The server should attach authoritative metadata when forwarding:

```ts
interface ForwardedChatMessage {
  roomId: RoomId;
  messageId: string;
  sender: "self" | "stranger";
  message: string;
  timestamp: number;
}
```

The server generates:
- `messageId`
- `timestamp`

The client supplies only the message content and active room reference.

Recommended maximum:

```ts
const MAX_MESSAGE_LENGTH = 1000;
```

---

## 8. Match Found Event

Server → Client:

```ts
interface MatchFoundPayload {
  roomId: RoomId;
  mode: ChatMode;
  role: "initiator" | "receiver";
}
```

Do not expose the partner's socket ID.

Do not expose the partner's IP address.

Do not expose internal server state.

---

## 9. Matchmaking Events

### Client → Server

```ts
interface MatchFindPayload {
  mode: ChatMode;
}
```

```ts
interface MatchNextPayload {
  roomId: RoomId;
}
```

```ts
interface MatchCancelPayload {
  mode: ChatMode;
}
```

### Server → Client

```ts
interface MatchSearchingPayload {
  mode: ChatMode;
}
```

---

## 10. Partner Left

Server → Client:

```ts
interface PartnerLeftPayload {
  roomId: RoomId;
}
```

The client must not assume a new partner exists automatically.

The UI transitions to a clear partner-left state and may then allow a new search.

---

## 11. WebRTC Offer

Client → Server:

```ts
interface WebRTCOfferPayload {
  roomId: RoomId;
  description: RTCSessionDescriptionInit;
}
```

Server → Partner:
same payload structure.

---

## 12. WebRTC Answer

Client → Server:

```ts
interface WebRTCAnswerPayload {
  roomId: RoomId;
  description: RTCSessionDescriptionInit;
}
```

Server → Partner:
same payload structure.

---

## 13. WebRTC ICE Candidate

Client → Server:

```ts
interface WebRTCICECandidatePayload {
  roomId: RoomId;
  candidate: RTCIceCandidateInit;
}
```

Server → Partner:
same payload structure.

---

## 14. Error Event

Server → Client:

```ts
interface ServerErrorPayload {
  code: string;
  message: string;
}
```

Stable error code examples:

    NOT_CONNECTED
    INVALID_MODE
    ALREADY_SEARCHING
    ALREADY_MATCHED
    ROOM_NOT_FOUND
    NOT_ROOM_MEMBER
    INVALID_PAYLOAD
    MESSAGE_TOO_LONG
    SIGNALING_REJECTED
    SERVER_ERROR

Do not expose stack traces to clients.

---

## 15. State Invariants

The implementation must preserve all of these:

### Invariant 1
A session cannot be in both a waiting queue and a room.

### Invariant 2
A session cannot be in two rooms.

### Invariant 3
A room always contains exactly two members.

### Invariant 4
Every room member points back to the room.

### Invariant 5
Every waiting session has status `SEARCHING`.

### Invariant 6
Every matched session has status `MATCHED`.

### Invariant 7
Destroyed rooms cannot receive new events.

### Invariant 8
All room-scoped events must originate from a current room member.

### Invariant 9
A disconnected session must eventually disappear from all runtime collections.

### Invariant 10
No runtime chat history must survive process restart.
