import express from 'express';
import cors from 'cors';
import messageRoutes from './routes/messageRoutes.js';
import healthRoutes from './routes/healthRoutes.js';

const app = express();

// CORS middleware configuration
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
app.use(cors({
  origin: clientUrl,
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
