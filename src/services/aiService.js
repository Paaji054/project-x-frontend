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
      return response.success ? response.data : {};
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
      return response.success ? response.data : null;
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
      const payload = {};
      if (imageUrl) payload.imageUrl = imageUrl;
      if (context) payload.context = context;
      const response = await api.post(API_ENDPOINTS.AI.GENERATE_CAPTION, payload);
      return response.success ? response.data : null;
    } catch (error) {
      console.error('Generate caption error:', error);
      throw error;
    }
  },

  /**
   * Generate bio
   * @param {string[]} interests - Array of interest strings
   * @param {string} tone - 'casual' | 'professional' | 'funny' | 'creative'
   */
  async generateBio(interests = [], tone = 'casual') {
    try {
      const response = await api.post(API_ENDPOINTS.AI.GENERATE_BIO, { interests, tone });
      return response.success ? response.data : null;
    } catch (error) {
      console.error('Generate bio error:', error);
      throw error;
    }
  },

  /**
   * Generate theme
   * @param {string} mood - Theme mood description
   * @param {string} baseColor - Hex color like '#6366f1'
   */
  async generateTheme(mood = '', baseColor = '') {
    try {
      const payload = {};
      if (mood) payload.mood = mood;
      if (baseColor) payload.baseColor = baseColor;
      const response = await api.post(API_ENDPOINTS.AI.GENERATE_THEME, payload);
      return response.success ? response.data : null;
    } catch (error) {
      console.error('Generate theme error:', error);
      throw error;
    }
  },

  /**
   * Generate avatar
   * @param {string} description - Description of the avatar
   */
  async generateAvatar(description) {
    try {
      const response = await api.post(API_ENDPOINTS.AI.GENERATE_AVATAR, { description });
      return response.success ? response.data : null;
    } catch (error) {
      console.error('Generate avatar error:', error);
      throw error;
    }
  },

  /**
   * Generate community icon
   */
  async generateCommunityIcon(communityName, description) {
    try {
      const response = await api.post(API_ENDPOINTS.AI.GENERATE_COMMUNITY_ICON, { communityName, description });
      return response.success ? response.data : null;
    } catch (error) {
      console.error('Generate community icon error:', error);
      throw error;
    }
  },
};
