# PRD — LAN Stranger Chat

## 1. Product Definition

### Working title
LAN Stranger Chat

### Product type
LAN-only anonymous random text/video chat application.

### Core concept
Users connected to the same local network open the application from a browser. A centralized Node.js server maintains matchmaking, creates one-to-one rooms, routes text messages, and handles WebRTC signaling.

Actual audio/video media is transferred peer-to-peer between matched browsers using WebRTC.

### Primary deployment model
One machine acts as the LAN host/server.

Example:

    Server: 192.168.1.100:3000
    Client A: browser
    Client B: browser
    Client C: browser

All clients access the server through the LAN.

The application must not require internet connectivity during normal LAN text/video operation.

---

## 2. Product Goals

1. Allow a LAN user to anonymously enter a random one-to-one conversation.
2. Support text chat.
3. Support video + audio chat.
4. Match waiting users randomly.
5. Allow a user to skip the current stranger and immediately search again.
6. Correctly handle disconnects, refreshes, network failures, and abandoned rooms.
7. Keep the architecture simple enough to run from one LAN-host machine.
8. Avoid persistent storage in the MVP.
9. Avoid unnecessary cloud infrastructure.
10. Keep the media path peer-to-peer rather than relaying video through the Node server.

---

## 3. User Modes

### Text mode
User enters matchmaking and receives a random stranger.

The session contains:
- text chat
- Next
- Leave

### Video mode
User enters matchmaking for a random stranger.

The session contains:
- local camera preview
- remote camera stream
- microphone
- camera
- text chat
- Next
- Leave

Video mode must still support text messaging.

The MVP does not implement a separate audio-only mode.

---

## 4. User Flow

### Entry
1. User opens the LAN URL.
2. Application checks Socket.IO connectivity.
3. User selects Text or Video mode.
4. User presses `Start`.

### Matchmaking
1. Client sends `match:find`.
2. Server places the session into the appropriate waiting queue.
3. If fewer than two compatible users are available:
   - server emits `match:searching`
   - UI displays a searching state
4. When at least two users are available:
   - server selects two eligible users randomly
   - server creates a unique room
   - both users receive `match:found`
5. Both clients transition to the chat screen.

### Text messaging
1. User types a message.
2. Client sends `chat:send`.
3. Server verifies the sender is currently in the referenced room.
4. Server forwards the message only to the other room member.
5. Client renders the message locally and for received messages.

Messages are not persisted.

### Video connection
1. Client requests camera/microphone permission.
2. Client creates an `RTCPeerConnection`.
3. One participant is designated as WebRTC initiator by the server.
4. SDP offer/answer is exchanged through Socket.IO.
5. ICE candidates are exchanged through Socket.IO.
6. WebRTC establishes the peer connection.
7. Audio/video media flows directly between peers.

The Node server must not relay video/audio in the MVP.

### Next
1. User presses `Next`.
2. Client closes and cleans up the current WebRTC connection.
3. Server removes the user from the old room.
4. Server notifies the remaining participant with `partner:left`.
5. Old room is destroyed.
6. Requesting user enters matchmaking again.
7. A new match can be created.

### Leave
1. User presses `Leave`.
2. User is removed from matchmaking or current room.
3. Partner is notified if applicable.
4. WebRTC resources are closed.
5. User returns to the landing/idle state.

---

## 5. Core Features — MVP

### P0 — Required
- LAN-hosted application
- React frontend
- Node.js backend
- Socket.IO realtime connection
- Anonymous sessions
- Random one-to-one matchmaking
- Text chat
- Text mode
- Video mode
- Camera enable/disable
- Microphone mute/unmute
- Next
- Leave
- Partner disconnect handling
- Browser refresh/disconnect handling
- Empty queue handling
- Room lifecycle management
- WebRTC signaling
- WebRTC peer-to-peer audio/video
- Responsive desktop/mobile UI
- User-visible connection/matchmaking status
- LAN HTTPS support for video mode

### P1 — Required before MVP acceptance
- Input validation
- Message length limits
- Server-side room membership validation
- Protection against stale WebRTC signaling
- Cleanup of disconnected sessions
- Cleanup of media streams
- Basic server logging
- Error states in UI
- Reconnection handling
- LAN deployment instructions
- Manual multi-device test procedure

---

## 6. Non-Goals

Do NOT implement these in the MVP:
- User accounts
- Registration/login
- Passwords
- Database
- Persistent chat history
- Profiles
- Public usernames
- Friend system
- Followers
- Groups
- Multi-person video calls
- File sharing
- Image sharing
- Screen sharing
- Recording
- Cloud deployment
- Global internet matchmaking
- External STUN/TURN service
- AI moderation
- Recommendation system
- Interest-based matching
- Payment/subscription
- Analytics platform
- Admin dashboard
- Permanent bans
- Social graph
- SEO-oriented features

These can be considered only after the MVP is stable.

---

## 7. Functional Requirements

### FR-01 — Session creation
Every browser connection receives a server-generated opaque session identifier.

The client must never choose its authoritative session ID.

### FR-02 — Anonymous operation
No account or personally identifying profile is required.

### FR-03 — Matchmaking
Only users in compatible modes may be paired.

For MVP:
- Text users match with Text users.
- Video users match with Video users.

Do not mix modes unless explicitly changed later.

### FR-04 — Randomness
When two or more eligible users are waiting, the server chooses a random pair rather than always using FIFO order.

### FR-05 — One active room
A session may belong to at most one active room.

### FR-06 — One-to-one rooms
Every room contains exactly two users after successful matching.

### FR-07 — Server authority
The server is authoritative for:
- session status
- queue membership
- room membership
- partner state
- room lifecycle

The client must never declare itself matched.

### FR-08 — Text delivery
A chat message is routed only to the two members of the active room.

### FR-09 — Next behavior
`Next` must terminate the old session relationship before searching again.

### FR-10 — Disconnect behavior
Unexpected socket disconnect must remove the session from:
- waiting queues
- rooms
- room-related server state

### FR-11 — Video behavior
Video mode must request camera/microphone access only when required.

### FR-12 — Media cleanup
Stopping/next/leave/disconnect must stop local media tracks and close the associated RTCPeerConnection.

---

## 8. UX States

The UI must represent these states explicitly:
- `IDLE`
- `CONNECTING`
- `SEARCHING`
- `MATCHED`
- `CONNECTING_MEDIA`
- `IN_CALL`
- `PARTNER_LEFT`
- `DISCONNECTED`
- `ERROR`

Do not represent these states using loosely related booleans that can create impossible combinations.

---

## 9. MVP Success Criteria

The MVP is complete only when:
1. Two devices on the same LAN can open the application.
2. They can enter the same supported mode.
3. They are automatically matched.
4. They can exchange realtime text messages.
5. Video mode can establish camera/audio communication.
6. Video does not pass through the Node server.
7. Either user can press Next.
8. The remaining user receives a clear partner-left state.
9. A new match can then be established.
10. Browser refresh/disconnect does not permanently poison the queue.
11. Multiple simultaneous users can be matched into separate rooms.
12. Restarting the server correctly resets all runtime state.
