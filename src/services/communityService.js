import { api } from '../utils/httpClient';
import { API_ENDPOINTS } from '../config/api';

/**
 * Community Service
 */
export const communityService = {
  /**
   * Get public communities
   * @param {number} limit - Maximum number of communities to return
   * @param {string} category - Optional category filter
   */
  async getPublicCommunities(limitOrOptions = 20, category = null) {
    try {
      const limit = typeof limitOrOptions === 'object' && limitOrOptions !== null
        ? (limitOrOptions.limit ?? 20)
        : limitOrOptions;
      const cat = typeof limitOrOptions === 'object' && limitOrOptions !== null
        ? (limitOrOptions.category ?? category)
        : category;
      const params = { limit };
      if (cat) params.category = cat;
      // Send auth when available so backend can set isJoined (optionalAuth on backend)
      const response = await api.get(API_ENDPOINTS.COMMUNITIES.PUBLIC, params);
      // Backend returns { success, data: { communities } }
      if (response.success && response.data) {
        const list = response.data.communities ?? response.data;
        return Array.isArray(list) ? list : [];
      }
      return [];
    } catch (error) {
      console.error('Get public communities error:', error);
      return [];
    }
  },

  /**
   * Get user's communities
   */
  async getUserCommunities(limit = 20) {
    try {
      const response = await api.get(API_ENDPOINTS.COMMUNITIES.USER_COMMUNITIES, { limit });
      // Backend returns { success, data: { communities } }
      if (response.success && response.data) {
        const list = response.data.communities ?? response.data;
        return Array.isArray(list) ? list : [];
      }
      return [];
    } catch (error) {
      console.error('Get user communities error:', error);
      return [];
    }
  },

  /**
   * Create community
   */
  async createCommunity(communityData) {
    try {
      const response = await api.post(API_ENDPOINTS.COMMUNITIES.CREATE, communityData);
      // Backend returns { success, data: { community } }; return data so caller gets { community }
      return response.success ? response.data : null;
    } catch (error) {
      console.error('Create community error:', error);
      throw error;
    }
  },

  /**
   * Get community by slug
   */
  async getCommunityBySlug(slug) {
    try {
      const response = await api.get(API_ENDPOINTS.COMMUNITIES.BY_SLUG(slug));
      // Backend returns { success, data: { community } }; community has _id, slug, code, isJoined (if auth)
      if (response.success && response.data) {
        return response.data.community ?? response.data;
      }
      return null;
    } catch (error) {
      console.error('Get community by slug error:', error);
      throw error;
    }
  },

  /**
   * Get community posts
   */
  async getCommunityPosts(communityId, limit = 10, page = 1) {
    try {
      const response = await api.get(API_ENDPOINTS.COMMUNITIES.POSTS(communityId), { limit, page });
      // Backend returns { success, data: { posts } }; normalize to always have posts + pagination
      const data = response.success && response.data ? response.data : { posts: [] };
      const posts = Array.isArray(data.posts) ? data.posts : [];
      const pagination = data.pagination || {};
      return { posts, pagination };
    } catch (error) {
      console.error('Get community posts error:', error);
      throw error;
    }
  },

  /**
   * Update community
   */
  async updateCommunity(communityId, communityData) {
    try {
      const response = await api.put(API_ENDPOINTS.COMMUNITIES.UPDATE(communityId), communityData);
      return response.success ? response.data : null;
    } catch (error) {
      console.error('Update community error:', error);
      throw error;
    }
  },

  /**
   * Delete community
   */
  async deleteCommunity(communityId) {
    try {
      const response = await api.delete(API_ENDPOINTS.COMMUNITIES.DELETE(communityId));
      return response;
    } catch (error) {
      console.error('Delete community error:', error);
      throw error;
    }
  },

  /**
   * Join community
   */
  async joinCommunity(communityId) {
    try {
      const response = await api.post(API_ENDPOINTS.COMMUNITIES.JOIN(communityId));
      return response;
    } catch (error) {
      console.error('Join community error:', error);
      throw error;
    }
  },

  /**
   * Join community by code
   */
  async joinCommunityByCode(code) {
    try {
      const response = await api.post(API_ENDPOINTS.COMMUNITIES.JOIN_BY_CODE, { code });
      return response;
    } catch (error) {
      console.error('Join community by code error:', error);
      throw error;
    }
  },

  /**
   * Leave community
   */
  async leaveCommunity(communityId) {
    try {
      const response = await api.post(API_ENDPOINTS.COMMUNITIES.LEAVE(communityId));
      return response;
    } catch (error) {
      console.error('Leave community error:', error);
      throw error;
    }
  },

  /**
   * Add moderator to community (requires creator). userId is the target user's uid.
   */
  async addModerator(communityId, userId) {
    try {
      const response = await api.post(API_ENDPOINTS.COMMUNITIES.ADD_MODERATOR(communityId, userId));
      return response;
    } catch (error) {
      console.error('Add moderator error:', error);
      throw error;
    }
  },

  /**
   * Remove moderator from community (creator only).
   */
  async removeModerator(communityId, userId) {
    try {
      const response = await api.delete(API_ENDPOINTS.COMMUNITIES.REMOVE_MODERATOR(communityId, userId));
      return response;
    } catch (error) {
      console.error('Remove moderator error:', error);
      throw error;
    }
  },

  /**
   * Get community members (owner or moderator only). Returns { members: [{ uid, username, displayName, avatar }] }.
   */
  async getMembers(communityId) {
    try {
      const response = await api.get(API_ENDPOINTS.COMMUNITIES.GET_MEMBERS(communityId));
      if (response.success && response.data) {
        return response.data.members ?? response.data ?? [];
      }
      return [];
    } catch (error) {
      console.error('Get community members error:', error);
      throw error;
    }
  },

  /**
   * Remove member from community (owner or moderator only).
   */
  async removeMember(communityId, userId) {
    try {
      const response = await api.delete(API_ENDPOINTS.COMMUNITIES.REMOVE_MEMBER(communityId, userId));
      return response;
    } catch (error) {
      console.error('Remove member error:', error);
      throw error;
    }
  },

  /**
   * Ban user from community
   */
  async banUser(communityId, userId) {
    try {
      const response = await api.post(API_ENDPOINTS.COMMUNITIES.BAN_USER(communityId, userId));
      return response;
    } catch (error) {
      console.error('Ban user error:', error);
      throw error;
    }
  },
};
