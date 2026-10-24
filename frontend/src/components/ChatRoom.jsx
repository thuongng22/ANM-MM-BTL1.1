import React, { useState, useEffect } from 'react';
import Header from './Header';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { socket } from '../socket';

export default function ChatRoom({ username, room, onLeaveRoom }) {
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(socket.connected);

  useEffect(() => {
    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    setMessages([]);
    socket.emit('join_room', { username, room });

    const handleRoomHistory = (history) => {
      setMessages(history || []);
    };

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
  }, [username, room]);

  const handleSendMessage = ({ text, attachment }) => {
    const messagePayload = {
      room,
      sender: username,
      text: text || '',
      attachment: attachment || null,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    socket.emit('send_message', messagePayload);
  };

  return (
    <div className="flex flex-col h-screen w-full bg-night select-none">
      <Header
        username={username}
        room={room}
        onLeaveRoom={onLeaveRoom}
        isConnected={isConnected}
      />
      <MessageList messages={messages} currentUser={username} />
      <MessageInput
        onSendMessage={handleSendMessage}
        disabled={!isConnected}
      />
    </div>
  );
}
