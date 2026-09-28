# Architecture — LAN Stranger Chat

## 1. Architecture Decision

Use:
- React
- Vite
- TypeScript
- Node.js
- Express
- Socket.IO
- WebRTC
- In-memory runtime state
- npm

Do NOT use Next.js.

Do NOT create a separate standalone frontend runtime in production.

The React application is built into static assets and served by the Node.js server.

---

## 2. Runtime Architecture

                    SAME LAN

       ┌───────────────────────────────────┐
       │          HOST MACHINE             │
       │                                   │
       │        Node.js Process            │
       │                                   │
       │   ┌───────────────────────────┐   │
       │   │ Express HTTP/HTTPS        │   │
       │   │                           │   │
       │   │ Serves React/Vite build   │   │
       │   │ Health endpoint           │   │
       │   └─────────────┬─────────────┘   │
       │                 │                 │
       │   ┌─────────────▼─────────────┐   │
       │   │ Socket.IO                 │   │
       │   │                           │   │
       │   │ Session management        │   │
       │   │ Matchmaking               │   │
       │   │ Room management           │   │
       │   │ Chat routing              │   │
       │   │ WebRTC signaling          │   │
       │   └───────────────────────────┘   │
       │                                   │
       │     In-memory application state   │
       └─────────────────┬─────────────────┘
                         │
                    LAN / Wi-Fi
             ┌───────────┼───────────┐
             │           │           │
          Client A    Client B    Client C
             │           │
             └──── WebRTC P2P ──────┘
                  Audio + Video

---

## 3. Responsibilities

### React
Responsible for:
- UI rendering
- application state
- matchmaking UI
- chat UI
- media controls
- local camera preview
- remote video rendering
- Socket.IO client
- WebRTC client
- connection status
- cleanup of browser media resources

React must not own authoritative matchmaking or room state.

### Node.js
Responsible for:
- accepting browser connections
- serving the frontend
- creating session IDs
- maintaining presence
- maintaining waiting queues
- random matchmaking
- creating/destroying rooms
- forwarding text messages
- forwarding WebRTC signaling messages
- validating client actions
- cleanup after disconnect
- serving health information

### Socket.IO
Use Socket.IO as the application's single realtime control channel.

Use it for:
- matchmaking events
- room events
- text chat
- WebRTC signaling
- connection/disconnection events

Do not use polling-based REST calls for realtime chat/matchmaking.

### WebRTC
Use native browser WebRTC APIs.

WebRTC is responsible for:
- microphone stream
- camera stream
- peer connection
- remote audio
- remote video

Do not send media through Socket.IO.
Do not encode video manually.
Do not implement a custom media transport.

---

## 4. Production Process Model

Production must use one Node.js process.

Conceptually:

    npm run build

    ┌───────────────────────┐
    │ Node.js               │
    │                       │
    │ Express               │
    │   └── React dist/     │
    │                       │
    │ Socket.IO             │
    │   ├── matchmaking     │
    │   ├── rooms           │
    │   ├── chat            │
    │   └── signaling       │
    └───────────────────────┘

The client must access one LAN origin.

Example:

    https://192.168.1.100:3000

The server must bind to `0.0.0.0` so LAN clients can connect.

---

## 5. Development Process Model

Development may use two processes:

    React/Vite dev server
          +
    Node realtime server

Vite is for frontend development/HMR only.

Production must not depend on the Vite dev server.

Use a Vite proxy during development for Socket.IO traffic.

---

## 6. Suggested Project Structure

    /
    ├── client/
    │   ├── index.html
    │   └── src/
    │       ├── main.tsx
    │       ├── App.tsx
    │       ├── components/
    │       │   ├── Lobby/
    │       │   ├── Matchmaking/
    │       │   ├── Chat/
    │       │   ├── Video/
    │       │   └── Controls/
    │       ├── hooks/
    │       │   ├── useSocket.ts
    │       │   └── useWebRTC.ts
    │       ├── state/
    │       │   └── sessionState.ts
    │       └── styles/
    │           └── global.css
    │
    ├── server/
    │   ├── index.ts
    │   ├── socket/
    │   │   ├── connection.ts
    │   │   ├── matchmaking.ts
    │   │   ├── chat.ts
    │   │   └── signaling.ts
    │   ├── services/
    │   │   ├── SessionService.ts
    │   │   ├── MatchmakingService.ts
    │   │   └── RoomService.ts
    │   └── state/
    │       └── RuntimeState.ts
    │
    ├── shared/
    │   ├── events.ts
    │   ├── models.ts
    │   └── constants.ts
    │
    ├── public/
    ├── dist/
    ├── vite.config.ts
    ├── tsconfig.json
    ├── tsconfig.server.json
    ├── eslint.config.js
    ├── package.json
    ├── .env.example
    └── README.md

Do not create additional architectural layers unless they solve a real problem.

---

## 7. Runtime State

All authoritative runtime state lives in memory.

Primary structures:

    sessions: Map<SessionId, Session>

    rooms: Map<RoomId, Room>

    waitingQueues:
      text
      video

    waitingIndexes:
      efficient removal from queues

