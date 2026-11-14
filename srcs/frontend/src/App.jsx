import React, { useState, useEffect } from 'react';
import Auth from './components/Auth';
import Chat from './components/Chat';
import { socket } from './socket';

export default function App() {
  const [resetNotice, setResetNotice] = useState('');
  const [currentUser, setCurrentUser] = useState(() => {
    // Khôi phục phiên làm việc từ localStorage nếu có
    const saved = localStorage.getItem('chat_user');
    return saved ? JSON.parse(saved) : null;
  });

  const handleLoginSuccess = (user) => {
    setResetNotice('');
    setCurrentUser(user);
    localStorage.setItem('chat_user', JSON.stringify(user));
  };

  const handleLogout = (notice) => {
    if (socket && socket.connected) {
      socket.emit('update_status', { status: 'offline' });
    }
    if (notice && typeof notice === 'string') {
      setResetNotice(notice);
    }
    setCurrentUser(null);
    localStorage.removeItem('chat_user');
  };

  // Đồng bộ logout tự động trên tất cả các tab của cùng trình duyệt khi có 1 tab logout
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'chat_user' && !e.newValue) {
        setCurrentUser(null);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <main className="min-h-screen bg-night text-on-dark antialiased">
      {!currentUser ? (
        <Auth onLoginSuccess={handleLoginSuccess} notice={resetNotice} />
      ) : (
        <Chat user={currentUser} onLogout={handleLogout} />
      )}
    </main>
  );
}
