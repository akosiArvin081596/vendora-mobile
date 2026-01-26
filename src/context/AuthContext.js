import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authService from '../services/authService';
import { hasPermission as checkRolePermission, ROLES } from '../utils/permissions';

const AuthContext = createContext();

// Re-export ROLES for convenience
export { ROLES };

const normalizeRole = (role) => (typeof role === 'string' ? role.toLowerCase() : role);
const normalizeUser = (user) => {
  if (!user) return null;
  const role = normalizeRole(user.role || user.user_type);
  return { ...user, role };
};

// Role hierarchy for permission checks
const ROLE_HIERARCHY = {
  [ROLES.ADMIN]: 4,
  [ROLES.MANAGER]: 3,
  [ROLES.VENDOR]: 2,
  [ROLES.CASHIER]: 2,
  [ROLES.CUSTOMER]: 0,
};

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState(null);

  // Initialize auth state from storage
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Check for stored user and token
      const storedUser = await authService.getStoredUser();
      const hasToken = await authService.isAuthenticated();

      if (storedUser && hasToken) {
        // Validate token by fetching current user from API
        try {
          const response = await authService.getCurrentUser();
          const user = normalizeUser(response.user || response);
          setCurrentUser(user);
          // Update stored user with fresh data
          await authService.updateStoredUser(user);
        } catch (err) {
          // Token invalid or expired - clear auth state
          await authService.logout();
          setCurrentUser(null);
        }
      }

      setIsInitialized(true);
    } catch (err) {
      console.error('Error initializing auth:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Login with email and password
  const login = useCallback(async (email, password) => {
    try {
      setIsLoading(true);
      setError(null);

      const { user } = await authService.login(email, password);
      const normalized = normalizeUser(user);
      setCurrentUser(normalized);
      return normalized;
    } catch (err) {
      const errorMessage = err.message || 'Login failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Logout
  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      await authService.logout();
      // Clear saved screen so next login starts fresh
      await AsyncStorage.removeItem('@vendora_current_screen');
      setCurrentUser(null);
      setError(null);
    } catch (err) {
      console.error('Error logging out:', err);
      // Still clear local state even if API call fails
      setCurrentUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Register new user
  const register = useCallback(async (userData) => {
    try {
      setIsLoading(true);
      setError(null);

      const { user } = await authService.register(userData);
      const normalized = normalizeUser(user);
      setCurrentUser(normalized);
      return normalized;
    } catch (err) {
      const errorMessage = err.message || 'Registration failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Refresh token
  const refreshToken = useCallback(async () => {
    try {
      await authService.refreshToken();
    } catch (err) {
      // Refresh failed - logout user
      await logout();
      throw err;
    }
  }, [logout]);

  // Check if current user has minimum role level
  const hasRole = useCallback((minimumRole) => {
    if (!currentUser || !currentUser.role) return false;
    const userLevel = ROLE_HIERARCHY[normalizeRole(currentUser.role)] || 0;
    const requiredLevel = ROLE_HIERARCHY[minimumRole] || 0;
    return userLevel >= requiredLevel;
  }, [currentUser]);

  // Check if user has specific permission
  const checkPermission = useCallback((permission) => {
    if (!currentUser) return false;
    return checkRolePermission(normalizeRole(currentUser.role), permission);
  }, [currentUser]);

  // Check if user is authenticated
  const isAuthenticated = !!currentUser;

  // Check if user is admin
  const isAdmin = currentUser?.role === ROLES.ADMIN;

  // Check if user is vendor
  const isVendor = currentUser?.role === ROLES.VENDOR;

  // Check if user is manager or admin
  const isManagerOrAbove = hasRole(ROLES.MANAGER);

  // Check if user can access POS
  const canAccessPOS = currentUser?.role === ROLES.ADMIN ||
    currentUser?.role === ROLES.MANAGER ||
    currentUser?.role === ROLES.CASHIER ||
    currentUser?.role === ROLES.VENDOR;

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value = {
    // State
    currentUser,
    isLoading,
    isInitialized,
    error,

    // Computed
    isAuthenticated,
    isAdmin,
    isVendor,
    isManagerOrAbove,
    canAccessPOS,

    // Actions
    login,
    logout,
    register,
    refreshToken,
    hasRole,
    checkPermission,
    hasPermission: checkPermission, // Alias for backward compatibility
    clearError,

    // Constants
    ROLES,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
