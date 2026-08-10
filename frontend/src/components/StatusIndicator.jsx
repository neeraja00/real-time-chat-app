import React from 'react';
import { useChat } from '../context/ChatContext';

const StatusIndicator = () => {
  const { connectionStatus } = useChat();

  const config = {
    connected: { text: 'Connected', className: 'status-connected' },
    connecting: { text: 'Connecting...', className: 'status-connecting' },
    disconnected: { text: 'Disconnected', className: 'status-disconnected' }
  };

  const { text, className } = config[connectionStatus] || config.disconnected;

  return (
    <div
      className={`status-badge ${className}`}
      title={`Server: ${text}`}
      role="status"
      aria-label={`Connection status: ${text}`}
    >
      <span className="status-indicator-dot" aria-hidden="true" />
      <span>{text}</span>
    </div>
  );
};

export default StatusIndicator;
