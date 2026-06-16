import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, Search, Shield, LogOut, CheckCheck,
  MessageSquare, User, Settings, Image, Plus, 
  UserPlus, Users, X, Trash2, ShieldCheck, Mail, Phone,
  ChevronUp, ChevronDown
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { User as AuthUser } from '../context/AuthContext';

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
  is_group: boolean;
  members?: string[];
  partnerEmail?: string;
  partnerContact?: string;
}

export const Chat: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileForm(prev => ({
          ...prev,
          avatar_url: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Set default state as null so that the empty/welcome landing canvas displays first
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  
  // Active Utility Sidebar tab: 'chats' | 'profile' | 'settings' | 'media'
  const [activeUtilityTab, setActiveUtilityTab] = useState<'chats' | 'profile' | 'settings' | 'media'>('chats');
  
  // Search Filters
  const [searchFilter, setSearchFilter] = useState('');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<'all' | 'unread' | 'groups'>('all');
  
  // Specific Chat Search
  const [isChatSearchActive, setIsChatSearchActive] = useState(false);
  const [chatSearchQuery, setChatSearchQuery] = useState('');

  // Theme Management
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') return saved;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);
  
  // Info Drawer toggling
  const [isInfoDrawerOpen, setIsInfoDrawerOpen] = useState(false);
  
  // Modals
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [newUserForm, setNewUserForm] = useState({ name: '', email: '', initialMessage: '' });
  
  const [isAddGroupModalOpen, setIsAddGroupModalOpen] = useState(false);
  const [newGroupForm, setNewGroupForm] = useState({ name: '', description: '' });
  
  const [isNewChatDropdownOpen, setIsNewChatDropdownOpen] = useState(false);
  const [addUserError, setAddUserError] = useState<string | null>(null);
  const [addGroupError, setAddGroupError] = useState<string | null>(null);

  // Group Member search and collection states
  const [groupMembers, setGroupMembers] = useState<AuthUser[]>([]);
  const [memberEmailInput, setMemberEmailInput] = useState('');
  const [memberSearchError, setMemberSearchError] = useState<string | null>(null);
  const [isSearchingMember, setIsSearchingMember] = useState(false);
  
  // Profile settings local state
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    contact_no: user?.contact_no || '',
    avatar_url: user?.avatar_url || '',
    bio: user ? (localStorage.getItem(`whispr_bio_${user.id}`) || 'Excited to chat and build premium apps with Whispr! 🚀') : 'Excited to chat and build premium apps with Whispr! 🚀',
    status: 'Active'
  });
  const [profileMessage, setProfileMessage] = useState<string | null>(null);

  // App settings state
  const [appSettings, setAppSettings] = useState({
    notifications: true,
    sound: true,
    showStatus: true,
    readReceipts: true
  });

  // Sync profileForm once user details load
  useEffect(() => {
    if (user) {
      setProfileForm(prev => ({
        ...prev,
        name: user.name,
        email: user.email,
        contact_no: user.contact_no || '',
        avatar_url: user.avatar_url || '',
        bio: localStorage.getItem(`whispr_bio_${user.id}`) || 'Excited to chat and build premium apps with Whispr! 🚀',
      }));
    }
  }, [user]);
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);
  const [roomsError, setRoomsError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        setIsLoadingRooms(true);
        setRoomsError(null);
        const response = await fetch('/api/rooms');
        if (!response.ok) {
          throw new Error('Failed to load conversations.');
        }
        const data = await response.json();
        
        const mappedRooms: ChatRoom[] = data.rooms.map((room: any) => {
          let displayName = room.name || 'Direct Message';
          let partnerEmail = undefined;
          let partnerContact = undefined;
          if (!room.is_group && room.room_members) {
            const partner = room.room_members.find((m: any) => m.profiles.id !== user?.id);
            if (partner) {
              displayName = partner.profiles.name;
              partnerEmail = partner.profiles.email;
              partnerContact = partner.profiles.contact_no || undefined;
            }
          }
          
          return {
            id: room.id,
            name: displayName,
            description: room.is_group ? (room.description || 'No description.') : `DM conversation with ${displayName}`,
            is_group: room.is_group,
            lastMessage: room.lastMessage || 'No messages yet.',
            members: room.room_members?.map((m: any) => m.profiles.name) || [],
            partnerEmail,
            partnerContact
          };
        });

        setRooms(mappedRooms);
      } catch (err: any) {
        console.error('Failed to load rooms:', err);
        setRoomsError(err.message || 'An error occurred while fetching conversations.');
      } finally {
        setIsLoadingRooms(false);
      }
    };

    if (user) {
      fetchRooms();
    }
  }, [user]);

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

  const [activeMatchIndex, setActiveMatchIndex] = useState<number>(0);

  const getSearchMatches = (): { messageId: string; indexInMessage: number }[] => {
    if (!isChatSearchActive || !chatSearchQuery.trim() || !activeRoomId) return [];
    const query = chatSearchQuery.toLowerCase();
    const currentMessages = messages[activeRoomId] || [];
    const matches: { messageId: string; indexInMessage: number }[] = [];
    
    currentMessages.forEach((msg) => {
      const text = msg.text.toLowerCase();
      let pos = text.indexOf(query);
      let idx = 0;
      while (pos !== -1) {
        matches.push({
          messageId: msg.id,
          indexInMessage: idx
        });
        idx++;
        pos = text.indexOf(query, pos + query.length);
      }
    });
    
    return matches;
  };

  const searchMatches = getSearchMatches();

  useEffect(() => {
    if (searchMatches.length > 0) {
      setActiveMatchIndex(searchMatches.length - 1);
    } else {
      setActiveMatchIndex(0);
    }
  }, [chatSearchQuery, isChatSearchActive, activeRoomId]);

  useEffect(() => {
    if (isChatSearchActive && searchMatches.length > 0) {
      const timer = setTimeout(() => {
        const element = document.getElementById('active-search-match');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [activeMatchIndex, chatSearchQuery, isChatSearchActive]);

  const handlePrevMatch = () => {
    if (searchMatches.length === 0) return;
    setActiveMatchIndex((prev) => (prev - 1 + searchMatches.length) % searchMatches.length);
  };

  const handleNextMatch = () => {
    if (searchMatches.length === 0) return;
    setActiveMatchIndex((prev) => (prev + 1) % searchMatches.length);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, activeRoomId]);

  // Auto-close details drawer when switching active room
  useEffect(() => {
    setIsInfoDrawerOpen(false);
  }, [activeRoomId]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRoomId || !inputText.trim()) return;

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

    // Update last message in the rooms list
    setRooms(prev => prev.map(room => 
      room.id === activeRoomId ? { ...room, lastMessage: inputText } : room
    ));

    setInputText('');
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleAddMemberByEmail = async () => {
    const email = memberEmailInput.trim().toLowerCase();
    if (!email) return;

    if (user && email === user.email.toLowerCase()) {
      setMemberSearchError('You cannot add yourself to the group list.');
      return;
    }

    if (groupMembers.some(m => m.email.toLowerCase() === email)) {
      setMemberSearchError('User is already added to the group list.');
      return;
    }

    setIsSearchingMember(true);
    setMemberSearchError(null);

    try {
      const response = await fetch(`/api/auth/check/${encodeURIComponent(email)}`);
      const data = await response.json();

      if (!response.ok) {
        setMemberSearchError(data.message || 'User does not exist in the database.');
        return;
      }

      if (data.exists && data.profile) {
        setGroupMembers(prev => [...prev, data.profile]);
        setMemberEmailInput('');
      } else {
        setMemberSearchError('User profile not found.');
      }
    } catch (error) {
      console.error('Failed to verify user email:', error);
      setMemberSearchError('Network error checking user email.');
    } finally {
      setIsSearchingMember(false);
    }
  };

  const handleAddUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserForm.name.trim() || !newUserForm.email.trim()) return;

    try {
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_group: false,
          email: newUserForm.email.trim()
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to start direct message conversation.');
      }

      const room = data.room;
      let displayName = room.name;
      if (!displayName && room.room_members) {
        const partner = room.room_members.find((m: any) => m.profiles.id !== user?.id);
        if (partner) {
          displayName = partner.profiles.name;
        }
      }
      displayName = displayName || newUserForm.name.trim();

      const partnerObj = room.room_members?.find((m: any) => m.profiles.id !== user?.id);
      const newRoom: ChatRoom = {
        id: room.id,
        name: displayName,
        description: `Direct Message conversation with ${displayName}`,
        is_group: false,
        lastMessage: 'Chat started',
        members: room.room_members?.map((m: any) => m.profiles.name) || [],
        partnerEmail: partnerObj?.profiles.email || newUserForm.email.trim(),
        partnerContact: partnerObj?.profiles.contact_no || undefined
      };

      setRooms(prev => [newRoom, ...prev]);
      setMessages(prev => ({
        ...prev,
        [room.id]: []
      }));

      setActiveRoomId(room.id);
      setActiveUtilityTab('chats');
      setIsAddUserModalOpen(false);
      setNewUserForm({ name: '', email: '', initialMessage: '' });
    } catch (err: any) {
      setAddUserError(err.message || 'Failed to create direct message.');
    }
  };

  const handleAddGroupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupForm.name.trim()) return;

    if (groupMembers.length === 0) {
      setAddGroupError('Please add at least one member to create a group.');
      return;
    }

    try {
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_group: true,
          name: newGroupForm.name.trim(),
          email: groupMembers.map(m => m.email)
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create group room.');
      }

      const room = data.room;
      const memberNames = ['You', ...groupMembers.map(m => m.name)];
      const newRoom: ChatRoom = {
        id: room.id,
        name: room.name || newGroupForm.name.trim(),
        description: newGroupForm.description.trim() || 'No description provided.',
        is_group: true,
        lastMessage: 'Group created',
        members: memberNames
      };

      setRooms(prev => [newRoom, ...prev]);
      setMessages(prev => ({
        ...prev,
        [room.id]: [{
          id: Date.now().toString(),
          sender: 'System',
          text: `Group room "${newRoom.name}" created with members: ${memberNames.join(', ')}.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isSelf: false
        }]
      }));

      setActiveRoomId(room.id);
      setActiveUtilityTab('chats');
      setIsAddGroupModalOpen(false);
      setNewGroupForm({ name: '', description: '' });
      setGroupMembers([]);
      setMemberEmailInput('');
      setMemberSearchError(null);
    } catch (err: any) {
      setAddGroupError(err.message || 'Failed to create group.');
    }
  };

  const handleClearChat = () => {
    if (!activeRoomId) return;
    const room = rooms.find(r => r.id === activeRoomId);
    if (!room) return;
    
    if (window.confirm(`Are you sure you want to clear all messages in #${room.name}? This cannot be undone.`)) {
      setMessages(prev => ({
        ...prev,
        [activeRoomId]: []
      }));
      setRooms(prev => prev.map(r => 
        r.id === activeRoomId ? { ...r, lastMessage: 'No messages' } : r
      ));
    }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: profileForm.name,
          contact_no: profileForm.contact_no,
          avatar_url: profileForm.avatar_url,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to update profile.');
      }

      if (user) {
        localStorage.setItem(`whispr_bio_${user.id}`, profileForm.bio);
      }

      updateUser({
        name: profileForm.name,
        contact_no: profileForm.contact_no,
        avatar_url: profileForm.avatar_url,
      });

      setProfileMessage('Profile details updated successfully!');
      setTimeout(() => setProfileMessage(null), 3000);
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      setProfileMessage(err.message || 'An error occurred while saving profile changes.');
      setTimeout(() => setProfileMessage(null), 4000);
    }
  };

  const activeRoom = activeRoomId ? (rooms.find(r => r.id === activeRoomId) || null) : null;
  const currentMessages = activeRoomId ? (messages[activeRoomId] || []) : [];

  // Filter messages based on specific chat search query
  const filteredMessages = currentMessages.filter(msg => {
    if (!isChatSearchActive || !chatSearchQuery.trim()) return true;
    return msg.text.toLowerCase().includes(chatSearchQuery.toLowerCase());
  });

  // Filter conversations list
  const filteredRooms = rooms.filter(room => {
    const matchesSearch = room.name.toLowerCase().includes(searchFilter.toLowerCase());
    if (!matchesSearch) return false;

    if (activeCategoryFilter === 'unread') {
      return room.unreadCount && room.unreadCount > 0;
    }
    if (activeCategoryFilter === 'groups') {
      return room.is_group === true;
    }
    return true;
  });

  // Highlight matches text helper
  const renderMessageText = (messageId: string, text: string) => {
    if (!chatSearchQuery.trim() || !isChatSearchActive) return <p>{text}</p>;

    const regex = new RegExp(`(${chatSearchQuery.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    const firstGlobalMatchIndex = searchMatches.findIndex(m => m.messageId === messageId);
    let matchCount = 0;

    return (
      <p>
        {parts.map((part, index) => {
          if (regex.test(part)) {
            const currentGlobalIndex = firstGlobalMatchIndex !== -1 ? firstGlobalMatchIndex + matchCount : -1;
            const isActive = currentGlobalIndex === activeMatchIndex;
            matchCount++;
            
            return (
              <span 
                key={index} 
                id={isActive ? 'active-search-match' : undefined}
                className={`message-highlight ${isActive ? 'active' : ''}`}
              >
                {part}
              </span>
            );
          }
          return part;
        })}
      </p>
    );
  };

  // Mocked Shared Media attachments list
  const sharedMediaList = [
    { id: 'm1', name: 'Product Roadmap Q3.png', url: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=300&auto=format&fit=crop', type: 'image' },
    { id: 'm2', name: 'Dashboard Design.png', url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=300&auto=format&fit=crop', type: 'image' },
    { id: 'm3', name: 'Whispr Cover.jpg', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300&auto=format&fit=crop', type: 'image' },
    { id: 'm4', name: 'Office Gathering.jpg', url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=300&auto=format&fit=crop', type: 'image' },
    { id: 'm5', name: 'Vite Setup Blueprint.pdf', url: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=300&auto=format&fit=crop', type: 'image' },
    { id: 'm6', name: 'Release Blueprint.md', url: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=300&auto=format&fit=crop', type: 'image' },
  ];

  return (
    <div className="chat-layout-grid" style={{ gridTemplateColumns: activeUtilityTab === 'chats' ? '20% 20% 60%' : '20% 80%' }}>
      {/* COLUMN 1: Utility Bar (Left-Most Strip - 20% width) */}
      <aside className="utility-bar">
        <div>
          <div className="utility-header">
            <MessageSquare className="brand-icon" size={24} />
            <span>Whispr</span>
          </div>

          <nav className="utility-nav">
            <button 
              className={`utility-nav-item ${activeUtilityTab === 'chats' ? 'active' : ''}`}
              onClick={() => setActiveUtilityTab('chats')}
            >
              <MessageSquare size={18} />
              <span>Chats</span>
            </button>
            <button 
              className={`utility-nav-item ${activeUtilityTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveUtilityTab('profile')}
            >
              <User size={18} />
              <span>Profile</span>
            </button>
            <button 
              className={`utility-nav-item ${activeUtilityTab === 'settings' ? 'active' : ''}`}
              onClick={() => {
                setActiveUtilityTab('settings');
              }}
            >
              <Settings size={18} />
              <span>Settings</span>
            </button>
            <button 
              className={`utility-nav-item ${activeUtilityTab === 'media' ? 'active' : ''}`}
              onClick={() => setActiveUtilityTab('media')}
            >
              <Image size={18} />
              <span>Media</span>
            </button>
          </nav>
        </div>

        <div className="utility-bar-footer" style={{ borderTop: 'none', paddingTop: 0 }}>
          <div className="utility-user-card" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '0.75rem', background: 'none', border: 'none', padding: 0, justifyContent: 'flex-start', width: '100%' }}>
            {profileForm.avatar_url ? (
              <img 
                src={profileForm.avatar_url} 
                alt={profileForm.name} 
                style={{ width: '40px', height: '40px', borderRadius: '50%', border: 'none', objectFit: 'cover', flexShrink: 0 }} 
              />
            ) : (
              <div 
                style={{ 
                  width: '40px', 
                  height: '40px', 
                  borderRadius: '50%', 
                  background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent-purple) 100%)', 
                  color: 'white', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  fontWeight: 700, 
                  fontSize: '1rem',
                  border: 'none',
                  flexShrink: 0
                }}
              >
                {profileForm.name ? profileForm.name[0].toUpperCase() : 'U'}
              </div>
            )}
            <div className="utility-user-details" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left', overflow: 'hidden' }}>
              <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
                {profileForm.name || 'User'}
              </h4>
              <span style={{ fontSize: '0.75rem', color: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 500 }}>
                <span style={{ width: '6px', height: '6px', backgroundColor: 'var(--accent-green)', borderRadius: '50%', display: 'inline-block' }}></span>
                Online
              </span>
            </div>
          </div>
          <button className="utility-logout-btn" onClick={handleLogout} style={{ marginTop: '0.75rem' }}>
            <LogOut size={16} />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* COLUMN 2: Conversations List (Left-Center Panel - 20% width) */}
      {activeUtilityTab === 'chats' && (
        <div className="conversations-list-panel">
        <div className="conversations-header">
          <div className="conversations-title-row">
            <h3>Conversations</h3>
            
            <div className="new-chat-dropdown-container">
              <button 
                className="btn-icon" 
                title="New Chat" 
                onClick={() => setIsNewChatDropdownOpen(!isNewChatDropdownOpen)}
              >
                <Plus size={18} />
              </button>
              
              {isNewChatDropdownOpen && (
                <>
                  <div 
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99 }}
                    onClick={() => setIsNewChatDropdownOpen(false)}
                  />
                  <div className="new-chat-dropdown">
                    <button onClick={() => { setIsAddUserModalOpen(true); setAddUserError(null); setIsNewChatDropdownOpen(false); }}>
                      <UserPlus size={16} />
                      <span>Add New User</span>
                    </button>
                    <button onClick={() => { setIsAddGroupModalOpen(true); setAddGroupError(null); setIsNewChatDropdownOpen(false); }}>
                      <Users size={16} />
                      <span>Add New Group</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="search-bar" style={{ padding: '0', borderBottom: 'none' }}>
            <Search size={16} className="search-icon" style={{ left: '0.75rem' }} />
            <input 
              type="text" 
              placeholder="Search conversations..." 
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              style={{ paddingLeft: '2.25rem' }}
            />
          </div>

          <div className="filter-pills-row">
            <button 
              className={`filter-pill ${activeCategoryFilter === 'all' ? 'active' : ''}`}
              onClick={() => setActiveCategoryFilter('all')}
            >
              All
            </button>
            <button 
              className={`filter-pill ${activeCategoryFilter === 'unread' ? 'active' : ''}`}
              onClick={() => setActiveCategoryFilter('unread')}
            >
              Unread
            </button>
            <button 
              className={`filter-pill ${activeCategoryFilter === 'groups' ? 'active' : ''}`}
              onClick={() => setActiveCategoryFilter('groups')}
            >
              Groups
            </button>
          </div>
        </div>

        <div className="channels-section" style={{ padding: '1rem' }}>
          <div className="rooms-list">
            {isLoadingRooms ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem' }}>
                <div className="spinner" style={{ width: '24px', height: '24px' }}></div>
              </div>
            ) : roomsError ? (
              <div style={{ textAlign: 'center', padding: '1.5rem 1rem', color: '#ef4444' }}>
                <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>{roomsError}</p>
              </div>
            ) : filteredRooms.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-tertiary)' }}>
                <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  {activeCategoryFilter === 'groups' ? 'No groups found' : 'No group or DM found'}
                </p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                  Click the plus icon (+) above to start a new chat.
                </p>
              </div>
            ) : (
              filteredRooms.map((room) => (
                <button
                  key={room.id}
                  className={`room-item ${room.id === activeRoomId && activeUtilityTab === 'chats' ? 'active' : ''}`}
                  onClick={() => {
                    setActiveRoomId(room.id);
                    setActiveUtilityTab('chats');
                  }}
                >
                  {room.is_group ? (
                    <Users size={18} className="room-icon" />
                  ) : (
                    <User size={18} className="room-icon" />
                  )}
                  <div className="room-details">
                    <span className="room-name">
                      {room.is_group ? '#' : ''}{room.name}
                    </span>
                    <span className="room-preview">{room.lastMessage}</span>
                  </div>
                  {room.unreadCount && room.unreadCount > 0 && (
                    <span className="unread-badge">{room.unreadCount}</span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      </div>
      )}

      {/* COLUMN 3: Right Panel (The Main Canvas - 60% width) */}
      <div style={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'row', position: 'relative' }}>
        {/* Render View depending on activeUtilityTab & activeRoomId */}
        
        {activeUtilityTab === 'profile' && (
          <div className="utility-view-container" style={{ maxWidth: '100%' }}>
            <div className="utility-view-header">
              <h2>My Profile</h2>
              <p>Manage your details, upload your avatar image, and update your biography.</p>
            </div>

            {profileMessage && (
              <div className="form-alert form-alert-success">
                <span>{profileMessage}</span>
              </div>
            )}

            <div className="profile-wrapper">
              {/* Avatar Icon Upload (Left side) */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', flexShrink: 0, marginTop: '0.5rem' }}>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleAvatarChange} 
                  style={{ display: 'none' }} 
                  accept="image/*" 
                />
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  style={{ 
                    position: 'relative', 
                    width: '140px', 
                    height: '140px', 
                    borderRadius: '50%', 
                    cursor: 'pointer', 
                    overflow: 'hidden',
                    border: '3px solid var(--primary)',
                    boxShadow: 'var(--card-shadow)',
                    transition: 'all 0.2s',
                    background: 'var(--bg-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  className="avatar-upload-hover"
                  title="Click to upload image"
                >
                  {profileForm.avatar_url ? (
                    <img 
                      src={profileForm.avatar_url} 
                      alt={profileForm.name} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent-purple) 100%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3.5rem', fontWeight: 'bold' }}>
                      {profileForm.name ? profileForm.name[0].toUpperCase() : 'U'}
                    </div>
                  )}
                  {/* Hover Overlay text */}
                  <div 
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      backgroundColor: 'rgba(3, 7, 18, 0.45)',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      opacity: 0,
                      transition: 'opacity 0.2s',
                      borderRadius: '50%'
                    }}
                    className="avatar-overlay-text"
                  >
                    Change Image
                  </div>
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                  Click to upload image
                </span>
              </div>

              {/* Form Grid below Avatar (stacked one by one in new line) */}
              <form onSubmit={handleProfileSave} className="profile-editor-form" style={{ flexGrow: 1, width: '100%' }}>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Display Name</label>
                  <input 
                    type="text" 
                    value={profileForm.name} 
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                    required
                  />
                </div>

                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Email Address</label>
                  <input 
                    type="email" 
                    value={profileForm.email} 
                    disabled
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-tertiary)', cursor: 'not-allowed' }}
                  />
                </div>

                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Contact Number</label>
                  <input 
                    type="text" 
                    value={profileForm.contact_no} 
                    onChange={(e) => setProfileForm({ ...profileForm, contact_no: e.target.value })}
                    placeholder="+1 (555) 019-2834"
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                  />
                </div>

                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Biography</label>
                  <textarea 
                    value={profileForm.bio} 
                    onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                    rows={3}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', fontFamily: 'inherit', resize: 'vertical' }}
                  />
                </div>

                <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem', width: 'fit-content' }}>
                  Save Changes
                </button>
              </form>
            </div>
          </div>
        )}

        {activeUtilityTab === 'settings' && (
          <div className="utility-view-container" style={{ maxWidth: '100%' }}>
            <div className="utility-view-header">
              <h2>Account Settings</h2>
              <p>Configure notifications, sound effects, security, and interface preferences.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', width: '100%', marginTop: '0.5rem' }}>
              {/* Box 1: Alerts & Notifications */}
              <div className="settings-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', color: 'var(--primary)' }}>
                  Alerts & Sounds
                </h3>
                
                <div className="settings-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="settings-info">
                    <span>Push Notifications</span>
                    <p>Receive alerts for incoming messages.</p>
                  </div>
                  <label className="switch">
                    <input 
                      type="checkbox" 
                      checked={appSettings.notifications} 
                      onChange={(e) => setAppSettings({ ...appSettings, notifications: e.target.checked })}
                    />
                    <span className="slider"></span>
                  </label>
                </div>

                <div className="settings-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="settings-info">
                    <span>Sound Effects</span>
                    <p>Play chime sounds on receiving messages.</p>
                  </div>
                  <label className="switch">
                    <input 
                      type="checkbox" 
                      checked={appSettings.sound} 
                      onChange={(e) => setAppSettings({ ...appSettings, sound: e.target.checked })}
                    />
                    <span className="slider"></span>
                  </label>
                </div>
              </div>

              {/* Box 2: Privacy & Receipts */}
              <div className="settings-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', color: 'var(--accent-purple)' }}>
                  Privacy & Presence
                </h3>
                
                <div className="settings-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="settings-info">
                    <span>Show Active Status</span>
                    <p>Allow workspace members to see you online.</p>
                  </div>
                  <label className="switch">
                    <input 
                      type="checkbox" 
                      checked={appSettings.showStatus} 
                      onChange={(e) => setAppSettings({ ...appSettings, showStatus: e.target.checked })}
                    />
                    <span className="slider"></span>
                  </label>
                </div>

                <div className="settings-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="settings-info">
                    <span>Read Receipts</span>
                    <p>Let members know when you view messages.</p>
                  </div>
                  <label className="switch">
                    <input 
                      type="checkbox" 
                      checked={appSettings.readReceipts} 
                      onChange={(e) => setAppSettings({ ...appSettings, readReceipts: e.target.checked })}
                    />
                    <span className="slider"></span>
                  </label>
                </div>
              </div>

              {/* Box 3: Theme Options */}
              <div className="settings-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', color: 'var(--accent-blue)' }}>
                  Theme & Display
                </h3>
                
                <div className="settings-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="settings-info">
                    <span>Dark Mode Theme</span>
                    <p>Toggle between light and dark backgrounds.</p>
                  </div>
                  <label className="switch">
                    <input 
                      type="checkbox" 
                      checked={theme === 'dark'} 
                      onChange={(e) => setTheme(e.target.checked ? 'dark' : 'light')}
                    />
                    <span className="slider"></span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeUtilityTab === 'media' && (
          <div className="utility-view-container" style={{ maxWidth: '100%' }}>
            <div className="utility-view-header">
              <h2>Shared Media</h2>
              <p>Browse photos, files, and blueprints uploaded across your channels.</p>
            </div>

            <div className="media-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1.5rem', width: '100%', margin: 0, marginTop: '0.5rem' }}>
              {sharedMediaList.map(item => (
                <div key={item.id} className="media-card">
                  <img src={item.url} alt={item.name} />
                  <div className="media-card-overlay">{item.name}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeUtilityTab === 'chats' && !activeRoomId && (
          <div className="welcome-panel">
            {/* Background Glow Orbs */}
            <div className="glow-orb orb-1"></div>
            <div className="glow-orb orb-2"></div>
            
            <div className="welcome-content">
              <div className="welcome-icon-wrapper">
                <MessageSquare size={40} />
              </div>
              <h2>Welcome to Whispr!</h2>
              <p>
                Select a conversation from the left panel to begin messaging, or start a new conversation.
              </p>
              
              <div className="welcome-suggestions">
                <button 
                  className="welcome-suggestion-btn" 
                  onClick={() => { setIsAddUserModalOpen(true); setAddUserError(null); }}
                >
                  <UserPlus size={16} />
                  <span>Start Direct Message</span>
                </button>
                <button 
                  className="welcome-suggestion-btn"
                  onClick={() => { setIsAddGroupModalOpen(true); setAddGroupError(null); }}
                >
                  <Users size={16} />
                  <span>Create Group Chat</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeUtilityTab === 'chats' && activeRoomId && activeRoom && (
          <main className="chat-main" style={{ height: '100%' }}>
            {/* Chat Header */}
            <header className="chat-header">
              <div className="chat-title-info">
                <h2 
                  className="clickable-title" 
                  onClick={() => setIsInfoDrawerOpen(true)}
                  title="Click to view details"
                >
                  {activeRoom.is_group ? '#' : ''}{activeRoom.name}
                </h2>
                <p>{activeRoom.description}</p>
              </div>
              <div className="chat-actions">
                {isChatSearchActive ? (
                  <div className="chat-search-container">
                    <Search size={14} style={{ color: 'var(--text-tertiary)' }} />
                    <input 
                      type="text" 
                      placeholder="Search messages..." 
                      value={chatSearchQuery}
                      onChange={(e) => setChatSearchQuery(e.target.value)}
                      autoFocus
                    />
                    
                    {chatSearchQuery.trim() && (
                      <span className="search-match-count">
                        {searchMatches.length > 0 ? `${activeMatchIndex + 1} of ${searchMatches.length}` : '0 of 0'}
                      </span>
                    )}

                    <button 
                      type="button"
                      className="search-nav-btn"
                      onClick={handlePrevMatch}
                      disabled={searchMatches.length === 0}
                      title="Previous match (Up)"
                    >
                      <ChevronUp size={14} />
                    </button>
                    <button 
                      type="button"
                      className="search-nav-btn"
                      onClick={handleNextMatch}
                      disabled={searchMatches.length === 0}
                      title="Next match (Down)"
                    >
                      <ChevronDown size={14} />
                    </button>

                    <button 
                      className="btn-icon" 
                      style={{ padding: '2px', marginLeft: '0.25rem' }}
                      onClick={() => {
                        setIsChatSearchActive(false);
                        setChatSearchQuery('');
                      }}
                      title="Close search"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <button 
                    className="btn-icon" 
                    title="Search messages"
                    onClick={() => setIsChatSearchActive(true)}
                  >
                    <Search size={18} />
                  </button>
                )}

                <button 
                  className="btn-icon" 
                  title="Clear Chat"
                  onClick={handleClearChat}
                  style={{ color: '#ef4444' }}
                >
                  <Trash2 size={18} />
                </button>

                <span className="badge-secure">
                  <Shield size={14} /> Secure
                </span>
              </div>
            </header>

            {/* Messages List */}
            <div className="messages-list">
              {currentMessages.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>
                  No messages in this chat yet. Say hello! 👋
                </div>
              ) : (
                currentMessages.map((msg) => (
                  <div key={msg.id} className={`message-row ${msg.isSelf ? 'self' : 'other'}`}>
                    {!msg.isSelf && <div className="message-avatar">{msg.sender[0]}</div>}
                    <div className="message-bubble-wrapper">
                      {!msg.isSelf && <span className="message-sender">{msg.sender}</span>}
                      <div className="message-bubble">
                        {renderMessageText(msg.id, msg.text)}
                        <div className="message-meta">
                          <span className="message-time">{msg.timestamp}</span>
                          {msg.isSelf && <CheckCheck size={14} className="status-icon" />}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="message-input-form">
              <input
                type="text"
                placeholder={`Message ${activeRoom.is_group ? '#' : ''}${activeRoom.name}...`}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />
              <button type="submit" className="btn btn-primary btn-send">
                <Send size={18} />
              </button>
            </form>
          </main>
        )}

        {/* Slide-out User/Room Details Drawer */}
        <aside className={`info-drawer ${isInfoDrawerOpen && activeRoomId && activeRoom ? 'open' : ''}`}>
          <div className="info-drawer-header">
            <h3>Details</h3>
            <button className="btn-icon" onClick={() => setIsInfoDrawerOpen(false)}>
              <X size={18} />
            </button>
          </div>

          {activeRoom && (
            <div className="info-drawer-body">
              <div className="info-drawer-avatar">
                {activeRoom.name[0].toUpperCase()}
              </div>
              
              <div className="info-section">
                <label>Name</label>
                <p style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                  {activeRoom.is_group ? '#' : ''}{activeRoom.name}
                </p>
              </div>

              <div className="info-section">
                <label>Description</label>
                <p>{activeRoom.description}</p>
              </div>

              {activeRoom.is_group && activeRoom.members && (
                <div className="info-section">
                  <label>Members ({activeRoom.members.length})</label>
                  <div className="member-list">
                    {activeRoom.members.map((member, i) => (
                      <div key={i} className="member-tag">
                        <div className="member-avatar-mini">{member[0].toUpperCase()}</div>
                        <span>{member}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!activeRoom.is_group && (activeRoom.partnerEmail || activeRoom.partnerContact) && (
                <div className="info-section">
                  <label>Contact Info</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.25rem' }}>
                    {activeRoom.partnerEmail && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        <Mail size={14} />
                        <span>{activeRoom.partnerEmail}</span>
                      </div>
                    )}
                    {activeRoom.partnerContact && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        <Phone size={14} />
                        <span>{activeRoom.partnerContact}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </aside>
      </div>

      {/* Modal: Add New User */}
      {isAddUserModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsAddUserModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Start Direct Message</h3>
              <button className="btn-icon" onClick={() => setIsAddUserModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleAddUserSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Full Name</label>
                  <input 
                    type="text" 
                    placeholder="E.g., Sarah Connor"
                    value={newUserForm.name}
                    onChange={(e) => {
                      setNewUserForm({ ...newUserForm, name: e.target.value });
                      setAddUserError(null);
                    }}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
                    required
                    autoFocus
                  />
                </div>
                <div className="form-group">
                  <label>Email Address</label>
                  <input 
                    type="email" 
                    placeholder="sarah@skynet.com"
                    value={newUserForm.email}
                    onChange={(e) => {
                      setNewUserForm({ ...newUserForm, email: e.target.value });
                      setAddUserError(null);
                    }}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
                    required
                  />
                  {addUserError && (
                    <span className="field-error-message">
                      {addUserError}
                    </span>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddUserModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Start DM
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add New Group */}
      {isAddGroupModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsAddGroupModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create Group Channel</h3>
              <button className="btn-icon" onClick={() => setIsAddGroupModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleAddGroupSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Group Name</label>
                  <input 
                    type="text" 
                    placeholder="E.g., design-ops"
                    value={newGroupForm.name}
                    onChange={(e) => {
                      setNewGroupForm({ ...newGroupForm, name: e.target.value });
                      setAddGroupError(null);
                    }}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
                    required
                    autoFocus
                  />
                  {addGroupError && (
                    <span className="field-error-message">
                      {addGroupError}
                    </span>
                  )}
                </div>
                <div className="form-group">
                  <label>Purpose / Description</label>
                  <input 
                    type="text" 
                    placeholder="E.g., Aligning visual assets and stylesheets"
                    value={newGroupForm.description}
                    onChange={(e) => {
                      setNewGroupForm({ ...newGroupForm, description: e.target.value });
                      setAddGroupError(null);
                    }}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
                  />
                </div>
                
                <div className="form-group">
                  <label>Add Member by Email</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input 
                      type="email" 
                      placeholder="E.g., member@example.com"
                      value={memberEmailInput}
                      onChange={(e) => {
                        setMemberEmailInput(e.target.value);
                        setAddGroupError(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddMemberByEmail();
                        }
                      }}
                      style={{ flexGrow: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
                    />
                    <button 
                      type="button" 
                      onClick={handleAddMemberByEmail}
                      disabled={isSearchingMember || !memberEmailInput.trim()}
                      className="btn btn-primary"
                      style={{ padding: '0', width: '44px', height: '44px', borderRadius: '8px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      title="Add member"
                    >
                      {isSearchingMember ? (
                        <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px', borderTopColor: '#ffffff' }}></div>
                      ) : (
                        <Plus size={18} />
                      )}
                    </button>
                  </div>
                  {memberSearchError && (
                    <span className="field-error-message">
                      {memberSearchError}
                    </span>
                  )}
                  
                  {/* Selected members capsules with radius shape border */}
                  {groupMembers.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.75rem' }}>
                      {groupMembers.map(member => (
                        <div 
                          key={member.id} 
                          style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '0.5rem', 
                            padding: '0.35rem 0.75rem', 
                            borderRadius: '20px', 
                            border: '1px solid var(--primary)', 
                            backgroundColor: 'var(--primary-glow)', 
                            fontSize: '0.8rem',
                            color: 'var(--primary)',
                            fontWeight: 600
                          }}
                        >
                          <span>{member.name} ({member.email})</span>
                          <button 
                            type="button" 
                            onClick={() => setGroupMembers(prev => prev.filter(m => m.id !== member.id))}
                            style={{ 
                              border: 'none', 
                              background: 'none', 
                              cursor: 'pointer', 
                              color: 'var(--primary)', 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              padding: 0
                            }}
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddGroupModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
