import React from 'react';
import { ChatProvider, useChat } from './context/ChatContext';
import WelcomeScreen from './components/WelcomeScreen';
import ChatScreen from './components/ChatScreen';

const ChatContent = () => {
  const { username } = useChat();

  if (!username) {
    return <WelcomeScreen />;
  }

  return (
    <div className="app-container">
      <ChatScreen />
    </div>
  );
};

function App() {
  return (
    <ChatProvider>
      <ChatContent />
    </ChatProvider>
  );
}

export default App;
