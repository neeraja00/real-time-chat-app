import Message from '../models/Message.js';

// Map of socket.id -> username
const onlineUsers = new Map();

// Set of socket.ids that are currently typing
const typingUsers = new Map(); // socket.id -> username

export default function chatSocket(io) {
  io.on('connection', (socket) => {
    console.log(`[Socket] connected: ${socket.id}`);

    // Helpers to get list of unique online usernames
    const getUniqueUsers = () => {
      return Array.from(new Set(onlineUsers.values()));
    };

    // Helper to send error to client
    const sendSocketError = (errorMsg) => {
      socket.emit('error:occurred', { message: errorMsg });
    };

    // Handle user join
    socket.on('user:join', (data) => {
      try {
        if (!data || !data.username || typeof data.username !== 'string') {
          return sendSocketError('Invalid or missing username');
        }

        const username = data.username.trim();

        if (username.length === 0) {
          return sendSocketError('Username cannot be empty');
        }
        if (username.length > 50) {
          return sendSocketError('Username is too long (max 50 chars)');
        }

        // Register user
        onlineUsers.set(socket.id, username);
        console.log(`[Socket] user joined: ${username}`);
        console.log(`[Socket] online users: ${getUniqueUsers().length}`);

        // Broadcast updated online users list
        io.emit('users:update', getUniqueUsers());
      } catch (err) {
        console.error('Error in user:join:', err);
        sendSocketError('Internal server error during join');
      }
    });

    // Handle message send
    socket.on('message:send', async (data) => {
      try {
        if (!data) {
          return sendSocketError('Message payload is empty');
        }

        let { username, message } = data;

        if (!username || typeof username !== 'string') {
          return sendSocketError('Username is required');
        }
        if (!message || typeof message !== 'string') {
          return sendSocketError('Message content is required');
        }

        username = username.trim();
        message = message.trim();

        if (username.length === 0) {
          return sendSocketError('Username cannot be empty');
        }
        if (username.length > 50) {
          return sendSocketError('Username is too long (max 50 chars)');
        }
        if (message.length === 0) {
          return sendSocketError('Message cannot be empty');
        }
        if (message.length > 2000) {
          return sendSocketError('Message is too long (max 2000 chars)');
        }

        // Validate socket registration
        const registeredName = onlineUsers.get(socket.id);
        if (!registeredName || registeredName !== username) {
          // If socket disconnected and reconnected, automatically register them
          onlineUsers.set(socket.id, username);
          console.log(`[Socket] user re-registered via message:send: ${username}`);
          console.log(`[Socket] online users: ${getUniqueUsers().length}`);
          io.emit('users:update', getUniqueUsers());
        }

        // Save message exactly once to MongoDB
        const newMessage = new Message({
          username,
          message,
          status: 'sent',
          readBy: []
        });

        const savedMessage = await newMessage.save();

        // Broadcast the new message to all connected clients
        io.emit('message:new', savedMessage);
      } catch (err) {
        console.error('Error saving or broadcasting message:', err);
        sendSocketError('Failed to send message: database or server error');
      }
    });

    // Handle typing start
    socket.on('typing:start', () => {
      try {
        const username = onlineUsers.get(socket.id);
        if (username) {
          typingUsers.set(socket.id, username);
          console.log(`[Socket] typing:start: ${username}`);
          
          // Broadcast to all OTHER clients
          socket.broadcast.emit('typing:update', Array.from(new Set(typingUsers.values())));
        }
      } catch (err) {
        console.error('Error in typing:start:', err);
      }
    });

    // Handle typing stop
    socket.on('typing:stop', () => {
      try {
        const username = onlineUsers.get(socket.id);
        if (typingUsers.has(socket.id)) {
          typingUsers.delete(socket.id);
          if (username) {
            console.log(`[Socket] typing:stop: ${username}`);
          }
          
          // Broadcast to all OTHER clients
          socket.broadcast.emit('typing:update', Array.from(new Set(typingUsers.values())));
        }
      } catch (err) {
        console.error('Error in typing:stop:', err);
      }
    });

    // Handle message read
    socket.on('message:read', async (data) => {
      try {
        if (!data || !data.messageId || !data.username) {
          return;
        }

        const { messageId, username } = data;
        const msg = await Message.findById(messageId);

        if (msg) {
          // Only update if the user isn't the sender and hasn't already read it
          if (msg.username !== username && !msg.readBy.includes(username)) {
            msg.readBy.push(username);
            msg.status = 'read';
            await msg.save();

            // Broadcast the read status update to all clients
            io.emit('message:read', {
              messageId: msg._id,
              status: msg.status,
              readBy: msg.readBy
            });
          }
        }
      } catch (err) {
        console.error('Error updating read status:', err);
      }
    });

    // Handle user disconnect
    socket.on('disconnect', () => {
      try {
        console.log(`[Socket] disconnected: ${socket.id}`);
        const username = onlineUsers.get(socket.id);
        if (username) {
          onlineUsers.delete(socket.id);
          typingUsers.delete(socket.id);
          
          console.log(`[Socket] user left: ${username}`);
          console.log(`[Socket] online users: ${getUniqueUsers().length}`);

          // Broadcast updated user list
          io.emit('users:update', getUniqueUsers());
          
          // Broadcast updated typing status
          socket.broadcast.emit('typing:update', Array.from(new Set(typingUsers.values())));
        } else {
          console.log(`[Socket] online users: ${getUniqueUsers().length}`);
        }
      } catch (err) {
        console.error('Error in socket disconnect:', err);
      }
    });
  });
}
