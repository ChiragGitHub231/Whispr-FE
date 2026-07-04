import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Search,
  LogOut,
  Check,
  CheckCheck,
  MessageSquare,
  User,
  Settings,
  Image,
  Info,
  MoreVertical,
  Plus,
  UserPlus,
  Users,
  X,
  Trash2,
  Mail,
  Phone,
  ChevronUp,
  ChevronDown,
  Paperclip,
  FileText,
  Download,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { User as AuthUser } from "../context/AuthContext";

interface Message {
  id: string;
  senderId: string;
  sender: string;
  avatar?: string;
  text: string;
  fileUrl?: string;
  timestamp: string;
  createdAt: string;
  isSelf: boolean;
  status?: "sent" | "read";
}

interface ChatRoom {
  id: string;
  name: string;
  description: string;
  unreadCount?: number;
  lastMessage?: string;
  is_group: boolean;
  members?: string[];
  memberIds?: string[];
  partnerEmail?: string;
  partnerContact?: string;
  partnerId?: string;
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
        setProfileForm((prev) => ({
          ...prev,
          avatar_url: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Set default state as null so that the empty/welcome landing canvas displays first
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [inputText, setInputText] = useState("");
  const wsRef = useRef<WebSocket | null>(null);
  const typingTimeoutRef = useRef<number | null>(null);
  const activeRoomIdRef = useRef<string | null>(null);

  // Attachment states and handlers
  const attachmentInputRef = useRef<HTMLInputElement>(null);
  const [attachment, setAttachment] = useState<{ name: string; dataUrl: string; type: string } | null>(null);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);

  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeRoomId) return;

    // Validate size - limit to 50MB
    if (file.size > 50 * 1024 * 1024) {
      setAttachmentError("File size is too large (maximum 50MB).");
      return;
    }

    setIsUploadingAttachment(true);
    setAttachmentError(null);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      setAttachment({
        name: file.name,
        type: file.type,
        dataUrl: reader.result as string,
      });
      setIsUploadingAttachment(false);
    };

