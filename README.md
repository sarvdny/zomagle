# LAN Stranger Chat

LAN Stranger Chat is an anonymous, random one-to-one text and video chat application designed to run entirely on a Local Area Network (LAN) without internet access.

## Architecture Summary
- **Frontend**: React (Vite), TypeScript.
- **Backend**: Node.js, Express, Socket.IO.
- **Media**: Native WebRTC (Peer-to-Peer).
- **State**: In-memory (no database required).

The application is served by a single Node.js process which also manages Socket.IO realtime connections for matchmaking, chat routing, and WebRTC signaling.

## Requirements
- Node.js (v18+ recommended)
- NPM

## Installation
```bash
npm install
```

## Development
To start the Vite dev server and Node server concurrently:
```bash
npm run dev
```

## Production Build & Deployment
1. Build the frontend and backend:
   ```bash
   npm run build
   ```
2. Start the production server:
   ```bash
   npm run start
   ```

## LAN Deployment & HTTPS/Video Setup
Video and Audio permissions in modern browsers require a **Secure Context (HTTPS)** unless you are connecting to `localhost`. 
To deploy on a LAN with Video support, you must generate a TLS certificate and pass it to the server.

Set the following environment variables (or create a `.env` file based on `.env.example`):
```
TLS_CERT_FILE=/path/to/certificate.pem
TLS_KEY_FILE=/path/to/private-key.pem
PORT=3000
HOST=0.0.0.0
```

Start the server: `npm run start`. It will bind to `0.0.0.0` and be accessible across your LAN.

## Firewall & Network Notes
- **Firewall**: Ensure the host machine's firewall allows incoming connections on the configured `PORT` (default `3000`).
- **Wi-Fi Client Isolation**: Some guest Wi-Fi networks enable "Client Isolation" (AP Isolation), which prevents devices on the same network from communicating with each other. This must be disabled for peer-to-peer WebRTC and LAN access to work.

## Troubleshooting
- **Cannot access camera/mic**: Ensure you are connecting via `https://` (or `localhost`). 
- **Server unreachable**: Check your Windows/Mac firewall settings and ensure Node.js is allowed on private networks.
- **Video fails to connect**: Ensure both devices can ping each other directly over the LAN. If Client Isolation is on, WebRTC will fail to establish a direct connection.

## Testing
Run the test suite using:
```bash
npm run test
```
