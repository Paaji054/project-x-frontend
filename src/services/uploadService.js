import { api } from '../utils/httpClient';
import { API_ENDPOINTS, API_CONFIG } from '../config/api';
import { tokenManager } from '../utils/httpClient';

export const MAX_VIDEO_SIZE_BYTES = 50 * 1024 * 1024;
export const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;

function parseUploadResponse(xhr) {
  let data;
  try {
    data = JSON.parse(xhr.responseText);
  } catch {
    throw new Error('Invalid server response during upload');
  }

  if (xhr.status < 200 || xhr.status >= 300) {
    const message =
      data?.error?.message ||
      data?.message ||
      (xhr.status === 413
        ? 'File is too large to upload.'
        : `Upload failed (HTTP ${xhr.status})`);
    throw new Error(message);
  }

  if (!data.success) {
    throw new Error(data?.error?.message || data?.message || 'Upload failed');
  }

  return data.data;
}

/**
 * Upload Service
 */
export const uploadService = {
  async uploadFromURL(imageUrl, folder = 'posts') {
    try {
      const response = await api.post(API_ENDPOINTS.UPLOAD.URL, { imageUrl, folder });
      return response.success ? response.data : null;
    } catch (error) {
      console.error('Upload from URL error:', error);
      throw error;
    }
  },

  async uploadFromBase64(base64, folder = 'posts') {
    try {
      const response = await api.post(API_ENDPOINTS.UPLOAD.BASE64, { base64, folder });
      if (!response.success) {
        throw new Error(response?.error?.message || 'Upload failed');
      }
      return response.data;
    } catch (error) {
      console.error('Upload from base64 error:', error);
      throw new Error(error.message || 'Failed to upload media');
    }
  },

  uploadFileWithProgress(file, folder = 'posts', onProgress) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const url = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.UPLOAD.FILE}`;
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);

      xhr.open('POST', url);
      xhr.withCredentials = true;
      xhr.timeout = 5 * 60 * 1000;

      const token = tokenManager.getAccessToken();
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }

      if (onProgress && xhr.upload) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            onProgress(Math.round((event.loaded / event.total) * 100));
          }
        };
      }

      xhr.onload = () => {
        try {
          resolve(parseUploadResponse(xhr));
        } catch (error) {
          reject(error);
        }
      };

      xhr.onerror = () => reject(new Error('Network error during upload. Check your connection.'));
      xhr.ontimeout = () =>
        reject(new Error('Upload timed out. Try a smaller file or a stronger connection.'));
      xhr.onabort = () => reject(new Error('Upload was cancelled.'));

      xhr.send(formData);
    });
  },

  async uploadMedia({ file, dataUrl, folder = 'posts', onProgress }) {
    if (file) {
      const isVideo = file.type?.startsWith('video/');
      const limit = isVideo ? MAX_VIDEO_SIZE_BYTES : MAX_IMAGE_SIZE_BYTES;
      if (file.size > limit) {
        const limitLabel = isVideo ? '50 MB' : '10 MB';
        throw new Error(`File is too large (${formatBytes(file.size)}). Maximum size is ${limitLabel}.`);
      }
      return this.uploadFileWithProgress(file, folder, onProgress);
    }

    if (dataUrl) {
      return this.uploadFromBase64(dataUrl, folder);
    }

    throw new Error('No media provided for upload');
  },

  async getOptimizedImage(publicId) {
    try {
      const response = await api.get(API_ENDPOINTS.UPLOAD.OPTIMIZE(publicId));
      return response.success ? response.data : null;
    } catch (error) {
      console.error('Get optimized image error:', error);
      throw error;
    }
  },

  async getTransformedImage(publicId) {
    try {
      const response = await api.get(API_ENDPOINTS.UPLOAD.TRANSFORM(publicId));
      return response.success ? response.data : null;
    } catch (error) {
      console.error('Get transformed image error:', error);
      throw error;
    }
  },

  async getSquareImage(publicId) {
    try {
      const response = await api.get(API_ENDPOINTS.UPLOAD.SQUARE(publicId));
      return response.success ? response.data : null;
    } catch (error) {
      console.error('Get square image error:', error);
      throw error;
    }
  },

  async deleteImage(publicId) {
    try {
      const response = await api.delete(API_ENDPOINTS.UPLOAD.DELETE(publicId));
      return response;
    } catch (error) {
      console.error('Delete image error:', error);
      throw error;
    }
  },

  async uploadBase64(base64, folder = 'posts') {
    return this.uploadFromBase64(base64, folder);
  },
};

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
