import React, { useState, useEffect } from 'react';
import Header from './Header';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { socket } from '../socket';

export default function Chat({ user, onLogout }) {
  const [room, setRoom] = useState('general');
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(socket.connected);

  useEffect(() => {
    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    // Xóa tin nhắn của phòng cũ khi chuyển phòng và tham gia phòng mới
    setMessages([]);
    socket.emit('join_room', { username: user.username, room });

    // Lắng nghe sự kiện tải lịch sử tin nhắn từ database.json (bao gồm cả file đính kèm)
    const handleRoomHistory = (history) => {
      setMessages(history || []);
    };

    // Lắng nghe tin nhắn mới nhận được từ các thành viên trong phòng
    const handleReceiveMessage = (message) => {
      setMessages((prev) => [...prev, message]);
    };

    socket.on('room_history', handleRoomHistory);
    socket.on('receive_message', handleReceiveMessage);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('room_history', handleRoomHistory);
      socket.off('receive_message', handleReceiveMessage);
    };
  }, [user.username, room]);

  // Xử lý gửi tin nhắn (nhận cả nội dung text và object attachment Base64)
  const handleSendMessage = ({ text, attachment }) => {
    const messagePayload = {
      room,
      sender: user.username,
      text: text || '',
      attachment: attachment || null, // Object chứa: name, type, size, data (Base64)
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // Phát sự kiện send_message lên server Socket.io
    socket.emit('send_message', messagePayload);
  };

  const handleRoomChange = (newRoom) => {
    if (newRoom !== room) {
      setRoom(newRoom);
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-night select-none">
      <Header
        username={user.username}
        room={room}
        onRoomChange={handleRoomChange}
        onLogout={onLogout}
        isConnected={isConnected}
      />

      <MessageList messages={messages} currentUser={user.username} />

      <MessageInput
        onSendMessage={handleSendMessage}
        disabled={!isConnected}
      />
    </div>
  );
}
