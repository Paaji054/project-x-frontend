import { api } from '../utils/httpClient';
import { API_ENDPOINTS } from '../config/api';

/**
 * Message Service
 */
export const messageService = {
  /**
   * Create conversation
   */
  async createConversation(userId) {
    try {
      // Backend expects userId, not participantIds
      const response = await api.post(API_ENDPOINTS.MESSAGES.CREATE_CONVERSATION, { userId });
      return response.success ? response.data.conversation : null;
    } catch (error) {
      console.error('Create conversation error:', error);
      throw error;
    }
  },

  /**
   * Get conversations (updated to match backend response format)
   */
  async getConversations(limit = 20, skip = 0) {
    try {
      // Backend expects skip, not page
      const response = await api.get(API_ENDPOINTS.MESSAGES.LIST_CONVERSATIONS, { limit, skip });
      // Backend returns: { success: true, data: { conversations: [] } }
      // Each conversation has: _id, participants, isGroup, name, avatar, creatorId, admins, 
      // lastMessageText, lastMessageAt, unreadCounts, otherUser (populated), unreadCount
      return response.success ? response.data.conversations : [];
    } catch (error) {
      console.error('Get conversations error:', error);
      throw error;
    }
  },

  /**
   * Send message (updated to match backend)
   * Backend expects: conversationId, recipientId, text, mediaUrl, type, sharedPostId
   * For WebSocket: use socketService.sendMessage() instead
   */
  async sendMessage(conversationId, recipientId, text, mediaUrl = null, type = 'text', sharedPostId = null) {
    try {
      const payload = {
        conversationId,
        recipientId,
        text: type === 'text' || type === 'post_share' ? text : '', // Text content for text/post_share messages
        mediaUrl: (type !== 'text' && type !== 'post_share') ? text : mediaUrl, // Use text as URL for media messages
        type, // Message type: text, image, video, voice, post_share
      };
      // Include sharedPostId for post_share messages
      if (sharedPostId) {
        payload.sharedPostId = sharedPostId;
      }
      // Backend expects: conversationId, recipientId, text, mediaUrl
      const response = await api.post(API_ENDPOINTS.MESSAGES.SEND, payload);
      // Backend returns: { success: true, data: { message: {...} }, message: 'Message sent' }
      // Message fields: _id, conversationId, senderId, recipientId, text, mediaUrl, type, 
      // createdAt, updatedAt, sender: { uid, username, displayName, avatar }
      return response.success ? response.data.message : null;
    } catch (error) {
      console.error('Send message error:', error);
      throw error;
    }
  },

  /**
   * Get messages by conversation (updated to match backend response)
   */
  async getMessagesByConversation(conversationId, limit = 50, skip = 0) {
    try {
      // Backend expects skip, not page
      const response = await api.get(API_ENDPOINTS.MESSAGES.BY_CONVERSATION(conversationId), { limit, skip });
      // Backend returns: { success: true, data: { messages: [] } }
      // Each message has: _id, conversationId, senderId, recipientId, text, mediaUrl, type,
      // duration, fileSize, readAt, deliveredAt, reactions, replyTo, isDeleted,
      // createdAt, updatedAt, sender: { uid, username, displayName, avatar }
      return response.success ? response.data.messages : [];
    } catch (error) {
      console.error('Get messages error:', error);
      throw error;
    }
  },

  /**
   * Edit message (text only). Backend returns updated message.
   */
  async editMessage(messageId, text) {
    try {
      const response = await api.patch(API_ENDPOINTS.MESSAGES.EDIT_MESSAGE(messageId), { text });
      return response.success ? response.data.message : null;
    } catch (error) {
      console.error('Edit message error:', error);
      throw error;
    }
  },

  /**
   * Delete message (soft delete). Sender only.
   */
  async deleteMessage(messageId) {
    try {
      const response = await api.delete(API_ENDPOINTS.MESSAGES.DELETE_MESSAGE(messageId));
      return response.success;
    } catch (error) {
      console.error('Delete message error:', error);
      throw error;
    }
  },

  /**
   * Mark conversation as read
   */
  async markConversationAsRead(conversationId, lastReadMessageId = null) {
    try {
      const data = lastReadMessageId ? { lastReadMessageId } : {};
      const response = await api.post(API_ENDPOINTS.MESSAGES.MARK_READ(conversationId), data);
      return response;
    } catch (error) {
      console.error('Mark conversation as read error:', error);
      throw error;
    }
  },

  /**
   * Upload message media (image, voice note, etc.)
   */
  async uploadMessageMedia(file) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await api.post(API_ENDPOINTS.MESSAGES.UPLOAD_MEDIA, formData, true, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.success ? response.data : null;
    } catch (error) {
      console.error('Upload message media error:', error);
      throw error;
    }
  },
};
