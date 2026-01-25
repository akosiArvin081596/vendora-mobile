import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  const [vendorApplications, setVendorApplications] = useState([]);
  const [settings, setSettings] = useState(defaultSettings);
  const [activityLogs, setActivityLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize admin data from storage
  useEffect(() => {
    initializeAdminData();
  }, []);

  const initializeAdminData = async () => {
    try {
      // Load users
      const usersJson = await AsyncStorage.getItem(STORAGE_KEYS.USERS);
      if (usersJson) {
        setUsers(JSON.parse(usersJson));
      }

      // Load vendor applications (with sample data if empty)
      const vendorAppsJson = await AsyncStorage.getItem(STORAGE_KEYS.VENDOR_APPS);
      if (vendorAppsJson) {
        setVendorApplications(JSON.parse(vendorAppsJson));
      } else {
        setVendorApplications(sampleVendorApplications);
        await AsyncStorage.setItem(STORAGE_KEYS.VENDOR_APPS, JSON.stringify(sampleVendorApplications));
      }

      // Load settings
      const settingsJson = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (settingsJson) {
        setSettings(JSON.parse(settingsJson));
      } else {
        await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(defaultSettings));
      }

      // Load activity logs
      const logsJson = await AsyncStorage.getItem(STORAGE_KEYS.ACTIVITY_LOGS);
      if (logsJson) {
        setActivityLogs(JSON.parse(logsJson));
      }
    } catch (error) {
      console.error('Error initializing admin data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Log activity
  const logActivity = useCallback(async (action, targetType, targetId, targetName, details = {}) => {
    if (!currentUser) return;

    const logEntry = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action,
      targetType,
      targetId,
      targetName,
      details,
    };

    const updatedLogs = [logEntry, ...activityLogs].slice(0, 500); // Keep last 500 logs
    setActivityLogs(updatedLogs);

    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ACTIVITY_LOGS, JSON.stringify(updatedLogs));
    } catch (error) {
      console.error('Error saving activity log:', error);
    }
  }, [currentUser, activityLogs]);

  // USER MANAGEMENT

  // Create user
  const createUser = useCallback(async (userData) => {
    try {
      const emailExists = users.some(u =>
        u.email.toLowerCase() === userData.email.toLowerCase()
      );
      if (emailExists) {
        throw new Error('Email already exists');
      }

      const newUser = {
        id: `user-${Date.now()}`,
        email: userData.email,
        password: userData.password,
        name: userData.name,
        role: userData.role,
        status: 'active',
        phone: userData.phone || '',
        avatar: null,
        createdAt: new Date().toISOString(),
        lastLoginAt: null,
      };

      const updatedUsers = [...users, newUser];
      setUsers(updatedUsers);
      await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updatedUsers));

      await logActivity(
        ACTIVITY_ACTIONS.USER_CREATE,
        'user',
        newUser.id,
        newUser.name,
        { email: newUser.email, role: newUser.role }
      );

      return newUser;
    } catch (error) {
      throw error;
    }
  }, [users, logActivity]);

  // Update user
  const updateUser = useCallback(async (userId, updates) => {
    try {
      const userIndex = users.findIndex(u => u.id === userId);
      if (userIndex === -1) {
        throw new Error('User not found');
      }

      const existingUser = users[userIndex];

      // Check role hierarchy
      if (!canManageUser(currentUser?.role, existingUser.role)) {
        throw new Error('You do not have permission to modify this user');
      }

      // Check email uniqueness if changing email
      if (updates.email && updates.email !== existingUser.email) {
        const emailExists = users.some(u =>
          u.email.toLowerCase() === updates.email.toLowerCase() && u.id !== userId
        );
        if (emailExists) {
          throw new Error('Email already exists');
        }
      }

      const updatedUser = { ...existingUser, ...updates };
      const updatedUsers = [...users];
      updatedUsers[userIndex] = updatedUser;

      setUsers(updatedUsers);
      await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updatedUsers));

      await logActivity(
        ACTIVITY_ACTIONS.USER_UPDATE,
        'user',
        userId,
        updatedUser.name,
        { changes: Object.keys(updates) }
      );

      return updatedUser;
    } catch (error) {
      throw error;
    }
  }, [users, currentUser, logActivity]);

  // Delete user
  const deleteUser = useCallback(async (userId) => {
    try {
      const user = users.find(u => u.id === userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Check role hierarchy
      if (!canManageUser(currentUser?.role, user.role)) {
        throw new Error('You do not have permission to delete this user');
      }

      // Prevent deleting yourself
      if (userId === currentUser?.id) {
        throw new Error('You cannot delete your own account');
      }

      const updatedUsers = users.filter(u => u.id !== userId);
      setUsers(updatedUsers);
      await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updatedUsers));

      await logActivity(
        ACTIVITY_ACTIONS.USER_DELETE,
        'user',
        userId,
        user.name,
        { email: user.email, role: user.role }
      );
    } catch (error) {
      throw error;
    }
  }, [users, currentUser, logActivity]);

  // Change user status
  const changeUserStatus = useCallback(async (userId, newStatus) => {
    try {
      const user = users.find(u => u.id === userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Check role hierarchy
      if (!canManageUser(currentUser?.role, user.role)) {
        throw new Error('You do not have permission to modify this user');
      }

      // Prevent deactivating yourself
      if (userId === currentUser?.id && newStatus !== 'active') {
        throw new Error('You cannot deactivate your own account');
      }

      const updatedUsers = users.map(u =>
        u.id === userId ? { ...u, status: newStatus } : u
      );
      setUsers(updatedUsers);
      await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updatedUsers));

      const actionType = newStatus === 'active'
        ? ACTIVITY_ACTIONS.USER_ACTIVATE
        : newStatus === 'suspended'
          ? ACTIVITY_ACTIONS.USER_SUSPEND
          : ACTIVITY_ACTIONS.USER_DEACTIVATE;

      await logActivity(actionType, 'user', userId, user.name, { newStatus });
    } catch (error) {
      throw error;
    }
  }, [users, currentUser, logActivity]);

  // VENDOR APPLICATIONS

  // Approve vendor
  const approveVendor = useCallback(async (applicationId, notes = '') => {
    try {
      const app = vendorApplications.find(a => a.id === applicationId);
      if (!app) {
        throw new Error('Application not found');
      }

      // Update application status
      const updatedApps = vendorApplications.map(a =>
        a.id === applicationId
          ? { ...a, status: 'approved', reviewedAt: new Date().toISOString(), notes }
          : a
      );
      setVendorApplications(updatedApps);
      await AsyncStorage.setItem(STORAGE_KEYS.VENDOR_APPS, JSON.stringify(updatedApps));

      // Create vendor user account
      const vendorUser = {
        id: `vendor-${Date.now()}`,
        email: app.email,
        password: 'vendor123', // Default password
        name: app.ownerName,
        role: 'vendor',
        status: 'active',
        phone: app.phone,
        businessName: app.businessName,
        avatar: null,
        createdAt: new Date().toISOString(),
        lastLoginAt: null,
      };

      const updatedUsers = [...users, vendorUser];
      setUsers(updatedUsers);
      await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updatedUsers));

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
  }, [vendorApplications, users, logActivity]);

  // Reject vendor
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

  // SYSTEM SETTINGS

  // Update settings
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

  // Reset settings to default
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

  // ACTIVITY LOGS

  // Clear activity logs
  const clearActivityLogs = useCallback(async () => {
    try {
      setActivityLogs([]);
      await AsyncStorage.setItem(STORAGE_KEYS.ACTIVITY_LOGS, JSON.stringify([]));
    } catch (error) {
      throw error;
    }
  }, []);

  // Get filtered activity logs
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
    users,
    vendorApplications,
    settings,
    activityLogs,
    isLoading,
    // User management
    createUser,
    updateUser,
    deleteUser,
    changeUserStatus,
    // Vendor management
    approveVendor,
    rejectVendor,
    // Settings
    updateSettings,
    resetSettings,
    // Activity logs
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
