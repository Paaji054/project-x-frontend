import { api } from '../utils/httpClient';
import { API_ENDPOINTS } from '../config/api';

/**
 * Credits/Payments Service
 */
export const creditsService = {
  /**
   * Get available credit packages
   */
  async getPackages() {
    try {
      const response = await api.get(API_ENDPOINTS.CREDITS.PACKAGES);
      return response.success ? (response.data?.packages ?? []) : [];
    } catch (error) {
      console.error('Get credit packages error:', error);
      throw error;
    }
  },

  async createOrder(packageId) {
    try {
      const response = await api.post(API_ENDPOINTS.CREDITS.ORDER, {
        packageId: Number(packageId),
      });
      return response.success ? response.data : null;
    } catch (error) {
      console.error('Create credit order error:', error);
      throw error;
    }
  },

  /**
   * Verify payment
   */
  async verifyPayment(paymentData) {
    try {
      const response = await api.post(API_ENDPOINTS.CREDITS.VERIFY, paymentData);
      return response;
    } catch (error) {
      console.error('Verify payment error:', error);
      throw error;
    }
  },

  /**
   * Get purchase history
   */
  async getPurchases(page = 1, limit = 20) {
    try {
      const response = await api.get(API_ENDPOINTS.CREDITS.PURCHASES, { page, limit });
      return response.success ? response.data : { purchases: [], pagination: {} };
    } catch (error) {
      console.error('Get purchases error:', error);
      throw error;
    }
  },
};
