# TASKS — LAN Stranger Chat

## How the Coding Agent Must Use This File

- Execute tasks in order unless a task explicitly allows parallel work.
- Complete all subtasks before marking the parent task complete.
- Do not skip acceptance criteria.
- Do not implement future-phase functionality early.
- Read and follow `prd.md`, `architecture.md`, `schema.md`, and `rules.md` before modifying code.
- Treat those files as architectural authority.
- After each major task:
  - run type checking
  - run linting
  - run relevant tests
  - verify the application still builds

- Never mark a task complete only because code was written. Verify behavior.

---

# TASK GROUP 01 — Project Initialization

## TASK-01 — Create Repository Structure

### Objective

Create the initial project structure exactly as defined in `architecture.md`.

### Subtasks

- [x] Create root project directory.
- [x] Create `client/`.
- [x] Create `server/`.
- [x] Create `shared/`.
- [x] Create `public/`.
- [x] Create required source subdirectories.
- [x] Create root `package.json`.
- [x] Create TypeScript configuration files.
- [x] Create Vite configuration.
- [x] Create ESLint configuration.
- [x] Create Prettier configuration.
- [x] Create `.gitignore`.
- [x] Create `.env.example`.

### Do not

- Create a database directory.
- Create ORM configuration.
- Create Next.js files.
- Create Docker configuration unless explicitly required later.
- Add unnecessary architecture layers.

### Done when

The repository structure matches `architecture.md` and all required configuration files exist.

---

## TASK-02 — Configure TypeScript

### Objective

Set up strict TypeScript for both browser and server code.

### Subtasks

- [x] Enable `strict`.
- [x] Configure client TypeScript.
- [x] Configure server TypeScript.
- [x] Configure shared TypeScript.
- [x] Configure module resolution.
- [x] Configure path aliases only where they materially improve readability.
- [x] Verify client compilation.
- [x] Verify server compilation.

### Done when

No TypeScript compilation errors exist.

---

## TASK-03 — Configure Development Tooling

### Objective

Set up the minimum development toolchain.

### Subtasks

- [x] Configure Vite.
- [x] Configure ESLint.
- [x] Configure Prettier.
- [x] Configure Vitest.
- [x] Add scripts for:
  - `dev`
  - `dev:client`
  - `dev:server`
  - `build`
  - `start`
  - `typecheck`
  - `lint`
  - `test`

- [x] Verify every script executes correctly.

---

# TASK GROUP 02 — Shared Domain Model

## TASK-04 — Define Core Types

### Objective

Create the authoritative shared type definitions.

### Subtasks

- [x] Define `SessionId`.
- [x] Define `RoomId`.
- [x] Define `ChatMode`.
- [x] Define `SessionStatus`.
- [x] Define `RoomStatus`.
- [x] Define `Session`.
- [x] Define `Room`.
- [x] Define waiting queue types.
- [x] Define runtime state type.

### Done when

Client and server can import shared domain types without duplication.

---

## TASK-05 — Define Socket Event Contracts

### Objective

Create a single authoritative protocol for client/server realtime communication.

### Subtasks

- [x] Define all client → server events.
- [x] Define all server → client events.
- [x] Define payload types.
- [x] Define stable error codes.
- [x] Document payload purpose through concise TypeScript comments where useful.
- [x] Ensure event names exactly match `architecture.md`.

### Required client events

- [x] `match:find`
- [x] `match:cancel`
- [x] `match:next`
- [x] `chat:send`
- [x] `session:leave`
- [x] `webrtc:offer`
- [x] `webrtc:answer`
- [x] `webrtc:ice-candidate`

### Required server events

- [x] `session:ready`
- [x] `match:searching`
- [x] `match:found`
- [x] `chat:message`
- [x] `partner:left`
- [x] `webrtc:offer`
- [x] `webrtc:answer`
- [x] `webrtc:ice-candidate`
- [x] `server:error`

---

## TASK-06 — Add Runtime Payload Validation

### Objective

Ensure untrusted network input is validated at runtime.

### Subtasks