    reader.onerror = () => {
      setAttachmentError("Failed to read file.");
      setIsUploadingAttachment(false);
    };
  };

  const handleRemoveAttachment = () => {
    setAttachment(null);
    setAttachmentError(null);
    if (attachmentInputRef.current) {
      attachmentInputRef.current.value = "";
    }
  };

  // Lightbox File Viewer State & Action
  const [activeLightboxFile, setActiveLightboxFile] = useState<{ url: string; name: string; type: string } | null>(null);
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<string | null>(null);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);

  const downloadImage = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      const link = document.createElement("a");
      link.href = url;
      link.target = "_blank";
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Active Utility Sidebar tab: 'chats' | 'profile' | 'settings' | 'media'
  const [activeUtilityTab, setActiveUtilityTab] = useState<
    "chats" | "profile" | "settings" | "media"
  >("chats");

  // Search Filters
  const [searchFilter, setSearchFilter] = useState("");
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<
    "all" | "unread" | "groups"
  >("all");

  // Specific Chat Search
  const [isChatSearchActive, setIsChatSearchActive] = useState(false);
  const [chatSearchQuery, setChatSearchQuery] = useState("");

  // Theme Management
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "light" || saved === "dark") return saved;
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    return prefersDark ? "dark" : "light";
  });

  useEffect(() => {
    activeRoomIdRef.current = activeRoomId;
  }, [activeRoomId]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
    } else {
      root.classList.add("light");
      root.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Info Drawer toggling
  const [isInfoDrawerOpen, setIsInfoDrawerOpen] = useState(false);
  const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);

  // Modals
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    name: "",
    email: "",
    initialMessage: "",
  });

  const [isAddGroupModalOpen, setIsAddGroupModalOpen] = useState(false);
  const [newGroupForm, setNewGroupForm] = useState({
    name: "",
    description: "",
  });

  const [isNewChatDropdownOpen, setIsNewChatDropdownOpen] = useState(false);
  const [addUserError, setAddUserError] = useState<string | null>(null);
  const [addGroupError, setAddGroupError] = useState<string | null>(null);

  // Group Member search and collection states
  const [groupMembers, setGroupMembers] = useState<AuthUser[]>([]);
  const [memberEmailInput, setMemberEmailInput] = useState("");
  const [memberSearchError, setMemberSearchError] = useState<string | null>(
    null,
  );
  const [isSearchingMember, setIsSearchingMember] = useState(false);

  // Profile settings local state
  const [profileForm, setProfileForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    contact_no: user?.contact_no || "",
    avatar_url: user?.avatar_url || "",
    bio: user
      ? localStorage.getItem(`whispr_bio_${user.id}`) ||
        "Excited to chat and build premium apps with Whispr! 🚀"
      : "Excited to chat and build premium apps with Whispr! 🚀",
    status: "Active",
  });
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // App settings state
  const [appSettings, setAppSettings] = useState({
    notifications: true,
    sound: true,
    showStatus: true,
    readReceipts: true,
  });

  // Sync profileForm once user details load
  useEffect(() => {
    if (user) {
      setProfileForm((prev) => ({
        ...prev,
        name: user.name,
        email: user.email,
        contact_no: user.contact_no || "",
        avatar_url: user.avatar_url || "",
        bio:
          localStorage.getItem(`whispr_bio_${user.id}`) ||
          "Excited to chat and build premium apps with Whispr! 🚀",
      }));
    }
  }, [user]);

  // Reset profileForm when switching away from the profile utility tab
  useEffect(() => {
    if (activeUtilityTab !== "profile" && user) {
      setProfileForm((prev) => ({
        ...prev,
        name: user.name,
        email: user.email,
        contact_no: user.contact_no || "",
        avatar_url: user.avatar_url || "",
      }));
    }
  }, [activeUtilityTab, user]);
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);
  const [roomsError, setRoomsError] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<Record<string, string[]>>({});
  const [presenceMap, setPresenceMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        setIsLoadingRooms(true);
        setRoomsError(null);
        const response = await fetch("/api/rooms");
        if (!response.ok) {
          throw new Error("Failed to load conversations.");
        }
        const data = await response.json();

        // Populate initial presenceMap from fetched user statuses
        const initialPresence: Record<string, boolean> = {};
        data.rooms.forEach((room: any) => {
          room.room_members?.forEach((member: any) => {
            if (member.profiles?.user_status) {
              initialPresence[member.profiles.id] = member.profiles.user_status.is_online;
            }
          });
        });
        setPresenceMap((prev) => ({ ...initialPresence, ...prev }));

        const mappedRooms: ChatRoom[] = data.rooms.map((room: any) => {
          let displayName = room.name || "Direct Message";
          let partnerEmail = undefined;
          let partnerContact = undefined;
          let partnerId = undefined;
          if (!room.is_group && room.room_members) {
            const partner = room.room_members.find(
              (m: any) => m.profiles.id !== user?.id,
            );
            if (partner) {
              displayName = partner.profiles.name;
              partnerEmail = partner.profiles.email;
              partnerContact = partner.profiles.contact_no || undefined;
              partnerId = partner.profiles.id;
            }
          }

          return {
            id: room.id,
            name: displayName,
            description: room.is_group
              ? room.description || "No description."
              : `DM conversation with ${displayName}`,
            is_group: room.is_group,
            lastMessage: room.messages && room.messages[0]
              ? (room.messages[0].text || (room.messages[0].file_url ? "📎 Attachment" : ""))
              : "No messages yet.",
            members: room.room_members?.map((m: any) => m.profiles.name) || [],
            memberIds: room.room_members?.map((m: any) => m.profiles.id) || [],
            partnerEmail,
            partnerContact,
            partnerId,
          };
        });

        setRooms(mappedRooms);
      } catch (err: any) {
        console.error("Failed to load rooms:", err);
        setRoomsError(
          err.message || "An error occurred while fetching conversations.",
        );
      } finally {
        setIsLoadingRooms(false);
      }
    };

    if (user) {
      fetchRooms();
    }
  }, [user]);

  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreMap, setHasMoreMap] = useState<Record<string, boolean>>({});
  const [shouldScrollInstantly, setShouldScrollInstantly] = useState<Record<string, boolean>>({});
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const lastMessageIdRef = useRef<Record<string, string>>({});

  const updateRoomPreview = (
    roomId: string,
    previewText: string,
    options?: { unread?: boolean; forceTop?: boolean },
  ) => {
    setRooms((prev) => {
      const existing = prev.find((room) => room.id === roomId);
      if (!existing) return prev;

      const updatedRoom = {
        ...existing,
        lastMessage: previewText,
        unreadCount:
          options?.unread === true
            ? (existing.unreadCount || 0) + 1
            : existing.unreadCount,
      };

      return [updatedRoom, ...prev.filter((room) => room.id !== roomId)];
    });
  };

  useEffect(() => {
    if (!user) return;

    let ws: WebSocket | null = null;
    let reconnectTimeoutId: any = null;
    let isClosedIntentionally = false;

    const connect = () => {
      const protocol = window.location.protocol === "https:" ? "wss" : "ws";
      const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
      const wsHost = isLocal ? `${window.location.hostname}:3001` : window.location.host;
      
      ws = new WebSocket(`${protocol}://${wsHost}/ws`);
      wsRef.current = ws;

      ws.onopen = () => {
        ws?.send(JSON.stringify({ event: "auth", userId: user.id }));
      };

      ws.onerror = (error) => {
        // Silent error
      };

      ws.onclose = (event) => {
        // Attempt to reconnect in 3 seconds if not closed intentionally
        if (!isClosedIntentionally) {
          reconnectTimeoutId = setTimeout(() => {
            connect();
          }, 3000);
        }
      };

      ws.onmessage = (event) => {
        const payload = JSON.parse(event.data);
        if (!payload?.event) return;

        switch (payload.event) {
          case "message:new": {
            const message = payload.payload;
            const normalizedMessage = {
              id: message.id,
              senderId: message.senderId,
              sender: message.sender?.name || "Unknown",
              avatar: message.sender?.avatarUrl,
              text: message.text || "",
              fileUrl: message.fileUrl,
              timestamp: new Date(message.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
              createdAt: message.createdAt,
              isSelf: message.senderId === user.id,
              status: message.status,
            };

            setMessages((prev) => {
              const currentList = prev[message.roomId] || [];
              // Deduplicate to prevent double-rendering if sender receives their own broadcast
              if (currentList.some((msg) => msg.id === normalizedMessage.id)) {
                return prev;
              }
              return {
                ...prev,
                [message.roomId]: [...currentList, normalizedMessage],
              };
            });

            const previewText = message.text || "📎 Attachment";
            updateRoomPreview(message.roomId, previewText, {
              unread:
                message.senderId !== user.id &&
                message.roomId !== activeRoomIdRef.current,
            });
            break;
          }
          case "message:read": {
            const { roomId, messageIds } = payload.payload;
            setMessages((prev) => ({
              ...prev,
              [roomId]: (prev[roomId] || []).map((msg) =>
                messageIds.includes(msg.id) ? { ...msg, status: "read" } : msg,
              ),
            }));

            setRooms((prev) =>
              prev.map((room) =>
                room.id === roomId ? { ...room, unreadCount: 0 } : room,
              ),
            );
            break;
          }
          case "typing:update": {
            const {
              roomId,
              userId: typingUserId,
              userName,
              isTyping,
            } = payload.payload;
            if (typingUserId === user.id) return;
            setTypingUsers((prev) => {
              const current = prev[roomId] || [];
              const next = isTyping
                ? Array.from(new Set([...current, userName || typingUserId]))
                : current.filter((name) => name !== (userName || typingUserId));
              return { ...prev, [roomId]: next };
            });
            break;
          }
          case "presence:update": {
            setPresenceMap((prev) => ({
              ...prev,
              [payload.payload.userId]: payload.payload.isOnline,
            }));
            break;
          }
          case "message:delete": {
            const { messageId, roomId } = payload.payload;
            setMessages((prev) => {
              const currentList = prev[roomId] || [];
              const isLast = currentList.length > 0 && currentList[currentList.length - 1].id === messageId;
              const updatedList = currentList.map((msg) =>
                msg.id === messageId
                  ? { ...msg, status: "deleted", text: "", fileUrl: undefined }
                  : msg
              );

              if (isLast) {
                setRooms((prevRooms) =>
                  prevRooms.map((room) =>
                    room.id === roomId
                      ? { ...room, lastMessage: "This chat has been deleted" }
                      : room
                  )
                );
              }

              return {
                ...prev,
                [roomId]: updatedList,
              };
            });
            break;
          }
          case "message:clear": {
            const { roomId, systemMessage } = payload.payload;
            const normalizedSystemMessage = {
              id: systemMessage.id,
              senderId: systemMessage.senderId,
              sender: systemMessage.sender?.name || "System",
              avatar: systemMessage.sender?.avatarUrl,
              text: systemMessage.text || "",
              fileUrl: systemMessage.fileUrl,
              timestamp: new Date(systemMessage.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
              createdAt: systemMessage.createdAt,
              isSelf: false,
              status: systemMessage.status,
            };

            setMessages((prev) => ({
              ...prev,
              [roomId]: [normalizedSystemMessage],
            }));

            setRooms((prev) =>
              prev.map((room) =>
                room.id === roomId
                  ? {
                      ...room,
                      lastMessage: systemMessage.text,
                    }
                  : room
              )
            );
            break;
          }
          default:
            break;
        }
      };
    };

    connect();

    return () => {
      isClosedIntentionally = true;
      if (ws) {
        ws.close();
      }
      if (reconnectTimeoutId) {
        clearTimeout(reconnectTimeoutId);
      }
    };
  }, [user]);

  useEffect(() => {
    if (!activeRoomId || !user) return;

    const fetchMessages = async () => {
      try {
        setIsLoadingMessages(true);
        const response = await fetch(`/api/messages/${activeRoomId}?limit=30`);
        if (!response.ok) {
          throw new Error("Failed to fetch messages.");
        }
        const data = await response.json();
        const mapped = (data.messages || []).map((message: any) => ({
          id: message.id,
          senderId: message.senderId,
          sender: message.sender?.name || "Unknown",
          avatar: message.sender?.avatarUrl,
          text: message.text || "",
          fileUrl: message.fileUrl,
          timestamp: new Date(message.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          createdAt: message.createdAt,
          isSelf: message.senderId === user.id,
          status: message.status,
        }));

        setMessages((prev) => ({
          ...prev,
          [activeRoomId]: mapped,
        }));

        setHasMoreMap((prev) => ({
          ...prev,
          [activeRoomId]: !!data.hasMore,
        }));

        setShouldScrollInstantly((prev) => ({
          ...prev,
          [activeRoomId]: true,
        }));

        setRooms((prev) =>
          prev.map((room) =>
            room.id === activeRoomId
              ? {
                  ...room,
                  lastMessage:
                    mapped.length > 0
                      ? mapped[mapped.length - 1].text
                      : "No messages yet.",
                }
              : room,
          ),
        );
      } catch (error) {
        console.error("Failed to fetch messages:", error);
      } finally {
        setIsLoadingMessages(false);
      }
    };

    if (!messages[activeRoomId]) {
      fetchMessages();
    } else {
      const fetchSilent = async () => {
        try {
          const response = await fetch(`/api/messages/${activeRoomId}?limit=30`);
          if (response.ok) {
            const data = await response.json();
            const mapped = (data.messages || []).map((message: any) => ({
              id: message.id,
              senderId: message.senderId,
              sender: message.sender?.name || "Unknown",
              avatar: message.sender?.avatarUrl,
              text: message.text || "",
              fileUrl: message.fileUrl,
              timestamp: new Date(message.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
              createdAt: message.createdAt,
              isSelf: message.senderId === user.id,
              status: message.status,
            }));

            setMessages((prev) => ({
              ...prev,
              [activeRoomId]: mapped,
            }));

            setHasMoreMap((prev) => ({
              ...prev,
              [activeRoomId]: !!data.hasMore,
            }));
          }
        } catch (e) {
          console.error("Background sync failed:", e);
        }
      };
      fetchSilent();
    }
  }, [activeRoomId, user]);

  useEffect(() => {
    if (!activeRoomId || !user) return;

    const unreadMessages = (messages[activeRoomId] || []).filter(
      (msg) => !msg.isSelf && msg.status !== "read",
    );

    if (unreadMessages.length === 0) return;

    const ids = unreadMessages.map((msg) => msg.id);
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          event: "message:read",
          roomId: activeRoomId,
          messageIds: ids,
        }),
      );
    }
  }, [messages, activeRoomId, user]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [activeMatchIndex, setActiveMatchIndex] = useState<number>(0);

  const getSearchMatches = (): {
    messageId: string;
    indexInMessage: number;
  }[] => {
    if (!isChatSearchActive || !chatSearchQuery.trim() || !activeRoomId)
      return [];
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
          indexInMessage: idx,
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
        const element = document.getElementById("active-search-match");
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [activeMatchIndex, chatSearchQuery, isChatSearchActive]);

  const handlePrevMatch = () => {
    if (searchMatches.length === 0) return;
    setActiveMatchIndex(
      (prev) => (prev - 1 + searchMatches.length) % searchMatches.length,
    );
  };

  const handleNextMatch = () => {
    if (searchMatches.length === 0) return;
    setActiveMatchIndex((prev) => (prev + 1) % searchMatches.length);
  };

  const prevRoomIdRef = useRef<string | null>(null);

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  const isNearBottom = () => {
    const container = messagesContainerRef.current;
    if (!container) return true;
    const threshold = 150;
    return container.scrollHeight - container.scrollTop - container.clientHeight <= threshold;
  };

  const loadMoreMessages = async () => {
    const roomId = activeRoomId;
    if (!roomId || !user || isLoadingMore) return;

    const roomMessages = messages[roomId] || [];
    if (roomMessages.length === 0) return;

    const oldestMessage = roomMessages[0];
    const beforeTimestamp = oldestMessage.createdAt;

    try {
      setIsLoadingMore(true);

      const container = messagesContainerRef.current;
      const prevScrollHeight = container ? container.scrollHeight : 0;
      const prevScrollTop = container ? container.scrollTop : 0;

      const response = await fetch(`/api/messages/${roomId}?limit=30&before=${encodeURIComponent(beforeTimestamp)}`);
      if (!response.ok) {
        throw new Error("Failed to load more messages.");
      }

      const data = await response.json();
      const mapped = (data.messages || []).map((message: any) => ({
        id: message.id,
        senderId: message.senderId,
        sender: message.sender?.name || "Unknown",
        avatar: message.sender?.avatarUrl,
        text: message.text || "",
        fileUrl: message.fileUrl,
        timestamp: new Date(message.createdAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        createdAt: message.createdAt,
        isSelf: message.senderId === user.id,
        status: message.status,
      }));

      if (mapped.length > 0) {
        setMessages((prev) => {
          const currentList = prev[roomId] || [];
          const existingIds = new Set(currentList.map((m) => m.id));
          const filteredMapped = mapped.filter((m: any) => !existingIds.has(m.id));
          return {
            ...prev,
            [roomId]: [...filteredMapped, ...currentList],
          };
        });

        requestAnimationFrame(() => {
          if (container) {
            const newScrollHeight = container.scrollHeight;
            container.scrollTop = newScrollHeight - prevScrollHeight + prevScrollTop;
          }
        });
      }

      setHasMoreMap((prev) => ({
        ...prev,
        [roomId]: !!data.hasMore,
      }));
    } catch (err) {
      console.error("Error loading more messages:", err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    if (container.scrollTop <= 10 && hasMoreMap[activeRoomId || ""] && !isLoadingMore && !isLoadingMessages) {
      loadMoreMessages();
    }
  };

  useEffect(() => {
    if (isLoadingMessages) return;
    const roomId = activeRoomId;
    if (!roomId) return;

    const isRoomChange = prevRoomIdRef.current !== roomId;
    prevRoomIdRef.current = roomId;

    const roomMessages = messages[roomId] || [];
    const lastMessage = roomMessages[roomMessages.length - 1];
    const lastMessageId = lastMessage?.id;

    // Check if the last message has actually changed (i.e. a new message was appended)
    const hasNewMessageAppended = lastMessageId && lastMessageIdRef.current[roomId] !== lastMessageId;

    // Update the ref
    if (lastMessageId) {
      lastMessageIdRef.current[roomId] = lastMessageId;
    }

    if (isRoomChange || shouldScrollInstantly[roomId]) {
      scrollToBottom("auto");
      setShouldScrollInstantly((prev) => ({ ...prev, [roomId]: false }));
    } else if (hasNewMessageAppended) {
      const isLastMessageSelf = lastMessage?.isSelf;
      if (isNearBottom() || isLastMessageSelf) {
        scrollToBottom("smooth");
      }
    }
  }, [messages, activeRoomId, isLoadingMessages]);

  // Auto-close details drawer & mobile header menu when switching active room
  useEffect(() => {
    setIsInfoDrawerOpen(false);
    setIsHeaderMenuOpen(false);
  }, [activeRoomId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRoomId || (!inputText.trim() && !attachment) || !user) return;

    const text = inputText.trim();
    const currentAttachment = attachment;

    setInputText("");
    setAttachment(null);
    setAttachmentError(null);

    try {
      let fileUrl = null;

      // Upload to bucket only when clicking Send
      if (currentAttachment) {
        setIsUploadingAttachment(true);
        const uploadResponse = await fetch(`/api/messages/${activeRoomId}/upload`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ file_data_url: currentAttachment.dataUrl, original_name: currentAttachment.name }),
        });

        if (!uploadResponse.ok) {
          const data = await uploadResponse.json();
          throw new Error(data.message || "Failed to upload file.");
        }

        const uploadData = await uploadResponse.json();
        fileUrl = uploadData.file_url;
      }

      const response = await fetch(`/api/messages/${activeRoomId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text || null, file_url: fileUrl }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to send message.");
      }

      const data = await response.json();
      const message = data.message;
      const normalizedMessage = {
        id: String(message.id),
        senderId: message.senderId,
        sender: message.sender?.name || user.name,
        avatar: message.sender?.avatarUrl,
        text: message.text || "",
        fileUrl: message.fileUrl,
        timestamp: new Date(message.createdAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        createdAt: message.createdAt,
        isSelf: true,
        status: message.status,
      };

      setMessages((prev) => ({
        ...prev,
        [activeRoomId]: (prev[activeRoomId] || []).some(
          (msg) => msg.id === normalizedMessage.id,
        )
          ? prev[activeRoomId]
          : [...(prev[activeRoomId] || []), normalizedMessage],
      }));

      setRooms((prev) => {
        const roomExists = prev.some((room) => room.id === activeRoomId);
        if (!roomExists) return prev;

        return [
          ...prev.filter((room) => room.id !== activeRoomId),
          {
            ...prev.find((room) => room.id === activeRoomId)!,
            lastMessage: message.text || "📎 Attachment",
          },
        ];
      });
    } catch (error: any) {
      console.error("Failed to send message:", error);
      // Restore inputs so user doesn't lose progress on error
      setInputText(text);
      setAttachment(currentAttachment);
      setAttachmentError(error.message || "Failed to send. Please try again.");
    } finally {
      setIsUploadingAttachment(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleAddMemberByEmail = async () => {
    const email = memberEmailInput.trim().toLowerCase();
    if (!email) return;

    if (user && email === user.email.toLowerCase()) {
      setMemberSearchError("You cannot add yourself to the group list.");
      return;
    }

    if (groupMembers.some((m) => m.email.toLowerCase() === email)) {
      setMemberSearchError("User is already added to the group list.");
      return;
    }

    setIsSearchingMember(true);
    setMemberSearchError(null);

    try {
      const response = await fetch(
        `/api/auth/check/${encodeURIComponent(email)}`,
      );
      const data = await response.json();

      if (!response.ok) {
        setMemberSearchError(
          data.message || "User does not exist in the database.",
        );
        return;
      }

      if (data.exists && data.profile) {
        setGroupMembers((prev) => [...prev, data.profile]);
        setMemberEmailInput("");
      } else {
        setMemberSearchError("User profile not found.");
      }
    } catch (error) {
      console.error("Failed to verify user email:", error);
      setMemberSearchError("Network error checking user email.");
    } finally {
      setIsSearchingMember(false);
    }
  };

  const handleAddUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserForm.name.trim() || !newUserForm.email.trim()) return;

    try {
      const response = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          is_group: false,
          email: newUserForm.email.trim(),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          data.message || "Failed to start direct message conversation.",
        );
      }

      const room = data.room;
      let displayName = room.name;
      if (!displayName && room.room_members) {
        const partner = room.room_members.find(
          (m: any) => m.profiles.id !== user?.id,
        );
        if (partner) {
          displayName = partner.profiles.name;
        }
      }
      displayName = displayName || newUserForm.name.trim();

      const partnerObj = room.room_members?.find(
        (m: any) => m.profiles.id !== user?.id,
      );
      const newRoom: ChatRoom = {
        id: room.id,
        name: displayName,
        description: `Direct Message conversation with ${displayName}`,
        is_group: false,
        lastMessage: "Chat started",
        members: room.room_members?.map((m: any) => m.profiles.name) || [],
        partnerEmail: partnerObj?.profiles.email || newUserForm.email.trim(),
        partnerContact: partnerObj?.profiles.contact_no || undefined,
      };

      setRooms((prev) => [newRoom, ...prev]);
      setMessages((prev) => ({
        ...prev,
        [room.id]: [],
      }));

      setActiveRoomId(room.id);
      setActiveUtilityTab("chats");
      setIsAddUserModalOpen(false);
      setNewUserForm({ name: "", email: "", initialMessage: "" });
    } catch (err: any) {
      setAddUserError(err.message || "Failed to create direct message.");
    }
  };

  const handleAddGroupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupForm.name.trim()) return;

    if (groupMembers.length === 0) {
      setAddGroupError("Please add at least one member to create a group.");
      return;
    }

    try {
      const response = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          is_group: true,
          name: newGroupForm.name.trim(),
          email: groupMembers.map((m) => m.email),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to create group room.");
      }

      const room = data.room;
      const memberNames = ["You", ...groupMembers.map((m) => m.name)];
      const newRoom: ChatRoom = {
        id: room.id,
        name: room.name || newGroupForm.name.trim(),
        description:
          newGroupForm.description.trim() || "No description provided.",
        is_group: true,
        lastMessage: "Group created",
        members: memberNames,
      };

      setRooms((prev) => [newRoom, ...prev]);
      setMessages((prev) => ({
        ...prev,
        [room.id]: [
          {
            id: Date.now().toString(),
            sender: "System",
            text: `Group room "${newRoom.name}" created with members: ${memberNames.join(", ")}.`,
            timestamp: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            isSelf: false,
          },
        ],
      }));

      setActiveRoomId(room.id);
      setActiveUtilityTab("chats");
      setIsAddGroupModalOpen(false);
      setNewGroupForm({ name: "", description: "" });
      setGroupMembers([]);
      setMemberEmailInput("");
      setMemberSearchError(null);
    } catch (err: any) {
      setAddGroupError(err.message || "Failed to create group.");
    }
  };

  const handleClearChat = () => {
    setIsClearConfirmOpen(true);
  };

  const handleClearChatConfirm = async () => {
    setIsClearConfirmOpen(false);
    if (!activeRoomId) return;
    const room = rooms.find((r) => r.id === activeRoomId);
    if (!room) return;

    try {
      const response = await fetch(`/api/messages/room/${activeRoomId}/clear`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to clear chat history.");
      }

      const data = await response.json();
      const systemMessage = data.systemMessage;

      const normalizedSystemMessage = {
        id: systemMessage.id,
        senderId: systemMessage.senderId,
        sender: systemMessage.sender?.name || "System",
        avatar: systemMessage.sender?.avatarUrl,
        text: systemMessage.text || "",
        fileUrl: systemMessage.fileUrl,
        timestamp: new Date(systemMessage.createdAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        createdAt: systemMessage.createdAt,
        isSelf: false,
        status: systemMessage.status,
      };

      setMessages((prev) => ({
        ...prev,
        [activeRoomId]: [normalizedSystemMessage],
      }));

      setRooms((prev) =>
        prev.map((r) =>
          r.id === activeRoomId ? { ...r, lastMessage: systemMessage.text } : r,
        ),
      );
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to clear chat history.");
    }
  };

  const handleDeleteMessage = async () => {
    if (!deleteConfirmTarget) return;
    const messageId = deleteConfirmTarget;
    setDeleteConfirmTarget(null);

    try {
      const response = await fetch(`/api/messages/${messageId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete message.");
      }

      setMessages((prev) => {
        const currentList = prev[activeRoomId!] || [];
        const isLast = currentList.length > 0 && currentList[currentList.length - 1].id === messageId;
        const updatedList = currentList.map((msg) =>
          msg.id === messageId
            ? { ...msg, status: "deleted", text: "", fileUrl: undefined }
            : msg
        );

        if (isLast) {
          setRooms((prevRooms) =>
            prevRooms.map((room) =>
              room.id === activeRoomId
                ? { ...room, lastMessage: "This chat has been deleted" }
                : room
            )
          );
        }

        return {
          ...prev,
          [activeRoomId!]: updatedList,
        };
      });
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to delete message.");
    }
  };

  const handleTyping = (value: string) => {
    setInputText(value);
    if (
      !activeRoomId ||
      !wsRef.current ||
      wsRef.current.readyState !== WebSocket.OPEN
    )
      return;

    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current);
    }

    wsRef.current.send(
      JSON.stringify({
        event: "typing",
        roomId: activeRoomId,
        userName: user?.name || "User",
      }),
    );

    typingTimeoutRef.current = window.setTimeout(() => {
      wsRef.current?.send(
        JSON.stringify({
          event: "typing-stop",
          roomId: activeRoomId,
          userName: user?.name || "User",
        }),
      );
    }, 1200);
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      const response = await fetch("/api/auth/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: profileForm.name,
          contact_no: profileForm.contact_no,
          avatar_url: profileForm.avatar_url,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update profile.");
      }

      if (user) {
        localStorage.setItem(`whispr_bio_${user.id}`, profileForm.bio);
      }

      updateUser({
        name: data.user.name,
        contact_no: data.user.contact_no,
        avatar_url: data.user.avatar_url,
      });

      setProfileForm((prev) => ({
        ...prev,
        avatar_url: data.user.avatar_url || "",
      }));

      setProfileMessage("Profile details updated successfully!");
      setTimeout(() => setProfileMessage(null), 3000);
    } catch (err: any) {
      console.error("Failed to update profile:", err);
      setProfileMessage(
        err.message || "An error occurred while saving profile changes.",
      );
      setTimeout(() => setProfileMessage(null), 4000);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const activeRoom = activeRoomId
    ? rooms.find((r) => r.id === activeRoomId) || null
    : null;
  const currentMessages = activeRoomId ? messages[activeRoomId] || [] : [];

  // Filter conversations list
  const filteredRooms = rooms.filter((room) => {
    const matchesSearch = room.name
      .toLowerCase()
      .includes(searchFilter.toLowerCase());
    if (!matchesSearch) return false;

    if (activeCategoryFilter === "unread") {
      return room.unreadCount && room.unreadCount > 0;
    }
    if (activeCategoryFilter === "groups") {
      return room.is_group === true;
    }
    return true;
  });

  // Highlight matches text helper
  const renderMessageText = (messageId: string, text: string) => {
    if (!text) return null;
    if (!chatSearchQuery.trim() || !isChatSearchActive) return <p>{text}</p>;

    const regex = new RegExp(
      `(${chatSearchQuery.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&")})`,
      "gi",
    );
    const parts = text.split(regex);

    const firstGlobalMatchIndex = searchMatches.findIndex(
      (m) => m.messageId === messageId,
    );
    let matchCount = 0;

    return (
      <p>
        {parts.map((part, index) => {
          if (regex.test(part)) {
            const currentGlobalIndex =
              firstGlobalMatchIndex !== -1
                ? firstGlobalMatchIndex + matchCount
                : -1;
            const isActive = currentGlobalIndex === activeMatchIndex;
            matchCount++;

            return (
              <span
                key={index}
                id={isActive ? "active-search-match" : undefined}
                className={`message-highlight ${isActive ? "active" : ""}`}
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

  // Dynamic Shared Media attachments list from the active room's messages
  const activeRoomMessages = activeRoomId ? messages[activeRoomId] || [] : [];
  const sharedMediaList = activeRoomMessages
    .filter((msg) => msg.fileUrl && msg.status !== "deleted")
    .map((msg) => {
      const urlParts = msg.fileUrl!.split("/");
      const filename = decodeURIComponent(urlParts[urlParts.length - 1]);
      const cleanName = filename.replace(/^[a-f0-9-]{36}_\d+_/, "").replace(/^\w+_\d+_/, "");
      
      let fileType = "document";
      if (/\.(jpg|jpeg|png|gif|webp|svg)/i.test(msg.fileUrl!)) {
        fileType = "image";
      } else if (/\.(mp4|webm|ogg|mov)/i.test(msg.fileUrl!)) {
        fileType = "video";
      }

      return {
        id: msg.id,
        name: cleanName || "Attachment",
        url: msg.fileUrl!,
        type: fileType,
      };
    });

  return (
    <div
      className={`chat-layout-grid ${activeUtilityTab !== "chats" ? "utility-expanded" : ""}`}
    >
      {/* COLUMN 1: Utility Bar (Left-Most Strip - 20% width) */}
      <aside className="utility-bar">
        <div>
          <div className="utility-header" title="Whispr">
            <MessageSquare className="brand-icon" size={24} />
            <span>Whispr</span>
          </div>

          <nav className="utility-nav">
            <button
              className={`utility-nav-item ${activeUtilityTab === "chats" ? "active" : ""}`}
              onClick={() => setActiveUtilityTab("chats")}
              title="Chats"
            >
              <MessageSquare size={18} />
              <span>Chats</span>
            </button>
            <button
              className={`utility-nav-item ${activeUtilityTab === "profile" ? "active" : ""}`}
              onClick={() => setActiveUtilityTab("profile")}
              title="Profile"
            >
              <User size={18} />
              <span>Profile</span>
            </button>
            <button
              className={`utility-nav-item ${activeUtilityTab === "settings" ? "active" : ""}`}
              onClick={() => {
                setActiveUtilityTab("settings");
              }}
              title="Settings"
            >
              <Settings size={18} />
              <span>Settings</span>
            </button>
            <button
              className={`utility-nav-item ${activeUtilityTab === "media" ? "active" : ""}`}
              onClick={() => setActiveUtilityTab("media")}
              title="Media"
            >
              <Image size={18} />
              <span>Media</span>
            </button>
          </nav>
        </div>

        <div
          className="utility-bar-footer"
          style={{ borderTop: "none", paddingTop: 0 }}
        >
          <div
            className="utility-user-card"
            title={user?.name || "User Profile"}
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: "0.75rem",
              background: "none",
              border: "none",
              padding: 0,
              justifyContent: "flex-start",
              width: "100%",
            }}
          >
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user?.name || "User"}
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  border: "none",
                  objectFit: "cover",
                  flexShrink: 0,
                }}
              />
            ) : (
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  background:
                    "linear-gradient(135deg, var(--primary) 0%, var(--accent-purple) 100%)",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: "1rem",
                  border: "none",
                  flexShrink: 0,
                }}
              >
                {user?.name ? user.name[0].toUpperCase() : "U"}
              </div>
            )}
            <div
              className="utility-user-details"
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                textAlign: "left",
                overflow: "hidden",
                width: "100%",
              }}
            >
              <h4
                style={{
                  margin: 0,
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  width: "100%",
                }}
              >
                {user?.name || "User"}
              </h4>
              <span
                style={{
                  fontSize: "0.75rem",
                  color: "var(--accent-green)",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.25rem",
                  fontWeight: 500,
                }}
              >
                <span
                  style={{
                    width: "6px",
                    height: "6px",
                    backgroundColor: "var(--accent-green)",
                    borderRadius: "50%",
                    display: "inline-block",
                  }}
                ></span>
                Online
              </span>
            </div>
          </div>
          <button
            className="utility-logout-btn"
            onClick={handleLogout}
            style={{ marginTop: "0.75rem" }}
            title="Log Out"
          >
            <LogOut size={16} />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* COLUMN 2: Conversations List (Left-Center Panel - 20% width) */}
      {activeUtilityTab === "chats" && (
        <div className="conversations-list-panel">
          <div className="conversations-header">
            <div className="conversations-title-row" style={{ width: "100%" }}>
              <h3>Conversations</h3>

              <div className="new-chat-dropdown-container">
                <button
                  className="btn-icon"
                  title="New Chat"
                  onClick={() =>
                    setIsNewChatDropdownOpen(!isNewChatDropdownOpen)
                  }
                >
                  <Plus size={18} />
                </button>

                {isNewChatDropdownOpen && (
                  <>
                    <div
                      style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        zIndex: 99,
                      }}
                      onClick={() => setIsNewChatDropdownOpen(false)}
                    />
                    <div className="new-chat-dropdown">
                      <button
                        onClick={() => {
                          setIsAddUserModalOpen(true);
                          setAddUserError(null);
                          setIsNewChatDropdownOpen(false);
                        }}
                      >
                        <UserPlus size={16} />
                        <span>Add New User</span>
                      </button>
                      <button
                        onClick={() => {
                          setIsAddGroupModalOpen(true);
                          setAddGroupError(null);
                          setIsNewChatDropdownOpen(false);
                        }}
                      >
                        <Users size={16} />
                        <span>Add New Group</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="conversations-search-filter" style={{ padding: "1rem 1.25rem 0.5rem 1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div
              className="search-bar"
              style={{ padding: "0", borderBottom: "none" }}
            >
              <Search
                size={16}
                className="search-icon"
                style={{ left: "0.75rem" }}
              />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                style={{ paddingLeft: "2.25rem" }}
              />
            </div>

            <div className="filter-pills-row">
              <button
                className={`filter-pill ${activeCategoryFilter === "all" ? "active" : ""}`}
                onClick={() => setActiveCategoryFilter("all")}
              >
                All
              </button>
              <button
                className={`filter-pill ${activeCategoryFilter === "unread" ? "active" : ""}`}
                onClick={() => setActiveCategoryFilter("unread")}
              >
                Unread
              </button>
              <button
                className={`filter-pill ${activeCategoryFilter === "groups" ? "active" : ""}`}
                onClick={() => setActiveCategoryFilter("groups")}
              >
                Groups
              </button>
            </div>
          </div>

          <div className="channels-section" style={{ padding: "1rem" }}>
            <div className="rooms-list">
              {isLoadingRooms ? (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    padding: "2rem",
                  }}
                >
                  <div
                    className="spinner"
                    style={{ width: "24px", height: "24px" }}
                  ></div>
                </div>
              ) : roomsError ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "1.5rem 1rem",
                    color: "#ef4444",
                  }}
                >
                  <p style={{ fontSize: "0.85rem", fontWeight: 600 }}>
                    {roomsError}
                  </p>
                </div>
              ) : filteredRooms.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "2rem 1rem",
                    color: "var(--text-tertiary)",
                  }}
                >
                  <p
                    style={{
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      color: "var(--text-secondary)",
                      marginBottom: "0.25rem",
                    }}
                  >
                    {activeCategoryFilter === "groups"
                      ? "No groups found"
                      : "No group or DM found"}
                  </p>
                  <p
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--text-tertiary)",
                    }}
                  >
                    Click the plus icon (+) above to start a new chat.
                  </p>
                </div>
              ) : (
                filteredRooms.map((room) => (
                  <button
                    key={room.id}
                    className={`room-item ${room.id === activeRoomId && activeUtilityTab === "chats" ? "active" : ""}`}
                    onClick={() => {
                      setActiveRoomId(room.id);
                      setActiveUtilityTab("chats");
                    }}
                    title={room.name}
                  >
                    <div className="room-avatar" style={{ position: "relative" }}>
                      {room.name ? room.name[0].toUpperCase() : "?"}
                      {!room.is_group && room.partnerId && presenceMap[room.partnerId] && (
                        <span
                          style={{
                            position: "absolute",
                            bottom: "-2px",
                            right: "-2px",
                            width: "9px",
                            height: "9px",
                            borderRadius: "50%",
                            backgroundColor: "#22c55e",
                            border: "2px solid var(--bg-secondary)",
                          }}
                        />
                      )}
                    </div>
                    <div className="room-details">
                      <span className="room-name">
                        {room.is_group ? "#" : ""}
                        {room.name}
                      </span>
                      <span className="room-preview">{room.lastMessage}</span>
                    </div>
                    {room.unreadCount !== undefined && room.unreadCount > 0 && (
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
      <div
        style={{
          height: "100%",
          overflow: "hidden",
          display: "flex",
          flexDirection: "row",
          position: "relative",
        }}
      >
        {/* Render View depending on activeUtilityTab & activeRoomId */}

        {activeUtilityTab === "profile" && (
          <div className="utility-view-container" style={{ maxWidth: "100%" }}>
            <div className="utility-view-header">
              <h2>My Profile</h2>
              <p>
                Manage your details, upload your avatar image, and update your
                biography.
              </p>
            </div>

            {profileMessage && (
              <div className="form-alert form-alert-success">
                <span>{profileMessage}</span>
              </div>
            )}

            <div className="profile-wrapper">
              {/* Avatar Icon Upload (Left side) */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "0.75rem",
                  flexShrink: 0,
                  marginTop: "0.5rem",
                }}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarChange}
                  style={{ display: "none" }}
                  accept="image/*"
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    position: "relative",
                    width: "140px",
                    height: "140px",
                    borderRadius: "50%",
                    cursor: "pointer",
                    overflow: "hidden",
                    border: "3px solid var(--primary)",
                    boxShadow: "var(--card-shadow)",
                    transition: "all 0.2s",
                    background: "var(--bg-secondary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  className="avatar-upload-hover"
                  title="Click to upload image"
                >
                  {profileForm.avatar_url ? (
                    <img
                      src={profileForm.avatar_url}
                      alt={profileForm.name}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        background:
                          "linear-gradient(135deg, var(--primary) 0%, var(--accent-purple) 100%)",
                        color: "white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "3.5rem",
                        fontWeight: "bold",
                      }}
                    >
                      {profileForm.name
                        ? profileForm.name[0].toUpperCase()
                        : "U"}
                    </div>
                  )}
                  {/* Hover Overlay text */}
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      backgroundColor: "rgba(3, 7, 18, 0.45)",
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      opacity: 0,
                      transition: "opacity 0.2s",
                      borderRadius: "50%",
                    }}
                    className="avatar-overlay-text"
                  >
                    Change Image
                  </div>
                </div>
                <span
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--text-secondary)",
                    fontWeight: 500,
                  }}
                >
                  Click to upload image
                </span>
                {profileForm.avatar_url && (
                  <button
                    type="button"
                    onClick={() => {
                      setProfileForm((prev) => ({ ...prev, avatar_url: "" }));
                      if (fileInputRef.current) {
                        fileInputRef.current.value = "";
                      }
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#ef4444",
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      padding: "0.25rem 0.5rem",
                      borderRadius: "4px",
                      transition: "opacity 0.2s",
                      marginTop: "-0.25rem",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                  >
                    Remove Image
                  </button>
                )}
              </div>

              {/* Form Grid below Avatar (stacked one by one in new line) */}
              <form
                onSubmit={handleProfileSave}
                className="profile-editor-form"
                style={{ flexGrow: 1, width: "100%" }}
              >
                <div className="form-group">
                  <label
                    style={{
                      display: "block",
                      marginBottom: "0.5rem",
                      fontWeight: 600,
                      fontSize: "0.9rem",
                      color: "var(--text-secondary)",
                    }}
                  >
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, name: e.target.value })
                    }
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      borderRadius: "8px",
                      border: "1px solid var(--border-color)",
                      backgroundColor: "var(--bg-secondary)",
                      color: "var(--text-primary)",
                    }}
                    required
                  />
                </div>

                <div className="form-group">
                  <label
                    style={{
                      display: "block",
                      marginBottom: "0.5rem",
                      fontWeight: 600,
                      fontSize: "0.9rem",
                      color: "var(--text-secondary)",
                    }}
                  >
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={profileForm.email}
                    disabled
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      borderRadius: "8px",
                      border: "1px solid var(--border-color)",
                      backgroundColor: "var(--bg-tertiary)",
                      color: "var(--text-tertiary)",
                      cursor: "not-allowed",
                    }}
                  />
                </div>

                <div className="form-group">
                  <label
                    style={{
                      display: "block",
                      marginBottom: "0.5rem",
                      fontWeight: 600,
                      fontSize: "0.9rem",
                      color: "var(--text-secondary)",
                    }}
                  >
                    Contact Number
                  </label>
                  <input
                    type="text"
                    value={profileForm.contact_no}
                    onChange={(e) =>
                      setProfileForm({
                        ...profileForm,
                        contact_no: e.target.value,
                      })
                    }
                    placeholder="+1 (555) 019-2834"
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      borderRadius: "8px",
                      border: "1px solid var(--border-color)",
                      backgroundColor: "var(--bg-secondary)",
                      color: "var(--text-primary)",
                    }}
                  />
                </div>

                <div className="form-group">
                  <label
                    style={{
                      display: "block",
                      marginBottom: "0.5rem",
                      fontWeight: 600,
                      fontSize: "0.9rem",
                      color: "var(--text-secondary)",
                    }}
                  >
                    Biography
                  </label>
                  <textarea
                    value={profileForm.bio}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, bio: e.target.value })
                    }
                    rows={3}
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      borderRadius: "8px",
                      border: "1px solid var(--border-color)",
                      backgroundColor: "var(--bg-secondary)",
                      color: "var(--text-primary)",
                      fontFamily: "inherit",
                      resize: "vertical",
                    }}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{
                    marginTop: "0.5rem",
                    width: "fit-content",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                  disabled={isSavingProfile}
                >
                  {isSavingProfile ? (
                    <>
                      <span
                        className="spinner"
                        style={{
                          width: "14px",
                          height: "14px",
                          borderWidth: "2px",
                          margin: 0,
                          display: "inline-block",
                        }}
                      />
                      <span>Saving...</span>
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {activeUtilityTab === "settings" && (
          <div className="utility-view-container" style={{ maxWidth: "100%" }}>
            <div className="utility-view-header">
              <h2>Account Settings</h2>
              <p>
                Configure notifications, sound effects, security, and interface
                preferences.
              </p>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                gap: "1.5rem",
                width: "100%",
                marginTop: "0.5rem",
              }}
            >
              {/* Box 1: Alerts & Notifications */}
              <div
                className="settings-card"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1.5rem",
                  height: "100%",
                }}
              >
                <h3
                  style={{
                    fontSize: "1.05rem",
                    fontWeight: 700,
                    margin: 0,
                    paddingBottom: "0.75rem",
                    borderBottom: "1px solid var(--border-color)",
                    color: "var(--primary)",
                  }}
                >
                  Alerts & Sounds
                </h3>

                <div
                  className="settings-row"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div className="settings-info">
                    <span>Push Notifications</span>
                    <p>Receive alerts for incoming messages.</p>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={appSettings.notifications}
                      onChange={(e) =>
                        setAppSettings({
                          ...appSettings,
                          notifications: e.target.checked,
                        })
                      }
                    />
                    <span className="slider"></span>
                  </label>
                </div>

                <div
                  className="settings-row"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div className="settings-info">
                    <span>Sound Effects</span>
                    <p>Play chime sounds on receiving messages.</p>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={appSettings.sound}
                      onChange={(e) =>
                        setAppSettings({
                          ...appSettings,
                          sound: e.target.checked,
                        })
                      }
                    />
                    <span className="slider"></span>
                  </label>
                </div>
              </div>

              {/* Box 2: Privacy & Receipts */}
              <div
                className="settings-card"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1.5rem",
                  height: "100%",
                }}
              >
                <h3
                  style={{
                    fontSize: "1.05rem",
                    fontWeight: 700,
                    margin: 0,
                    paddingBottom: "0.75rem",
                    borderBottom: "1px solid var(--border-color)",
                    color: "var(--accent-purple)",
                  }}
                >
                  Privacy & Presence
                </h3>

                <div
                  className="settings-row"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div className="settings-info">
                    <span>Show Active Status</span>
                    <p>Allow workspace members to see you online.</p>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={appSettings.showStatus}
                      onChange={(e) =>
                        setAppSettings({
                          ...appSettings,
                          showStatus: e.target.checked,
                        })
                      }
                    />
                    <span className="slider"></span>
                  </label>
                </div>

                <div
                  className="settings-row"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div className="settings-info">
                    <span>Read Receipts</span>
                    <p>Let members know when you view messages.</p>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={appSettings.readReceipts}
                      onChange={(e) =>
                        setAppSettings({
                          ...appSettings,
                          readReceipts: e.target.checked,
                        })
                      }
                    />
                    <span className="slider"></span>
                  </label>
                </div>
              </div>

              {/* Box 3: Theme Options */}
              <div
                className="settings-card"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1.5rem",
                  height: "100%",
                }}
              >
                <h3
                  style={{
                    fontSize: "1.05rem",
                    fontWeight: 700,
                    margin: 0,
                    paddingBottom: "0.75rem",
                    borderBottom: "1px solid var(--border-color)",
                    color: "var(--accent-blue)",
                  }}
                >
                  Theme & Display
                </h3>

                <div
                  className="settings-row"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div className="settings-info">
                    <span>Dark Mode Theme</span>
                    <p>Toggle between light and dark backgrounds.</p>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={theme === "dark"}
                      onChange={(e) =>
                        setTheme(e.target.checked ? "dark" : "light")
                      }
                    />
                    <span className="slider"></span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeUtilityTab === "media" && (
          <div className="utility-view-container" style={{ maxWidth: "100%" }}>
            <div className="utility-view-header">
              <h2>Shared Media</h2>
              <p>
                Browse photos, files, and blueprints uploaded across your
                channels.
              </p>
            </div>

            {sharedMediaList.length === 0 ? (
              <div style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "200px",
                color: "var(--text-secondary)",
                fontSize: "0.95rem",
                gap: "0.8rem",
                border: "1px dashed var(--border-color)",
                borderRadius: "12px",
                padding: "2rem",
                textAlign: "center",
                marginTop: "1rem"
              }}>
                <Image size={32} style={{ opacity: 0.6 }} />
                <span>No shared media found in this conversation</span>
              </div>
            ) : (
              <div
                className="media-grid"
                style={{
                  gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                  gap: "1.5rem",
                  width: "100%",
                  margin: 0,
                  marginTop: "0.5rem",
                }}
              >
                {sharedMediaList.map((item) => (
                  <div
                    key={item.id}
                    className="media-card"
                    onClick={() => setActiveLightboxFile({ url: item.url, name: item.name, type: item.type })}
                    style={{ cursor: "pointer" }}
                  >
                    {item.type === "image" ? (
                      <img src={item.url} alt={item.name} />
                    ) : item.type === "video" ? (
                      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0b0f19', color: 'white', position: 'relative' }}>
                        <video src={item.url} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.4 }} />
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="var(--primary)" style={{ marginLeft: '1px' }}>
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', gap: '8px' }}>
                        <FileText size={32} style={{ color: 'var(--primary)' }} />
                        <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                          {item.url.split('.').pop()?.substring(0, 4) || 'FILE'}
                        </span>
                      </div>
                    )}
                    <div className="media-card-overlay">{item.name}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeUtilityTab === "chats" && !activeRoomId && (
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
                Select a conversation from the left panel to begin messaging, or
                start a new conversation.
              </p>

              <div className="welcome-suggestions">
                <button
                  className="welcome-suggestion-btn"
                  onClick={() => {
                    setIsAddUserModalOpen(true);
                    setAddUserError(null);
                  }}
                >
                  <UserPlus size={16} />
                  <span>Start Direct Message</span>
                </button>
                <button
                  className="welcome-suggestion-btn"
                  onClick={() => {
                    setIsAddGroupModalOpen(true);
                    setAddGroupError(null);
                  }}
                >
                  <Users size={16} />
                  <span>Create Group Chat</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeUtilityTab === "chats" && activeRoomId && activeRoom && (
          <main className="chat-main" style={{ height: "100%", width: "100%", display: "flex", flexDirection: "column" }}>
            {/* Chat Header */}
            <header className="chat-header">
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div className="room-avatar" style={{ width: "40px", height: "40px", fontSize: "1.1rem" }}>
                  {activeRoom.name ? activeRoom.name[0].toUpperCase() : "?"}
                </div>
                <div className="chat-title-info">
                  <h2>
                    {activeRoom.is_group ? "#" : ""}
                    {activeRoom.name}
                  </h2>

                  {activeRoom.is_group ? (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.15rem" }}>
                      <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 500 }}>
                        {activeRoom.members?.length || 0} members
                      </span>
                    </div>
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.15rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                        <span
                          style={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            backgroundColor: activeRoom.partnerId && presenceMap[activeRoom.partnerId]
                              ? "#22c55e"
                              : "#9ca3af",
                            display: "inline-block",
                          }}
                        />
                        <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 500 }}>
                          {activeRoom.partnerId && presenceMap[activeRoom.partnerId] ? "Online" : "Offline"}
                        </span>
                      </div>
                    </div>
                  )}

                  {typingUsers[activeRoom.id]?.length > 0 && (
                    <p
                      style={{
                        color: "var(--accent-blue)",
                        fontSize: "0.8rem",
                        marginTop: "0.25rem",
                      }}
                    >
                      {typingUsers[activeRoom.id].join(", ")} is typing...
                    </p>
                  )}
                </div>
              </div>
              <div className="chat-actions">
                {isChatSearchActive ? (
                  <div className="chat-search-container">
                    <Search
                      size={14}
                      style={{ color: "var(--text-tertiary)" }}
                    />
                    <input
                      type="text"
                      placeholder="Search messages..."
                      value={chatSearchQuery}
                      onChange={(e) => setChatSearchQuery(e.target.value)}
                      autoFocus
                    />

                    {chatSearchQuery.trim() && (
                      <span className="search-match-count">
                        {searchMatches.length > 0
                          ? `${activeMatchIndex + 1} of ${searchMatches.length}`
                          : "0 of 0"}
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
                      style={{ padding: "2px", marginLeft: "0.25rem" }}
                      onClick={() => {
                        setIsChatSearchActive(false);
                        setChatSearchQuery("");
                      }}
                      title="Close search"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Desktop Toolbar */}
                    <div className="chat-actions-desktop">
                      <button
                        className="btn-icon"
                        title="Search messages"
                        onClick={() => setIsChatSearchActive(true)}
                      >
                        <Search size={18} />
                      </button>

                      <button
                        className="btn-icon"
                        title="View Details"
                        onClick={() => setIsInfoDrawerOpen(!isInfoDrawerOpen)}
                        style={{ color: isInfoDrawerOpen ? "var(--primary)" : "inherit" }}
                      >
                        <Info size={18} />
                      </button>

                      <button
                        className="btn-icon"
                        title="Clear Chat"
                        onClick={handleClearChat}
                        style={{ color: "#ef4444" }}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    {/* Mobile Toolbar (Three-dots dropdown menu) */}
                    <div className="chat-actions-mobile">
                      <button
                        className="btn-icon"
                        title="More Options"
                        onClick={() => setIsHeaderMenuOpen(!isHeaderMenuOpen)}
                      >
                        <MoreVertical size={18} />
                      </button>

                      {isHeaderMenuOpen && (
                        <>
                          <div
                            style={{
                              position: "fixed",
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              zIndex: 99,
                            }}
                            onClick={() => setIsHeaderMenuOpen(false)}
                          />
                          <div className="header-menu-dropdown">
                            <button
                              onClick={() => {
                                setIsChatSearchActive(true);
                                setIsHeaderMenuOpen(false);
                              }}
                            >
                              <Search size={16} />
                              <span>Search Messages</span>
                            </button>
                            <button
                              onClick={() => {
                                setIsInfoDrawerOpen(!isInfoDrawerOpen);
                                setIsHeaderMenuOpen(false);
                              }}
                              style={{ color: isInfoDrawerOpen ? "var(--primary)" : "inherit" }}
                            >
                              <Info size={16} />
                              <span>View Details</span>
                            </button>
                            <button
                              onClick={() => {
                                handleClearChat();
                                setIsHeaderMenuOpen(false);
                              }}
                              style={{ color: "#ef4444" }}
                            >
                              <Trash2 size={16} />
                              <span>Clear Chat</span>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            </header>

            {/* Messages List */}
            {/* Messages List */}
            {isLoadingMessages ? (
              <div className="skeleton-messages-container">
                <div className="skeleton-message-row">
                  <div className="skeleton-avatar" />
                  <div className="skeleton-bubble-wrapper">
                    <div className="skeleton-sender" />
                    <div className="skeleton-bubble" />
                  </div>
                </div>
                <div className="skeleton-message-row self">
                  <div className="skeleton-avatar" />
                  <div className="skeleton-bubble-wrapper">
                    <div className="skeleton-sender" />
                    <div className="skeleton-bubble" />
                  </div>
                </div>
                <div className="skeleton-message-row">
                  <div className="skeleton-avatar" />
                  <div className="skeleton-bubble-wrapper">
                    <div className="skeleton-sender" />
                    <div className="skeleton-bubble" style={{ height: "42px", width: "80%" }} />
                  </div>
                </div>
                <div className="skeleton-message-row self">
                  <div className="skeleton-avatar" />
                  <div className="skeleton-bubble-wrapper">
                    <div className="skeleton-sender" />
                    <div className="skeleton-bubble" style={{ height: "64px", width: "90%" }} />
                  </div>
                </div>
              </div>
            ) : (
              <div 
                className={`messages-list ${isLoadingMessages ? 'loading-fade' : 'loaded-fade'}`}
                ref={messagesContainerRef}
                onScroll={handleScroll}
              >
                {isLoadingMore && (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '0.5rem 0' }}>
                    <div className="spinner" style={{ width: '16px', height: '16px', margin: 0 }} />
                  </div>
                )}
                {currentMessages.length === 0 ? (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      flexGrow: 1,
                      color: "var(--text-tertiary)",
                      fontSize: "0.9rem",
                      padding: "3rem",
                    }}
                  >
                    No messages in this chat yet. Say hello! 👋
                  </div>
                ) : (
                  currentMessages.map((msg) => {
                    if (!msg.senderId) {
                      return (
                        <div
                          key={msg.id}
                          className="system-message-row"
                          style={{
                            display: 'flex',
                            justifyContent: 'center',
                            width: '100%',
                            margin: '0.75rem 0',
                          }}
                        >
                          <span
                            className="system-message-text"
                            style={{
                              fontSize: '0.75rem',
                              color: 'var(--text-tertiary)',
                              backgroundColor: 'var(--bg-tertiary)',
                              padding: '5px 14px',
                              borderRadius: '20px',
                              border: '1px solid var(--border-color)',
                              fontWeight: 600,
                              letterSpacing: '0.01em',
                            }}
                          >
                            {msg.text}
                          </span>
                        </div>
                      );
                    }
                    return (
                      <div
                        key={msg.id}
                        className={`message-row ${msg.isSelf ? "self" : "other"}`}
                      >
                    <div className="message-bubble-wrapper" style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "8px", position: "relative" }}>
                      {/* For right-side chat (self), display delete button on the left (before the bubble) */}
                      {msg.isSelf && msg.status !== "deleted" && (
                        <button
                          onClick={() => setDeleteConfirmTarget(msg.id)}
                          className="msg-delete-btn"
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "var(--text-tertiary)",
                            cursor: "pointer",
                            padding: "6px",
                            borderRadius: "50%",
                            transition: "all 0.2s",
                            display: "none",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                          title="Delete message"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                      {msg.status === "deleted" ? (
                        <div
                          style={{
                            color: theme === "dark" ? "#9ca3af" : "#000000",
                            fontStyle: "italic",
                            fontSize: "0.85rem",
                            padding: "6px 12px",
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            alignSelf: msg.isSelf ? 'flex-end' : 'flex-start',
                          }}
                        >
                          <Trash2 size={13} style={{ opacity: 0.5 }} />
                          <span>This chat has been deleted</span>
                        </div>
                      ) : (
                        <div className="message-bubble">
                          {msg.fileUrl && (
                            <div style={{ marginBottom: msg.text ? '8px' : '0px' }}>
                              {/\.(jpg|jpeg|png|gif|webp|svg)/i.test(msg.fileUrl) ? (
                                <img
                                  src={msg.fileUrl}
                                  alt="Attachment"
                                  onClick={() => {
                                    const urlParts = msg.fileUrl!.split("/");
                                    const filename = decodeURIComponent(urlParts[urlParts.length - 1]);
                                    const cleanName = filename.replace(/^[a-f0-9-]{36}_\d+_/, "").replace(/^\w+_\d+_/, "");
                                    setActiveLightboxFile({ url: msg.fileUrl!, name: cleanName || "Image Attachment", type: 'image' });
                                  }}
                                  style={{
                                    maxWidth: '200px',
                                    maxHeight: '150px',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    display: 'block',
                                    objectFit: 'cover'
                                  }}
                                />
                              ) : /\.(mp4|webm|ogg|mov)/i.test(msg.fileUrl) ? (
                                <div 
                                  style={{ position: 'relative', cursor: 'pointer', maxWidth: '240px', maxHeight: '150px', borderRadius: '8px', overflow: 'hidden' }}
                                  onClick={() => {
                                    const urlParts = msg.fileUrl!.split("/");
                                    const filename = decodeURIComponent(urlParts[urlParts.length - 1]);
                                    const cleanName = filename.replace(/^[a-f0-9-]{36}_\d+_/, "").replace(/^\w+_\d+_/, "");
                                    setActiveLightboxFile({ url: msg.fileUrl!, name: cleanName || "Video Attachment", type: 'video' });
                                  }}
                                >
                                  <video
                                    src={msg.fileUrl}
                                    style={{
                                      width: '100%',
                                      height: '100%',
                                      display: 'block',
                                      objectFit: 'cover'
                                    }}
                                  />
                                  {/* Play icon overlay */}
                                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0, 0, 0, 0.25)' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
                                      <svg viewBox="0 0 24 24" width="20" height="20" fill="var(--primary)" style={{ marginLeft: '2px' }}>
                                        <path d="M8 5v14l11-7z" />
                                      </svg>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div
                                  onClick={() => {
                                    const urlParts = msg.fileUrl!.split("/");
                                    const filename = decodeURIComponent(urlParts[urlParts.length - 1]);
                                    const cleanName = filename.replace(/^[a-f0-9-]{36}_\d+_/, "").replace(/^\w+_\d+_/, "");
                                    setActiveLightboxFile({ url: msg.fileUrl!, name: cleanName || "Attachment", type: 'document' });
                                  }}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    background: msg.isSelf ? 'rgba(0, 0, 0, 0.15)' : 'var(--bg-secondary)',
                                    padding: '6px 10px',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    border: '1px solid var(--border-color)',
                                    maxWidth: '220px',
                                  }}
                                >
                                  <FileText size={16} style={{ flexShrink: 0 }} />
                                  <span style={{ fontSize: '0.8rem', wordBreak: 'break-all', textDecoration: 'underline', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {decodeURIComponent(msg.fileUrl.split('/').pop() || 'Attachment').replace(/^[a-f0-9-]{36}_\d+_/, "").replace(/^\w+_\d+_/, "")}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                          {renderMessageText(msg.id, msg.text)}
                          <div className="message-meta">
                            <span className="message-time">{msg.timestamp}</span>
                            {msg.isSelf && msg.status !== "deleted" && (
                              msg.status === "read" ? (
                                <CheckCheck
                                  size={14}
                                  className="status-icon"
                                  style={{ color: "#22c55e" }}
                                />
                              ) : (
                                <Check size={14} className="status-icon" />
                              )
                            )}
                          </div>
                        </div>
                      )}
                      {/* For left-side chat (other), display delete button on the right (after the bubble) */}
                      {!msg.isSelf && msg.status !== "deleted" && (
                        <button
                          onClick={() => setDeleteConfirmTarget(msg.id)}
                          className="msg-delete-btn"
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "var(--text-tertiary)",
                            cursor: "pointer",
                            padding: "6px",
                            borderRadius: "50%",
                            transition: "all 0.2s",
                            display: "none",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                          title="Delete message"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                );})
              )}
              <div ref={messagesEndRef} />
            </div>
            )}

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="message-input-form" style={{ flexDirection: "column", gap: "0.75rem" }}>
              {/* Attachment Preview Area */}
              {isUploadingAttachment && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: 'var(--bg-tertiary)', borderRadius: '8px', border: '1px solid var(--border-color)', width: 'fit-content' }}>
                  <div className="spinner" style={{ width: '14px', height: '14px', margin: 0 }}></div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Uploading attachment...</span>
                </div>
              )}
              {attachmentError && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', padding: '6px 12px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)', width: 'fit-content' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--accent)', marginRight: '12px' }}>{attachmentError}</span>
                  <X size={14} style={{ cursor: 'pointer', color: 'var(--accent)' }} onClick={() => setAttachmentError(null)} />
                </div>
              )}
              {attachment && (
                <div 
                  style={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    gap: '6px', 
                    padding: '8px', 
                    background: 'var(--bg-tertiary)', 
                    borderRadius: '12px', 
                    border: '1px solid var(--border-color)', 
                    width: 'fit-content',
                    position: 'relative',
                    animation: 'fadeIn 0.2s ease',
                    marginTop: '0.25rem'
                  }}
                >
                  {/* Floating Remove Button */}
                  <button
                    type="button"
                    onClick={handleRemoveAttachment}
                    style={{
                      position: 'absolute',
                      top: '-8px',
                      right: '-8px',
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: 'rgba(239, 68, 68, 0.9)',
                      color: 'white',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                      zIndex: 10,
                      transition: 'background-color 0.2s'
                    }}
                    title="Remove attachment"
                  >
                    <X size={12} />
                  </button>

                  {/* Visual Preview */}
                  {attachment.type.startsWith('image/') ? (
                    <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                      <img 
                        src={attachment.dataUrl} 
                        alt="Preview" 
                        style={{ 
                          display: 'block',
                          maxWidth: '120px', 
                          maxHeight: '120px', 
                          objectFit: 'contain',
                          background: 'var(--bg-secondary)' 
                        }} 
                      />
                    </div>
                  ) : attachment.type.startsWith('video/') ? (
                    <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)', position: 'relative' }}>
                      <video 
                        src={attachment.dataUrl} 
                        style={{ 
                          display: 'block',
                          maxWidth: '160px', 
                          maxHeight: '100px', 
                          objectFit: 'cover',
                          background: 'var(--bg-secondary)' 
                        }} 
                      />
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.3)', pointerEvents: 'none', color: 'white', fontSize: '0.75rem', fontWeight: 'bold' }}>
                        VIDEO PREVIEW
                      </div>
                    </div>
                  ) : (
                    <div 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '12px', 
                        padding: '10px 14px', 
                        background: 'var(--bg-secondary)', 
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)',
                        minWidth: '200px',
                        maxWidth: '300px'
                      }}
                    >
                      <FileText size={24} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 500 }}>
                          {attachment.name}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
                          {attachment.type.split('/')[1]?.toUpperCase() || 'FILE'} Document
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Main Input Row */}
              <div style={{ display: 'flex', gap: '0.75rem', width: '100%', alignItems: 'center' }}>
                <input
                  type="file"
                  ref={attachmentInputRef}
                  onChange={handleAttachmentChange}
                  style={{ display: "none" }}
                  accept="image/*,video/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                />
                <button
                  type="button"
                  onClick={() => attachmentInputRef.current?.click()}
                  disabled={isUploadingAttachment}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '42px',
                    height: '42px',
                    borderRadius: '8px',
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    flexShrink: 0,
                    transition: 'all 0.2s'
                  }}
                  title="Attach file"
                >
                  <Paperclip size={18} />
                </button>
                <input
                  type="text"
                  placeholder={`Message ${activeRoom.is_group ? "#" : ""}${activeRoom.name}...`}
                  value={inputText}
                  onChange={(e) => handleTyping(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button type="submit" className="btn btn-primary btn-send" disabled={isUploadingAttachment} style={{ height: '42px', width: '42px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                  <Send size={18} />
                </button>
              </div>
            </form>
          </main>
        )}

        {/* Slide-out User/Room Details Drawer */}
        <aside
          className={`info-drawer ${isInfoDrawerOpen && activeRoomId && activeRoom ? "open" : ""}`}
        >
          <div className="info-drawer-header">
            <h3>Details</h3>
            <button
              className="btn-icon"
              onClick={() => setIsInfoDrawerOpen(false)}
            >
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
                <p style={{ fontWeight: 700, fontSize: "1.1rem" }}>
                  {activeRoom.is_group ? "#" : ""}
                  {activeRoom.name}
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
                        <div className="member-avatar-mini">
                          {member[0].toUpperCase()}
                        </div>
                        <span>{member}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!activeRoom.is_group &&
                (activeRoom.partnerEmail || activeRoom.partnerContact) && (
                  <div className="info-section">
                    <label>Contact Info</label>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.5rem",
                        marginTop: "0.25rem",
                      }}
                    >
                      {activeRoom.partnerEmail && (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            fontSize: "0.85rem",
                            color: "var(--text-secondary)",
                          }}
                        >
                          <Mail size={14} />
                          <span>{activeRoom.partnerEmail}</span>
                        </div>
                      )}
                      {activeRoom.partnerContact && (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            fontSize: "0.85rem",
                            color: "var(--text-secondary)",
                          }}
                        >
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
        <div
          className="modal-backdrop"
          onClick={() => setIsAddUserModalOpen(false)}
        >
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Start Direct Message</h3>
              <button
                className="btn-icon"
                onClick={() => setIsAddUserModalOpen(false)}
              >
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
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      borderRadius: "8px",
                      border: "1px solid var(--border-color)",
                      backgroundColor: "var(--bg-tertiary)",
                      color: "var(--text-primary)",
                    }}
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
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      borderRadius: "8px",
                      border: "1px solid var(--border-color)",
                      backgroundColor: "var(--bg-tertiary)",
                      color: "var(--text-primary)",
                    }}
                    required
                  />
                  {addUserError && (
                    <span className="field-error-message">{addUserError}</span>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsAddUserModalOpen(false)}
                >
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
        <div
          className="modal-backdrop"
          onClick={() => setIsAddGroupModalOpen(false)}
        >
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create Group Channel</h3>
              <button
                className="btn-icon"
                onClick={() => setIsAddGroupModalOpen(false)}
              >
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
                      setNewGroupForm({
                        ...newGroupForm,
                        name: e.target.value,
                      });
                      setAddGroupError(null);
                    }}
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      borderRadius: "8px",
                      border: "1px solid var(--border-color)",
                      backgroundColor: "var(--bg-tertiary)",
                      color: "var(--text-primary)",
                    }}
                    required
                    autoFocus
                  />
                  {addGroupError && (
                    <span className="field-error-message">{addGroupError}</span>
                  )}
                </div>
                <div className="form-group">
                  <label>Purpose / Description</label>
                  <input
                    type="text"
                    placeholder="E.g., Aligning visual assets and stylesheets"
                    value={newGroupForm.description}
                    onChange={(e) => {
                      setNewGroupForm({
                        ...newGroupForm,
                        description: e.target.value,
                      });
                      setAddGroupError(null);
                    }}
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      borderRadius: "8px",
                      border: "1px solid var(--border-color)",
                      backgroundColor: "var(--bg-tertiary)",
                      color: "var(--text-primary)",
                    }}
                  />
                </div>

                <div className="form-group">
                  <label>Add Member by Email</label>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <input
                      type="email"
                      placeholder="E.g., member@example.com"
                      value={memberEmailInput}
                      onChange={(e) => {
                        setMemberEmailInput(e.target.value);
                        setAddGroupError(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddMemberByEmail();
                        }
                      }}
                      style={{
                        flexGrow: 1,
                        padding: "0.75rem",
                        borderRadius: "8px",
                        border: "1px solid var(--border-color)",
                        backgroundColor: "var(--bg-tertiary)",
                        color: "var(--text-primary)",
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleAddMemberByEmail}
                      disabled={isSearchingMember || !memberEmailInput.trim()}
                      className="btn btn-primary"
                      style={{
                        padding: "0",
                        width: "44px",
                        height: "44px",
                        borderRadius: "8px",
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      title="Add member"
                    >
                      {isSearchingMember ? (
                        <div
                          className="spinner"
                          style={{
                            width: "16px",
                            height: "16px",
                            borderWidth: "2px",
                            borderTopColor: "#ffffff",
                          }}
                        ></div>
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
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "0.5rem",
                        marginTop: "0.75rem",
                      }}
                    >
                      {groupMembers.map((member) => (
                        <div
                          key={member.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            padding: "0.35rem 0.75rem",
                            borderRadius: "20px",
                            border: "1px solid var(--primary)",
                            backgroundColor: "var(--primary-glow)",
                            fontSize: "0.8rem",
                            color: "var(--primary)",
                            fontWeight: 600,
                          }}
                        >
                          <span>
                            {member.name} ({member.email})
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setGroupMembers((prev) =>
                                prev.filter((m) => m.id !== member.id),
                              )
                            }
                            style={{
                              border: "none",
                              background: "none",
                              cursor: "pointer",
                              color: "var(--primary)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              padding: 0,
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
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsAddGroupModalOpen(false)}
                >
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

      {/* Lightbox File Preview Modal */}
      {activeLightboxFile && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            animation: 'fadeIn 0.2s ease',
          }}
          onClick={() => setActiveLightboxFile(null)}
        >
          {/* Lightbox Header with filename and actions */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1rem 2rem',
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.5), transparent)',
              color: 'white',
              zIndex: 10000,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <span style={{ fontSize: '1rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>
              {activeLightboxFile.name}
            </span>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <button
                onClick={() => downloadImage(activeLightboxFile.url, activeLightboxFile.name)}
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  border: 'none',
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  transition: 'background 0.2s',
                }}
                title="Download file"
              >
                <Download size={16} />
                <span>Download</span>
              </button>
              <button
                onClick={() => setActiveLightboxFile(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '4px',
                }}
                title="Close preview"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          {/* Lightbox File Content */}
          <div
            style={{
              width: activeLightboxFile.type === 'document' && /\.pdf/i.test(activeLightboxFile.url) ? '80%' : 'auto',
              height: activeLightboxFile.type === 'document' && /\.pdf/i.test(activeLightboxFile.url) ? '80%' : 'auto',
              maxWidth: '90%',
              maxHeight: '80%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {activeLightboxFile.type === 'image' || /\.(jpg|jpeg|png|gif|webp|svg)/i.test(activeLightboxFile.url) ? (
              <img
                src={activeLightboxFile.url}
                alt="Preview"
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  borderRadius: '8px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                  objectFit: 'contain',
                }}
              />
            ) : activeLightboxFile.type === 'video' || /\.(mp4|webm|ogg|mov)/i.test(activeLightboxFile.url) ? (
              <video
                src={activeLightboxFile.url}
                controls
                autoPlay
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  borderRadius: '8px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                  background: 'black'
                }}
              />
            ) : /\.pdf/i.test(activeLightboxFile.url) ? (
              <iframe
                src={activeLightboxFile.url}
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  borderRadius: '8px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                  background: 'white'
                }}
                title="PDF Document Preview"
              />
            ) : /\.txt/i.test(activeLightboxFile.url) ? (
              <iframe
                src={activeLightboxFile.url}
                style={{
                  width: '600px',
                  height: '400px',
                  border: 'none',
                  borderRadius: '8px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  padding: '16px'
                }}
                title="Text Document Preview"
              />
            ) : (
              // Fallback preview card for formats browser cannot render (like .docx, .zip)
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  padding: '3rem',
                  textAlign: 'center',
                  maxWidth: '400px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                  gap: '1.25rem'
                }}
              >
                <FileText size={64} style={{ color: 'var(--primary)' }} />
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                    Preview not available
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    We can't preview this file type in the browser. Please download it to view the contents.
                  </p>
                </div>
                <button
                  onClick={() => downloadImage(activeLightboxFile.url, activeLightboxFile.name)}
                  style={{
                    background: 'var(--primary)',
                    border: 'none',
                    color: 'white',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    transition: 'opacity 0.2s',
                    width: '100%'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
                  onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
                >
                  Download File
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Custom Confirm Delete Message Dialog */}
      {deleteConfirmTarget && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10100,
            animation: "fadeIn 0.15s ease-out",
          }}
          onClick={() => setDeleteConfirmTarget(null)}
        >
          <div
            style={{
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-color)",
              borderRadius: "12px",
              padding: "1.5rem 2rem",
              maxWidth: "400px",
              width: "90%",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)",
              display: "flex",
              flexDirection: "column",
              gap: "1.25rem",
              animation: "scaleIn 0.15s ease-out",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  backgroundColor: "rgba(239, 68, 68, 0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ef4444",
                }}
              >
                <Trash2 size={20} />
              </div>
              <h3 style={{ fontSize: "1.15rem", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>
                Delete Message
              </h3>
            </div>

            <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", margin: 0, lineHeight: "1.4" }}>
              Are you sure you want to delete this message? This action will permanently remove it from the chat for all members.
            </p>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
              <button
                onClick={() => setDeleteConfirmTarget(null)}
                style={{
                  background: "transparent",
                  border: "1px solid var(--border-color)",
                  color: "var(--text-primary)",
                  padding: "8px 16px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "0.85rem",
                  fontWeight: 500,
                  transition: "background 0.2s",
                }}
                onMouseOver={(e) => e.currentTarget.style.background = "var(--bg-tertiary)"}
                onMouseOut={(e) => e.currentTarget.style.background = "transparent"}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteMessage}
                style={{
                  background: "#ef4444",
                  border: "none",
                  color: "white",
                  padding: "8px 16px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  transition: "opacity 0.2s",
                }}
                onMouseOver={(e) => e.currentTarget.style.opacity = "0.9"}
                onMouseOut={(e) => e.currentTarget.style.opacity = "1"}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Confirm Clear Chat Dialog */}
      {isClearConfirmOpen && activeRoom && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10100,
            animation: "fadeIn 0.15s ease-out",
          }}
          onClick={() => setIsClearConfirmOpen(false)}
        >
          <div
            style={{
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-color)",
              borderRadius: "12px",
              padding: "1.5rem 2rem",
              maxWidth: "400px",
              width: "90%",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)",
              display: "flex",
              flexDirection: "column",
              gap: "1.25rem",
              animation: "scaleIn 0.15s ease-out",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  backgroundColor: "rgba(239, 68, 68, 0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ef4444",
                }}
              >
                <Trash2 size={20} />
              </div>
              <h3 style={{ fontSize: "1.15rem", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>
                Clear Chat History
              </h3>
            </div>

            <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", margin: 0, lineHeight: "1.4" }}>
              Are you sure you want to clear all messages in <strong>#{activeRoom.name}</strong>? This action will permanently delete all chat history and attachments for all members.
            </p>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
              <button
                onClick={() => setIsClearConfirmOpen(false)}
                style={{
                  background: "transparent",
                  border: "1px solid var(--border-color)",
                  color: "var(--text-primary)",
                  padding: "8px 16px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "0.85rem",
                  fontWeight: 500,
                  transition: "background 0.2s",
                }}
                onMouseOver={(e) => e.currentTarget.style.background = "var(--bg-tertiary)"}
                onMouseOut={(e) => e.currentTarget.style.background = "transparent"}
              >
                Cancel
              </button>
              <button
                onClick={handleClearChatConfirm}
                style={{
                  background: "#ef4444",
                  border: "none",
                  color: "white",
                  padding: "8px 16px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "0.85rem",
                  fontWeight: 500,
                  transition: "opacity 0.2s",
                }}
                onMouseOver={(e) => e.currentTarget.style.opacity = "0.9"}
                onMouseOut={(e) => e.currentTarget.style.opacity = "1"}
              >
                Clear Chat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;
