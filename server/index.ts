import express from 'express';
import http from 'http';
import https from 'https';
import fs from 'fs';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import { ClientToServerEvents, ServerToClientEvents } from '@shared/events.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const HOST = process.env.HOST || '0.0.0.0';

const app = express();

let server;
if (process.env.TLS_CERT_FILE && process.env.TLS_KEY_FILE) {
  const privateKey = fs.readFileSync(process.env.TLS_KEY_FILE, 'utf8');
  const certificate = fs.readFileSync(process.env.TLS_CERT_FILE, 'utf8');
  server = https.createServer({ key: privateKey, cert: certificate }, app);
} else {
  server = http.createServer(app);
}

const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Basic HTTP health endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'lan-stranger-chat' });
});

// Serve React static files in production
const clientDistPath = path.join(__dirname, '../../dist/client');
app.use(express.static(clientDistPath));

app.use((req, res) => {
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

import { setupConnection } from './socket/connection.js';

setupConnection(io);

// Graceful shutdown
const shutdown = () => {
  console.log('\nShutting down server...');
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

server.listen(PORT, HOST, () => {
  console.log(`========================================`);
  console.log(`🚀 LAN Stranger Chat Server running!`);
  console.log(`👉 Local: http://localhost:${PORT}`);
  console.log(`👉 LAN:   http://${HOST === '0.0.0.0' ? '<YOUR_LOCAL_IP>' : HOST}:${PORT}`);
  console.log(`========================================`);
});
