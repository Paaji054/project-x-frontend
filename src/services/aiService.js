import { api } from '../utils/httpClient';
import { API_ENDPOINTS } from '../config/api';

/**
 * AI Service
 */
export const aiService = {
  /**
   * Get credit costs for AI features
   */
  async getCreditCosts() {
    try {
      const response = await api.get(API_ENDPOINTS.AI.CREDIT_COSTS);
      if (!response.success || !response.data) return {};
      const costs = response.data.costs || response.data;
      return {
        ...costs,
        generateImage: costs.generateImage ?? costs.AI_IMAGE,
        generateCaption: costs.generateCaption ?? costs.AI_CAPTION,
        generateBio: costs.generateBio ?? costs.AI_BIO,
        generateTheme: costs.generateTheme ?? costs.AI_THEME,
        generateAvatar: costs.generateAvatar ?? costs.AI_AVATAR,
        generateCommunityIcon: costs.generateCommunityIcon ?? costs.AI_COMMUNITY_ICON,
      };
    } catch (error) {
      console.error('Get credit costs error:', error);
      throw error;
    }
  },

  /**
   * Generate image
   */
  async generateImage(prompt, options = {}) {
    try {
      const response = await api.post(API_ENDPOINTS.AI.GENERATE_IMAGE, { prompt, ...options });
      if (!response.success || !response.data) return null;
      const data = response.data;
      return { url: data.imageUrl, ...data };
    } catch (error) {
      console.error('Generate image error:', error);
      throw error;
    }
  },

  /**
   * Generate caption
   */
  async generateCaption(imageUrl, context = '') {
    try {
      const response = await api.post(API_ENDPOINTS.AI.GENERATE_CAPTION, { imageUrl, context });
      return response.success ? response.data : null;
    } catch (error) {
      console.error('Generate caption error:', error);
      throw error;
    }
  },

  /**
   * Generate bio
   */
  async generateBio(description) {
    try {
      const response = await api.post(API_ENDPOINTS.AI.GENERATE_BIO, { description });
      return response.success ? response.data : null;
    } catch (error) {
      console.error('Generate bio error:', error);
      throw error;
    }
  },

  /**
   * Generate theme
   */
  async generateTheme(themePrompt) {
    try {
      const response = await api.post(API_ENDPOINTS.AI.GENERATE_THEME, themePrompt);
      return response.success ? response.data : null;
    } catch (error) {
      console.error('Generate theme error:', error);
      throw error;
    }
  },

  /**
   * Generate avatar
   */
  async generateAvatar(avatarConfig) {
    try {
      const response = await api.post(API_ENDPOINTS.AI.GENERATE_AVATAR, avatarConfig);
      return response.success ? response.data : null;
    } catch (error) {
      console.error('Generate avatar error:', error);
      throw error;
    }
  },

  /**
   * Generate community icon
   */
  async generateCommunityIcon(name, description) {
    try {
      const response = await api.post(API_ENDPOINTS.AI.GENERATE_COMMUNITY_ICON, {
        communityName: name,
        description: (description && description.trim()) ? description.trim() : 'Community',
      });
      return response.success ? response.data : null;
    } catch (error) {
      console.error('Generate community icon error:', error);
      throw error;
    }
  },
};
