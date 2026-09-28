# Coding Rules — LAN Stranger Chat

## 1. Architecture Is Locked

Use only:
- React
- Vite
- TypeScript
- Node.js
- Express
- Socket.IO
- WebRTC
- In-memory state

Do NOT introduce Next.js.

Do NOT migrate to a different framework.

Do NOT split the production system into separate frontend/backend servers.

Do NOT introduce a database for the MVP.

---

## 2. Runtime Model

Production must be:

    One Node.js process
        ├── Express
        ├── React static files
        └── Socket.IO

Development may use separate Vite and Node processes.

---

## 3. TypeScript

Use strict TypeScript.

Required:

```json
{
  "compilerOptions": {
    "strict": true
  }
}
```

Rules:
- no `any`
- no unnecessary type assertions
- prefer explicit shared types
- use discriminated unions for Socket.IO events
- use `unknown` when the input type is genuinely unknown
- validate external input before using it

---

## 4. Shared Contracts

All client/server event definitions belong in `shared/`.

Do not duplicate event payload interfaces independently in client and server.

The shared protocol is authoritative.

---

## 5. Server Authority

Never trust the browser for:
- session identity
- room membership
- partner identity
- matchmaking state
- connection state
- authorization to send room events

The server determines the truth.

The browser only requests actions.

---

## 6. Socket.IO

Use Socket.IO for realtime operations.

Use events for:
- matchmaking
- chat
- room lifecycle
- WebRTC signaling

Do not implement chat using repeated HTTP polling.

Do not create REST endpoints that duplicate Socket.IO functionality.

---

## 7. Room Security

Before processing any room-scoped event:

1. Obtain the session from the server.
2. Obtain the authoritative room.
3. Verify the session belongs to the room.
4. Verify the room is active.
5. Validate the payload.
6. Process the event.
7. Route only to the intended partner.

Reject everything else.

---

## 8. IDs

Use secure server-generated IDs.

Recommended:

```ts
crypto.randomUUID()
```

Do not use:

```ts
Math.random()
```

for session IDs, room IDs, security tokens, or any identifier whose unpredictability matters.

`Math.random()` is acceptable for selecting a random waiting pair.

---

## 9. Matchmaking

Requirements:
- separate Text and Video queues
- one session can be in only one queue
- one session can have only one room
- random pair selection
- no client-side pairing
- no duplicate queue entries

Do not silently change matchmaking behavior to FIFO.

Do not add interest matching, geographic matching, or recommendation logic.

---

## 10. State Management

Prefer simple React state, reducers, or small context modules.

Do not add Redux, Zustand, MobX, or another global state library unless a demonstrated requirement appears.

Server state must remain in dedicated runtime services.

Do not duplicate authoritative server state into unrelated singleton objects.

---

## 11. WebRTC

WebRTC is responsible for media.

Socket.IO is responsible for signaling.

Never send camera/audio frames through Socket.IO.

Never send media through Express.

Do not implement a media relay server for the MVP.

---

## 12. WebRTC Lifecycle

Every active RTCPeerConnection must be explicitly cleaned up.

On:
- Next
- Leave
- partner:left
- disconnect
- connection failure

perform cleanup.

Required cleanup includes:

```ts
localStream?.getTracks().forEach(track => track.stop());

peerConnection?.close();
```

Clear stale references afterward.

---

## 13. WebRTC Negotiation

Only the server-designated initiator creates the initial offer.

Do not allow both peers to independently create offers during initial connection.

Validate the active `roomId` before forwarding signaling.

Ignore or reject stale signals from previous rooms.

---

## 14. HTTPS

Camera and microphone access require a secure browser context.

Therefore:
- text mode may be tested over HTTP
- video acceptance testing must use HTTPS or localhost
- LAN video deployment must support HTTPS

Never commit:
- certificates
- private keys
- credentials

Store their paths in environment configuration.

---

## 15. Environment Variables

Use environment variables for configuration.

Examples:

    PORT
    HOST
    TLS_CERT_FILE
    TLS_KEY_FILE
    MAX_MESSAGE_LENGTH
    CHAT_RATE_LIMIT

Never place private credentials in source code.

Never use `VITE_` variables for secrets because frontend variables are exposed to the browser.

---

## 16. Input Validation

Every Socket.IO payload crossing the client/server boundary must be validated.

Validate:
- event shape
- mode
- room ID
- message length
- WebRTC signaling payload shape

Use Zod for runtime validation.

Types alone are not sufficient protection for network input.

---