- [x] Create Zod schemas for all external Socket.IO payloads.
- [x] Validate `ChatMode`.
- [x] Validate message payload.
- [x] Validate room ID.
- [x] Validate WebRTC signaling payloads.
- [x] Reject malformed payloads.
- [x] Return stable server error codes.

### Done when

Malformed client payloads cannot reach business logic.

---

# TASK GROUP 03 — Server Foundation

## TASK-07 — Create Node Server

### Objective

Create the central server process.

### Subtasks

- [x] Create `server/index.ts`.
- [x] Create HTTP server.
- [x] Attach Express.
- [x] Attach Socket.IO.
- [x] Load environment configuration.
- [x] Bind server to `0.0.0.0`.
- [x] Add configurable port.
- [x] Add startup logging.
- [x] Add graceful shutdown.

### Done when

Server starts successfully and accepts LAN connections.

---

## TASK-08 — Serve React Production Build

### Objective

Make the Node server host the production frontend.

### Subtasks

- [x] Determine the production build output directory.
- [x] Configure Express static serving.
- [x] Add SPA fallback handling where necessary.
- [x] Verify React loads from Node.
- [x] Verify browser-side routing does not break on refresh.

### Done when

```text
npm run build
npm run start
```

serves the application from one Node process.

---

## TASK-09 — Add Health Endpoint

### Objective

Add the minimal operational endpoint.

### Subtasks

- [x] Implement `GET /api/health`.
- [x] Return `{ status: "ok", service: "lan-stranger-chat" }`.
- [x] Ensure endpoint does not expose secrets or runtime internals.

---

# TASK GROUP 04 — Runtime State

## TASK-10 — Create RuntimeState

### Objective

Create the in-memory authoritative state container.

### Subtasks

- [x] Create session map.
- [x] Create room map.
- [x] Create text waiting queue.
- [x] Create video waiting queue.
- [x] Export controlled access methods.
- [x] Avoid direct uncontrolled mutations from UI code.

### Done when

All server runtime state can be traced through a small number of well-defined structures.

---

## TASK-11 — Create Session Service

### Objective

Manage the lifecycle of connected users.

### Subtasks

- [x] Create session on connection.
- [x] Generate secure session ID.
- [x] Store socket ID internally.
- [x] Set initial state to `IDLE`.
- [x] Record timestamps.
- [x] Retrieve session by ID.
- [x] Remove session.
- [x] Update session status.
- [x] Update room membership.

### Done when

Session lifecycle can be tested independently from Socket.IO handlers.

---

# TASK GROUP 05 — Socket Connection Lifecycle

## TASK-12 — Handle Socket Connection

### Objective

Create the server-side connection lifecycle.

### Subtasks

- [x] Handle Socket.IO connection.
- [x] Create server-side session.
- [x] associate socket with session.
- [x] emit `session:ready`.
- [x] register event handlers.
- [x] register disconnect handler.

### Done when

Every connected browser receives a valid server-generated session.

---

## TASK-13 — Handle Disconnect

### Objective

Guarantee cleanup when a browser disappears unexpectedly.

### Subtasks

- [x] Detect `disconnect`.
- [x] Determine whether session is waiting.
- [x] Remove from queue if waiting.
- [x] Determine whether session is in a room.
- [x] notify partner if necessary.
- [x] remove room.
- [x] clear room references.
- [x] remove session.
- [x] log operational event.

### Done when

A disconnected client leaves no stale runtime state.

---

# TASK GROUP 06 — Matchmaking

## TASK-14 — Implement WaitingQueue

### Objective

Create efficient waiting queue operations.

### Subtasks

- [x] Implement add.
- [x] Implement remove.
- [x] Implement contains.
- [x] Implement random item retrieval.
- [x] Maintain session-to-index mapping.
- [x] Prevent duplicates.
- [x] Handle stale session IDs.

### Done when

Queue operations preserve all invariants in `schema.md`.

---

## TASK-15 — Implement MatchmakingService

### Objective

Implement random one-to-one matchmaking.

### Subtasks

