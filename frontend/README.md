# PulseChat Frontend Client

This is the React frontend for the Real-Time Chat Application, built with React, Vite, Axios, and Socket.io-client.

## Features

- **Welcome / Login Screen:** Trimmed input validation with custom alphanumeric error blocks.
- **Glassmorphic Theme:** Dark high-contrast styling using HSL custom properties, CSS animations, and smooth transitions.
- **WebSocket State Providers:** Unified state sync via React Context API, with connection state tracking and reconnection safeguards.
- **Real-Time Typists:** Real-time updates when other users start and stop typing.
- **Message Read Indicators:** Dynamic message status checkmarks showing sent (`✓`) and read (`✓✓` in blue) states.
- **Persistence Layer:** Restores active session credentials from local storage on reload.

## Setup Instructions

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables in `.env` (copied from `.env.example`):
   ```env
   VITE_API_URL=http://localhost:5000/api
   VITE_SOCKET_URL=http://localhost:5000
   ```

3. Launch development server:
   ```bash
   npm run dev
   ```

4. Build client files for production:
   ```bash
   npm run build
   ```

## Folder Structure

- `src/components/` - Sub-elements (Status badges, Login card, Chat board)
- `src/context/` - Global states (Context wrapping Socket and history APIs)
- `src/services/` - External interfaces (Centralized Axios and Socket modules)
- `src/utils/` - Utilities (Time formatting helper)
- `src/index.css` - Custom variables and global CSS layout properties
