import { api } from '../utils/httpClient';
import { API_ENDPOINTS } from '../config/api';

/**
 * Story Service
 */
export const storyService = {
  /**
   * Get active stories (sends auth when available so backend can return viewed flag)
   */
  async getStories() {
    try {
      const response = await api.get(API_ENDPOINTS.STORIES.LIST, {}, true);
      if (response.success && response.data) {
        return response.data.stories || [];
      }
      return [];
    } catch (error) {
      console.error('Get stories error:', error);
      return [];
    }
  },

  /**
   * Get user's stories
   */
  async getUserStories(userId) {
    try {
      const response = await api.get(API_ENDPOINTS.STORIES.BY_USER(userId));
      if (response.success && response.data) {
        return response.data.stories || [];
      }
      return [];
    } catch (error) {
      console.error('Get user stories error:', error);
      return [];
    }
  },

  /**
   * Create story
   */
  async createStory(story) {
    try {
      const response = await api.post(API_ENDPOINTS.STORIES.CREATE, story);
      if (response.success && response.data) {
        return response.data.story || null;
      }
      return null;
    } catch (error) {
      console.error('Create story error:', error);
      throw error;
    }
  },

  /**
   * Mark story viewed
   */
  async markViewed(storyId) {
    try {
      const response = await api.post(API_ENDPOINTS.STORIES.VIEW(storyId), {});
      return response;
    } catch (error) {
      console.error('View story error:', error);
      throw error;
    }
  },

  /**
   * Delete story (owner only)
   */
  async deleteStory(storyId) {
    try {
      const response = await api.delete(API_ENDPOINTS.STORIES.DELETE(storyId));
      return response;
    } catch (error) {
      console.error('Delete story error:', error);
      throw error;
    }
  },
};