- [x] Accept a session + mode.
- [x] Add session to correct queue.
- [x] Check whether two eligible sessions exist.
- [x] Randomly select two different users.
- [x] Remove both from queue.
- [x] Create room.
- [x] Assign initiator.
- [x] Update both sessions.
- [x] Return match information.

### Rules

- Text only matches Text.
- Video only matches Video.
- A matched user cannot remain in the queue.
- A session cannot match with itself.
- Client cannot determine partner.
- Client cannot determine room membership.

---

## TASK-16 — Implement `match:find`

### Objective

Connect the client matchmaking request to the service.

### Subtasks

- [x] Validate payload.
- [x] Verify session exists.
- [x] Reject duplicate search attempts.
- [x] Call `MatchmakingService`.
- [x] Emit `match:searching` when no match exists.
- [x] Emit `match:found` to both users when matched.

---

## TASK-17 — Implement `match:cancel`

### Objective

Allow a searching user to leave the queue.

### Subtasks

- [x] Validate mode.
- [x] Verify session state.
- [x] Remove from appropriate queue.
- [x] Change status to `IDLE`.
- [x] Emit any required client state update.

---

# TASK GROUP 07 — Room Management

## TASK-18 — Implement RoomService

### Objective

Create the authoritative one-to-one room lifecycle.

### Subtasks

- [x] Generate secure room ID.
- [x] Create room with two members.
- [x] Store mode.
- [x] Assign initiator.
- [x] Lookup room.
- [x] Lookup partner.
- [x] Remove room.
- [x] Clear session room references.
- [x] Prevent invalid room creation.

### Done when

Room invariants from `schema.md` remain true after every operation.

---

## TASK-19 — Implement Partner Lookup

### Objective

Provide one reliable server-side method to find a user's partner.

### Subtasks

- [x] Validate session has a room.
- [x] Retrieve room.
- [x] Return the other member.
- [x] Reject if room is invalid.
- [x] Never expose internal socket details to clients.

---

# TASK GROUP 08 — React Foundation

## TASK-20 — Create React Application Shell

### Objective

Build the minimal application UI/state shell.

### Subtasks

- [ ] Create `App.tsx`.
- [x] Add application states.
- [ ] Add landing screen.
- [ ] Add mode selection.
- [ ] Add start action.
- [ ] Add status area.
- [ ] Add error display.
- [ ] Create reusable layout.

### Required states

- [ ] Idle
- [ ] Connecting
- [ ] Searching
- [ ] Matched
- [ ] Connecting media
- [ ] In call
- [ ] Partner left
- [ ] Disconnected
- [ ] Error

---

## TASK-21 — Create Socket Client Module

### Objective

Create one controlled Socket.IO client connection.

### Subtasks

- [ ] Connect to server.
- [ ] Store socket instance in `useRef` or dedicated client module.
- [ ] Handle connection.
- [ ] Handle reconnect.
- [ ] Handle disconnect.
- [ ] Register event listeners once.
- [ ] Remove listeners during cleanup.
- [ ] Expose typed event helpers.

### Do not

Create a new socket on every React render.

---

# TASK GROUP 09 — Text Chat

## TASK-22 — Build Chat UI

### Objective

Create the text conversation interface.

### Subtasks

- [ ] Message list.
- [ ] Text input.
- [ ] Send button.
- [ ] Empty state.
- [ ] Sending state if necessary.
- [ ] Own/stranger message presentation.
- [ ] Mobile-friendly layout.

---

## TASK-23 — Implement `chat:send`

### Objective

Route text messages through the server.

### Subtasks

- [ ] Client validates basic input.
- [ ] Client sends `chat:send`.
- [x] Server validates payload.
- [x] Server verifies active room.
- [x] Server verifies sender membership.
- [x] Server checks maximum message length.
- [x] Server generates message ID.
- [x] Server generates timestamp.
- [x] Server forwards only to room partner.
- [ ] Client renders received message.

### Security requirement

Never trust the room ID provided by the client.

The server must verify it.

---

## TASK-24 — Add Chat Rate Limiting

### Objective

Prevent message flooding.

### Subtasks