The state is lost when the process restarts.

This is expected.

---

## 8. Matchmaking Algorithm

The server must guarantee:
- one user cannot exist in two queues
- one user cannot exist in two rooms
- only compatible modes can match
- matching is server-authoritative
- room creation and queue removal happen as one synchronous state transition

Preferred algorithm:

1. Add session to the appropriate queue.
2. If queue length < 2, wait.
3. Randomly select two different queue entries.
4. Remove both using indexed removal.
5. Create room.
6. Assign both sessions to the room.
7. Set both states to `MATCHED`.
8. Emit `match:found` to both clients.

Do not depend on client-side random matching.

`Math.random()` may be used for selecting random waiting entries.

Use cryptographically strong IDs for sessions and rooms.

---

## 9. Room Routing

Each active room has exactly two members.

Server must route:
- `chat:send`
- `webrtc:offer`
- `webrtc:answer`
- `webrtc:ice-candidate`

only to the partner in the same room.

Client-provided room IDs are never trusted.

Every room-scoped event must be validated against authoritative server state.

---

## 10. Text Data Flow

    Client A
       │
       │ chat:send
       ▼
    Socket.IO
       │
       ▼
    Server
       │
       ├── validate session
       ├── validate room
       ├── validate message size
       └── route to partner
               │
               ▼
           Client B

The server does not persist the message.

React renders message text normally.

Never use `dangerouslySetInnerHTML` for user messages.

---

## 11. WebRTC Data Flow

### Signaling

    Client A
       │
       │ SDP offer
       ▼
    Socket.IO
       │
       ▼
    Server
       │
       │ routed to partner
       ▼
    Client B

Then:

    Client B
       │
       │ SDP answer
       ▼
    Server
       │
       ▼
    Client A

ICE candidates follow the same signaling route.

### Media

After negotiation:

    Client A ═════════════════ Client B
               WebRTC
            video + audio

The Node server must not relay the audio/video stream.

---

## 12. Signaling Rules

The server does not interpret SDP contents.

It only:
1. validates sender membership
2. validates active room
3. identifies the partner
4. forwards the signaling payload
5. rejects messages from users not in the room

The client handles:
- `RTCPeerConnection`
- `createOffer`
- `createAnswer`
- `setLocalDescription`
- `setRemoteDescription`
- ICE candidate generation
- `addIceCandidate`

---

## 13. WebRTC Role Assignment

The server assigns exactly one participant as the initiator when the room is created.

Do not let both clients independently decide to become the offerer.

Example:

    match:found
    {
      roomId,
      mode,
      role: "initiator" | "receiver"
    }

The initiator creates the offer.

The receiver waits for the offer.

---

## 14. Stale Event Protection

Every room-scoped client operation must be associated with the active `roomId`.

After `Next` or disconnect:
- old room is destroyed
- old WebRTC connection is closed
- old events are rejected
- a new room gets a new room ID

Never accept WebRTC signaling from a previous room.

---

## 15. HTTP API

Keep HTTP APIs minimal.

Required:

    GET /api/health

Response:

    {
      "status": "ok",
      "service": "lan-stranger-chat"
    }

Do not create REST endpoints for:
- send message
- find partner
- next
- WebRTC signaling
- room membership

Those are Socket.IO operations.

---

## 16. Socket.IO Event Contract

### Client → Server

    match:find
    match:cancel
    match:next
    chat:send
    session:leave
    webrtc:offer
    webrtc:answer
    webrtc:ice-candidate

### Server → Client

    session:ready
    match:searching
    match:found
    chat:message
    partner:left
    webrtc:offer
    webrtc:answer
    webrtc:ice-candidate
    server:error

Exact payload definitions belong in `shared/events.ts`.

---

## 17. Security Model

The server trusts no client state.

Validate:
- event type
- room membership
- mode
- message length
- payload shape
- active session state

Use server-generated:
- session IDs
- room IDs

Do not expose Socket.IO socket IDs as public identity.

Do not log message contents.

Do not log camera/audio data.

Do not persist chat data.

---

## 18. LAN Requirements

The deployment assumes:
- clients are on the same reachable LAN
- server is reachable from client devices
- Wi-Fi client isolation is disabled
- host firewall allows the application port

Automatic LAN discovery is not part of the MVP.

The server must print the usable LAN URL when started.

---

## 19. HTTPS Requirement

Video mode must run in a secure browser context.

The production server must support HTTPS.

TLS configuration must be supplied through environment variables or explicit startup configuration.

Required configuration concept:

    TLS_CERT_FILE=/path/to/certificate.pem
    TLS_KEY_FILE=/path/to/private-key.pem

Text-only operation may be tested through HTTP during development, but video acceptance testing must use a secure origin.

Do not hard-code certificates or private keys.

---

## 20. Dependency Policy

Required runtime technologies:
- React
- React DOM
- Socket.IO client
- Node.js
- Express
- Socket.IO server

Recommended supporting tools:
- TypeScript
- Vite
- Zod for runtime payload validation
- Vitest for service/unit tests

Do not add a package merely because it is popular.

Every new dependency must have a concrete project-level reason.
