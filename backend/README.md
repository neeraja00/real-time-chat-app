# Chat App Backend

This is the backend server for the Real-Time Chat Application, built with Node.js, Express, Socket.io, and MongoDB.

## Features

- **REST API endpoints:** Health checks, message history retrieval, and fallback message creation.
- **Real-Time Communication:** Direct Socket.io bindings for messaging, typing states, online users tracking, and status checkmarks.
- **Database Persistence:** Persistent storage using MongoDB and Mongoose.
- **Graceful Error Handling:** Try/catch wrappers on all database queries and socket payloads to prevent process termination.

## Setup Instructions

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables in `.env` (copied from `.env.example`):
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/chat_app
   CLIENT_URL=http://localhost:5173
   ```

3. Launch server in development mode:
   ```bash
   npm run dev
   ```

4. Run production server:
   ```bash
   npm start
   ```

## REST API Endpoints

- `GET /api/health` - Health check status
- `GET /api/messages` - Retrieve latest 100 chat messages chronologically
- `POST /api/messages` - Store a new message (REST fallback/testing)

## Socket.io Event Triggers

- `user:join` - Registers username, triggers user list updates
- `message:send` - Receives incoming chat messages, writes to DB, broadcasts to all
- `typing:start` / `typing:stop` - Notifies other users of active input typing state
- `message:read` - Receives a seen indicator for a message, saves and broadcasts the status update
- `users:update` - Broadcasts list of currently online unique usernames
- `message:new` - Broadcasts newly received chat message
- `typing:update` - Broadcasts list of active typists