- [x] Create per-session in-memory rate limiter.
- [x] Configure reasonable initial threshold.
- [x] Reject excessive bursts.
- [x] Return stable error code.
- [x] Avoid introducing Redis or external services.

---

# TASK GROUP 10 — Next / Leave

## TASK-25 — Implement `match:next`

### Objective

Allow a user to leave the current stranger and search again.

### Subtasks

- [x] Validate current room.
- [x] Verify user is a member.
- [x] Remove user from old room.
- [x] Notify partner.
- [x] Destroy old room.
- [x] Reset requester state.
- [x] Start matchmaking again.
- [x] Prevent stale events from old room.

---

## TASK-26 — Implement `session:leave`

### Objective

Provide a clean session termination path.

### Subtasks

- [x] Remove from queue if searching.
- [x] Leave room if matched.
- [x] Notify partner.
- [x] Clean server state.
- [ ] Clean client chat state.
- [ ] Clean client media state.
- [ ] Return UI to idle state.

---

# TASK GROUP 11 — WebRTC Client

## TASK-27 — Create WebRTC Manager

### Objective

Create a controlled abstraction around `RTCPeerConnection`.

### Subtasks

- [ ] Create peer connection.
- [ ] Store connection in `useRef`.
- [ ] Create local stream.
- [ ] Attach local tracks.
- [ ] Handle remote track.
- [ ] Handle ICE candidates.
- [ ] Handle connection-state changes.
- [ ] Handle ICE connection-state changes.
- [ ] Implement cleanup.

### Done when

WebRTC lifecycle can be started and completely destroyed without resource leakage.

---

## TASK-28 — Request Media Permissions

### Objective

Acquire camera and microphone only for Video mode.

### Subtasks

- [ ] Call `navigator.mediaDevices.getUserMedia`.
- [ ] Request video + audio.
- [ ] Display permission failure.
- [ ] Display camera unavailable state.
- [ ] Display microphone unavailable state.
- [ ] Provide recovery path.
- [ ] Stop tracks during cleanup.

---

## TASK-29 — Add Local Video Preview

### Objective

Render the user's camera locally.

### Subtasks

- [ ] Create local `<video>` element.
- [ ] Attach MediaStream.
- [ ] Enable autoplay.
- [ ] Enable muted.
- [ ] Enable inline playback.
- [ ] Prevent unnecessary stream recreation.

---

## TASK-30 — Add Remote Video

### Objective

Render the stranger's WebRTC stream.

### Subtasks

- [ ] Handle `track`.
- [ ] Create/update remote MediaStream.
- [ ] Attach to remote `<video>`.
- [ ] Enable autoplay.
- [ ] Handle missing/ended stream.

---

# TASK GROUP 12 — WebRTC Signaling

## TASK-31 — Implement Offer Signaling

### Objective

Allow the designated initiator to send an SDP offer.

### Subtasks

- [ ] Verify initiator role.
- [ ] Create offer.
- [ ] Set local description.
- [ ] Emit `webrtc:offer`.
- [x] Validate room on server.
- [x] Forward to partner.

---

## TASK-32 — Implement Answer Signaling

### Objective

Allow receiver to answer an offer.

### Subtasks

- [ ] Receive offer.
- [ ] Verify correct room.
- [ ] Set remote description.
- [ ] Create answer.
- [ ] Set local description.
- [ ] Emit `webrtc:answer`.
- [x] Server validates and forwards.

---

## TASK-33 — Implement ICE Candidate Signaling

### Objective

Exchange ICE candidates through Socket.IO.

### Subtasks

- [ ] Listen for local candidates.
- [ ] Send candidate with room ID.
- [x] Server validates room.
- [x] Forward only to partner.
- [ ] Add remote candidate.
- [ ] Handle delayed candidate arrival safely.

---

## TASK-34 — Prevent Stale WebRTC Signals

### Objective

Prevent signals from an old room from affecting a new room.

### Subtasks

- [ ] Associate every signal with `roomId`.
- [x] Validate room server-side.
- [ ] Track active client room.
- [ ] Reject outdated client room events.
- [ ] Replace/close old RTCPeerConnection before new match.

---

# TASK GROUP 13 — Video Controls

