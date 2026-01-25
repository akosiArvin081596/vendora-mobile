import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_TOKEN_KEY = '@vendora_auth_token';
const AUTH_USER_KEY = '@vendora_auth_user';
const REFRESH_TOKEN_KEY = '@vendora_refresh_token';

/**
 * Auth Service
 * Handles all API calls related to authentication
 */
const authService = {
  /**
   * Login with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<{user: Object, accessToken: string, refreshToken: string}>}
   */
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });

    const { user, accessToken, refreshToken, token } = response.data || response;
    const finalUser = user
      ? { ...user, role: user.role || user.user_type }
      : user;

    // Store tokens and user data
    const authToken = accessToken || token;
    if (authToken) {
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, authToken);
    }
    if (refreshToken) {
      await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
    if (finalUser) {
      await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(finalUser));
    }

    return { user: finalUser, accessToken: authToken, refreshToken };
  },

  /**
   * Register a new user
   * @param {Object} userData - Registration data
   * @param {string} userData.email - User email
   * @param {string} userData.password - User password
   * @param {string} userData.name - User name
   * @param {string} userData.phone - User phone (optional)
   * @returns {Promise<{user: Object, accessToken: string}>}
   */
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);

    const { user, accessToken, refreshToken, token } = response.data || response;
    const finalUser = user
      ? { ...user, role: user.role || user.user_type || userData?.user_type }
      : user;

    // Store tokens and user data
    const authToken = accessToken || token;
    if (authToken) {
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, authToken);
    }
    if (refreshToken) {
      await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
    if (finalUser) {
      await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(finalUser));
    }

    return { user: finalUser, accessToken: authToken, refreshToken };
  },

  /**
   * Logout - clear tokens and user data
   * @returns {Promise<void>}
   */
  logout: async () => {
    try {
      // Call logout endpoint if exists (optional)
      await api.post('/auth/logout').catch(() => {});
    } finally {
      // Always clear local storage
      await AsyncStorage.multiRemove([AUTH_TOKEN_KEY, AUTH_USER_KEY, REFRESH_TOKEN_KEY]);
    }
  },

  /**
   * Get current authenticated user
   * @returns {Promise<{user: Object}>}
   */
  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data || response;
  },

  /**
   * Refresh access token
   * @returns {Promise<{accessToken: string}>}
   */
  refreshToken: async () => {
    const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await api.post('/auth/refresh', { refreshToken });
    const { accessToken, token } = response.data || response;

    const newToken = accessToken || token;
    if (newToken) {
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, newToken);
    }

    return { accessToken: newToken };
  },

  /**
   * Request password reset
   * @param {string} email - User email
   * @returns {Promise<{message: string}>}
   */
  forgotPassword: async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data || response;
  },

  /**
   * Reset password with token
   * @param {string} token - Reset token
   * @param {string} password - New password
   * @returns {Promise<{message: string}>}
   */
  resetPassword: async (token, password) => {
    const response = await api.post('/auth/reset-password', { token, password });
    return response.data || response;
  },

  /**
   * Change password (authenticated)
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<{message: string}>}
   */
  changePassword: async (currentPassword, newPassword) => {
    const response = await api.put('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return response.data || response;
  },

  /**
   * Get stored auth token
   * @returns {Promise<string|null>}
   */
  getStoredToken: async () => {
    return AsyncStorage.getItem(AUTH_TOKEN_KEY);
  },

  /**
   * Get stored user data
   * @returns {Promise<Object|null>}
   */
  getStoredUser: async () => {
    const userJson = await AsyncStorage.getItem(AUTH_USER_KEY);
    return userJson ? JSON.parse(userJson) : null;
  },

  /**
   * Check if user is authenticated (has valid token)
   * @returns {Promise<boolean>}
   */
  isAuthenticated: async () => {
    const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    return !!token;
  },

  /**
   * Update stored user data
   * @param {Object} userData - Updated user data
   * @returns {Promise<void>}
   */
  updateStoredUser: async (userData) => {
    await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(userData));
  },
};

export default authService;
