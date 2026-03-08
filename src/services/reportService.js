import { api } from '../utils/httpClient';
import { API_ENDPOINTS } from '../config/api';

export const reportService = {
  async reportContent(targetType, targetId, reason, description = '') {
    try {
      const response = await api.post(API_ENDPOINTS.REPORTS.CREATE, {
        targetType,
        targetId,
        reason,
        description,
      });
      return response;
    } catch (error) {
      console.error('Report content error:', error);
      throw error;
    }
  },
};
