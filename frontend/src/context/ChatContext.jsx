import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { socket } from '../services/socket';
import { apiService } from '../services/api';

const ChatContext = createContext(null);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider = ({ children }) => {
  const [username, setUsername] = useState(() => sessionStorage.getItem('username') || '');
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState(null);
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, [removeToast]);

  const prevConnectionStatusRef = useRef(connectionStatus);
  useEffect(() => {
    const prev = prevConnectionStatusRef.current;
    prevConnectionStatusRef.current = connectionStatus;

    if (connectionStatus === 'connected') {
      if (prev === 'disconnected' || prev === 'connecting') {
        addToast('Connected to chat server', 'success');
      }
    } else if (connectionStatus === 'disconnected' && prev === 'connected') {
      addToast('Connection lost. Reconnecting...', 'error');
    }
  }, [connectionStatus, addToast]);

  // Use refs to keep track of current values in socket callbacks to avoid re-binding listeners
  const usernameRef = useRef(username);
  useEffect(() => {
    usernameRef.current = username;
  }, [username]);

  // Fetch message history from REST API
  const fetchHistory = useCallback(async () => {
    setLoadingMessages(true);
    setError(null);
    try {
      const history = await apiService.getMessages();
      setMessages(history);
    } catch (err) {
      console.error('Failed to load chat history:', err);
      setError('Could not load previous messages. Server might be down.');
      addToast('Failed to load chat history. Server might be down.', 'error');
    } finally {
      setLoadingMessages(false);
    }
  }, [addToast]);

  // Send message via Socket.io
  const sendMessage = useCallback((messageContent) => {
    if (!messageContent || !messageContent.trim()) return;
    
    const payload = {
      username: usernameRef.current,
      message: messageContent.trim()
    };

    socket.emit('message:send', payload);
  }, []);

  // Emit typing indicators
  const sendTypingStart = useCallback(() => {
    socket.emit('typing:start');
  }, []);

  const sendTypingStop = useCallback(() => {
    socket.emit('typing:stop');
  }, []);

  // Mark message as read
  const markMessageAsRead = useCallback((messageId) => {
    if (!messageId || !usernameRef.current) return;
    socket.emit('message:read', { messageId, username: usernameRef.current });
  }, []);

  // Join the chat room
  const joinChat = useCallback(async (newUser) => {
    const trimmedUser = newUser.trim();
    setUsername(trimmedUser);
    sessionStorage.setItem('username', trimmedUser);
    
    // Connect socket
    socket.connect();
    
    // Fetch history
    await fetchHistory();
  }, [fetchHistory]);

  // Logout/leave chat
  const logoutChat = useCallback(() => {
    sendTypingStop();
    socket.disconnect();
    setUsername('');
    setMessages([]);
    setOnlineUsers([]);
    setTypingUsers([]);
    sessionStorage.removeItem('username');
  }, [sendTypingStop]);

  // Set up socket listeners
  useEffect(() => {
    // If username exists in sessionStorage on startup, connect automatically
    const initialUsername = usernameRef.current;
    if (initialUsername) {
      setConnectionStatus('connecting');
      socket.connect();
      // Fetch initial history
      fetchHistory();
    }

    const onConnect = () => {
      setConnectionStatus('connected');
      setError(null);
    };

    const onDisconnect = (reason) => {
      console.log('Socket disconnected:', reason);
      setConnectionStatus('disconnected');
      
      if (reason === 'io server disconnect') {
        // the disconnection was initiated by the server, need to reconnect manually
        socket.connect();
      }
    };

    const onConnectError = (err) => {
      console.error('Socket connection error:', err);
      setConnectionStatus('disconnected');
      setError('Chat server connection offline. Attempting to reconnect...');
    };

    const onUsersUpdate = (users) => {
      setOnlineUsers(users);
    };

    const onMessageNew = (newMsg) => {
      setMessages((prev) => {
        // Prevent duplicate messages if the message is already in state
        if (prev.some((m) => m._id === newMsg._id)) {
          return prev;
        }
        return [...prev, newMsg];
      });

      // If we are not the sender of this new message, mark it as read immediately
      if (newMsg.username !== usernameRef.current) {
        socket.emit('message:read', { messageId: newMsg._id, username: usernameRef.current });
      }
    };

    const onTypingUpdate = (typists) => {
      // Filter out our own name from the typists list
      const otherTypists = typists.filter((user) => user !== usernameRef.current);
      setTypingUsers(otherTypists);
    };

    const onMessageRead = ({ messageId, status, readBy }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === messageId ? { ...msg, status, readBy } : msg
        )
      );
    };

    const onErrorOccurred = (errData) => {
      console.warn('Socket error received:', errData);
      const errMsg = errData.message || 'An error occurred during transaction';
      setError(errMsg);
      addToast(errMsg, 'error');
    };

    // Bind event listeners
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);
    socket.on('users:update', onUsersUpdate);
    socket.on('message:new', onMessageNew);
    socket.on('typing:update', onTypingUpdate);
    socket.on('message:read', onMessageRead);
    socket.on('error:occurred', onErrorOccurred);

    // If socket is already connected from a previous render
    if (socket.connected) {
      onConnect();
    }

    // Cleanup listeners on unmount
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
      socket.off('users:update', onUsersUpdate);
      socket.off('message:new', onMessageNew);
      socket.off('typing:update', onTypingUpdate);
      socket.off('message:read', onMessageRead);
      socket.off('error:occurred', onErrorOccurred);
    };
  }, [fetchHistory, addToast]);

  // Emit user:join whenever connection is established and username is present
  useEffect(() => {
    if (connectionStatus === 'connected' && username) {
      socket.emit('user:join', { username });
    }
  }, [connectionStatus, username]);

  const value = {
    username,
    messages,
    onlineUsers,
    typingUsers,
    connectionStatus,
    loadingMessages,
    error,
    setError,
    toasts,
    addToast,
    removeToast,
    sendMessage,
    sendTypingStart,
    sendTypingStop,
    markMessageAsRead,
    joinChat,
    logoutChat,
    fetchHistory
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
