import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import messageRoutes from './routes/messageRoutes.js';
import healthRoutes from './routes/healthRoutes.js';

// Load environment variables EARLY — ES module imports are hoisted,
// so dotenv.config() in server.js runs AFTER this module executes.
// Without this, process.env.CLIENT_URL is undefined here.
dotenv.config();

const app = express();

// Build allowed origins list (supports comma-separated CLIENT_URL for multiple frontends)
const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map((o) => o.trim())
  : ['http://localhost:5173'];

console.log('[CORS] Allowed origins:', allowedOrigins);

// CORS middleware configuration with dynamic origin checking
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (server-to-server, curl, health checks)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    console.warn(`[CORS] Blocked request from origin: ${origin}`);
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routing registration
app.use('/api/messages', messageRoutes);
app.use('/api/health', healthRoutes);

// Catch-all route handler for undefined routes
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: 'Resource not found' });
});

// Centralized error handler
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  res.status(500).json({
    success: false,
    message: 'An unexpected error occurred on the server'
  });
});

export default app;
