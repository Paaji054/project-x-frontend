import { io } from 'socket.io-client';
import { API_CONFIG } from '../config/api';

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
  }

  /**
   * Connect to Socket.io server
   */
  connect(token) {
    // Return existing connection if already connected
    if (this.socket?.connected) {
      console.log('✅ Socket already connected');
      return this.socket;
    }

    // Disconnect existing socket if not connected
    if (this.socket && !this.socket.connected) {
      this.socket.disconnect();
      this.socket = null;
    }

    const socketUrl = import.meta.env.VITE_SOCKET_URL || API_CONFIG.BASE_URL;
    console.log('🔌 Connecting to socket server:', socketUrl);

    this.socket = io(socketUrl, {
      auth: {
        token: token,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      timeout: 10000,
      autoConnect: true,
    });

    // Connection events
    this.socket.on('connect', () => {
      this.connected = true;
      console.log('✅ Socket connected successfully:', this.socket.id);
    });

    this.socket.on('disconnect', (reason) => {
      this.connected = false;
      console.log('❌ Socket disconnected:', reason);
      
      // Attempt to reconnect if disconnected unexpectedly
      if (reason === 'io server disconnect') {
        // Server disconnected, try to reconnect manually
        setTimeout(() => {
          if (token && !this.socket?.connected) {
            console.log('🔄 Attempting manual reconnection...');
            this.socket?.connect();
          }
        }, 1000);
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket.io connection error:', error.message);
      this.connected = false;
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('✅ Socket reconnected after', attemptNumber, 'attempts');
      this.connected = true;
    });

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      console.log('🔄 Socket reconnection attempt', attemptNumber);
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('❌ Socket reconnection error:', error.message);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('❌ Socket reconnection failed after max attempts');
      this.connected = false;
    });

    return this.socket;
  }

  /**
   * Disconnect from Socket.io server
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  /**
   * Check if connected
   */
  isConnected() {
    return this.connected && this.socket?.connected;
  }

  /**
   * Join a chat room (updated to match backend)
   */
  joinConversation(conversationId) {
    if (this.socket) {
      // Backend expects join_group event with { chatId }
      this.socket.emit('join_group', { chatId: conversationId });
    }
  }

  /**
   * Leave a chat room (updated to match backend)
   */
  leaveConversation(conversationId) {
    if (this.socket) {
      // Backend expects leave_group event with { chatId }
      this.socket.emit('leave_group', { chatId: conversationId });
    }
  }

  /**
   * Send typing indicator (updated to match backend)
   */
  sendTyping(conversationId, isTyping) {
    if (this.socket) {
      // Backend expects typing_start or typing_stop with { chatId }
      const event = isTyping ? 'typing_start' : 'typing_stop';
      this.socket.emit(event, { chatId: conversationId });
    }
  }

  /**
   * PRODUCTION-GRADE: Send a message with acknowledgment and retry logic
   * @param {String} chatId - Chat/conversation ID
   * @param {String} content - Message content
   * @param {String} type - Message type (text, image, voice, etc.)
   * @param {Object} options - Additional options
   * @returns {Promise} Resolves with server response (messageId, isDuplicate)
   */
  sendMessage(chatId, content, type = 'text', options = {}) {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.connected) {
        return reject(new Error('Socket not connected'));
      }

      // Generate UUID for idempotent processing (prevents duplicates)
      const clientMessageId = options.clientMessageId || this.generateUUID();
      const tempId = options.tempId || `temp_${Date.now()}`;

      // Message payload
      const messageData = {
        chatId,
        content,
        type,
        clientMessageId, // PRODUCTION-GRADE: UUID for deduplication
        tempId, // For optimistic UI updates
        replyTo: options.replyTo || null,
        duration: options.duration || null,
        fileSize: options.fileSize || null,
      };

      // PRODUCTION-GRADE: Acknowledgment with timeout and retry
      const timeout = options.timeout || 10000; // 10 seconds default
      const maxRetries = options.maxRetries || 3;
      let attempt = 0;

      const sendAttempt = () => {
        attempt++;
        console.log(`📤 Sending message (attempt ${attempt}/${maxRetries})...`, { chatId, clientMessageId });

        const timeoutId = setTimeout(() => {
          console.warn(`⏱️ Message acknowledgment timeout (attempt ${attempt})`);
          
          if (attempt < maxRetries) {
            // Exponential backoff: 1s, 2s, 4s
            const delay = Math.pow(2, attempt - 1) * 1000;
            console.log(`🔄 Retrying in ${delay}ms...`);
            setTimeout(sendAttempt, delay);
          } else {
            reject(new Error('Message send timeout after max retries'));
          }
        }, timeout);

        // Send with acknowledgment callback
        this.socket.emit('send_message', messageData, (response) => {
          clearTimeout(timeoutId);

          if (response.success) {
            console.log('✅ Message acknowledged:', response);
            resolve({
              messageId: response.messageId,
              isDuplicate: response.isDuplicate || false,
              timestamp: response.timestamp,
              clientMessageId,
              tempId,
            });
          } else {
            console.error('❌ Message send failed:', response.error);
            
            // Don't retry on validation errors or rate limits
            if (response.error?.code === 'VALIDATION_ERROR' || 
                response.error?.code === 'RATE_LIMIT_EXCEEDED' ||
                response.error?.code === 'CONTENT_TOO_LONG') {
              reject(new Error(response.error.message));
            } else if (attempt < maxRetries) {
              // Retry on other errors
              const delay = Math.pow(2, attempt - 1) * 1000;
              setTimeout(sendAttempt, delay);
            } else {
              reject(new Error(response.error?.message || 'Message send failed'));
            }
          }
        });
      };

      // Start first attempt
      sendAttempt();
    });
  }

  /**
   * Generate RFC4122 v4 UUID for clientMessageId
   */
  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Legacy method for backwards compatibility (no acknowledgment)
   * @deprecated Use sendMessage() with Promise instead
   */
  sendMessageLegacy(chatId, content, type = 'text') {
    if (this.socket) {
      // Backend expects send_message event with { chatId, content, type }
      this.socket.emit('send_message', {
        chatId,
        content,
        type,
        tempId: `temp_${Date.now()}`,
      });
    }
  }

  /**
   * Listen for new messages (updated to match backend)
   */
  onNewMessage(callback) {
    if (this.socket) {
      // Backend sends receive_message event
      this.socket.on('receive_message', callback);
    }
  }

  /**
   * Listen for message sent confirmation (updated to match backend)
   */
  onMessageSent(callback) {
    if (this.socket) {
      // Backend sends message_sent event for confirmation
      this.socket.on('message_sent', callback);
    }
  }

  /**
   * Listen for message delivered receipts
   */
  onMessageDelivered(callback) {
    if (this.socket) {
      // Backend sends message_delivered event
      this.socket.on('message_delivered', callback);
    }
  }

  /**
   * Listen for typing indicators (updated to match backend)
   */
  onTyping(callback) {
    if (this.socket) {
      // Backend sends user_typing event
      this.socket.on('user_typing', callback);
    }
  }

  /**
   * Mark messages as read (updated to match backend)
   */
  markMessagesSeen(chatId, messageId = null) {
    if (this.socket) {
      // Backend expects message_seen event with { chatId, messageId }
      this.socket.emit('message_seen', { chatId, messageId });
    }
  }

  /**
   * Listen for read receipts (updated to match backend)
   */
  onMessageReadReceipt(callback) {
    if (this.socket) {
      // Backend sends message_read_receipt event
      this.socket.on('message_read_receipt', callback);
    }
  }

  /**
   * Listen for user online status
   */
  onUserOnline(callback) {
    if (this.socket) {
      this.socket.on('user-online', callback);
    }
  }

  /**
   * Listen for user offline status
   */
  onUserOffline(callback) {
    if (this.socket) {
      this.socket.on('user-offline', callback);
    }
  }

  /**
   * Listen for joined chat confirmation
   */
  onJoinedChat(callback) {
    if (this.socket) {
      this.socket.on('joined_chat', callback);
    }
  }

  /**
   * Listen for user joined chat notification
   */
  onUserJoinedChat(callback) {
    if (this.socket) {
      this.socket.on('user_joined_chat', callback);
    }
  }

  /**
   * Listen for user left chat notification
   */
  onUserLeftChat(callback) {
    if (this.socket) {
      this.socket.on('user_left_chat', callback);
    }
  }

  /**
   * Listen for errors
   */
  onError(callback) {
    if (this.socket) {
      this.socket.on('error', callback);
    }
  }

  onNewNotification(callback) {
    if (this.socket) {
      this.socket.on('new-notification', callback);
    }
  }

  offNewNotification(callback) {
    if (this.socket) {
      this.socket.off('new-notification', callback);
    }
  }

  /**
   * Remove all event listeners
   */
  removeAllListeners() {
    if (this.socket) {
      this.socket.removeAllListeners();
    }
  }
}

// Export singleton instance
export const socketService = new SocketService();
