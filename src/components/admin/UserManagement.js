import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAdmin } from '../../context/AdminContext';
import { useAuth } from '../../context/AuthContext';
import { ROLES, getRoleDisplayName, canManageUser, PERMISSIONS } from '../../utils/permissions';
import UserCard from './UserCard';
import UserFormModal from './UserFormModal';

const ROLE_FILTERS = [
  { id: 'all', label: 'All' },
  { id: ROLES.ADMIN, label: 'Admins' },
  { id: ROLES.MANAGER, label: 'Managers' },
  { id: ROLES.CASHIER, label: 'Cashiers' },
  { id: ROLES.CUSTOMER, label: 'Customers' },
];

const STATUS_FILTERS = [
  { id: 'all', label: 'All Status' },
  { id: 'active', label: 'Active' },
  { id: 'inactive', label: 'Inactive' },
  { id: 'suspended', label: 'Suspended' },
];

export default function UserManagement() {
  const { users, isLoading, refreshData, deleteUser, changeUserStatus } = useAdmin();
  const { currentUser, checkPermission } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const canManageUsers = checkPermission(PERMISSIONS.USER_MANAGEMENT);

  // Filter users based on search, role, and status
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      // Search filter
      const matchesSearch =
        searchQuery === '' ||
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase());

      // Role filter
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;

      // Status filter
      const matchesStatus = statusFilter === 'all' || user.status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  const handleDeleteUser = (user) => {
    if (!canManageUser(currentUser?.role, user.role)) {
      Alert.alert('Error', 'You do not have permission to delete this user.');
      return;
    }

    Alert.alert(
      'Delete User',
      `Are you sure you want to delete ${user.name}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteUser(user.id);
            } catch (error) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  const handleToggleStatus = async (user) => {
    if (!canManageUser(currentUser?.role, user.role)) {
      Alert.alert('Error', 'You do not have permission to modify this user.');
      return;
    }

    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    try {
      await changeUserStatus(user.id, newStatus);
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handleEditUser = (user) => {
    if (!canManageUser(currentUser?.role, user.role)) {
      Alert.alert('Error', 'You do not have permission to edit this user.');
      return;
    }
    setEditingUser(user);
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#9ca3af" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search users..."
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

      {/* Filters Row */}
      <View style={styles.filtersRow}>
        {/* Role Filter */}
        <View style={styles.filterGroup}>
          <FlatList
            horizontal
            data={ROLE_FILTERS}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  roleFilter === item.id && styles.filterChipActive,
                ]}
                onPress={() => setRoleFilter(item.id)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    roleFilter === item.id && styles.filterChipTextActive,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </View>

      {/* Status Filter */}
      <View style={styles.statusFilterRow}>
        {STATUS_FILTERS.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.statusChip,
              statusFilter === item.id && styles.statusChipActive,
            ]}
            onPress={() => setStatusFilter(item.id)}
          >
            <Text
              style={[
                styles.statusChipText,
                statusFilter === item.id && styles.statusChipTextActive,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Results Count */}
      <View style={styles.resultsRow}>
        <Text style={styles.resultsText}>
          {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} found
        </Text>
        {canManageUsers && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowCreateModal(true)}
          >
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.addButtonText}>Add User</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="people-outline" size={64} color="#4a3660" />
      <Text style={styles.emptyTitle}>No Users Found</Text>
      <Text style={styles.emptyText}>
        {searchQuery || roleFilter !== 'all' || statusFilter !== 'all'
          ? 'Try adjusting your search or filters'
          : 'No users have been created yet'}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <UserCard
            user={item}
            currentUser={currentUser}
            onEdit={() => handleEditUser(item)}
            onDelete={() => handleDeleteUser(item)}
            onToggleStatus={() => handleToggleStatus(item)}
            canManage={canManageUser(currentUser?.role, item.role)}
          />
        )}
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

      {/* Create/Edit Modal */}
      <UserFormModal
        visible={showCreateModal || !!editingUser}
        onClose={() => {
          setShowCreateModal(false);
          setEditingUser(null);
        }}
        user={editingUser}
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
  },
  headerContainer: {
    padding: 16,
    gap: 12,
  },
  searchContainer: {
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
  filtersRow: {
    flexDirection: 'row',
  },
  filterGroup: {
    flex: 1,
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
    fontSize: 13,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  statusFilterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#2d1f3d',
    borderWidth: 1,
    borderColor: '#4a3660',
  },
  statusChipActive: {
    backgroundColor: '#4a3660',
    borderColor: '#a855f7',
  },
  statusChipText: {
    color: '#9ca3af',
    fontSize: 12,
  },
  statusChipTextActive: {
    color: '#e5e5e5',
  },
  resultsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  resultsText: {
    color: '#9ca3af',
    fontSize: 14,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#9333ea',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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