## 17. Chat Safety

Maximum chat message length:

    1000 characters

Rules:
- reject oversized messages server-side
- do not persist messages
- do not log message contents
- render message text through React normally
- never use `dangerouslySetInnerHTML`

Do not execute user-provided HTML or JavaScript.

---

## 18. Rate Limiting

Implement a lightweight in-memory per-session message rate limit.

The MVP does not require Redis or an external rate-limiting service.

Reject excessive message bursts with a stable server error code.

Do not over-engineer distributed rate limiting.

---

## 19. Logging

Log operational information such as:
- server start
- server stop
- connection
- disconnect
- room created
- room destroyed
- matchmaking failure
- server errors

Do NOT log:
- chat content
- microphone data
- camera data
- full WebRTC SDP unnecessarily
- sensitive browser details

---

## 20. Dependencies

Do not add dependencies casually.

Before adding a package, ask:
1. Is this required by the PRD?
2. Is it materially simpler than implementing the small required behavior?
3. Does it add runtime complexity?
4. Does it work offline on the LAN?

If the answer is mostly no, do not add it.

---

## 21. No Cloud Dependency

The MVP must not depend on:
- Firebase
- Supabase
- AWS
- Pusher
- Ably
- hosted signaling servers
- hosted STUN/TURN
- third-party APIs

The LAN application must remain functional without internet access.

---

## 22. No Database

Do not create:
- SQL schema
- MongoDB schema
- ORM
- migrations
- database connection
- persistent message storage

unless the PRD is explicitly revised.

---

## 23. LAN Networking

The server must listen on:

    0.0.0.0

The server should display an accessible LAN URL at startup.

Do not hard-code a specific LAN IP because the host's LAN address can change.

---

## 24. Frontend Performance

Avoid:
- unnecessary global state updates
- rendering the entire chat list for trivial state changes
- excessive Socket.IO listeners
- duplicate WebRTC event handlers
- creating a new RTCPeerConnection on every React render
- creating media streams repeatedly without cleanup

Socket and WebRTC connections must be created inside controlled lifecycle hooks.

---

## 25. React Rules

Do not:
- manipulate DOM unnecessarily
- store socket objects in ordinary React state
- store RTCPeerConnection objects in ordinary React state
- recreate sockets on every render
- recreate media streams on every render

Use `useRef` for mutable connection objects.

Use state only for UI/application state that should trigger rendering.

---

## 26. Error Handling

Never silently swallow:
- socket errors
- WebRTC errors
- permission failures
- matchmaking failures
- invalid payloads
- server failures

Every user-actionable error needs:
1. machine-readable code
2. user-readable message
3. recovery path where possible

Do not expose stack traces to users.

---

## 27. No Feature Drift

The coding agent must not independently add:
- login
- usernames
- database
- profiles
- group chat
- file sharing
- recording
- screen sharing
- AI
- analytics
- admin dashboard
- external infrastructure

Treat the PRD non-goals as hard constraints.

---

## 28. Testing

At minimum, test server services for:
- queue insertion
- duplicate prevention
- random pairing
- room creation
- room destruction
- partner lookup
- disconnect cleanup
- Next cleanup
- invalid room access

Run:

    typecheck
    lint
    unit tests
    production build

before declaring a phase complete.

---

## 29. Code Organization

Keep business logic out of Socket.IO event handlers where practical.

Bad:

```ts
socket.on("match:next", () => {
  // 150 lines of matchmaking logic
});
```

Prefer:

```ts
socket.on("match:next", payload => {
  matchNext(sessionId, payload);
});
```

Business rules belong in services.

Socket handlers should mainly:
1. validate
2. call service
3. emit result
4. handle errors

---

## 30. No Premature Abstraction

Do not create:
- generic event buses
- generic repository layers
- generic service factories
- complex dependency injection
- plugin systems
- enterprise architecture layers

unless an actual requirement emerges.

The project should remain understandable by one developer.

---

## 31. Build Verification

Before every final build:

1. TypeScript passes
2. ESLint passes
3. Unit tests pass
4. Vite production build passes
5. Node server compilation passes
6. Production server serves React
7. Socket.IO connection works
8. LAN client can connect

---

## 32. Definition of Done

A feature is not done merely because its UI exists.

A feature is done only when:
- frontend behavior works
- server behavior works
- shared protocol is correct
- invalid input is handled
- disconnect cleanup works
- tests exist where appropriate
- the feature works from another LAN device
- it does not violate `prd.md` or `architecture.md`
