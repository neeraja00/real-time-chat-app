import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

// Initialize the socket client instance, but do not connect automatically
export const socket = io(SOCKET_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionDelay: 2000,
  reconnectionAttempts: 15,
  timeout: 20000,
  transports: ['websocket', 'polling'],
  withCredentials: true
});

// For easier logging of all client-side socket events in development mode
if (import.meta.env.DEV) {
  socket.onAny((eventName, ...args) => {
    console.log(`[SocketEvent] ${eventName}`, args);
  });
}
