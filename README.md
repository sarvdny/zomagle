# Zomagle : LAN Stranger Chat

> A self-hosted, LAN-only anonymous random text and video chat application built with React, Node.js, Socket.IO, and WebRTC.

LAN Stranger Chat is a lightweight local-network communication platform inspired by the interaction model of random stranger chat applications.

Instead of connecting users over the public internet, the application operates entirely within a reachable local network.

A single computer acts as the server. Other devices connected to the same LAN open the application through a browser, enter a matchmaking queue, and are randomly paired into one-to-one conversations.

The application supports both:

- Random text chat
- Random video + audio chat

Text communication is routed through Socket.IO, while video and audio are transmitted peer-to-peer using WebRTC.

---

# Table of Contents

- [Overview](#overview)
- [Core Concept](#core-concept)
- [Features](#features)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [How It Works](#how-it-works)
- [Application Flow](#application-flow)
- [Project Structure](#project-structure)
- [Runtime State](#runtime-state)
- [Realtime Event Model](#realtime-event-model)
- [WebRTC Architecture](#webrtc-architecture)
- [LAN Deployment](#lan-deployment)
- [Development Setup](#development-setup)
- [Production Build](#production-build)
- [HTTPS and Video Mode](#https-and-video-mode)
- [Testing](#testing)
- [Security](#security)
- [Networking Requirements](#networking-requirements)
- [Troubleshooting](#troubleshooting)
- [Performance Considerations](#performance-considerations)
- [Limitations](#limitations)
- [Non-Goals](#non-goals)
- [Future Extensions](#future-extensions)
- [Development Rules](#development-rules)
- [Definition of Done](#definition-of-done)
- [License](#license)

---

# Overview

LAN Stranger Chat provides an anonymous one-to-one random communication experience inside a local network.

Typical deployment:

```text
                    LOCAL NETWORK
                         │
                ┌────────▼────────┐
                │   HOST MACHINE  │
                │                 │
                │    Node.js      │
                │    Express      │
                │    Socket.IO    │
                │    WebRTC       │
                └────────┬────────┘
                         │
              ┌──────────┼──────────┐
              │          │          │
           Browser A  Browser B  Browser C
```

For example:

```text
Server:
192.168.1.100:3000

Client A:
192.168.1.101

Client B:
192.168.1.102

Client C:
192.168.1.103
```

Users do not need individual installations.

The server-hosting machine runs the application, and other devices simply open the LAN URL in a browser.

---

# Core Concept

The project deliberately separates the application's **control plane** and **media plane**.

## Control Plane

Handled by:

- Node.js
- Express
- Socket.IO
- In-memory runtime state

Responsible for:

- sessions
- presence
- matchmaking
- rooms
- text messages
- WebRTC signaling
- disconnect handling

## Media Plane

Handled by:

- WebRTC

Responsible for:

- camera
- microphone
- peer connection
- remote audio
- remote video

The Node.js server does **not** relay video or audio in the MVP.

Conceptually:

```text
              CONTROL

Client A ────── Socket.IO ──────► Server
Client B ────── Socket.IO ──────► Server

              MEDIA

Client A ═══════════════════════ Client B
              WebRTC
           Audio + Video
```

This keeps the server lightweight and makes the architecture appropriate for a LAN environment.

---

# Features

## Text Chat

- Anonymous session
- Random one-to-one matchmaking
- Realtime text messages
- Message length validation
- Server-side room validation
- Next
- Leave
- Partner disconnect handling

## Video Chat

Everything available in Text Chat, plus:

- Camera access
- Microphone access
- Local video preview
- Remote video
- Mute/unmute
- Camera enable/disable
- WebRTC peer-to-peer media
- WebRTC connection state handling
- Media cleanup

## Matchmaking

- Separate Text and Video queues
- Random pair selection
- One-to-one rooms
- Server-authoritative matching
- One active room per session
- Automatic cleanup of abandoned sessions

## Reliability

- Socket disconnect handling
- Browser refresh recovery
- Server restart recovery
- Stale room protection
- Stale WebRTC signaling protection
- LAN connectivity status
- Explicit UI states for failures

---

# Technology Stack

| Layer                  | Technology |
| ---------------------- | ---------- |
| UI                     | React      |
| Build tool             | Vite       |
| Language               | TypeScript |
| Server runtime         | Node.js    |
| HTTP server            | Express    |
| Realtime communication | Socket.IO  |
| Audio/video            | WebRTC     |
| Validation             | Zod        |
| Testing                | Vitest     |
| Formatting             | Prettier   |
| Linting                | ESLint     |
| Persistence            | None       |

## Why React + Node.js?

The application is fundamentally a realtime client application.

React handles:

- application UI
- application state
- chat interface
- matchmaking interface
- video interface
- browser media APIs

Node.js handles:

- persistent realtime connections
- matchmaking
- room management
- session management
- signaling
- message routing

This avoids adding a full-stack framework such as Next.js when server-side rendering and SEO are not requirements of the application.

---

# Architecture

The production application uses one Node.js process.

```text
                     Node.js Process
                            │
              ┌─────────────┴─────────────┐
              │                           │
          Express                    Socket.IO
              │                           │
       React static files          Realtime engine
              │                           │
              │              ┌────────────┼────────────┐
              │              │            │            │
              │         Matchmaking     Rooms         Chat
              │              │            │            │
              │              └────────────┼────────────┘
              │                           │
              │                      WebRTC Signaling
              │
              └───────────────┬────────────────────────
                              │
                            LAN
                              │
              ┌───────────────┼───────────────┐
              │               │               │
           Client A        Client B        Client C
              │               │
              └────── WebRTC ┘
                  Video/Audio
```

## Server Responsibilities

The server is authoritative for:

- session state
- matchmaking state
- queue membership
- room membership
- partner state
- room lifecycle
- signaling authorization

Clients only request actions.

The client must never be trusted to declare:

- "I am matched"
- "this is my room"
- "this is my partner"
- "I own this room"

---

# Application Flow

## 1. User Opens Application

The user visits:

```text
http://<LAN-IP>:<PORT>
```

or the configured HTTPS equivalent.

The React application connects to Socket.IO.

The server creates a session.

---

## 2. Mode Selection

The user chooses:

```text
Text Chat
```

or:

```text
Video Chat
```

The selected mode determines which matchmaking queue is used.

---

## 3. Searching

The client sends:

```text
match:find
```

The server:

1. validates the session
2. validates the selected mode
3. adds the session to the correct queue
4. checks whether another compatible user exists

If none exists:

```text
SEARCHING
```

The client displays:

```text
Looking for a stranger...
```

---

## 4. Match Found

When enough users are waiting, the server:

1. selects two users randomly
2. removes them from the queue
3. creates a room
4. assigns both users to the room
5. assigns one user as WebRTC initiator
6. changes their session states
7. emits `match:found`

Example:

```json
{
  "roomId": "room-id",
  "mode": "video",
  "role": "initiator"
}
```

The second user receives:

```json
{
  "roomId": "room-id",
  "mode": "video",
  "role": "receiver"
}
```

---

# Text Chat Flow

Once two users are matched:

```text
Client A
   │
   │ chat:send
   ▼
Socket.IO
   │
   ▼
Node Server
   │
   ├── validate session
   ├── validate room
   ├── validate message
   └── find partner
           │
           ▼
       Client B
```

Messages are not stored.

The server generates authoritative:

- message ID
- timestamp

The browser renders the message as plain text.

---

# Video Chat Flow

Video mode adds WebRTC.

## Signaling

The signaling channel still runs through Socket.IO.

```text
Client A
   │
   │ SDP Offer
   ▼
Server
   │
   │
   ▼
Client B
   │
   │ SDP Answer
   ▼
Server
   │
   ▼
Client A
```

ICE candidates are exchanged in the same way.

## Media

After WebRTC negotiation:

```text
Client A ═══════════════════ Client B
              WebRTC
           Video + Audio
```

The Node server does not receive or relay the media stream.

---

# Application States

The frontend uses explicit states rather than a collection of unrelated boolean flags.

```text
IDLE
  ↓
CONNECTING
  ↓
SEARCHING
  ↓
MATCHED
  ↓
CONNECTING_MEDIA
  ↓
IN_CALL
```

Possible interruption states:

```text
PARTNER_LEFT
DISCONNECTED
ERROR
```

This prevents invalid states such as:

```text
matched = true
searching = true
roomId = null
```

at the same time.

---

# Project Structure

```text
lan-stranger-chat/
│
├── client/
│   ├── index.html
│   │
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       │
│       ├── components/
│       │   ├── Lobby/
│       │   ├── Matchmaking/
│       │   ├── Chat/
│       │   ├── Video/
│       │   └── Controls/
│       │
│       ├── hooks/
│       │   ├── useSocket.ts
│       │   └── useWebRTC.ts
│       │
│       ├── state/
│       │   └── sessionState.ts
│       │
│       └── styles/
│           └── global.css
│
├── server/
│   ├── index.ts
│   │
│   ├── socket/
│   │   ├── connection.ts
│   │   ├── matchmaking.ts
│   │   ├── chat.ts
│   │   └── signaling.ts
│   │
│   ├── services/
│   │   ├── SessionService.ts
│   │   ├── MatchmakingService.ts
│   │   └── RoomService.ts
│   │
│   └── state/
│       └── RuntimeState.ts
│
├── shared/
│   ├── events.ts
│   ├── models.ts
│   └── constants.ts
│
├── public/
│
├── dist/
│
├── vite.config.ts
├── tsconfig.json
├── tsconfig.server.json
├── eslint.config.js
├── package.json
├── .env.example
├── README.md
│
└── documentation/
    ├── prd.md
    ├── architecture.md
    ├── schema.md
    ├── rules.md
    └── task.md
```

The documentation directory is optional in the final application repository but recommended for AI-assisted development.

---

# Runtime State

The MVP does not use a database.

All state exists in memory.

Conceptually:

```ts
sessions: Map<SessionId, Session>;

rooms: Map<RoomId, Room>;

waitingQueues: {
  text: WaitingQueue;
  video: WaitingQueue;
}
```

## Session

```ts
interface Session {
  sessionId: SessionId;
  socketId: string;
  mode: 'text' | 'video';
  status: 'IDLE' | 'SEARCHING' | 'MATCHED' | 'DISCONNECTING';
  roomId: string | null;
  connectedAt: number;
  lastActivityAt: number;
}
```

## Room

```ts
interface Room {
  roomId: string;
  mode: 'text' | 'video';
  members: [string, string];
  initiator: string;
  status: 'ACTIVE' | 'CLOSING';
  createdAt: number;
}
```

Restarting the server resets all runtime state.

This is intentional.

---

# Realtime Event Model

## Client → Server

```text
match:find
match:cancel
match:next

chat:send

session:leave

webrtc:offer
webrtc:answer
webrtc:ice-candidate
```

## Server → Client

```text
session:ready

match:searching
match:found

chat:message

partner:left

webrtc:offer
webrtc:answer
webrtc:ice-candidate

server:error
```

All event payloads must be defined centrally in:

```text
shared/events.ts
```

Both client and server use the same contracts.

---

# WebRTC Architecture

## Peer Roles

When a room is created, the server assigns:

```text
initiator
```

to one client and:

```text
receiver
```

to the other.

Only the initiator creates the initial SDP offer.

This prevents both clients from independently attempting initial negotiation.

---

# WebRTC Lifecycle

The browser creates:

```ts
new RTCPeerConnection();
```

Then:

1. acquire media
2. add tracks
3. configure event listeners
4. create/receive SDP
5. exchange ICE candidates
6. establish peer connection
7. attach remote media
8. monitor connection status
9. close everything when the room ends

On:

- Next
- Leave
- Partner disconnect
- Socket disconnect
- WebRTC failure

the client must:

```text
stop local tracks
close RTCPeerConnection
clear remote stream
remove listeners
clear room state
```

---

# LAN Deployment

## Server Machine

The server machine must:

1. be connected to the LAN
2. have Node.js installed
3. install project dependencies
4. build the project
5. start the Node server
6. allow the application port through the local firewall

The server should bind to:

```text
0.0.0.0
```

rather than only:

```text
127.0.0.1
```

This allows other LAN devices to connect.

---

# Example Deployment

Suppose the server machine receives:

```text
192.168.1.100
```

and the configured port is:

```text
3000
```

The application becomes:

```text
http://192.168.1.100:3000
```

Other LAN users open that address in a browser.

The server should print the usable LAN address when it starts.

Do not hard-code a LAN address because DHCP assignments can change.

---

# Development Setup

## Requirements

Recommended baseline:

- Node.js
- npm
- modern browser
- LAN/Wi-Fi connection for multi-device testing

The server and frontend use TypeScript.

---

## Install Dependencies

```bash
npm install
```

---

## Development Mode

Development may run the frontend and backend separately.

Conceptually:

```text
Vite
localhost:5173

Node
localhost:3000
```

The Vite development server should proxy Socket.IO traffic to the Node server.

This separation exists only for development convenience.

---

# Available Scripts

The root project should provide scripts similar to:

```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev:client\" \"npm run dev:server\"",
    "dev:client": "vite",
    "dev:server": "tsx server/index.ts",
    "build": "vite build && tsc -p tsconfig.server.json",
    "start": "node dist-server/index.js",
    "typecheck": "tsc --noEmit",
    "lint": "eslint .",
    "test": "vitest run"
  }
}
```

The exact scripts may vary according to the implementation, but production must ultimately run as one Node.js process.

---

# Production Build

The production workflow is:

```bash
npm run build
```

then:

```bash
npm run start
```

The Node server should:

- serve the generated React/Vite assets
- expose `/api/health`
- accept Socket.IO connections
- maintain runtime state
- provide matchmaking
- provide room management
- provide chat routing
- provide WebRTC signaling

The Vite development server must not be required for production.

---

# HTTPS and Video Mode

Browser camera and microphone APIs require a secure browser context.

For LAN video deployment, use HTTPS.

Example configuration:

```env
PORT=3000
HOST=0.0.0.0

TLS_CERT_FILE=/path/to/certificate.pem
TLS_KEY_FILE=/path/to/private-key.pem
```

Never commit certificates or private keys to the repository.

Text-only development can use HTTP where appropriate.

Video acceptance testing on real LAN devices should use HTTPS.

---

# Networking Requirements

The application assumes that LAN clients can directly reach the host and, for WebRTC, can establish peer connectivity.

The following condition must hold:

```text
Client A ──────► Host Server
Client B ──────► Host Server

Client A ◄──────── LAN/WebRTC ────────► Client B
```

## Important: Wi-Fi Client Isolation

Some wireless networks enable:

```text
AP / Client Isolation
```

In such a configuration:

```text
Client A ──X── Client B
```

even though both devices appear to be connected to the same Wi-Fi network.

For the MVP:

- client isolation must be disabled
- devices must be on a reachable LAN/subnet
- the host firewall must allow the application port

---

# Security

The application is LAN-only, but LAN does not automatically mean trusted.

## Server Authority

Never trust the client for:

- room ownership
- partner identity
- session identity
- matchmaking status
- authorization

All room-scoped operations must be validated server-side.

---

## Input Validation

Validate every Socket.IO payload.

Validation should cover:

- event payload structure
- mode
- room ID
- message size
- signaling payload shape

Use Zod for runtime validation.

---

## Chat Protection

Maximum recommended message size:

```text
1000 characters
```

The server must enforce this limit.

Messages must be rendered as plain text.

Never use:

```tsx
dangerouslySetInnerHTML;
```

for chat content.

---

## Rate Limiting

Use lightweight per-session in-memory rate limiting for chat messages.

The MVP does not require Redis or a distributed rate limiter.

---

## Sensitive Information

The UI should never expose:

- internal session IDs
- Socket.IO socket IDs
- partner IP addresses
- server internals
- raw logs
- WebRTC internals

The server should not log:

- chat contents
- microphone data
- camera data
- unnecessary complete SDP payloads

---

# Performance Considerations

The architecture is deliberately designed to avoid unnecessary server load.

## Text

Messages are small and routed through Socket.IO.

```text
A → Server → B
```

## Video

Video does not pass through Node.

```text
A ═════════ B
   WebRTC
```

This is important.

A video relay server would significantly increase host bandwidth and CPU requirements.

The chosen architecture avoids making the LAN server a media bottleneck.

---

# Matchmaking Complexity

The waiting queue uses:

```text
ids[]
indexBySessionId
```

This enables efficient removal without repeatedly scanning the entire queue.

The server:

1. maintains queue membership
2. selects a random waiting user
3. removes matched entries
4. creates a room
5. updates session state

The client never chooses the partner.

---

# Error Handling

The application distinguishes between different failure types.

## Partner disconnected

```text
PARTNER_LEFT
```

Meaning:

The stranger left or lost their connection.

User can search again.

## Server disconnected

```text
DISCONNECTED
```

Meaning:

The application lost connection to the LAN host.

User should see a reconnect option.

## WebRTC failure

```text
VIDEO_CONNECTION_FAILED
```

Meaning:

The signaling connection may exist, but media negotiation failed.

The UI should provide an appropriate recovery path.

## Permission failure

Possible cases:

```text
CAMERA_PERMISSION_DENIED
MICROPHONE_PERMISSION_DENIED
```

The UI should explain the issue and allow recovery.

---

# Testing

Testing must cover both isolated services and real LAN behavior.

## Unit Tests

At minimum:

### Matchmaking

- one user remains waiting
- two users become matched
- three users produce one pair + one waiting user
- four users produce two rooms
- text/video queues remain independent
- duplicate queue insertion is prevented
- disconnected waiting users are removed
- users cannot match themselves

### Room Management

- room creation
- room lookup
- partner lookup
- room destruction
- invalid room rejection
- room member validation

### Validation

- invalid mode
- missing room ID
- oversized message
- invalid WebRTC payload
- unauthorized room operation

---

# Integration Tests

## Text Chat

Test:

```text
A connects
B connects
A/B are matched
A sends message
B receives message
C does not receive message
```

---

## Next

Test:

```text
A ↔ B

A → Next

B receives partner:left

Old room destroyed

A → searching

A ↔ C
```

Verify that old room events cannot affect the new room.

---

## Disconnect

Test:

- browser close
- browser refresh
- network disconnect
- server restart
- temporary Wi-Fi failure

No stale session should remain indefinitely.

---

# Real LAN Testing

Use actual devices.

Recommended minimum:

```text
Host PC
Second PC
Android phone
```

Optional:

```text
Multiple browser tabs
Additional phones
Tablet
```

Test:

- Text mode
- Video mode
- microphone
- camera
- Next
- Leave
- partner disconnect
- server disconnect
- refresh
- permission denial
- multiple simultaneous users

---

# Troubleshooting

## Other devices cannot open the application

Check:

1. Server is running.
2. Server is bound to `0.0.0.0`.
3. Both devices are on the same LAN.
4. Host firewall allows the port.
5. Router/AP client isolation is disabled.
6. The correct LAN address is being used.

Test from another device:

```text
http://<server-ip>:3000
```

---

## Text chat works but video does not

Check:

1. The page is running in a secure browser context.
2. Camera permission was granted.
3. Microphone permission was granted.
4. WebRTC signaling events are being exchanged.
5. Both clients can establish LAN peer connectivity.
6. The current room ID is still active.
7. Old RTCPeerConnection state is not being reused.

---

## Camera permission does not appear

Possible causes:

- page is not in a secure context
- permission was previously blocked
- browser policy is preventing access
- device has no available camera
- operating system camera access is disabled

Check browser site permissions and OS privacy permissions.

---

## User gets stuck on "Searching"

Check:

1. Another compatible user has joined.
2. The second user is using the same mode.
3. The waiting queue contains valid sessions.
4. Socket.IO connection remains active.
5. Server logs show the matchmaking event.

Remember:

```text
Text → Text
Video → Video
```

in the MVP.

---

## Partner disappears but room remains active

This indicates a cleanup bug.

Verify:

- `disconnect` is handled
- `partner:left` is emitted
- room is destroyed
- both session references are cleared
- old room events are rejected

---

# Limitations

The MVP intentionally has limitations.

## No persistent data

Restarting the server clears all state.

## LAN-only

The application is not designed for public internet deployment in the MVP.

## No accounts

Users are anonymous sessions.

## No moderation system

There is no persistent moderation or reporting infrastructure in the MVP.

## WebRTC networking

Peer connectivity depends on the local network and browser networking behavior.

## No media relay

If direct peer connectivity cannot be established, video may fail even if the Socket.IO server itself is reachable.

---

# Non-Goals

The MVP does not include:

- login
- registration
- passwords
- user profiles
- usernames
- friends
- followers
- group chat
- group video
- file sharing
- image sharing
- screen sharing
- recording
- database
- persistent chat history
- analytics
- AI moderation
- recommendation algorithms
- interest-based matching
- cloud infrastructure
- public internet matchmaking
- external hosted signaling infrastructure
- external hosted STUN/TURN infrastructure
- payment systems
- admin dashboard

Do not implement these unless the product requirements are explicitly revised.

---

# Future Extensions

The architecture leaves room for later features without forcing them into the MVP.

Potential future work includes:

## Automatic LAN Discovery

Instead of manually opening:

```text
http://192.168.x.x:3000
```

clients could discover the server automatically using an appropriate LAN service-discovery mechanism.

---

## Interest-Based Matching

Queues could later be expanded to support:

```text
mode
+
interest
+
language
```

without changing the fundamental room architecture.

---

## Persistent Accounts

A future authenticated version could introduce:

```text
database
authentication
profiles
moderation
history
```

but these should be added as a separate architectural phase.

---

## Moderation

Possible later features:

- report
- block
- temporary session bans
- rate-limiting improvements
- administrator controls

These are intentionally excluded from the MVP.

---

## Internet Deployment

A public internet version would require additional infrastructure and security considerations, potentially including:

- HTTPS
- production TURN infrastructure
- horizontal scaling
- distributed session state
- persistent storage
- abuse prevention
- authentication
- observability

That is a different deployment target from the current LAN product.

---

# Development Rules

The repository follows these fundamental rules:

1. React handles UI.
2. Node.js handles server authority.
3. Socket.IO handles realtime control traffic.
4. WebRTC handles audio/video.
5. The server owns matchmaking and room state.
6. Runtime state is in memory.
7. No database in the MVP.
8. No cloud dependency.
9. No media relay server in the MVP.
10. No unnecessary framework or dependency additions.
11. TypeScript strict mode is required.
12. All network payloads must be validated.
13. Room-scoped events must be authorized.
14. WebRTC connections must be completely cleaned up.
15. Stale room/signaling events must be rejected.
16. Chat content must be treated as untrusted text.
17. Production must run from one Node.js process.
18. The Vite dev server is development-only.
19. LAN video deployment must support HTTPS.
20. Do not implement non-goal features without updating the requirements.

For detailed constraints, refer to:

```text
rules.md
```

---

# Documentation Set

The project documentation is intentionally divided by responsibility.

```text
prd.md
```

Defines:

- product goals
- user flows
- MVP
- requirements
- non-goals

```text
architecture.md
```

Defines:

- technology architecture
- project structure
- server/client responsibilities
- data flow
- Socket.IO architecture
- WebRTC architecture

```text
schema.md
```

Defines:

- runtime models
- event payloads
- state invariants

```text
implementation_plan.md
```

Defines:

- chronological implementation phases

```text
task.md
```

Defines:

- granular implementation tasks
- subtasks
- acceptance criteria
- verification steps

```text
rules.md
```

Defines:

- coding constraints
- security rules
- dependency rules
- architectural boundaries

---

# AI-Assisted Development

This repository is designed to work well with AI coding agents.

Before making changes, an AI coding agent should read:

```text
prd.md
architecture.md
schema.md
rules.md
task.md
```

The agent must then:

1. identify the current task
2. inspect existing implementation
3. implement only the requested scope
4. preserve existing architecture
5. run validation
6. run tests
7. update task completion state only after verification

The AI must not independently introduce a framework, database, cloud service, or architectural pattern that is not required by the documentation.

---

# Definition of Done

The MVP is complete when all of the following work:

```text
✓ One Node.js process hosts the production application
✓ React frontend loads from Node
✓ LAN devices can connect
✓ Socket.IO connection works
✓ Anonymous sessions work
✓ Random Text matchmaking works
✓ Random Video matchmaking works
✓ One-to-one rooms work
✓ Realtime text chat works
✓ Video works
✓ Audio works
✓ Camera control works
✓ Microphone control works
✓ Next works
✓ Leave works
✓ Partner disconnect works
✓ Browser refresh is recoverable
✓ Server restart is recoverable
✓ WebRTC media remains peer-to-peer
✓ Node does not relay video/audio
✓ No database is required
✓ No cloud service is required
✓ Core LAN operation does not require internet access
✓ LAN video works over HTTPS
✓ Room authorization works
✓ Stale events are rejected
✓ Input validation works
✓ Rate limiting works
✓ Tests pass
✓ TypeScript passes
✓ ESLint passes
✓ Production build passes
✓ Multi-device LAN testing passes
```

---

# License

Choose an appropriate open-source or private license before publishing this project.

Example:

```text
MIT License
```

The license should be added as a separate `LICENSE` file rather than embedded only in this README.

---

# Project Status

**Current target:** LAN-only MVP

**Architecture status:** Defined

**Frontend:** React + Vite + TypeScript

**Backend:** Node.js + Express + Socket.IO

**Media:** WebRTC

**Persistence:** None

**Deployment:** Single self-hosted LAN server

**Internet dependency:** None for core LAN operation
