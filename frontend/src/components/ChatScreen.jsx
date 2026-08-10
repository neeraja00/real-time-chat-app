import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Users, LogOut, Check, CheckCheck, MessageCircle, AlertTriangle, RefreshCw, ChevronDown, X } from 'lucide-react';
import { useChat } from '../context/ChatContext';
import { formatChatTime } from '../utils/dateFormatter';
import StatusIndicator from './StatusIndicator';

const SCROLL_THRESHOLD = 120; // px from bottom to auto-scroll

const ChatScreen = () => {
  const {
    username,
    messages,
    onlineUsers,
    typingUsers,
    connectionStatus,
    loadingMessages,
    error,
    setError,
    toasts,
    removeToast,
    sendMessage,
    sendTypingStart,
    sendTypingStop,
    logoutChat,
    fetchHistory
  } = useChat();

  const [messageText, setMessageText] = useState('');
  const [mobileUsersOpen, setMobileUsersOpen] = useState(false);
  const [newMsgCount, setNewMsgCount] = useState(0);
  const [showConnectionBanner, setShowConnectionBanner] = useState(false);
  const [connectionBannerType, setConnectionBannerType] = useState('');

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);
  const prevMessageCountRef = useRef(0);
  const isNearBottomRef = useRef(true);
  const prevConnectionRef = useRef(connectionStatus);
  const connectionBannerTimerRef = useRef(null);

  // Determine if user is near the bottom of the scroll area
  const checkNearBottom = useCallback(() => {
    const el = messagesContainerRef.current;
    if (!el) return true;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    return distFromBottom <= SCROLL_THRESHOLD;
  }, []);

  // Scroll to bottom
  const scrollToBottom = useCallback((smooth = true) => {
    const el = messagesContainerRef.current;
    if (!el) return;
    el.scrollTo({
      top: el.scrollHeight,
      behavior: smooth ? 'smooth' : 'auto'
    });
    setNewMsgCount(0);
  }, []);

  // Handle scroll events to track position
  const handleScroll = useCallback(() => {
    isNearBottomRef.current = checkNearBottom();
    if (isNearBottomRef.current) {
      setNewMsgCount(0);
    }
  }, [checkNearBottom]);

  // Smart scroll on new messages
  useEffect(() => {
    const currentCount = messages.length;
    const prevCount = prevMessageCountRef.current;

    if (currentCount > prevCount) {
      const newCount = currentCount - prevCount;
      const latestMsg = messages[currentCount - 1];
      const isOwnMessage = latestMsg && latestMsg.username === username;

      if (isOwnMessage || isNearBottomRef.current) {
        // Auto scroll for own messages or when near bottom
        setTimeout(() => scrollToBottom(true), 30);
      } else {
        // User scrolled up — show indicator
        setNewMsgCount((prev) => prev + newCount);
      }
    }

    prevMessageCountRef.current = currentCount;
  }, [messages, username, scrollToBottom]);

  // Initial scroll when loading completes
  useEffect(() => {
    if (!loadingMessages && messages.length > 0) {
      setTimeout(() => scrollToBottom(false), 50);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingMessages]);

  // Connection status banner
  useEffect(() => {
    const prev = prevConnectionRef.current;
    prevConnectionRef.current = connectionStatus;

    if (connectionBannerTimerRef.current) {
      clearTimeout(connectionBannerTimerRef.current);
    }

    if (connectionStatus === 'disconnected' && prev === 'connected') {
      setConnectionBannerType('disconnected');
      setShowConnectionBanner(true);
    } else if (connectionStatus === 'connected' && prev !== 'connected') {
      // Only show "reconnected" if we were previously disconnected (not initial connect)
      if (prev === 'disconnected') {
        setConnectionBannerType('reconnected');
        setShowConnectionBanner(true);
        connectionBannerTimerRef.current = setTimeout(() => {
          setShowConnectionBanner(false);
        }, 3000);
      } else {
        setShowConnectionBanner(false);
      }
    }
  }, [connectionStatus]);

  // Clean up typing timers on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (isTypingRef.current) sendTypingStop();
      if (connectionBannerTimerRef.current) clearTimeout(connectionBannerTimerRef.current);
    };
  }, [sendTypingStop]);

  // Handle typing debounce
  const handleInputChange = (e) => {
    const text = e.target.value;
    setMessageText(text);

    if (connectionStatus !== 'connected') return;

    if (text.trim().length === 0) {
      if (isTypingRef.current) {
        sendTypingStop();
        isTypingRef.current = false;
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    } else {
      if (!isTypingRef.current) {
        isTypingRef.current = true;
        sendTypingStart();
      }

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

      typingTimeoutRef.current = setTimeout(() => {
        if (isTypingRef.current) {
          sendTypingStop();
          isTypingRef.current = false;
        }
      }, 2000);
    }
  };

  // Handle send message
  const handleSend = (e) => {
    e.preventDefault();
    if (!messageText.trim() || connectionStatus !== 'connected') return;

    sendMessage(messageText);
    setMessageText('');

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (isTypingRef.current) {
      sendTypingStop();
      isTypingRef.current = false;
    }
  };

  // Render message status checkmarks
  const renderMessageStatus = (msg) => {
    if (msg.username !== username) return null;

    if (msg.status === 'read') {
      return (
        <span className="status-checkmark read" title={`Read by: ${msg.readBy?.join(', ') || 'Others'}`}>
          <CheckCheck size={13} />
        </span>
      );
    }

    if (msg.status === 'delivered') {
      return (
        <span className="status-checkmark" title="Delivered">
          <CheckCheck size={13} />
        </span>
      );
    }

    return (
      <span className="status-checkmark" title="Sent">
        <Check size={13} />
      </span>
    );
  };

  // Typing text
  const getTypingText = () => {
    if (typingUsers.length === 0) return '';
    if (typingUsers.length === 1) return `${typingUsers[0]} is typing...`;
    if (typingUsers.length === 2) return `${typingUsers[0]} and ${typingUsers[1]} are typing...`;
    const rest = typingUsers.length - 2;
    return `${typingUsers[0]}, ${typingUsers[1]} and ${rest} other${rest > 1 ? 's' : ''} are typing...`;
  };

  // Deterministic avatar color from username
  const getAvatarColor = (name) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 45%, 35%)`;
  };

  // Render user list (shared between sidebar and mobile drawer)
  const renderUserList = () => (
    <div className="user-list">
      {onlineUsers.map((user) => {
        const isMe = user === username;
        return (
          <div key={user} className={`user-item ${isMe ? 'active-user' : ''}`}>
            <div
              className={`user-avatar ${isMe ? 'me' : ''}`}
              style={!isMe ? { background: getAvatarColor(user) } : undefined}
            >
              {user.charAt(0).toUpperCase()}
            </div>
            <div className="user-info">
              <div className="user-name">
                {user} {isMe && <span className="me-label">(You)</span>}
              </div>
              <div className="user-status-text">Active now</div>
            </div>
            <div className="user-status-dot" aria-label={`${user} is online`} />
          </div>
        );
      })}
    </div>
  );

  // Render messages with date dividers
  const renderMessagesWithDividers = () => {
    const elements = [];
    let lastDateStr = null;
    const totalMessages = messages.length;

    messages.forEach((msg, index) => {
      const msgDate = new Date(msg.timestamp);
      const msgDateStr = msgDate.toDateString();
      const todayStr = new Date().toDateString();
      const yesterdayStr = new Date(Date.now() - 86400000).toDateString();

      let dividerText = '';
      if (msgDateStr !== lastDateStr) {
        if (msgDateStr === todayStr) {
          dividerText = 'Today';
        } else if (msgDateStr === yesterdayStr) {
          dividerText = 'Yesterday';
        } else {
          dividerText = msgDate.toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: msgDate.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
          });
        }
        lastDateStr = msgDateStr;

        elements.push(
          <div key={`divider-${msgDateStr}`} className="date-divider">
            <span className="date-divider-line" />
            <span className="date-divider-text">{dividerText}</span>
            <span className="date-divider-line" />
          </div>
        );
      }

      const isMe = msg.username === username;

      // Only animate the very latest message when it's brand new
      const shouldAnimate = index === totalMessages - 1 && totalMessages > prevMessageCountRef.current;

      elements.push(
        <div
          key={msg._id || `msg-${index}-${msg.timestamp}`}
          className={`message-row ${isMe ? 'me' : 'other'}${shouldAnimate ? ' animate-message-in' : ''}`}
        >
          <div className="message-bubble-wrapper">
            {!isMe && <span className="message-sender-name">{msg.username}</span>}
            <div className="message-bubble">{msg.message}</div>
            <div className="message-metadata">
              <span>{formatChatTime(msg.timestamp)}</span>
              {renderMessageStatus(msg)}
            </div>
          </div>
        </div>
      );
    });

    return elements;
  };

  return (
    <div className="chat-layout">
      {/* Desktop Sidebar */}
      <aside className="chat-sidebar glass-panel" aria-label="Online users">
        <div className="sidebar-header">
          <h2 className="sidebar-title">Online</h2>
          <span className="online-badge">{onlineUsers.length}</span>
        </div>
        {renderUserList()}
      </aside>

      {/* Mobile Drawer */}
      {mobileUsersOpen && (
        <div
          className="mobile-drawer-overlay"
          onClick={() => setMobileUsersOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Online users"
        >
          <div className="mobile-drawer glass-panel" onClick={(e) => e.stopPropagation()}>
            <div className="sidebar-header">
              <h2 className="sidebar-title">Online</h2>
              <span className="online-badge">{onlineUsers.length}</span>
            </div>
            {renderUserList()}
          </div>
        </div>
      )}

      {/* Main Chat Panel */}
      <main className="chat-main glass-panel">
        {/* Header */}
        <header className="chat-header">
          <div className="header-user-info" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              className="btn-secondary mobile-only-btn"
              onClick={() => setMobileUsersOpen(true)}
              aria-label="Show online users"
            >
              <Users size={16} />
            </button>
            <div
              className="user-avatar"
              style={{
                background: getAvatarColor(username),
                color: '#fff',
                border: 'none',
                width: '36px',
                height: '36px',
                fontSize: '14px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
              }}
            >
              {username.charAt(0).toUpperCase()}
            </div>
            <div className="header-titles">
              <h3 className="header-title">PulseChat</h3>
              <p className="header-subtitle" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span className="user-status-dot" style={{ width: '6px', height: '6px', backgroundColor: 'var(--success)', boxShadow: '0 0 4px var(--success)', display: 'inline-block' }} />
                {username} (You)
              </p>
            </div>
          </div>
          <div className="header-actions">
            <StatusIndicator />
            <div className="presence-count-badge">
              <Users size={13} />
              <span>{onlineUsers.length} Online</span>
            </div>
            <button className="btn-exit" onClick={logoutChat} title="Log Out" aria-label="Log out">
              <LogOut size={14} />
              <span className="desktop-only-text">Exit</span>
            </button>
          </div>
        </header>

        {/* Chat area sub-header */}
        <div className="chat-area-subheader">
          <div className="chat-area-subheader-left">
            <h4>Global Lounge</h4>
            <p>Everyone in the conversation</p>
          </div>
          <div className="chat-area-subheader-right">
            <span className="chat-area-online-dot" />
            <span>{onlineUsers.length} online</span>
          </div>
        </div>

        {/* Connection banner */}
        {showConnectionBanner && connectionBannerType === 'disconnected' && (
          <div className="connection-banner disconnected" role="alert">
            <span>Connection lost. Reconnecting...</span>
          </div>
        )}
        {showConnectionBanner && connectionBannerType === 'reconnected' && (
          <div className="connection-banner reconnected" role="status">
            <span>Connected</span>
          </div>
        )}

        {/* Error notification banner */}
        {error && (
          <div className="error-banner" role="alert">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertTriangle size={14} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
            <button className="error-banner-btn" onClick={() => { setError(null); fetchHistory(); }}>
              <RefreshCw size={11} style={{ marginRight: '3px', display: 'inline', verticalAlign: 'middle' }} />
              Retry
            </button>
          </div>
        )}

        {/* Messages area */}
        <div
          className="messages-container"
          ref={messagesContainerRef}
          onScroll={handleScroll}
          style={{ position: 'relative' }}
        >
          {loadingMessages ? (
            <div className="loading-skeleton">
              <div className="skeleton-bubble left" />
              <div className="skeleton-bubble right" />
              <div className="skeleton-bubble left" />
              <div className="skeleton-bubble right" />
              <div className="skeleton-bubble left" />
            </div>
          ) : messages.length === 0 ? (
            <div className="messages-welcome">
              <MessageCircle className="messages-welcome-icon" />
              <h4 className="welcome-chat-title">Welcome to PulseChat</h4>
              <p className="welcome-chat-text">
                Start a conversation with everyone online.
              </p>
              <button
                type="button"
                className="btn-say-hello"
                onClick={() => {
                  setMessageText('Hello 👋');
                  setTimeout(() => {
                    document.querySelector('.composer-input')?.focus();
                  }, 50);
                }}
              >
                Say hello 👋
              </button>
            </div>
          ) : (
            renderMessagesWithDividers()
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* New messages indicator */}
        {newMsgCount > 0 && (
          <button
            className="new-messages-indicator"
            onClick={() => scrollToBottom(true)}
            aria-label={`${newMsgCount} new message${newMsgCount > 1 ? 's' : ''}`}
          >
            <ChevronDown size={14} />
            {newMsgCount} new message{newMsgCount > 1 ? 's' : ''}
          </button>
        )}

        {/* Typing indicator */}
        <div
          className="typing-indicators-area"
          aria-live="polite"
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}
        >
          {typingUsers.map((user) => (
            <div key={user} className="typing-indicator-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                className="user-avatar"
                style={{
                  background: getAvatarColor(user),
                  width: '20px',
                  height: '20px',
                  fontSize: '9px',
                  border: 'none',
                  color: '#fff',
                  boxShadow: '0 1px 4px rgba(0, 0, 0, 0.15)'
                }}
              >
                {user.charAt(0).toUpperCase()}
              </div>
              <span className="typing-text" style={{ fontSize: '11px', color: 'var(--text-secondary)', fontStyle: 'normal' }}>
                {user} is typing
              </span>
              <div className="typing-dot-animation" style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
                <span className="typing-dot" style={{ width: '3px', height: '3px', backgroundColor: 'var(--accent)' }} />
                <span className="typing-dot" style={{ width: '3px', height: '3px', backgroundColor: 'var(--accent)' }} />
                <span className="typing-dot" style={{ width: '3px', height: '3px', backgroundColor: 'var(--accent)' }} />
              </div>
            </div>
          ))}
        </div>

        {/* Message Composer */}
        <footer className="message-composer">
          <form onSubmit={handleSend} className="composer-form">
            <div className="composer-input-wrapper">
              <input
                type="text"
                className="composer-input"
                placeholder={connectionStatus === 'connected' ? 'Type a message...' : 'Reconnecting to server...'}
                value={messageText}
                onChange={handleInputChange}
                disabled={connectionStatus !== 'connected'}
                autoComplete="off"
                maxLength={2000}
                aria-label="Message input"
              />
            </div>
            <button
              type="submit"
              className="send-btn"
              disabled={connectionStatus !== 'connected' || !messageText.trim()}
              title="Send Message"
              aria-label="Send message"
            >
              <Send size={15} />
            </button>
          </form>
        </footer>
      </main>

      {/* Floating Toast Notifications */}
      <div className="toast-container">
        {toasts && toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            <span className="toast-text">{toast.message}</span>
            <button
              className="toast-close-btn"
              onClick={() => removeToast(toast.id)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'inherit',
                cursor: 'pointer',
                padding: '2px',
                marginLeft: 'auto',
                display: 'flex',
                alignItems: 'center',
                opacity: 0.7
              }}
              title="Close notification"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChatScreen;