## TASK-35 — Microphone Control

### Objective

Allow the user to mute/unmute locally.

### Subtasks

- [ ] Find local audio track.
- [ ] Toggle `enabled`.
- [ ] Update UI state.
- [ ] Reflect mute state immediately.

Do not renegotiate the entire WebRTC connection for ordinary mute/unmute.

---

## TASK-36 — Camera Control

### Objective

Allow the user to enable/disable camera transmission.

### Subtasks

- [ ] Find local video track.
- [ ] Toggle `enabled`.
- [ ] Update UI.
- [ ] Keep peer connection alive.

---

## TASK-37 — Media Connection Status

### Objective

Give the user useful feedback while WebRTC connects.

### Subtasks

- [ ] Show `Connecting media`.
- [ ] Show connected state.
- [ ] Show connection failure.
- [ ] Show reconnect/failure messaging where appropriate.
- [ ] Provide cleanup path.

---

# TASK GROUP 14 — Next + WebRTC Integration

## TASK-38 — Clean WebRTC on Next

### Objective

Ensure pressing Next cannot leave camera/microphone/peer connections alive.

### Subtasks

- [ ] Stop all local media tracks.
- [ ] Close peer connection.
- [ ] Remove media event listeners.
- [ ] Clear media refs.
- [ ] Clear remote stream.
- [ ] Reset media UI.
- [ ] Clear old room ID.
- [ ] Enter matchmaking.
- [ ] Create fresh WebRTC state for new room.

---

## TASK-39 — Clean WebRTC on Partner Disconnect

### Objective

Handle the stranger disappearing.

### Subtasks

- [ ] Receive `partner:left`.
- [ ] Close peer connection.
- [ ] Stop local tracks if leaving video session.
- [ ] Reset remote video.
- [ ] Show partner-left UI.
- [ ] Allow new matchmaking.

---

# TASK GROUP 15 — HTTPS

## TASK-40 — Add TLS Server Support

### Objective

Support secure LAN origins required for browser media access.

### Subtasks

- [ ] Add certificate path configuration.
- [ ] Add private key configuration.
- [ ] Validate files at startup.
- [ ] Start HTTPS server when configured.
- [ ] Keep development configuration simple.
- [ ] Never commit private keys.
- [ ] Document certificate setup.

---

## TASK-41 — Test Camera/Microphone on LAN

### Objective

Verify that video mode works from a real LAN device.

### Subtasks

- [ ] Start secure server.
- [ ] Open application from second machine.
- [ ] Verify secure-origin status.
- [ ] Grant camera permission.
- [ ] Grant microphone permission.
- [ ] Match two video users.
- [ ] Verify remote video.
- [ ] Verify remote audio.

---

# TASK GROUP 16 — LAN Reliability

## TASK-42 — Detect LAN Server Reachability

### Objective

Give useful feedback when the host server cannot be reached.

### Subtasks

- [ ] Detect initial connection failure.
- [ ] Show server unavailable UI.
- [ ] Attempt Socket.IO reconnection.
- [ ] Prevent endless duplicate UI states.
- [ ] Recover cleanly when server returns.

---

## TASK-43 — Server Restart Recovery

### Objective

Ensure clients recover after a host restart.

### Subtasks

- [ ] Confirm all server runtime state is discarded.
- [ ] Clients detect disconnect.
- [ ] Clients clear stale room state.
- [ ] Clients reconnect.
- [ ] Users can start a new match.
- [ ] No old room is reused.

---

## TASK-44 — Wi-Fi Disconnect Recovery

### Objective

Handle temporary connectivity loss.

### Subtasks

- [ ] Simulate LAN loss.
- [ ] Verify socket disconnect detection.
- [ ] Verify UI state.
- [ ] Reconnect when network returns.
- [ ] Ensure stale room state is not trusted.

---

# TASK GROUP 17 — Production Build

## TASK-45 — Create Production Build Pipeline

### Objective

Create the single-process production package.

### Subtasks

