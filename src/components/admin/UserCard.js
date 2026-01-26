import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getRoleDisplayName, getRoleColor } from '../../utils/permissions';

export default function UserCard({
  user,
  currentUser,
  onEdit,
  onDelete,
  onToggleStatus,
  canManage,
}) {
  const isCurrentUser = currentUser?.id === user.id;
  const roleColor = getRoleColor(user.role);

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return '#10b981';
      case 'inactive':
        return '#f59e0b';
      case 'suspended':
        return '#ef4444';
      default:
        return '#9ca3af';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return 'checkmark-circle';
      case 'inactive':
        return 'pause-circle';
      case 'suspended':
        return 'ban';
      default:
        return 'help-circle';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return 'Never';
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'Asia/Manila',
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return 'Never';
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Manila',
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.mainContent}>
        {/* Avatar */}
        <View style={[styles.avatar, { borderColor: roleColor }]}>
          {user.avatar ? (
            <Text style={styles.avatarText}>
              {user.name.charAt(0).toUpperCase()}
            </Text>
          ) : (
            <Text style={styles.avatarText}>
              {user.name.charAt(0).toUpperCase()}
            </Text>
          )}
        </View>

        {/* User Info */}
        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>
              {user.name}
              {isCurrentUser && <Text style={styles.youBadge}> (You)</Text>}
            </Text>
          </View>
          <Text style={styles.email} numberOfLines={1}>
            {user.email}
          </Text>
          <View style={styles.metaRow}>
            <View style={[styles.roleBadge, { backgroundColor: roleColor + '20' }]}>
              <Text style={[styles.roleText, { color: roleColor }]}>
                {getRoleDisplayName(user.role)}
              </Text>
            </View>
            <View style={styles.statusBadge}>
              <Ionicons
                name={getStatusIcon(user.status)}
                size={12}
                color={getStatusColor(user.status)}
              />
              <Text style={[styles.statusText, { color: getStatusColor(user.status) }]}>
                {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Additional Info */}
      <View style={styles.additionalInfo}>
        {user.phone && (
          <View style={styles.infoItem}>
            <Ionicons name="call-outline" size={14} color="#9ca3af" />
            <Text style={styles.infoText}>{user.phone}</Text>
          </View>
        )}
        <View style={styles.infoItem}>
          <Ionicons name="time-outline" size={14} color="#9ca3af" />
          <Text style={styles.infoText}>
            Last login: {formatDateTime(user.lastLoginAt)}
          </Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="calendar-outline" size={14} color="#9ca3af" />
          <Text style={styles.infoText}>
            Created: {formatDate(user.createdAt)}
          </Text>
        </View>
      </View>

      {/* Actions */}
      {canManage && !isCurrentUser && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={onToggleStatus}
          >
            <Ionicons
              name={user.status === 'active' ? 'pause-circle-outline' : 'play-circle-outline'}
              size={20}
              color={user.status === 'active' ? '#f59e0b' : '#10b981'}
            />
            <Text style={[
              styles.actionText,
              { color: user.status === 'active' ? '#f59e0b' : '#10b981' }
            ]}>
              {user.status === 'active' ? 'Deactivate' : 'Activate'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={onEdit}>
            <Ionicons name="create-outline" size={20} color="#a855f7" />
            <Text style={[styles.actionText, { color: '#a855f7' }]}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={onDelete}>
            <Ionicons name="trash-outline" size={20} color="#ef4444" />
            <Text style={[styles.actionText, { color: '#ef4444' }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}

      {isCurrentUser && (
        <View style={styles.currentUserBanner}>
          <Ionicons name="person-circle" size={16} color="#a855f7" />
          <Text style={styles.currentUserText}>This is your account</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#2d1f3d',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#4a3660',
    overflow: 'hidden',
  },
  mainContent: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#3d2a52',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  avatarText: {
    color: '#e5e5e5',
    fontSize: 20,
    fontWeight: 'bold',
  },
  info: {
    flex: 1,
    gap: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    color: '#e5e5e5',
    fontSize: 16,
    fontWeight: '600',
  },
  youBadge: {
    color: '#a855f7',
    fontSize: 12,
    fontWeight: '400',
  },
  email: {
    color: '#9ca3af',
    fontSize: 13,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '500',
  },
  additionalInfo: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 6,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    color: '#9ca3af',
    fontSize: 12,
  },
  actions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#4a3660',
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '500',
  },
  currentUserBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    backgroundColor: '#3d2a52',
    borderTopWidth: 1,
    borderTopColor: '#4a3660',
  },
  currentUserText: {
    color: '#a855f7',
    fontSize: 12,
    fontWeight: '500',
  },
});
