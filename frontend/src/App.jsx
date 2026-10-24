import React, { useState, useEffect } from 'react';
import Auth from './components/Auth';
import Chat from './components/Chat';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    // Khôi phục phiên làm việc từ localStorage nếu có
    const saved = localStorage.getItem('chat_user');
    return saved ? JSON.parse(saved) : null;
  });

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    localStorage.setItem('chat_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('chat_user');
  };

  return (
    <main className="min-h-screen bg-night text-on-dark antialiased">
      {!currentUser ? (
        <Auth onLoginSuccess={handleLoginSuccess} />
      ) : (
        <Chat user={currentUser} onLogout={handleLogout} />
      )}
    </main>
  );
}
