import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// Token Manager
export const tokenManager = {
  getAccessToken: () => localStorage.getItem('authToken'),
  getRefreshToken: () => localStorage.getItem('refreshToken'),
  setAccessToken: (token) => localStorage.setItem('authToken', token),
  setRefreshToken: (token) => localStorage.setItem('refreshToken', token),
  clearTokens: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('tokenExpiry');
  },
  isTokenExpired: () => {
    const expiry = localStorage.getItem('tokenExpiry');
    if (!expiry) return true;
    return Date.now() > parseInt(expiry, 10);
  }
};

// Create axios instance
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Enable credentials for cookie support
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = tokenManager.getAccessToken();
    if (token && !tokenManager.isTokenExpired()) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = tokenManager.getRefreshToken();
        
        // Call refresh endpoint (token will be sent via cookie automatically)
        // But also send in body as fallback
        const { data } = await axios.post(
          `${API_BASE_URL}/api/auth/refresh`, 
          refreshToken ? { token: refreshToken } : {},
          { withCredentials: true } // Important: send cookies
        );

        if (data.success && data.data?.accessToken) {
          tokenManager.setAccessToken(data.data.accessToken);
          if (data.data.refreshToken) {
            tokenManager.setRefreshToken(data.data.refreshToken);
          }

          // Update expiry
          const expiryTime = Date.now() + (55 * 60 * 1000);
          localStorage.setItem('tokenExpiry', expiryTime.toString());

          // Retry original request
          originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;
          return axiosInstance(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        tokenManager.clearTokens();
        window.dispatchEvent(new CustomEvent('auth:logout'));
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// API wrapper with better error handling
export const apiClient = {
  async get(url, config = {}) {
    try {
      const response = await axiosInstance.get(url, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  async post(url, data, config = {}) {
    try {
      const response = await axiosInstance.post(url, data, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  async put(url, data, config = {}) {
    try {
      const response = await axiosInstance.put(url, data, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  async patch(url, data, config = {}) {
    try {
      const response = await axiosInstance.patch(url, data, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  async delete(url, config = {}) {
    try {
      const response = await axiosInstance.delete(url, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  handleError(error) {
    if (error.response) {
      // Server responded with error
      const message = error.response.data?.message || error.response.data?.error || 'An error occurred';
      return new Error(message);
    } else if (error.request) {
      // Request made but no response
      return new Error('No response from server. Please check your connection.');
    } else {
      // Something else happened
      return new Error(error.message || 'An unexpected error occurred');
    }
  }
};

export default axiosInstance;
