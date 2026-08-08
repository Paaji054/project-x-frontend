// API Configuration
export const API_CONFIG = {
  // Backend runs on port 5000
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
};

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    REGISTER: '/api/auth/register',
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    REFRESH: '/api/auth/refresh',
    FORGOT_PASSWORD: '/api/auth/forgot-password',
    VERIFY_OTP: '/api/auth/verify-otp',
    RESET_PASSWORD: '/api/auth/reset-password',
    GOOGLE: '/api/auth/google',
    GOOGLE_CALLBACK: '/api/auth/google/callback',
    ME: '/api/auth/me',
    PASSWORD: '/api/auth/password',
    VERIFY_EMAIL: '/api/auth/verify-email',
    DELETE_ACCOUNT: '/api/auth/account',
  },
  
  // Users
  USERS: {
    SEARCH: '/api/users/search',
    PROFILE: '/api/users/profile',
    CREDITS_BALANCE: '/api/users/credits/balance',
    CREDITS_TRANSACTIONS: '/api/users/credits/transactions',
    BY_USERNAME: (username) => `/api/users/${username}`,
    FOLLOWERS: (username) => `/api/users/${username}/followers`,
    FOLLOWING: (username) => `/api/users/${username}/following`,
    STATS: (username) => `/api/users/${username}/stats`,
    FOLLOW: (userId) => `/api/users/${userId}/follow`,
    UNFOLLOW: (userId) => `/api/users/${userId}/follow`,
  },
  
  // Posts
  POSTS: {
    FEED: '/api/posts/feed',
    TRENDING: '/api/posts/trending',
    BY_USER: (username) => `/api/posts/user/${username}`,
    BY_ID: (postId) => `/api/posts/${postId}`,
    COMMENTS: (postId) => `/api/posts/${postId}/comments`,
    CREATE: '/api/posts',
    UPDATE: (postId) => `/api/posts/${postId}`,
    DELETE: (postId) => `/api/posts/${postId}`,
    LIKE: (postId) => `/api/posts/${postId}/like`,
    UNLIKE: (postId) => `/api/posts/${postId}/like`,
    COMMENT_LIKE: (postId, commentId) => `/api/posts/${postId}/comments/${commentId}/like`,
    COMMENT_UNLIKE: (postId, commentId) => `/api/posts/${postId}/comments/${commentId}/like`,
    ADD_COMMENT: (postId) => `/api/posts/${postId}/comments`,
    DELETE_COMMENT: (postId, commentId) => `/api/posts/${postId}/comments/${commentId}`,
    BOOKMARK: (postId) => `/api/posts/${postId}/bookmark`,
    UNBOOKMARK: (postId) => `/api/posts/${postId}/bookmark`,
    SHARE: (postId) => `/api/posts/${postId}/share`,
    PIN_COMMENT: (postId, commentId) => `/api/posts/${postId}/comments/${commentId}/pin`,
    UNPIN_COMMENT: (postId, commentId) => `/api/posts/${postId}/comments/${commentId}/pin`,
    COMMENT_REPLIES: (postId, commentId) => `/api/posts/${postId}/comments/${commentId}/replies`,
  },
  
  // Search
  SEARCH: {
    UNIVERSAL: '/api/search',
    TRENDING_HASHTAGS: '/api/search/trending-hashtags',
    BY_HASHTAG: (hashtag) => `/api/search/hashtag/${hashtag}`,
    AI_POSTS: '/api/search/ai-posts',
  },
  
  // Analytics
  ANALYTICS: {
    USER: '/api/analytics/user',
    DAILY: '/api/analytics/daily',
    ENGAGEMENT: '/api/analytics/engagement',
    EVENTS: '/api/analytics/events',
    PLATFORM: '/api/analytics/platform',
  },
  
  // AI
  AI: {
    CREDIT_COSTS: '/api/ai/credit-costs',
    STATUS: '/api/ai/status',
    GENERATE_IMAGE: '/api/ai/generate-image',
    GENERATE_CAPTION: '/api/ai/generate-caption',
    GENERATE_BIO: '/api/ai/generate-bio',
    GENERATE_THEME: '/api/ai/generate-theme',
    GENERATE_AVATAR: '/api/ai/generate-avatar',
    GENERATE_COMMUNITY_ICON: '/api/ai/generate-community-icon',
  },
  
  // Notifications
  NOTIFICATIONS: {
    LIST: '/api/notifications',
    UNREAD_COUNT: '/api/notifications/unread-count',
    MARK_READ: (notificationId) => `/api/notifications/${notificationId}/read`,
    MARK_ALL_READ: '/api/notifications/read-all',
    DELETE: (notificationId) => `/api/notifications/${notificationId}`,
  },
  
  // Messages
  MESSAGES: {
    CREATE_CONVERSATION: '/api/messages/conversations',
    LIST_CONVERSATIONS: '/api/messages/conversations',
    UPLOAD_MEDIA: '/api/messages/upload',
    SEND: '/api/messages',
    BY_CONVERSATION: (conversationId) => `/api/messages/${conversationId}`,
    MARK_READ: (conversationId) => `/api/messages/${conversationId}/read`,
    EDIT_MESSAGE: (messageId) => `/api/messages/message/${messageId}`,
    DELETE_MESSAGE: (messageId) => `/api/messages/message/${messageId}`,
  },
  
  // Credits/Payments
  CREDITS: {
    PACKAGES: '/api/credits/packages',
    ORDER: '/api/credits/order',
    VERIFY: '/api/credits/verify',
    PURCHASES: '/api/credits/purchases',
    WEBHOOK: '/api/credits/webhook',
  },
  
  // Upload
  UPLOAD: {
    URL: '/api/upload/url',
    FILE: '/api/upload/file',
    BASE64: '/api/upload/base64',
    OPTIMIZE: (publicId) => `/api/upload/optimize/${publicId}`,
    TRANSFORM: (publicId) => `/api/upload/transform/${publicId}`,
    SQUARE: (publicId) => `/api/upload/square/${publicId}`,
    DELETE: (publicId) => `/api/upload/${publicId}`,
  },
  
  // Communities
  COMMUNITIES: {
    PUBLIC: '/api/communities/public',
    USER_COMMUNITIES: '/api/communities/user/communities',
    CREATE: '/api/communities',
    JOIN_BY_CODE: '/api/communities/join-by-code',
    BY_SLUG: (slug) => `/api/communities/${slug}`,
    POSTS: (communityId) => `/api/communities/${communityId}/posts`,
    UPDATE: (communityId) => `/api/communities/${communityId}`,
    DELETE: (communityId) => `/api/communities/${communityId}`,
    JOIN: (communityId) => `/api/communities/${communityId}/join`,
    LEAVE: (communityId) => `/api/communities/${communityId}/leave`,
    ADD_MODERATOR: (communityId, userId) => `/api/communities/${communityId}/moderators/${userId}`,
    REMOVE_MODERATOR: (communityId, userId) => `/api/communities/${communityId}/moderators/${userId}`,
    GET_MEMBERS: (communityId) => `/api/communities/${communityId}/members`,
    REMOVE_MEMBER: (communityId, userId) => `/api/communities/${communityId}/members/${userId}`,
    BAN_USER: (communityId, userId) => `/api/communities/${communityId}/ban/${userId}`,
  },
  
  // Admin
  ADMIN: {
    USERS: '/api/admin/users',
    USER_ROLE: (userId) => `/api/admin/users/${userId}/role`,
    DELETE_USER: (userId) => `/api/admin/users/${userId}`,
  },
  
  // Health
  HEALTH: '/health',
  ROOT: '/',

  // Reports
  REPORTS: {
    CREATE: '/api/reports',
  },

  // Stories
  STORIES: {
    LIST: '/api/stories',
    CREATE: '/api/stories',
    VIEW: (storyId) => `/api/stories/${storyId}/view`,
    BY_USER: (userId) => `/api/stories/user/${userId}`,
    DELETE: (storyId) => `/api/stories/${storyId}`,
  },
};
