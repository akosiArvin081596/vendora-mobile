import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AdminUserRepository from '../db/repositories/AdminUserRepository';
import SyncQueueRepository from '../db/repositories/SyncQueueRepository';
import SyncManager from '../sync/SyncManager';
import SyncService from '../sync/SyncService';
import {
  STORAGE_KEYS,
  defaultSettings,
  sampleVendorApplications
} from '../data/defaultSettings';
import { ACTIVITY_ACTIONS, canManageUser } from '../utils/permissions';
import { useAuth } from './AuthContext';

const AdminContext = createContext();

/**
 * Transform a SQLite admin_users row to frontend format.
 */
const normalizeLocalUser = (row) => {
  if (!row) return null;
  return {
    id: row.id?.toString() ?? row.local_id,
    local_id: row.local_id,
    name: row.name,
    email: row.email,
    role: row.user_type,
    status: row.status || 'active',
    phone: row.phone || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastLoginAt: row.last_login_at,
    sync_status: row.sync_status,
  };
};

export function AdminProvider({ children }) {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [usersPagination, setUsersPagination] = useState(null);
  const [vendorApplications, setVendorApplications] = useState([]);
  const [settings, setSettings] = useState(defaultSettings);
  const [activityLogs, setActivityLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const usersLoaded = useRef(false);

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
      // Fetch users (offline-first)
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

  // ============ USER MANAGEMENT (Offline-First) ============

  /**
   * Load users from SQLite first, then background pull-sync.
   */
  const loadUsersFromLocal = useCallback((filters = {}) => {
    try {
      const rows = AdminUserRepository.getAll(filters);
      if (rows.length > 0) {
        const normalized = rows.map(normalizeLocalUser);
        setUsers(normalized);
        usersLoaded.current = true;
        return normalized;
      }
    } catch (err) {
      console.warn('[AdminContext] Error loading local users:', err.message);
    }
    return [];
  }, []);

  /**
   * Fetch users — offline-first via SQLite + background pull-sync.
   */
  const fetchUsers = useCallback(async (params = {}) => {
    // Step 1: Load from SQLite
    const localData = loadUsersFromLocal(params);

    if (localData.length > 0 && !params.forceRefresh) {
      // Background pull-sync
      _backgroundRefreshUsers();
      return localData;
    }

    // Step 2: If no local data, do a synchronous pull-sync
    try {
      setIsLoading(true);
      await SyncManager.syncAdminUsers({ full: true });

      // Reload from SQLite
      const rows = AdminUserRepository.getAll(params);
      const normalized = rows.map(normalizeLocalUser);
      setUsers(normalized);
      usersLoaded.current = true;
      return normalized;
    } catch (err) {
      // Silent — offline-first: local data is already displayed
      console.warn('[AdminContext] Users sync skipped (offline):', err.message);
      if (!usersLoaded.current) {
        loadUsersFromLocal(params);
      }
      return localData.length > 0 ? localData : users;
    } finally {
      setIsLoading(false);
    }
  }, [users, loadUsersFromLocal]);

  /**
   * Background refresh users via SyncManager.
   */
  const _backgroundRefreshUsers = useCallback(async () => {
    try {
      await SyncManager.syncAdminUsers();

      // Reload from SQLite
      const rows = AdminUserRepository.getAll();
      const normalized = rows.map(normalizeLocalUser);
      setUsers(normalized);
      usersLoaded.current = true;
    } catch (err) {
      console.warn('[AdminContext] Background refresh failed:', err.message);
    }
  }, []);

  /**
   * Create a new user — offline-first.
   */
  const createUser = useCallback(async (userData) => {
    // Transform frontend data to backend format
    const apiData = {
      name: userData.name,
      email: userData.email,
      password: userData.password,
      user_type: userData.role,
      phone: userData.phone || null,
      status: userData.status || 'active',
    };

    // 1. Write to SQLite
    let localId;
    try {
      localId = AdminUserRepository.createLocal({
        name: apiData.name,
        email: apiData.email,
        user_type: apiData.user_type,
        phone: apiData.phone,
        status: apiData.status,
      });
    } catch (err) {
      console.error('[AdminContext] SQLite user create failed:', err);
      throw err;
    }

    // 2. Enqueue sync
    try {
      SyncQueueRepository.enqueue({
        entityType: 'admin_user',
        entityLocalId: localId,
        action: 'create',
        endpoint: '/admin/users',
        method: 'POST',
        payload: apiData,
      });
    } catch (err) {
      console.warn('[AdminContext] Sync enqueue failed:', err.message);
    }

    // 3. Add to React state immediately
    const newUser = normalizeLocalUser({
      local_id: localId,
      name: apiData.name,
      email: apiData.email,
      user_type: apiData.user_type,
      phone: apiData.phone,
      status: apiData.status,
      sync_status: 'pending',
      created_at: new Date().toISOString(),
    });

    setUsers(prev => [newUser, ...prev]);

    // 4. Log activity locally
    await logActivity(
      ACTIVITY_ACTIONS.USER_CREATE,
      'user',
      newUser.id,
      newUser.name,
      { email: newUser.email, role: newUser.role }
    );

    // 5. Trigger sync
    SyncService.processQueue().catch(() => {});

    return newUser;
  }, []);

  /**
   * Update a user — offline-first.
   */
  const updateUser = useCallback(async (userId, updates) => {
    // Transform frontend data to backend format
    const apiData = {};
    if (updates.name) apiData.name = updates.name;
    if (updates.email) apiData.email = updates.email;
    if (updates.password) apiData.password = updates.password;
    if (updates.role) apiData.user_type = updates.role;
    if (updates.phone !== undefined) apiData.phone = updates.phone;
    if (updates.status) apiData.status = updates.status;

    // 1. Update SQLite
    try {
      AdminUserRepository.updateLocal(userId, apiData);
    } catch (err) {
      console.error('[AdminContext] SQLite user update failed:', err);
      throw err;
    }

    // 2. Enqueue sync
    try {
      const user = AdminUserRepository.getById(userId);
      SyncQueueRepository.enqueue({
        entityType: 'admin_user',
        entityLocalId: user?.local_id || `server-${userId}`,
        action: 'update',
        endpoint: `/admin/users/${userId}`,
        method: 'PUT',
        payload: apiData,
      });
    } catch (err) {
      console.warn('[AdminContext] Sync enqueue failed:', err.message);
    }

    // 3. Update React state immediately
    const updatedUser = {
      ...users.find(u => u.id === userId.toString()),
      ...updates,
      role: apiData.user_type || updates.role,
      sync_status: 'pending',
    };

    setUsers(prev => prev.map(u => u.id === userId.toString() ? updatedUser : u));

    // 4. Log activity locally
    await logActivity(
      ACTIVITY_ACTIONS.USER_UPDATE,
      'user',
      userId,
      updatedUser.name,
      { changes: Object.keys(updates) }
    );

    // 5. Trigger sync
    SyncService.processQueue().catch(() => {});

    return updatedUser;
  }, [users]);

  /**
   * Delete a user — offline-first.
   */
  const deleteUser = useCallback(async (userId) => {
    const user = users.find(u => u.id === userId.toString());

    // 1. Mark deleted in SQLite
    try {
      AdminUserRepository.markDeleted(userId);
    } catch (err) {
      console.warn('[AdminContext] SQLite user delete failed:', err.message);
    }

    // 2. Enqueue sync
    try {
      const dbUser = AdminUserRepository.getById(userId);
      SyncQueueRepository.enqueue({
        entityType: 'admin_user',
        entityLocalId: dbUser?.local_id || `server-${userId}`,
        action: 'delete',
        endpoint: `/admin/users/${userId}`,
        method: 'DELETE',
      });
    } catch (err) {
      console.warn('[AdminContext] Sync enqueue failed:', err.message);
    }

    // 3. Remove from React state immediately
    setUsers(prev => prev.filter(u => u.id !== userId.toString()));

    // 4. Log activity locally
    if (user) {
      await logActivity(
        ACTIVITY_ACTIONS.USER_DELETE,
        'user',
        userId,
        user.name,
        { email: user.email, role: user.role }
      );
    }

    // 5. Trigger sync
    SyncService.processQueue().catch(() => {});
  }, [users]);

  /**
   * Change user status — offline-first.
   */
  const changeUserStatus = useCallback(async (userId, newStatus) => {
    const user = users.find(u => u.id === userId.toString());

    // 1. Update SQLite
    try {
      AdminUserRepository.updateLocal(userId, { status: newStatus });
    } catch (err) {
      console.error('[AdminContext] SQLite status change failed:', err);
      throw err;
    }

    // 2. Enqueue sync
    try {
      const dbUser = AdminUserRepository.getById(userId);
      SyncQueueRepository.enqueue({
        entityType: 'admin_user',
        entityLocalId: dbUser?.local_id || `server-${userId}`,
        action: 'status_change',
        endpoint: `/admin/users/${userId}/status`,
        method: 'PATCH',
        payload: { status: newStatus },
      });
    } catch (err) {
      console.warn('[AdminContext] Sync enqueue failed:', err.message);
    }

    // 3. Update React state immediately
    setUsers(prev => prev.map(u =>
      u.id === userId.toString()
        ? { ...u, status: newStatus, sync_status: 'pending' }
        : u
    ));

    // 4. Log activity locally
    const actionType = newStatus === 'active'
      ? ACTIVITY_ACTIONS.USER_ACTIVATE
      : newStatus === 'suspended'
        ? ACTIVITY_ACTIONS.USER_SUSPEND
        : ACTIVITY_ACTIONS.USER_DEACTIVATE;

    await logActivity(actionType, 'user', userId, user?.name || 'Unknown', { newStatus });

    // 5. Trigger sync
    SyncService.processQueue().catch(() => {});
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

    // User management (offline-first)
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
