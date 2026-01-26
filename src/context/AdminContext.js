import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { adminApi } from '../api/admin';
import {
  STORAGE_KEYS,
  defaultSettings,
  sampleVendorApplications
} from '../data/defaultSettings';
import { ACTIVITY_ACTIONS, canManageUser } from '../utils/permissions';
import { useAuth } from './AuthContext';

const AdminContext = createContext();

export function AdminProvider({ children }) {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [usersPagination, setUsersPagination] = useState(null);
  const [vendorApplications, setVendorApplications] = useState([]);
  const [settings, setSettings] = useState(defaultSettings);
  const [activityLogs, setActivityLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize admin data
  useEffect(() => {
    if (currentUser?.user_type === 'admin' || currentUser?.role === 'admin') {
      initializeAdminData();
    }
  }, [currentUser]);

  const initializeAdminData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch users from backend API
      await fetchUsers();

      // Load vendor applications from storage (placeholder for now)
      const vendorAppsJson = await AsyncStorage.getItem(STORAGE_KEYS.VENDOR_APPS);
      if (vendorAppsJson) {
        setVendorApplications(JSON.parse(vendorAppsJson));
      } else {
        setVendorApplications(sampleVendorApplications);
        await AsyncStorage.setItem(STORAGE_KEYS.VENDOR_APPS, JSON.stringify(sampleVendorApplications));
      }

      // Load settings from storage
      const settingsJson = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (settingsJson) {
        setSettings(JSON.parse(settingsJson));
      } else {
        await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(defaultSettings));
      }

      // Load activity logs from storage
      const logsJson = await AsyncStorage.getItem(STORAGE_KEYS.ACTIVITY_LOGS);
      if (logsJson) {
        setActivityLogs(JSON.parse(logsJson));
      }
    } catch (err) {
      console.error('Error initializing admin data:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // ============ USER MANAGEMENT (API) ============

  /**
   * Fetch users from backend API
   */
  const fetchUsers = useCallback(async (params = {}) => {
    try {
      setIsLoading(true);
      const response = await adminApi.getUsers(params);

      // Handle paginated response
      if (response.data) {
        // Transform backend data to match frontend expectations
        const transformedUsers = response.data.map(user => ({
          id: user.id.toString(),
          name: user.name,
          email: user.email,
          role: user.user_type, // Map user_type to role for frontend
          status: user.status || 'active',
          phone: user.phone || '',
          createdAt: user.created_at,
          updatedAt: user.updated_at,
          lastLoginAt: user.last_login_at,
        }));
        setUsers(transformedUsers);
        setUsersPagination({
          currentPage: response.current_page,
          lastPage: response.last_page,
          perPage: response.per_page,
          total: response.total,
        });
      } else {
        // Non-paginated response
        const transformedUsers = (Array.isArray(response) ? response : []).map(user => ({
          id: user.id.toString(),
          name: user.name,
          email: user.email,
          role: user.user_type,
          status: user.status || 'active',
          phone: user.phone || '',
          createdAt: user.created_at,
          updatedAt: user.updated_at,
          lastLoginAt: user.last_login_at,
        }));
        setUsers(transformedUsers);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Create a new user via API
   */
  const createUser = useCallback(async (userData) => {
    try {
      // Transform frontend data to backend format
      const apiData = {
        name: userData.name,
        email: userData.email,
        password: userData.password,
        user_type: userData.role, // Map role to user_type for backend
        phone: userData.phone || null,
        status: userData.status || 'active',
      };

      const response = await adminApi.createUser(apiData);

      // Transform response and add to local state
      const newUser = {
        id: response.user.id.toString(),
        name: response.user.name,
        email: response.user.email,
        role: response.user.user_type,
        status: response.user.status || 'active',
        phone: response.user.phone || '',
        createdAt: response.user.created_at,
        updatedAt: response.user.updated_at,
        lastLoginAt: response.user.last_login_at,
      };

      setUsers(prev => [newUser, ...prev]);

      // Log activity locally
      await logActivity(
        ACTIVITY_ACTIONS.USER_CREATE,
        'user',
        newUser.id,
        newUser.name,
        { email: newUser.email, role: newUser.role }
      );

      return newUser;
    } catch (err) {
      console.error('Error creating user:', err);
      const message = err.response?.data?.message || err.message || 'Failed to create user';
      throw new Error(message);
    }
  }, []);

  /**
   * Update a user via API
   */
  const updateUser = useCallback(async (userId, updates) => {
    try {
      // Transform frontend data to backend format
      const apiData = {};
      if (updates.name) apiData.name = updates.name;
      if (updates.email) apiData.email = updates.email;
      if (updates.password) apiData.password = updates.password;
      if (updates.role) apiData.user_type = updates.role;
      if (updates.phone !== undefined) apiData.phone = updates.phone;
      if (updates.status) apiData.status = updates.status;

      const response = await adminApi.updateUser(userId, apiData);

      // Transform response and update local state
      const updatedUser = {
        id: response.user.id.toString(),
        name: response.user.name,
        email: response.user.email,
        role: response.user.user_type,
        status: response.user.status || 'active',
        phone: response.user.phone || '',
        createdAt: response.user.created_at,
        updatedAt: response.user.updated_at,
        lastLoginAt: response.user.last_login_at,
      };

      setUsers(prev => prev.map(u => u.id === userId.toString() ? updatedUser : u));

      // Log activity locally
      await logActivity(
        ACTIVITY_ACTIONS.USER_UPDATE,
        'user',
        userId,
        updatedUser.name,
        { changes: Object.keys(updates) }
      );

      return updatedUser;
    } catch (err) {
      console.error('Error updating user:', err);
      const message = err.response?.data?.message || err.message || 'Failed to update user';
      throw new Error(message);
    }
  }, []);

  /**
   * Delete a user via API
   */
  const deleteUser = useCallback(async (userId) => {
    try {
      const user = users.find(u => u.id === userId.toString());

      await adminApi.deleteUser(userId);

      // Remove from local state
      setUsers(prev => prev.filter(u => u.id !== userId.toString()));

      // Log activity locally
      if (user) {
        await logActivity(
          ACTIVITY_ACTIONS.USER_DELETE,
          'user',
          userId,
          user.name,
          { email: user.email, role: user.role }
        );
      }
    } catch (err) {
      console.error('Error deleting user:', err);
      const message = err.response?.data?.message || err.message || 'Failed to delete user';
      throw new Error(message);
    }
  }, [users]);

  /**
   * Change user status via API
   */
  const changeUserStatus = useCallback(async (userId, newStatus) => {
    try {
      const user = users.find(u => u.id === userId.toString());

      const response = await adminApi.changeUserStatus(userId, newStatus);

      // Update local state
      const updatedUser = {
        id: response.user.id.toString(),
        name: response.user.name,
        email: response.user.email,
        role: response.user.user_type,
        status: response.user.status || 'active',
        phone: response.user.phone || '',
        createdAt: response.user.created_at,
        updatedAt: response.user.updated_at,
        lastLoginAt: response.user.last_login_at,
      };

      setUsers(prev => prev.map(u => u.id === userId.toString() ? updatedUser : u));

      // Log activity locally
      const actionType = newStatus === 'active'
        ? ACTIVITY_ACTIONS.USER_ACTIVATE
        : newStatus === 'suspended'
          ? ACTIVITY_ACTIONS.USER_SUSPEND
          : ACTIVITY_ACTIONS.USER_DEACTIVATE;

      await logActivity(actionType, 'user', userId, user?.name || 'Unknown', { newStatus });
    } catch (err) {
      console.error('Error changing user status:', err);
      const message = err.response?.data?.message || err.message || 'Failed to change user status';
      throw new Error(message);
    }
  }, [users]);

  // ============ ACTIVITY LOGGING (Local) ============

  const logActivity = useCallback(async (action, targetType, targetId, targetName, details = {}) => {
    if (!currentUser) return;

    const logEntry = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role || currentUser.user_type,
      action,
      targetType,
      targetId,
      targetName,
      details,
    };

    const updatedLogs = [logEntry, ...activityLogs].slice(0, 500);
    setActivityLogs(updatedLogs);

    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ACTIVITY_LOGS, JSON.stringify(updatedLogs));
    } catch (error) {
      console.error('Error saving activity log:', error);
    }
  }, [currentUser, activityLogs]);

  // ============ VENDOR APPLICATIONS (Local placeholder) ============

  const approveVendor = useCallback(async (applicationId, notes = '') => {
    try {
      const app = vendorApplications.find(a => a.id === applicationId);
      if (!app) {
        throw new Error('Application not found');
      }

      const updatedApps = vendorApplications.map(a =>
        a.id === applicationId
          ? { ...a, status: 'approved', reviewedAt: new Date().toISOString(), notes }
          : a
      );
      setVendorApplications(updatedApps);
      await AsyncStorage.setItem(STORAGE_KEYS.VENDOR_APPS, JSON.stringify(updatedApps));

      await logActivity(
        ACTIVITY_ACTIONS.VENDOR_APPROVE,
        'vendor_application',
        applicationId,
        app.businessName,
        { email: app.email, notes }
      );

      return app;
    } catch (error) {
      throw error;
    }
  }, [vendorApplications, logActivity]);

  const rejectVendor = useCallback(async (applicationId, reason = '') => {
    try {
      const app = vendorApplications.find(a => a.id === applicationId);
      if (!app) {
        throw new Error('Application not found');
      }

      const updatedApps = vendorApplications.map(a =>
        a.id === applicationId
          ? { ...a, status: 'rejected', reviewedAt: new Date().toISOString(), rejectionReason: reason }
          : a
      );
      setVendorApplications(updatedApps);
      await AsyncStorage.setItem(STORAGE_KEYS.VENDOR_APPS, JSON.stringify(updatedApps));

      await logActivity(
        ACTIVITY_ACTIONS.VENDOR_REJECT,
        'vendor_application',
        applicationId,
        app.businessName,
        { email: app.email, reason }
      );

      return app;
    } catch (error) {
      throw error;
    }
  }, [vendorApplications, logActivity]);

  // ============ SYSTEM SETTINGS (Local) ============

  const updateSettings = useCallback(async (section, updates) => {
    try {
      const updatedSettings = {
        ...settings,
        [section]: { ...settings[section], ...updates },
      };
      setSettings(updatedSettings);
      await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updatedSettings));

      await logActivity(
        ACTIVITY_ACTIONS.SETTINGS_UPDATE,
        'settings',
        section,
        section,
        { changes: Object.keys(updates) }
      );

      return updatedSettings;
    } catch (error) {
      throw error;
    }
  }, [settings, logActivity]);

  const resetSettings = useCallback(async () => {
    try {
      setSettings(defaultSettings);
      await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(defaultSettings));

      await logActivity(
        ACTIVITY_ACTIONS.SETTINGS_UPDATE,
        'settings',
        'all',
        'All Settings',
        { action: 'reset_to_default' }
      );
    } catch (error) {
      throw error;
    }
  }, [logActivity]);

  // ============ ACTIVITY LOGS ============

  const clearActivityLogs = useCallback(async () => {
    try {
      setActivityLogs([]);
      await AsyncStorage.setItem(STORAGE_KEYS.ACTIVITY_LOGS, JSON.stringify([]));
    } catch (error) {
      throw error;
    }
  }, []);

  const getFilteredLogs = useCallback((filters = {}) => {
    let filtered = [...activityLogs];

    if (filters.action) {
      filtered = filtered.filter(log => log.action === filters.action);
    }

    if (filters.userId) {
      filtered = filtered.filter(log => log.userId === filters.userId);
    }

    if (filters.startDate) {
      filtered = filtered.filter(log => new Date(log.timestamp) >= new Date(filters.startDate));
    }

    if (filters.endDate) {
      filtered = filtered.filter(log => new Date(log.timestamp) <= new Date(filters.endDate));
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(log =>
        log.userName.toLowerCase().includes(searchLower) ||
        log.targetName?.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [activityLogs]);

  const value = {
    // State
    users,
    usersPagination,
    vendorApplications,
    settings,
    activityLogs,
    isLoading,
    error,

    // User management (API)
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    changeUserStatus,

    // Vendor management (local)
    approveVendor,
    rejectVendor,

    // Settings (local)
    updateSettings,
    resetSettings,

    // Activity logs (local)
    logActivity,
    clearActivityLogs,
    getFilteredLogs,

    // Utilities
    refreshData: initializeAdminData,
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}

export default AdminContext;
