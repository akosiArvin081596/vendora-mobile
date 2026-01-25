import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAdmin } from '../../context/AdminContext';
import {
  ACTIVITY_ACTIONS,
  getActionDisplayName,
  getActionColor,
} from '../../utils/permissions';

const ACTION_FILTERS = [
  { id: 'all', label: 'All Actions' },
  { id: ACTIVITY_ACTIONS.USER_CREATE, label: 'User Created' },
  { id: ACTIVITY_ACTIONS.USER_UPDATE, label: 'User Updated' },
  { id: ACTIVITY_ACTIONS.USER_DELETE, label: 'User Deleted' },
  { id: ACTIVITY_ACTIONS.USER_ACTIVATE, label: 'User Activated' },
  { id: ACTIVITY_ACTIONS.USER_DEACTIVATE, label: 'User Deactivated' },
  { id: ACTIVITY_ACTIONS.VENDOR_APPROVE, label: 'Vendor Approved' },
  { id: ACTIVITY_ACTIONS.VENDOR_REJECT, label: 'Vendor Rejected' },
  { id: ACTIVITY_ACTIONS.SETTINGS_UPDATE, label: 'Settings Updated' },
];

export default function ActivityLogs() {
  const { activityLogs, clearActivityLogs, refreshData } = useAdmin();
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const filteredLogs = useMemo(() => {
    return activityLogs.filter((log) => {
      const matchesSearch =
        searchQuery === '' ||
        log.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.targetName?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesAction =
        actionFilter === 'all' || log.action === actionFilter;

      return matchesSearch && matchesAction;
    });
  }, [activityLogs, searchQuery, actionFilter]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  const handleClearLogs = () => {
    Alert.alert(
      'Clear Activity Logs',
      'Are you sure you want to clear all activity logs? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearActivityLogs();
            } catch (error) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActionIcon = (action) => {
    switch (action) {
      case ACTIVITY_ACTIONS.USER_CREATE:
        return 'person-add';
      case ACTIVITY_ACTIONS.USER_UPDATE:
        return 'create';
      case ACTIVITY_ACTIONS.USER_DELETE:
        return 'trash';
      case ACTIVITY_ACTIONS.USER_ACTIVATE:
        return 'checkmark-circle';
      case ACTIVITY_ACTIONS.USER_DEACTIVATE:
        return 'pause-circle';
      case ACTIVITY_ACTIONS.USER_SUSPEND:
        return 'ban';
      case ACTIVITY_ACTIONS.VENDOR_APPROVE:
        return 'storefront';
      case ACTIVITY_ACTIONS.VENDOR_REJECT:
        return 'close-circle';
      case ACTIVITY_ACTIONS.SETTINGS_UPDATE:
        return 'settings';
      case ACTIVITY_ACTIONS.LOGIN:
        return 'log-in';
      case ACTIVITY_ACTIONS.LOGOUT:
        return 'log-out';
      default:
        return 'ellipse';
    }
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Search Bar */}
      <View style={styles.searchRow}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#9ca3af" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search logs..."
            placeholderTextColor="#6b7280"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[styles.filterButton, showFilters && styles.filterButtonActive]}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Ionicons
            name="filter"
            size={20}
            color={showFilters ? '#fff' : '#a855f7'}
          />
        </TouchableOpacity>
      </View>

      {/* Action Filters */}
      {showFilters && (
        <View style={styles.filtersContainer}>
          <FlatList
            horizontal
            data={ACTION_FILTERS}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  actionFilter === item.id && styles.filterChipActive,
                ]}
                onPress={() => setActionFilter(item.id)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    actionFilter === item.id && styles.filterChipTextActive,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* Results Row */}
      <View style={styles.resultsRow}>
        <Text style={styles.resultsText}>
          {filteredLogs.length} log{filteredLogs.length !== 1 ? 's' : ''}
        </Text>
        {activityLogs.length > 0 && (
          <TouchableOpacity style={styles.clearButton} onPress={handleClearLogs}>
            <Ionicons name="trash-outline" size={16} color="#ef4444" />
            <Text style={styles.clearButtonText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderLogItem = ({ item }) => {
    const actionColor = getActionColor(item.action);

    return (
      <View style={styles.logCard}>
        <View style={styles.logIcon}>
          <View style={[styles.iconContainer, { backgroundColor: actionColor + '20' }]}>
            <Ionicons
              name={getActionIcon(item.action)}
              size={18}
              color={actionColor}
            />
          </View>
        </View>

        <View style={styles.logContent}>
          <View style={styles.logHeader}>
            <Text style={styles.logAction}>{getActionDisplayName(item.action)}</Text>
            <Text style={styles.logTimestamp}>{formatTimestamp(item.timestamp)}</Text>
          </View>

          <Text style={styles.logDescription}>
            <Text style={styles.userName}>{item.userName}</Text>
            {' '}
            {item.targetName && (
              <>
                {'→ '}
                <Text style={styles.targetName}>{item.targetName}</Text>
              </>
            )}
          </Text>

          {item.details && Object.keys(item.details).length > 0 && (
            <View style={styles.detailsContainer}>
              {item.details.email && (
                <Text style={styles.detailText}>Email: {item.details.email}</Text>
              )}
              {item.details.role && (
                <Text style={styles.detailText}>Role: {item.details.role}</Text>
              )}
              {item.details.newStatus && (
                <Text style={styles.detailText}>Status: {item.details.newStatus}</Text>
              )}
              {item.details.changes && (
                <Text style={styles.detailText}>
                  Changed: {item.details.changes.join(', ')}
                </Text>
              )}
              {item.details.reason && (
                <Text style={styles.detailText}>Reason: {item.details.reason}</Text>
              )}
            </View>
          )}

          <View style={styles.logFooter}>
            <View style={styles.roleTag}>
              <Text style={styles.roleTagText}>{item.userRole}</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="document-text-outline" size={64} color="#4a3660" />
      <Text style={styles.emptyTitle}>No Activity Logs</Text>
      <Text style={styles.emptyText}>
        {searchQuery || actionFilter !== 'all'
          ? 'No logs match your search criteria'
          : 'Activity will be logged here as actions are performed'}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredLogs}
        keyExtractor={(item) => item.id}
        renderItem={renderLogItem}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#a855f7"
            colors={['#a855f7']}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1025',
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  headerContainer: {
    padding: 16,
    gap: 12,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 10,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3d2a52',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#4a3660',
  },
  searchInput: {
    flex: 1,
    color: '#e5e5e5',
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#3d2a52',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4a3660',
  },
  filterButtonActive: {
    backgroundColor: '#9333ea',
    borderColor: '#9333ea',
  },
  filtersContainer: {
    marginTop: 4,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#3d2a52',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#4a3660',
  },
  filterChipActive: {
    backgroundColor: '#9333ea',
    borderColor: '#9333ea',
  },
  filterChipText: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  resultsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultsText: {
    color: '#9ca3af',
    fontSize: 14,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#ef444420',
  },
  clearButtonText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '500',
  },
  logCard: {
    flexDirection: 'row',
    backgroundColor: '#2d1f3d',
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#4a3660',
    gap: 12,
  },
  logIcon: {
    paddingTop: 2,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logContent: {
    flex: 1,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  logAction: {
    color: '#e5e5e5',
    fontSize: 14,
    fontWeight: '600',
  },
  logTimestamp: {
    color: '#6b7280',
    fontSize: 11,
  },
  logDescription: {
    color: '#9ca3af',
    fontSize: 13,
    marginBottom: 6,
  },
  userName: {
    color: '#a855f7',
    fontWeight: '500',
  },
  targetName: {
    color: '#e5e5e5',
    fontWeight: '500',
  },
  detailsContainer: {
    backgroundColor: '#3d2a52',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    gap: 4,
  },
  detailText: {
    color: '#9ca3af',
    fontSize: 12,
  },
  logFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleTag: {
    backgroundColor: '#4a3660',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  roleTagText: {
    color: '#9ca3af',
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    marginTop: 48,
    gap: 12,
  },
  emptyTitle: {
    color: '#e5e5e5',
    fontSize: 18,
    fontWeight: '600',
  },
  emptyText: {
    color: '#9ca3af',
    fontSize: 14,
    textAlign: 'center',
  },
});
