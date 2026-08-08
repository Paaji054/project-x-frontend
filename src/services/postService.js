import { api } from '../utils/httpClient';
import { API_ENDPOINTS } from '../config/api';

/**
 * Post Service
 */
export const postService = {
  /**
   * Get feed posts
   */
  async getFeed(params = {}) {
    try {
      const { limit = 10, lastDocId = null } = params;
      const queryParams = { limit };
      if (lastDocId) queryParams.lastDocId = lastDocId;
      
      const response = await api.get(API_ENDPOINTS.POSTS.FEED, queryParams);
      return response.success ? response.data : { posts: [], lastDocId: null, hasMore: false };
    } catch (error) {
      console.error('Get feed error:', error);
      throw error;
    }
  },

  /**
   * Get trending posts
   */
  async getTrending(limit = 10, page = 1) {
    try {
      const response = await api.get(API_ENDPOINTS.POSTS.TRENDING, { limit, page });
      return response.success ? response.data : { posts: [], pagination: {} };
    } catch (error) {
      console.error('Get trending posts error:', error);
      throw error;
    }
  },

  /**
   * Get posts by user
   */
  async getUserPosts(username, limit = 10, page = 1) {
    try {
      const response = await api.get(API_ENDPOINTS.POSTS.BY_USER(username), { limit, page });
      return response.success ? response.data : { posts: [], pagination: {} };
    } catch (error) {
      console.error('Get user posts error:', error);
      throw error;
    }
  },

  /**
   * Get post by ID
   */
  async getPostById(postId) {
    try {
      const response = await api.get(API_ENDPOINTS.POSTS.BY_ID(postId));
      return response.success ? response.data : null;
    } catch (error) {
      console.error('Get post by ID error:', error);
      throw error;
    }
  },

  /**
   * Get post comments
   */
  async getPostComments(postId, limit = 20, page = 1) {
    try {
      const skip = (page - 1) * limit;
      const response = await api.get(API_ENDPOINTS.POSTS.COMMENTS(postId), { limit, skip });
      return response.success ? response.data : { comments: [], pagination: {} };
    } catch (error) {
      console.error('Get post comments error:', error);
      throw error;
    }
  },

  /**
   * Create post
   */
  async createPost(postData) {
    try {
      const response = await api.post(API_ENDPOINTS.POSTS.CREATE, postData);
      return response.success ? response.data : null;
    } catch (error) {
      console.error('Create post error:', error);
      throw error;
    }
  },

  /**
   * Update post
   */
  async updatePost(postId, postData) {
    try {
      const response = await api.put(API_ENDPOINTS.POSTS.UPDATE(postId), postData);
      return response.success ? response.data : null;
    } catch (error) {
      console.error('Update post error:', error);
      throw error;
    }
  },

  /**
   * Delete post
   */
  async deletePost(postId) {
    try {
      const response = await api.delete(API_ENDPOINTS.POSTS.DELETE(postId));
      return response;
    } catch (error) {
      console.error('Delete post error:', error);
      throw error;
    }
  },

  /**
   * Like post
   */
  async likePost(postId) {
    try {
      const response = await api.post(API_ENDPOINTS.POSTS.LIKE(postId));
      return response;
    } catch (error) {
      console.error('Like post error:', error);
      throw error;
    }
  },

  /**
   * Unlike post
   */
  async unlikePost(postId) {
    try {
      const response = await api.delete(API_ENDPOINTS.POSTS.UNLIKE(postId));
      return response;
    } catch (error) {
      console.error('Unlike post error:', error);
      throw error;
    }
  },

  /**
   * Add comment to post
   */
  async addComment(postId, commentData) {
    try {
      const response = await api.post(API_ENDPOINTS.POSTS.ADD_COMMENT(postId), commentData);
      return response.success ? response.data : null;
    } catch (error) {
      console.error('Add comment error:', error);
      throw error;
    }
  },

  /**
   * Bookmark post
   */
  async bookmarkPost(postId) {
    try {
      const response = await api.post(API_ENDPOINTS.POSTS.BOOKMARK(postId));
      return response;
    } catch (error) {
      console.error('Bookmark post error:', error);
      throw error;
    }
  },

  /**
   * Remove bookmark from post
   */
  async unbookmarkPost(postId) {
    try {
      const response = await api.delete(API_ENDPOINTS.POSTS.UNBOOKMARK(postId));
      return response;
    } catch (error) {
      console.error('Unbookmark post error:', error);
      throw error;
    }
  },

  async getBookmarkedPosts(limit = 20, skip = 0) {
    try {
      const response = await api.get(API_ENDPOINTS.POSTS.BOOKMARKS, { limit, skip });
      return response.success ? response.data : { posts: [], pagination: {} };
    } catch (error) {
      console.error('Get bookmarked posts error:', error);
      throw error;
    }
  },

  /**
   * Like comment
   */
  async likeComment(postId, commentId) {
    try {
      const response = await api.post(API_ENDPOINTS.POSTS.COMMENT_LIKE(postId, commentId));
      return response;
    } catch (error) {
      console.error('Like comment error:', error);
      throw error;
    }
  },

  /**
   * Unlike comment
   */
  async unlikeComment(postId, commentId) {
    try {
      const response = await api.delete(API_ENDPOINTS.POSTS.COMMENT_UNLIKE(postId, commentId));
      return response;
    } catch (error) {
      console.error('Unlike comment error:', error);
      throw error;
    }
  },

  /**
   * Delete comment
   */
  async deleteComment(postId, commentId) {
    try {
      const response = await api.delete(API_ENDPOINTS.POSTS.DELETE_COMMENT(postId, commentId));
      return response;
    } catch (error) {
      console.error('Delete comment error:', error);
      throw error;
    }
  },

  /**
   * Share post
   */
  async sharePost(postId) {
    try {
      const response = await api.post(API_ENDPOINTS.POSTS.SHARE(postId));
      return response;
    } catch (error) {
      console.error('Share post error:', error);
      throw error;
    }
  },

  /**
   * Pin comment
   */
  async pinComment(postId, commentId) {
    try {
      const response = await api.post(API_ENDPOINTS.POSTS.PIN_COMMENT(postId, commentId));
      return response;
    } catch (error) {
      console.error('Pin comment error:', error);
      throw error;
    }
  },

  /**
   * Unpin comment
   */
  async unpinComment(postId, commentId) {
    try {
      const response = await api.delete(API_ENDPOINTS.POSTS.UNPIN_COMMENT(postId, commentId));
      return response;
    } catch (error) {
      console.error('Unpin comment error:', error);
      throw error;
    }
  },

  /**
   * Get comment replies
   */
  async getCommentReplies(postId, commentId, limit = 20, skip = 0) {
    try {
      const response = await api.get(API_ENDPOINTS.POSTS.COMMENT_REPLIES(postId, commentId), { limit, skip });
      return response.success ? response.data : { replies: [] };
    } catch (error) {
      console.error('Get comment replies error:', error);
      throw error;
    }
  },
};
