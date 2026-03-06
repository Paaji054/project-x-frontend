import React, { useState, useEffect, useRef } from "react";
import { ArrowLeft, Send, Edit, X, Search, Loader2 } from "lucide-react";
import LiveProfilePhoto from "../../components/LiveProfilePhoto";
import { getProfileVideoUrl } from "../../utils/profileVideos";
import themeIcon from "../../assets/theme.svg";
import catTheme from "../../assets/cat_theme.jpg";
import xoxoTheme from "../../assets/xoxo_theme.jpg";
import { messageService, userService, socketService } from "../../services";
import { useAuth } from "../../context/AuthContext";
import { tokenManager } from "../../utils/httpClient";
import { useDebounce } from "../../hooks/useDebounce";

export default function MessagesPage({ onViewUserProfile, selectedChatUsername }) {
  const { user } = useAuth(); // Get current user to identify message sender
  const currentUserId = user?.uid || user?.id || user?._id;
  const [activeChat, setActiveChat] = useState(null);
  const [messageInput, setMessageInput] = useState("");
  const [messages, setMessages] = useState([]);

  // Compose ("New Message") modal state
  const [showCompose, setShowCompose] = useState(false);
  const [composeSearch, setComposeSearch] = useState("");
  const [composeResults, setComposeResults] = useState([]);
  const [composeLoading, setComposeLoading] = useState(false);
  const debouncedComposeSearch = useDebounce(composeSearch, 400);
  const [chatThemes, setChatThemes] = useState(() => {
    // Load chat themes from localStorage
    try {
      const saved = localStorage.getItem('chatThemes');
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      console.error('Error loading chat themes:', error);
      return {};
    }
  }); // key: chat id -> theme key
  const [showThemePicker, setShowThemePicker] = useState(false);
  const themePickerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const activeChatRef = useRef(null);

  // Keep ref in sync for socket listener
  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);

  // Connect socket when user is authenticated so we can receive real-time messages
  useEffect(() => {
    if (!user) return;
    const token = tokenManager.getAccessToken();
    if (token && !tokenManager.isTokenExpired()) {
      socketService.connect(token);
    }
  }, [user]);

  // Join active chat room and listen for new messages (so recipient sees messages in real time)
  useEffect(() => {
    if (!activeChat?._id) return;
    socketService.joinConversation(activeChat._id);

    const handleNewMessage = (payload) => {
      const { message: msg, chatId } = payload || {};
      if (!msg || String(chatId) !== String(activeChatRef.current?._id)) return;
      const uid = activeChatRef.current && (activeChatRef.current.otherUser?.uid || activeChatRef.current.otherUser?._id || activeChatRef.current.otherUser?.id);
      const currentUid = currentUserId;
      const newMsg = {
        id: msg._id || msg.id,
        text: msg.text || msg.mediaUrl || '',
        sender: msg.senderId === currentUid ? 'sender' : 'receiver',
        time: new Date(msg.createdAt || Date.now()).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        status: msg.senderId === currentUid ? (msg.readAt ? 'read' : (msg.deliveredAt ? 'delivered' : 'sent')) : null,
        isDelivered: !!msg.deliveredAt,
        isRead: !!msg.readAt,
        type: msg.type || 'text',
        mediaUrl: msg.mediaUrl,
      };
      setMessages((prev) => {
        if (prev.some((m) => String(m.id) === String(newMsg.id))) return prev;
        return [...prev, newMsg];
      });
    };

    socketService.onNewMessage(handleNewMessage);
    return () => {
      socketService.leaveConversation(activeChat._id);
      if (socketService.socket) {
        socketService.socket.off('receive_message', handleNewMessage);
      }
    };
  }, [activeChat?._id, currentUserId]);

  // API state
  const [conversations, setConversations] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [error, setError] = useState(null);
  // People you can start a chat with (followers you also follow)
  const [chatContacts, setChatContacts] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  
  // Read receipt settings - load from localStorage
  const [readReceiptsEnabled, setReadReceiptsEnabled] = useState(() => {
    const saved = localStorage.getItem('readReceiptsEnabled');
    return saved !== null ? saved === 'true' : true; // Default to enabled
  });

  // Listen for changes to read receipts setting
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('readReceiptsEnabled');
      setReadReceiptsEnabled(saved !== null ? saved === 'true' : true);
    };
    window.addEventListener('storage', handleStorageChange);
    // Also check periodically for same-tab updates
    const interval = setInterval(handleStorageChange, 500);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const themes = {
    default: {
      backgroundStyle: { backgroundColor: "" }, // Will use the container's background
      senderBubble: "bg-primary/90 text-white dark:bg-primary-700/40 dark:text-white",
      receiverBubble: "bg-primary-400/80 text-white dark:bg-primary/30 dark:text-white",
    },
    cat: {
      backgroundStyle: {
        backgroundImage: `linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.35)), url(${catTheme})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      },
      senderBubble: "bg-gray-200 text-black",
      receiverBubble: "bg-gray-500/80 text-white",
    },
    xoxo: {
      backgroundStyle: {
        backgroundImage: `linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.45)), url(${xoxoTheme})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      },
      senderBubble: "bg-black/80 text-white",
      receiverBubble: "bg-red-900/80 text-white",
    },
  };
  // Search users for compose modal
  useEffect(() => {
    if (!debouncedComposeSearch.trim()) {
      setComposeResults([]);
      return;
    }
    let cancelled = false;
    const search = async () => {
      setComposeLoading(true);
      try {
        const result = await userService.searchUsers(debouncedComposeSearch, 15);
        const users = result?.users || result || [];
        if (!cancelled) setComposeResults(Array.isArray(users) ? users : []);
      } catch {
        if (!cancelled) setComposeResults([]);
      } finally {
        if (!cancelled) setComposeLoading(false);
      }
    };
    search();
    return () => { cancelled = true; };
  }, [debouncedComposeSearch]);
  // Fetch conversations on mount
  useEffect(() => {
    console.log('MessagesPage mounted, fetching conversations...');
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      setLoadingConversations(true);
      setError(null);
      console.log('Fetching conversations...');
      // Use skip-based pagination instead of page-based
      const convos = await messageService.getConversations(20, 0);
      console.log('Conversations received:', convos);
      
      if (!Array.isArray(convos)) {
        console.error('Conversations is not an array:', convos);
        setConversations([]);
        setError('Invalid data received from server');
      } else {
        setConversations(convos);
        console.log(`Loaded ${convos.length} conversations`);
      }

      // If there are no conversations yet, load people user can message
      if ((!convos || convos.length === 0) && user?.username) {
        await fetchChatContacts(user.username);
      }
    } catch (err) {
      console.error("Error fetching conversations:", err);
      setError(err.message || "Failed to load conversations. Please try refreshing the page.");
      setConversations([]);
    } finally {
      setLoadingConversations(false);
    }
  };

  /**
   * Load users that the current user can start a chat with.
   * Prefer mutuals (followers you also follow). If none, fall back to following list.
   */
  const fetchChatContacts = async (username) => {
    try {
      setLoadingContacts(true);

      const [followersData, followingData] = await Promise.allSettled([
        userService.getUserFollowers(username),
        userService.getUserFollowing(username),
      ]);

      const followers =
        followersData.status === "fulfilled"
          ? followersData.value?.followers || followersData.value || []
          : [];
      const following =
        followingData.status === "fulfilled"
          ? followingData.value?.following || followingData.value || []
          : [];

      // Build map of following by uid/username
      const followingMap = new Map(
        following.map((u) => [
          u.uid || u.id || u._id || u.username,
          u,
        ])
      );

      // Mutuals: in followers AND following
      const mutuals = followers.filter((f) => {
        const key = f.uid || f.id || f._id || f.username;
        return followingMap.has(key);
      });

      const contacts = (mutuals.length > 0 ? mutuals : following).filter(
        (u) => (u.uid || u.id || u._id) && u.username
      );

      setChatContacts(contacts);
    } catch (err) {
      console.error("Error fetching chat contacts:", err);
      setChatContacts([]);
    } finally {
      setLoadingContacts(false);
    }
  };

  const fetchMessages = async (conversationId) => {
    try {
      setLoadingMessages(true);
      // Use skip-based pagination
      const msgs = await messageService.getMessagesByConversation(conversationId, 50, 0);
      
      // Transform API messages to component format
      // Backend message format: { _id, senderId, text, mediaUrl, type, readAt, deliveredAt, createdAt, sender: {...} }
      const transformedMsgs = msgs.map(msg => ({
        id: msg._id,
        text: msg.text || msg.mediaUrl || '', // Backend uses 'text' field, mediaUrl for media messages
        sender: msg.senderId === currentUserId ? 'sender' : 'receiver', // Compare senderId with currentUserId
        time: new Date(msg.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        // Read receipt status - check readAt and deliveredAt timestamps
        status: msg.senderId === currentUserId 
          ? (msg.readAt ? 'read' : (msg.deliveredAt ? 'delivered' : 'sent')) 
          : null,
        isDelivered: !!msg.deliveredAt,
        isRead: !!msg.readAt,
        type: msg.type || 'text', // Message type: text, image, video, voice
        mediaUrl: msg.mediaUrl, // Media URL if present
      }));
      
      setMessages(transformedMsgs);
      
      // Mark conversation as read
      await messageService.markConversationAsRead(conversationId);
    } catch (err) {
      console.error("Error fetching messages:", err);
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-open chat when selectedChatUsername is provided
  useEffect(() => {
    if (selectedChatUsername && conversations.length > 0) {
      // Check if conversation already exists
      const existingConvo = conversations.find(convo =>
        convo.otherUser?.username?.toLowerCase() === selectedChatUsername.toLowerCase()
      );

      if (existingConvo) {
        // Open existing conversation
        handleChatClick(existingConvo);
      } else {
        // Create new conversation
        createNewConversation(selectedChatUsername);
      }
    }
  }, [selectedChatUsername, conversations]);

  const createNewConversation = async (username) => {
    try {
      // First, fetch user ID by username
      const userResponse = await userService.getUserByUsername(username);
      if (!userResponse || !userResponse.user) {
        alert("User not found");
        return;
      }
      const user = userResponse.user;
      // Backend expects userId (uid), not username
      const userId = user.uid || user._id || user.id;
      if (!userId) {
        alert("Unable to start conversation");
        return;
      }
      const newConvo = await messageService.createConversation(userId);
      if (newConvo) {
        setConversations((prev) => [newConvo, ...prev]);
        setActiveChat(newConvo);
        setMessages([]);
      }
    } catch (err) {
      console.error("Error creating conversation:", err);
      alert("Failed to start conversation. Please try again.");
    }
  };

  // Close theme picker on outside click
  useEffect(() => {
    if (!showThemePicker) return;
    const handler = (e) => {
      if (themePickerRef.current && !themePickerRef.current.contains(e.target)) {
        setShowThemePicker(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showThemePicker]);

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !activeChat || sendingMessage) return;

    const messageText = messageInput.trim();
    setMessageInput("");
    setSendingMessage(true);

    // Optimistically add message to UI
    const tempMessage = {
      id: Date.now(),
      text: messageText,
      sender: 'sender',
      time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      status: 'sent',
      isDelivered: false,
      isRead: false,
    };
    setMessages([...messages, tempMessage]);

    try {
      // Backend expects: conversationId, recipientId, text, mediaUrl
      // Note: otherUser.uid is the recipient's user ID (not _id)
      const recipientId = activeChat.otherUser?.uid || activeChat.otherUser?._id || activeChat.otherUser?.id;
      const sentMessage = await messageService.sendMessage(
        activeChat._id,
        recipientId,
        messageText,
        null
      );
      
      // Update the optimistic message with actual message data and mark as delivered
      setMessages(prevMsgs =>
        prevMsgs.map(msg =>
          msg.id === tempMessage.id
            ? {
                ...msg,
                id: sentMessage._id || sentMessage.id || msg.id,
                status: 'delivered', // Assume delivered after successful send
                isDelivered: true,
              }
            : msg
        )
      );
      
      // Update conversation list with new last message
      setConversations(prevConvos =>
        prevConvos.map(convo =>
          convo._id === activeChat._id
            ? { ...convo, lastMessage: { text: messageText, createdAt: new Date() } }
            : convo
        )
      );
    } catch (err) {
      console.error("Error sending message:", err);
      // Remove optimistic message on error
      setMessages(messages.filter(msg => msg.id !== tempMessage.id));
      setMessageInput(messageText); // Restore message
      alert("Failed to send message. Please try again.");
    } finally {
      setSendingMessage(false);
    }
  };

  const handleSelectTheme = (key) => {
    if (!activeChat) return;
    const chatKey = activeChat.id || activeChat.username;
    const updatedThemes = { ...chatThemes, [chatKey]: key };
    setChatThemes(updatedThemes);
    // Save to localStorage
    try {
      localStorage.setItem('chatThemes', JSON.stringify(updatedThemes));
    } catch (error) {
      console.error('Error saving chat theme:', error);
    }
    setShowThemePicker(false);
  };

  const handleChatClick = async (chat) => {
    setActiveChat(chat);
    await fetchMessages(chat._id);
  };

  const handleStartChatWithContact = async (contact) => {
    if (!contact?.username) return;

    // If a conversation already exists with this user, open it
    const existingConvo = conversations.find(
      (convo) =>
        convo.otherUser?.username?.toLowerCase() ===
        contact.username.toLowerCase()
    );

    if (existingConvo) {
      await handleChatClick(existingConvo);
    } else {
      await createNewConversation(contact.username);
    }
  };

  const handleBackClick = () => {
    setActiveChat(null);
  };

  const activeChatKey = activeChat?.id || activeChat?.username;
  const currentTheme = activeChatKey ? chatThemes[activeChatKey] || "default" : "default";

  return (
    <main className={`flex-1 overflow-hidden bg-[#fffcfa] dark:bg-black ${activeChat ? 'fixed inset-0 z-[70] md:relative md:z-auto md:h-[calc(100vh-4rem)]' : 'h-[calc(100vh-7.5rem)] md:h-[calc(100vh-4rem)]'}`}>
      <div className="h-full flex">
        {/* Left Side - Chat List */}
        <div className={`${activeChat ? 'hidden md:block' : 'block'} w-full md:w-96 border-r border-black dark:border-gray-800 overflow-y-auto bg-[#fffcfa] dark:bg-black`}>
          <div className="p-4 md:p-6">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <h1 className="text-xl md:text-2xl font-bold">Messages</h1>
              <button
                onClick={() => { setShowCompose(true); setComposeSearch(""); setComposeResults([]); }}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                title="New message"
              >
                <Edit className="w-5 h-5 text-black dark:text-white" />
              </button>
            </div>

            {/* Loading State */}
            {loadingConversations && (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg mb-4">
                <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Empty State */}
            {!loadingConversations && !error && conversations.length === 0 && (
              <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                <div className="mb-4">
                  <svg
                    className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-700"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                </div>
                <p className="font-semibold text-lg mb-2">No conversations yet</p>
                <p className="text-sm mt-2 mb-1">
                  Start a chat with someone you follow.
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-600">
                  Tap a user below to open a chat.
                </p>
              </div>
            )}

            {/* Contacts list when there are no conversations yet */}
            {!loadingConversations &&
              !error &&
              conversations.length === 0 && (
                <div className="mt-2">
                  {loadingContacts ? (
                    <div className="flex justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    </div>
                  ) : chatContacts.length === 0 ? (
                    <p className="text-xs text-gray-400 dark:text-gray-600 text-center">
                      Follow someone to start messaging with them.
                    </p>
                  ) : (
                    <>
                      <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-2">
                        People you can message
                      </p>
                      <div className="space-y-2">
                        {chatContacts.map((contact) => (
                          <div
                            key={contact.uid || contact.id || contact._id}
                            onClick={() => handleStartChatWithContact(contact)}
                            className="flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-xl bg-white dark:bg-[#0f0f0f] border border-black dark:border-gray-800 hover:border-primary cursor-pointer transition"
                          >
                            {/* Profile Picture */}
                            <div className="relative flex-shrink-0">
                              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden">
                                <LiveProfilePhoto
                                  imageSrc={
                                    contact.profilePhoto ||
                                    contact.avatar ||
                                    "https://i.pravatar.cc/100"
                                  }
                                  videoSrc={getProfileVideoUrl(
                                    contact.profilePhoto ||
                                      contact.avatar,
                                    contact.username
                                  )}
                                  alt={contact.username || "User"}
                                  className="w-10 h-10 md:w-12 md:h-12 rounded-full"
                                />
                              </div>
                            </div>

                            {/* User Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onViewUserProfile &&
                                      onViewUserProfile(contact.username);
                                  }}
                                  className="font-semibold text-sm md:text-base text-black dark:text-white truncate hover:opacity-70 transition-opacity cursor-pointer"
                                >
                                  {contact.username || "Unknown User"}
                                </button>
                              </div>
                              <p className="text-xs md:text-sm text-gray-400 truncate">
                                Tap to start a conversation
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

            <div className="space-y-2">
              {conversations.map((convo) => {
                // Backend returns: otherUser (populated), lastMessageText, lastMessageAt, unreadCount (calculated per user)
                const otherUser = convo.otherUser || {};
                const lastMessageText = convo.lastMessageText || '';
                const lastMessageAt = convo.lastMessageAt;
                const unreadCount = convo.unreadCount || 0;
                const timeAgo = lastMessageAt
                  ? new Date(lastMessageAt).toLocaleDateString()
                  : "";
                
                return (
                <div
                    key={convo._id}
                    onClick={() => handleChatClick(convo)}
                    className="flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-xl bg-white dark:bg-[#0f0f0f] border border-black dark:border-gray-800 hover:border-primary cursor-pointer transition"
                >
                  {/* Profile Picture */}
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-full overflow-hidden">
                      <LiveProfilePhoto
                        imageSrc={otherUser.avatar || otherUser.profilePhoto || "https://i.pravatar.cc/100"}
                        videoSrc={getProfileVideoUrl(otherUser.avatar || otherUser.profilePhoto, otherUser.username)}
                        alt={otherUser.username || "User"}
                        className="w-12 h-12 md:w-14 md:h-14 rounded-full"
                    />
                    </div>
                    {convo.unreadCount > 0 && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 md:w-4 md:h-4 bg-primary rounded-full border-2 border-black dark:border-gray-800"></div>
                    )}
                  </div>

                  {/* Chat Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewUserProfile && onViewUserProfile(otherUser.username);
                        }}
                        className="font-semibold text-sm md:text-base text-black dark:text-white truncate hover:opacity-70 transition-opacity cursor-pointer"
                      >
                        {otherUser.username || "Unknown User"}
                      </button>
                      <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                        {timeAgo}
                      </span>
                    </div>
                    <p className={`text-xs md:text-sm truncate ${unreadCount > 0 ? 'text-black dark:text-white font-medium' : 'text-gray-400'}`}>
                      {lastMessageText || "No messages yet"}
                    </p>
                  </div>
                </div>
              );
              })}
            </div>
          </div>
        </div>

        {/* Right Side - Chat Window */}
        {activeChat && (
          <div className="flex-1 flex flex-col bg-[#fffcfa] dark:bg-black">
            {/* Chat Header */}
            <div className="flex items-center justify-between p-4 border-b border-black dark:border-gray-800 bg-[#fffcfa] dark:bg-[#0f0f0f] relative">
              <div className="flex items-center gap-3">
              <button
                onClick={handleBackClick}
                  className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition"
              >
                  <ArrowLeft className="w-5 h-5 text-black dark:text-white" />
                </button>
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden flex-shrink-0">
                  <LiveProfilePhoto
                    imageSrc={activeChat.otherUser?.avatar || activeChat.otherUser?.profilePhoto || "https://i.pravatar.cc/100"}
                    videoSrc={getProfileVideoUrl(activeChat.otherUser?.avatar || activeChat.otherUser?.profilePhoto, activeChat.otherUser?.username)}
                    alt={activeChat.otherUser?.username || "User"}
                    className="w-10 h-10 md:w-12 md:h-12 rounded-full"
                  />
                </div>
                <div className="flex flex-col">
                  <button
                    onClick={() => onViewUserProfile && onViewUserProfile(activeChat.otherUser?.username)}
                    className="font-semibold text-base md:text-lg text-black dark:text-white hover:opacity-70 transition-opacity cursor-pointer text-left"
                  >
                    {activeChat.otherUser?.username || "Unknown User"}
                  </button>
                  {/* Online Status Indicator */}
                  {activeChat.otherUser?.isOnline && (
                    <span className="text-xs text-primary font-medium">online</span>
                  )}
                </div>
              </div>
              <div className="relative" ref={themePickerRef}>
                <button
                  onClick={() => setShowThemePicker((s) => !s)}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition flex items-center justify-center"
                  aria-label="Change chat theme"
                >
                  <img src={themeIcon} alt="theme" className="w-5 h-5 dark:invert" />
              </button>
                {showThemePicker && (
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#0f0f0f] border border-black dark:border-gray-800 rounded-xl shadow-2xl p-3 z-20">
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">Chat themes</p>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleSelectTheme("cat")}
                        className={`w-14 h-14 rounded-full border-2 overflow-hidden flex-shrink-0 ${currentTheme === "cat" ? "border-primary" : "border-gray-300 dark:border-gray-700"}`}
                        style={{ backgroundImage: `url(${catTheme})`, backgroundSize: "cover", backgroundPosition: "center" }}
                        aria-label="Cat theme"
              />
                      <button
                        onClick={() => handleSelectTheme("xoxo")}
                        className={`w-14 h-14 rounded-full border-2 overflow-hidden flex-shrink-0 ${currentTheme === "xoxo" ? "border-primary" : "border-gray-300 dark:border-gray-700"}`}
                        style={{ backgroundImage: `url(${xoxoTheme})`, backgroundSize: "cover", backgroundPosition: "center" }}
                        aria-label="XOXO theme"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Messages Area */}
            <div
              className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-[#fffcfa] dark:bg-[#0f0f0f]"
              style={currentTheme !== "default" ? (themes[currentTheme]?.backgroundStyle || {}) : {}}
            >
              {loadingMessages ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <>
                  {messages.map((message, index) => {
                    // Find the last sender message to show read receipt only on it
                    const senderMessages = messages.filter(msg => msg.sender === 'sender');
                    const lastSenderMessage = senderMessages[senderMessages.length - 1];
                    const isLastSenderMessage = message.id === lastSenderMessage?.id;
                    
                    return (
                <div
                  key={message.id}
                        className={`flex flex-col ${message.sender === 'sender' ? 'items-end' : 'items-start'}`}
                >
                  <div
                          className={`max-w-[75%] md:max-w-[60%] rounded-2xl px-4 py-2 ${message.sender === 'sender'
                            ? themes[currentTheme]?.senderBubble || themes.default.senderBubble
                            : themes[currentTheme]?.receiverBubble || themes.default.receiverBubble
                    }`}
                  >
                    <p className="text-sm md:text-base">{message.text}</p>
                  </div>
                        {/* Read Receipts - Only show on the last sender message and if read receipts are enabled */}
                        {message.sender === 'sender' && isLastSenderMessage && readReceiptsEnabled && (
                          <div className="mt-1 px-1">
                            {message.status === 'read' ? (
                              <span className="text-xs text-gray-400 dark:text-gray-500">Seen</span>
                            ) : message.status === 'delivered' ? (
                              <span className="text-xs text-gray-400 dark:text-gray-500">Delivered</span>
                            ) : (
                              <span className="text-xs text-gray-400 dark:text-gray-500">Sent</span>
                            )}
                          </div>
                        )}
                </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Message Input */}
            <div className="border-t border-black dark:border-gray-800 p-4 bg-white dark:bg-[#0f0f0f]">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 bg-gray-100 dark:bg-[#2f2f2f] border border-black dark:border-gray-500 rounded-full px-4 py-2 md:py-3 text-sm text-black dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-primary transition"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim() || sendingMessage}
                  className="p-2 md:p-3 bg-primary hover:bg-primary-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed rounded-full transition flex items-center justify-center"
                >
                  {sendingMessage ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Send className="w-5 h-5 text-white dark:text-white" />
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Empty State (when no chat is selected on desktop) */}
        {!activeChat && (
          <div className="hidden md:flex flex-1 items-center justify-center bg-[#fffcfa] dark:bg-black">
            <div className="text-center text-gray-500">
              <p className="text-lg">Select a chat to start messaging</p>
              <button
                onClick={() => { setShowCompose(true); setComposeSearch(""); setComposeResults([]); }}
                className="mt-4 px-5 py-2 bg-primary text-white rounded-full text-sm font-medium hover:bg-primary-700 transition"
              >
                New message
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Compose / New Message Modal */}
      {showCompose && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-2xl w-full max-w-md mx-4 flex flex-col overflow-hidden max-h-[80vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-base font-bold text-black dark:text-white">New message</h2>
              <button
                onClick={() => { setShowCompose(false); setComposeSearch(""); setComposeResults([]); }}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                <X className="w-5 h-5 text-black dark:text-white" />
              </button>
            </div>

            {/* Search */}
            <div className="px-5 py-3 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 bg-gray-100 dark:bg-[#2f2f2f] rounded-xl px-4 py-2">
                <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Search people..."
                  value={composeSearch}
                  onChange={(e) => setComposeSearch(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-sm text-black dark:text-white placeholder-gray-400"
                />
                {composeLoading && <Loader2 className="w-4 h-4 text-gray-400 animate-spin flex-shrink-0" />}
              </div>
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto py-2">
              {!composeSearch.trim() && (
                <p className="text-sm text-gray-400 text-center py-8 px-5">
                  Search for someone to message
                </p>
              )}
              {composeSearch.trim() && !composeLoading && composeResults.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-8 px-5">No users found</p>
              )}
              {composeResults.map((u) => (
                <button
                  key={u.uid || u.id || u._id}
                  onClick={async () => {
                    setShowCompose(false);
                    setComposeSearch("");
                    setComposeResults([]);
                    await createNewConversation(u.username);
                  }}
                  className="w-full flex items-center gap-3 px-5 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition text-left"
                >
                  <div className="w-11 h-11 rounded-full overflow-hidden flex-shrink-0">
                    <LiveProfilePhoto
                      imageSrc={u.profilePhoto || u.avatar || "https://i.pravatar.cc/100"}
                      videoSrc={getProfileVideoUrl(u.profilePhoto || u.avatar, u.username)}
                      alt={u.username}
                      className="w-11 h-11 rounded-full"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-black dark:text-white truncate">{u.username}</p>
                    {u.displayName && <p className="text-xs text-gray-400 truncate">{u.displayName}</p>}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}