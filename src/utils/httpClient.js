import { API_CONFIG } from '../config/api';

/**
 * Custom API Error class
 */
export class APIError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Token management utilities
 */
export const tokenManager = {
  getAccessToken: () => localStorage.getItem('accessToken'),
  getRefreshToken: () => localStorage.getItem('refreshToken'),
  setAccessToken: (token) => localStorage.setItem('accessToken', token),
  setRefreshToken: (token) => localStorage.setItem('refreshToken', token),
  clearTokens: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('authToken');
    localStorage.removeItem('tokenExpiry');
    localStorage.removeItem('user');
  },
  isTokenExpired: () => {
    const tokenExpiry = localStorage.getItem('tokenExpiry');
    if (!tokenExpiry) return true;
    return Date.now() >= parseInt(tokenExpiry, 10);
  },
};

/**
 * Sleep utility for retry logic
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * HTTP Client with automatic retry and token refresh
 */
class HTTPClient {
  constructor(baseURL = API_CONFIG.BASE_URL) {
    this.baseURL = baseURL;
    this.timeout = API_CONFIG.TIMEOUT;
  }

  /**
   * Build full URL
   */
  buildURL(endpoint) {
    return `${this.baseURL}${endpoint}`;
  }

  /**
   * Build headers with auth token
   */
  buildHeaders(customHeaders = {}, requiresAuth = true) {
    const headers = {
      'Content-Type': 'application/json',
      ...customHeaders,
    };

    if (requiresAuth) {
      const token = tokenManager.getAccessToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  /**
   * Handle fetch with timeout
   */
  async fetchWithTimeout(url, options = {}) {
    const timeoutMs = options.timeout ?? this.timeout;
    const { timeout: _ignored, ...fetchOptions } = options;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        credentials: 'include',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new APIError('Request timeout', 408, null);
      }
      throw error;
    }
  }

  /**
   * Handle API response
   */
  async handleResponse(response) {
    const contentType = response.headers.get('content-type');
    const isJSON = contentType && contentType.includes('application/json');

    let data;
    if (isJSON) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      const message = (typeof data?.error === 'object' && data?.error?.message)
        ? data.error.message
        : (data?.message || (typeof data?.error === 'string' ? data.error : null) || `HTTP ${response.status}: ${response.statusText}`);
      throw new APIError(message, response.status, data);
    }

    return data;
  }

  /**
   * Retry logic with exponential backoff
   */
  async retryRequest(fn, attempts = API_CONFIG.RETRY_ATTEMPTS) {
    for (let i = 0; i < attempts; i++) {
      try {
        return await fn();
      } catch (error) {
        const isLastAttempt = i === attempts - 1;
        const shouldRetry = error.status >= 500;

        if (isLastAttempt || !shouldRetry) {
          throw error;
        }

        // Exponential backoff: 1s, 2s, 4s
        const delay = API_CONFIG.RETRY_DELAY * Math.pow(2, i);
        await sleep(delay);
      }
    }
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken() {
    const refreshToken = tokenManager.getRefreshToken();
    if (!refreshToken) {
      throw new APIError('No refresh token available', 401, null);
    }

    try {
      const response = await fetch(this.buildURL('/api/auth/refresh'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      const payload = data.data || data;
      if (payload.accessToken) {
        tokenManager.setAccessToken(payload.accessToken);
        if (payload.refreshToken) {
          tokenManager.setRefreshToken(payload.refreshToken);
        }
        return payload.accessToken;
      }

      throw new Error('No access token in response');
    // eslint-disable-next-line no-unused-vars
    } catch (error) {
      tokenManager.clearTokens();
      window.dispatchEvent(new CustomEvent('auth:logout'));
      throw new APIError('Session expired. Please login again.', 401, null);
    }
  }

  /**
   * Make HTTP request with auto-retry and token refresh
   */
  async request(endpoint, options = {}, requiresAuth = true) {
    const makeRequest = async () => {
      const url = this.buildURL(endpoint);
      const headers = this.buildHeaders(options.headers, requiresAuth);

      const response = await this.fetchWithTimeout(url, {
        ...options,
        headers,
      });

      return this.handleResponse(response);
    };

    try {
      const method = String(options.method || 'GET').toUpperCase();
      // Never retry mutating requests — a 502 after a successful insert
      // was creating duplicate stories/posts.
      if (method === 'GET') {
        return await this.retryRequest(makeRequest);
      }
      return await makeRequest();
    } catch (error) {
      // If 401 and we have a refresh token, try to refresh
      if (error.status === 401 && requiresAuth && tokenManager.getRefreshToken()) {
        // eslint-disable-next-line no-useless-catch
        try {
          await this.refreshAccessToken();
          return await makeRequest();
        } catch (refreshError) {
          throw refreshError;
        }
      }

      throw error;
    }
  }

  /**
   * HTTP Methods
   */
  async get(endpoint, params = {}, requiresAuth = true) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;

    return this.request(url, { method: 'GET' }, requiresAuth);
  }

  async post(endpoint, data = {}, requiresAuth = true, timeout) {
    return this.request(
      endpoint,
      {
        method: 'POST',
        body: JSON.stringify(data),
        ...(timeout ? { timeout } : {}),
      },
      requiresAuth
    );
  }

  async put(endpoint, data = {}, requiresAuth = true) {
    return this.request(
      endpoint,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      },
      requiresAuth
    );
  }

  async patch(endpoint, data = {}, requiresAuth = true) {
    return this.request(
      endpoint,
      {
        method: 'PATCH',
        body: JSON.stringify(data),
      },
      requiresAuth
    );
  }

  async delete(endpoint, requiresAuth = true) {
    return this.request(
      endpoint,
      {
        method: 'DELETE',
      },
      requiresAuth
    );
  }

  /**
   * Upload file (multipart/form-data)
   */
  async upload(endpoint, formData, requiresAuth = true) {
    const url = this.buildURL(endpoint);
    const headers = {};

    if (requiresAuth) {
      const token = tokenManager.getAccessToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    const response = await this.fetchWithTimeout(url, {
      method: 'POST',
      headers,
      body: formData,
    });

    return this.handleResponse(response);
  }
}

// Create singleton instance
export const httpClient = new HTTPClient();

// Export convenience methods - direct pass-through to httpClient
export const api = {
  get: (...args) => httpClient.get(...args),
  post: (...args) => httpClient.post(...args),
  put: (...args) => httpClient.put(...args),
  patch: (...args) => httpClient.patch(...args),
  delete: (...args) => httpClient.delete(...args),
  upload: (...args) => httpClient.upload(...args),
  postWithTimeout: (endpoint, data, timeout, requiresAuth = true) =>
    httpClient.post(endpoint, data, requiresAuth, timeout),
};
