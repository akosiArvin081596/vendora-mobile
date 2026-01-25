import React from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { PERMISSIONS } from '../../utils/permissions';

const ADMIN_TABS = [
  {
    id: 'users',
    label: 'Users',
    icon: 'people-outline',
    activeIcon: 'people',
    permission: PERMISSIONS.ADMIN_PANEL_ACCESS,
  },
  {
    id: 'vendors',
    label: 'Vendors',
    icon: 'storefront-outline',
    activeIcon: 'storefront',
    permission: PERMISSIONS.VENDOR_APPROVALS,
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: 'settings-outline',
    activeIcon: 'settings',
    permission: PERMISSIONS.SYSTEM_SETTINGS,
  },
  {
    id: 'activity',
    label: 'Activity',
    icon: 'list-outline',
    activeIcon: 'list',
    permission: PERMISSIONS.VIEW_ACTIVITY_LOGS,
  },
];

export default function AdminTabBar({ activeTab, onTabChange }) {
  const { checkPermission } = useAuth();

  // Filter tabs based on user permissions
  const visibleTabs = ADMIN_TABS.filter(tab => checkPermission(tab.permission));

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {visibleTabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, isActive && styles.activeTab]}
              onPress={() => onTabChange(tab.id)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isActive ? tab.activeIcon : tab.icon}
                size={20}
                color={isActive ? '#fff' : '#a855f7'}
              />
              <Text style={[styles.tabLabel, isActive && styles.activeTabLabel]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#2d1f3d',
    borderBottomWidth: 1,
    borderBottomColor: '#4a3660',
  },
  scrollContent: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#3d2a52',
    gap: 8,
  },
  activeTab: {
    backgroundColor: '#9333ea',
  },
  tabLabel: {
    color: '#a855f7',
    fontSize: 14,
    fontWeight: '600',
  },
  activeTabLabel: {
    color: '#fff',
  },
});
