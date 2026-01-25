import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AdminTabBar from '../components/admin/AdminTabBar';
import UserManagement from '../components/admin/UserManagement';
import VendorApprovals from '../components/admin/VendorApprovals';
import SystemSettings from '../components/admin/SystemSettings';
import ActivityLogs from '../components/admin/ActivityLogs';
import { useAuth } from '../context/AuthContext';
import { PERMISSIONS } from '../utils/permissions';

export default function AdminScreen() {
  const { currentUser, checkPermission } = useAuth();
  const [activeTab, setActiveTab] = useState('users');

  // Determine default tab based on permissions
  const getDefaultTab = () => {
    if (checkPermission(PERMISSIONS.USER_MANAGEMENT)) return 'users';
    if (checkPermission(PERMISSIONS.VENDOR_APPROVALS)) return 'vendors';
    if (checkPermission(PERMISSIONS.VIEW_ACTIVITY_LOGS)) return 'activity';
    return 'users';
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'users':
        return <UserManagement />;
      case 'vendors':
        return <VendorApprovals />;
      case 'settings':
        return checkPermission(PERMISSIONS.SYSTEM_SETTINGS) ? (
          <SystemSettings />
        ) : (
          <NoAccessPlaceholder />
        );
      case 'activity':
        return <ActivityLogs />;
      default:
        return <UserManagement />;
    }
  };

  if (!checkPermission(PERMISSIONS.ADMIN_PANEL_ACCESS)) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.noAccessContainer}>
          <Ionicons name="lock-closed" size={64} color="#4a3660" />
          <Text style={styles.noAccessTitle}>Access Denied</Text>
          <Text style={styles.noAccessText}>
            You don't have permission to access the Admin Panel.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1025" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="shield-checkmark" size={28} color="#a855f7" />
          <View>
            <Text style={styles.headerTitle}>Admin Panel</Text>
            <Text style={styles.headerSubtitle}>
              Welcome, {currentUser?.name}
            </Text>
          </View>
        </View>
      </View>

      {/* Tab Bar */}
      <AdminTabBar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Tab Content */}
      <View style={styles.content}>{renderTabContent()}</View>
    </SafeAreaView>
  );
}

function NoAccessPlaceholder() {
  return (
    <View style={styles.noAccessContainer}>
      <Ionicons name="lock-closed-outline" size={48} color="#4a3660" />
      <Text style={styles.noAccessText}>
        You don't have permission to access this section.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1025',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#2d1f3d',
    borderBottomWidth: 1,
    borderBottomColor: '#4a3660',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    color: '#e5e5e5',
    fontSize: 22,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#9ca3af',
    fontSize: 13,
  },
  content: {
    flex: 1,
  },
  noAccessContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 16,
  },
  noAccessTitle: {
    color: '#e5e5e5',
    fontSize: 24,
    fontWeight: 'bold',
  },
  noAccessText: {
    color: '#9ca3af',
    fontSize: 16,
    textAlign: 'center',
  },
});
