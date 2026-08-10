import http from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import dns from 'dns';
import app from './app.js';
import { connectDB } from './config/db.js';
import chatSocket from './sockets/chatSocket.js';

// Force IPv4 first resolution for localhost connection issues on Windows
dns.setDefaultResultOrder('ipv4first');

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 5000;

// Build allowed origins list (same logic as app.js CORS)
const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map((o) => o.trim())
  : ['http://localhost:5173'];

// Initialize HTTP server
const server = http.createServer(app);

// Initialize Socket.io server with CORS policy
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000
});

// Configure Socket.io event listeners
chatSocket(io);

// Connect to MongoDB and start server
const startServer = async () => {
  await connectDB();
  
  server.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    console.log(`Socket.io CORS configured for origins: ${allowedOrigins.join(', ')}`);
  });
};

// Handle process termination gracefully
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated.');
    process.exit(0);
  });
});

startServer();