- [ ] Build React with Vite.
- [ ] Compile server TypeScript.
- [ ] Ensure shared code compiles.
- [ ] Ensure production assets are available.
- [ ] Ensure Node serves the assets.
- [ ] Ensure Socket.IO uses the same origin.

---

## TASK-46 — LAN Startup Experience

### Objective

Make server deployment easy.

### Subtasks

- [ ] Print local URL.
- [ ] Detect server LAN address where possible.
- [ ] Print usable LAN URL.
- [ ] Print active port.
- [ ] Print HTTP/HTTPS mode.
- [ ] Print concise startup status.
- [ ] Do not hard-code a specific LAN IP.

Example:

```
LAN Stranger Chat
Server running

Local: http://localhost:3000
LAN:   http://192.168.x.x:3000
```

---

# TASK GROUP 18 — UI Polish

## TASK-47 — Responsive Layout

### Objective

Make the application usable on desktop and mobile browsers.

### Subtasks

- [ ] Test mobile portrait.
- [ ] Test mobile landscape.
- [ ] Test tablet.
- [ ] Test desktop.
- [ ] Prevent viewport overflow.
- [ ] Keep chat controls accessible.
- [ ] Keep video controls reachable.
- [ ] Prevent keyboard from breaking mobile chat layout.
- [ ] Handle safe-area spacing where required.

---

## TASK-48 — Matchmaking UX

### Objective

Make matchmaking state unambiguous.

### Subtasks

- [ ] Show searching state.
- [ ] Show connected state.
- [ ] Show partner-left state.
- [ ] Show reconnecting state.
- [ ] Prevent duplicate Start buttons while searching.
- [ ] Disable invalid actions based on state.

---

## TASK-49 — Video UX

### Objective

Make one-to-one video understandable.

### Subtasks

- [ ] Remote video is visually primary.
- [ ] Local preview is visually secondary.
- [ ] Mute control.
- [ ] Camera control.
- [ ] Next control.
- [ ] Leave control.
- [ ] Camera/mic permission error UI.
- [ ] Connection error UI.

---

## TASK-50 — Chat UX

### Objective

Make text messaging usable alongside video.

### Subtasks

- [ ] Message list scroll behavior.
- [ ] Input remains accessible.
- [ ] Enter-to-send behavior where appropriate.
- [ ] Prevent blank-message submission.
- [ ] Character-limit feedback.
- [ ] Clear chat when a new room begins.

---

# TASK GROUP 19 — Testing

## TASK-51 — Unit Test Matchmaking

### Subtasks

- [ ] One user remains waiting.
- [ ] Two users become matched.
- [ ] Three users produce one pair + one waiting user.
- [ ] Four users produce two pairs.
- [ ] Text and Video queues remain isolated.
- [ ] Duplicate queue insertion is rejected.
- [ ] Disconnected waiting user is removed.
- [ ] Self-match never occurs.

---

## TASK-52 — Unit Test Room Lifecycle

### Subtasks

- [ ] Room creation.
- [ ] Room lookup.
- [ ] Partner lookup.
- [ ] Invalid room rejection.
- [ ] Room destruction.
- [ ] Session room cleanup.
- [ ] Duplicate membership prevention.

---

## TASK-53 — Unit Test Validation

### Subtasks

- [ ] Invalid mode.
- [ ] Missing room ID.
- [ ] Oversized message.
- [ ] Invalid WebRTC payload.
- [ ] Unknown payload properties where strict validation is appropriate.
- [ ] Unauthorized room event.

---

## TASK-54 — Integration Test Text Chat

### Subtasks

- [ ] Connect A.
- [ ] Connect B.
- [ ] Match A/B.
- [ ] Send message A → B.
- [ ] Verify B receives.
- [ ] Verify unrelated C does not receive.
- [ ] Verify oversized message is rejected.

---

## TASK-55 — Integration Test Next

### Subtasks

- [ ] Match A/B.
- [ ] A presses Next.
- [ ] B receives partner-left.
- [ ] Old room is destroyed.
- [ ] A returns to searching.
- [ ] A can match C.
- [ ] Old signaling/messages are rejected.

---

## TASK-56 — Real LAN Test

### Subtasks

