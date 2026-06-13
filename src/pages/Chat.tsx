import React, { useState, useRef, useEffect } from 'react';
import { Send, Search, Hash, Shield, LogOut, CheckCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface Message {
  id: string;
  sender: string;
  avatar?: string;
  text: string;
  timestamp: string;
  isSelf: boolean;
}

interface ChatRoom {
  id: string;
  name: string;
  description: string;
  unreadCount?: number;
  lastMessage?: string;
}

export const Chat: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activeRoomId, setActiveRoomId] = useState('general');
  const [inputText, setInputText] = useState('');
  
  const [rooms] = useState<ChatRoom[]>([
    { id: 'general', name: 'general', description: 'General discussion for team members', lastMessage: 'Let\'s set up the project architecture.' },
    { id: 'random', name: 'random', description: 'Fun links, memes, and casual banter', lastMessage: 'Did you see that new Vite release?' },
    { id: 'announcements', name: 'announcements', description: 'Official system and project announcements', lastMessage: 'Welcome to Whispr V1.0!', unreadCount: 1 },
  ]);

  const [messages, setMessages] = useState<Record<string, Message[]>>({
    general: [
      { id: '1', sender: 'Alice Smith', text: 'Hey everyone! Welcome to our new Whispr workspace.', timestamp: '10:30 AM', isSelf: false },
      { id: '2', sender: 'Bob Johnson', text: 'Wow, this interface looks incredibly smooth! 🚀', timestamp: '10:32 AM', isSelf: false },
      { id: '3', sender: 'You', text: 'Thanks! Vite makes the build times instant and CSS variables keep the theme pristine.', timestamp: '10:35 AM', isSelf: true },
    ],
    random: [
      { id: '1', sender: 'Charlie Brown', text: 'Anybody up for coffee later? ☕', timestamp: 'Yesterday', isSelf: false },
      { id: '2', sender: 'You', text: 'I am down! Let\'s go around 3 PM.', timestamp: 'Yesterday', isSelf: true },
    ],
    announcements: [
      { id: '1', sender: 'System Admin', text: 'Whispr chat platform backend and frontend are now officially scaffolding successfully!', timestamp: '9:00 AM', isSelf: false },
    ],
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, activeRoomId]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newMessage: Message = {
      id: Date.now().toString(),
      sender: 'You',
      text: inputText,
      timestamp: timeString,
      isSelf: true,
    };

    setMessages((prev) => ({
      ...prev,
      [activeRoomId]: [...(prev[activeRoomId] || []), newMessage],
    }));

    setInputText('');
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const activeRoom = rooms.find(r => r.id === activeRoomId) || rooms[0];
  const currentMessages = messages[activeRoomId] || [];

  return (
    <div className="chat-app-container">
      {/* Sidebar */}
      <aside className="chat-sidebar">
        <div className="sidebar-header">
          <div className="user-profile">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt={user.name} className="avatar-img" />
            ) : (
              <div className="avatar">{user?.name ? user.name[0].toUpperCase() : 'U'}</div>
            )}
            <div className="profile-info">
              <h4>{user?.name || 'User'}</h4>
              <span className="status-online">Online</span>
            </div>
          </div>
          <button className="btn-icon logout-btn" title="Log Out" onClick={handleLogout}>
            <LogOut size={18} />
          </button>
        </div>

        <div className="search-bar">
          <Search size={16} className="search-icon" />
          <input type="text" placeholder="Search channels..." />
        </div>

        <div className="channels-section">
          <h3>Channels</h3>
          <div className="rooms-list">
            {rooms.map((room) => (
              <button
                key={room.id}
                className={`room-item ${room.id === activeRoomId ? 'active' : ''}`}
                onClick={() => setActiveRoomId(room.id)}
              >
                <Hash size={18} className="room-icon" />
                <div className="room-details">
                  <span className="room-name">#{room.name}</span>
                  <span className="room-preview">{room.lastMessage}</span>
                </div>
                {room.unreadCount && room.unreadCount > 0 && (
                  <span className="unread-badge">{room.unreadCount}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="chat-main">
        {/* Chat Header */}
        <header className="chat-header">
          <div className="chat-title-info">
            <h2>#{activeRoom.name}</h2>
            <p>{activeRoom.description}</p>
          </div>
          <div className="chat-actions">
            <span className="badge-secure">
              <Shield size={14} /> Secure
            </span>
          </div>
        </header>

        {/* Messages List */}
        <div className="messages-list">
          {currentMessages.map((msg) => (
            <div key={msg.id} className={`message-row ${msg.isSelf ? 'self' : 'other'}`}>
              {!msg.isSelf && <div className="message-avatar">{msg.sender[0]}</div>}
              <div className="message-bubble-wrapper">
                {!msg.isSelf && <span className="message-sender">{msg.sender}</span>}
                <div className="message-bubble">
                  <p>{msg.text}</p>
                  <div className="message-meta">
                    <span className="message-time">{msg.timestamp}</span>
                    {msg.isSelf && <CheckCheck size={14} className="status-icon" />}
                  </div>
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <form onSubmit={handleSendMessage} className="message-input-form">
          <input
            type="text"
            placeholder={`Message #${activeRoom.name}...`}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
          <button type="submit" className="btn btn-primary btn-send">
            <Send size={18} />
          </button>
        </form>
      </main>
    </div>
  );
};
