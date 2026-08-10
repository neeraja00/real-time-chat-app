import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { useChat } from '../context/ChatContext';

// Simple PulseChat logo as SVG
const PulseLogo = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    <circle cx="9" cy="12" r="1" fill="currentColor" />
    <circle cx="12" cy="12" r="1" fill="currentColor" />
    <circle cx="15" cy="12" r="1" fill="currentColor" />
  </svg>
);

const WelcomeScreen = () => {
  const { joinChat } = useChat();
  const [usernameInput, setUsernameInput] = useState('');
  const [validationError, setValidationError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');

    const trimmedName = usernameInput.trim();

    if (!trimmedName) {
      setValidationError('Username is required.');
      return;
    }

    if (trimmedName.length < 3) {
      setValidationError('Username must be at least 3 characters.');
      return;
    }

    if (trimmedName.length > 30) {
      setValidationError('Username cannot exceed 30 characters.');
      return;
    }

    const regex = /^[a-zA-Z0-9_\-\s]+$/;
    if (!regex.test(trimmedName)) {
      setValidationError('Only letters, numbers, spaces, underscores, and dashes allowed.');
      return;
    }

    try {
      setIsSubmitting(true);
      await joinChat(trimmedName);
    } catch (err) {
      console.error(err);
      setValidationError('Failed to connect to the chat server. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="welcome-container">
      <div className="welcome-card glass-panel">
        <div className="brand-icon-wrapper">
          <PulseLogo />
        </div>

        <h1 className="welcome-title">PulseChat</h1>
        <p className="welcome-subtitle">Real conversations. Real-time.</p>
        <div className="welcome-tagline">Stay connected. Instantly.</div>

        {validationError && (
          <div className="alert-message alert-danger" role="alert">
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{validationError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="username-login" className="input-label">
              Choose your username
            </label>
            <input
              id="username-login"
              type="text"
              className="text-input"
              placeholder="Enter your name"
              value={usernameInput}
              onChange={(e) => {
                setUsernameInput(e.target.value);
                if (validationError) setValidationError('');
              }}
              disabled={isSubmitting}
              autoComplete="off"
              autoFocus
              maxLength={30}
              aria-describedby={validationError ? 'login-error' : undefined}
            />
          </div>

          <button
            type="submit"
            className="submit-btn"
            disabled={isSubmitting || !usernameInput.trim()}
          >
            {isSubmitting ? 'Connecting...' : 'Enter the Lounge →'}
          </button>
        </form>

        <div className="welcome-features">
          <div className="welcome-feature-item">
            <span className="welcome-feature-dot" />
            <span>Real-time messaging</span>
          </div>
          <div className="welcome-feature-item">
            <span className="welcome-feature-dot" />
            <span>Secure session isolation</span>
          </div>
          <div className="welcome-feature-item">
            <span className="welcome-feature-dot" />
            <span>Instant conversations</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