- [ ] Host PC.
- [ ] Second PC.
- [ ] Android phone.
- [ ] Browser A.
- [ ] Browser B.
- [ ] Browser C.
- [ ] Text mode.
- [ ] Video mode.
- [ ] Next.
- [ ] Leave.
- [ ] Browser refresh.
- [ ] Network disconnect.

---

# TASK GROUP 20 — Security Hardening

## TASK-57 — Validate All Client Actions

### Subtasks

- [ ] Validate session state.
- [ ] Validate mode.
- [ ] Validate room membership.
- [ ] Validate room status.
- [ ] Validate message length.
- [ ] Validate WebRTC signal.
- [ ] Reject unauthorized operations.

---

## TASK-58 — Protect Chat Rendering

### Subtasks

- [ ] Render message as text.
- [ ] Never use `dangerouslySetInnerHTML`.
- [ ] Verify strings containing HTML remain harmless.
- [ ] Verify script-like strings are displayed as text.

---

## TASK-59 — Operational Logging

### Subtasks

- [ ] Log connection.
- [ ] Log disconnect.
- [ ] Log room creation.
- [ ] Log room destruction.
- [ ] Log major server errors.
- [ ] Do not log message content.
- [ ] Do not log media.
- [ ] Avoid logging complete SDP unnecessarily.

---

# TASK GROUP 21 — Final Verification

## TASK-60 — Automated Verification

Run:

- [ ] TypeScript check.
- [ ] ESLint.
- [ ] Unit tests.
- [ ] Production build.
- [ ] Production server startup test.

Nothing should fail.

---

## TASK-61 — Manual MVP Verification

Verify the complete flow:

```text
Open LAN URL
    ↓
Choose mode
    ↓
Start
    ↓
Searching
    ↓
Random match
    ↓
Text chat
    ↓
Video/audio in Video mode
    ↓
Next
    ↓
Old room destroyed
    ↓
Searching again
    ↓
New match
    ↓
Leave
```

### Verify all failure paths

- [ ] No partner available.
- [ ] Partner disconnects.
- [ ] Client disconnects.
- [ ] Server restarts.
- [ ] Camera denied.
- [ ] Microphone denied.
- [ ] LAN connection lost.
- [ ] Invalid socket payload.
- [ ] Oversized chat message.
- [ ] Stale room event.
- [ ] Stale WebRTC signal.

---

# TASK GROUP 22 — Documentation

## TASK-62 — Write README

### Include

- [ ] Project purpose.
- [ ] Architecture summary.
- [ ] Requirements.
- [ ] Installation.
- [ ] Development commands.
- [ ] Production build.
- [ ] LAN deployment.
- [ ] HTTPS/video setup.
- [ ] Firewall notes.
- [ ] Wi-Fi client-isolation warning.
- [ ] Troubleshooting.
- [ ] Testing instructions.

---

# FINAL DEFINITION OF DONE

The project may be considered MVP-complete only when every item below is true:

- [ ] One Node.js process can host the production application.
- [ ] React frontend loads from the Node server.
- [ ] LAN clients can connect.
- [ ] Socket.IO connection works.
- [ ] Anonymous session creation works.
- [ ] Random matchmaking works.
- [ ] Text mode works.
- [ ] Video mode works.
- [ ] Audio works.
- [ ] Camera controls work.
- [ ] Microphone controls work.
- [ ] Text chat works inside video rooms.
- [ ] Next works.
- [ ] Leave works.
- [ ] Partner disconnect works.
- [ ] Browser refresh is handled.
- [ ] Server restart is recoverable.
- [ ] WebRTC uses peer-to-peer media.
- [ ] Node does not relay video/audio.
- [ ] No database is required.
- [ ] No cloud service is required.
- [ ] No internet connection is required for the core LAN use case.
- [ ] HTTPS works for LAN video mode.
- [ ] Server validates all room-scoped operations.
- [ ] Stale room/WebRTC events are rejected.
- [ ] TypeScript passes.
- [ ] Lint passes.
- [ ] Tests pass.
- [ ] Production build passes.
- [ ] Real multi-device LAN testing passes.
