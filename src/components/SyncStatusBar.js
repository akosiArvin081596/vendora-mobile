import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSync } from '../context/SyncContext';
import { useNetwork } from '../context/NetworkContext';

/**
 * Persistent sync status bar shown at the top of screens.
 * Shows offline status, sync progress, and pending/failed counts.
 * Only visible when there's something to communicate (not when idle + online).
 */
export default function SyncStatusBar({ onPress }) {
  const { syncStatus, counts, hasPendingWork, hasDeadItems } = useSync();
  const { isOnline } = useNetwork();

  const pendingCount = counts.pending + counts.in_progress;

  // Don't show bar when everything is fine
  if (isOnline && !hasPendingWork && !hasDeadItems) {
    return null;
  }

  const getBarConfig = () => {
    if (!isOnline) {
      return {
        bg: 'bg-amber-500/90',
        icon: 'cloud-offline-outline',
        text: pendingCount > 0
          ? `Offline — ${pendingCount} pending`
          : 'You are offline',
        color: '#fff',
      };
    }

    if (hasDeadItems) {
      return {
        bg: 'bg-red-500/90',
        icon: 'alert-circle-outline',
        text: `${counts.dead} failed sync item${counts.dead > 1 ? 's' : ''}`,
        color: '#fff',
      };
    }

    if (syncStatus === 'syncing') {
      return {
        bg: 'bg-blue-500/90',
        icon: null, // use spinner
        text: `Syncing${pendingCount > 0 ? ` (${pendingCount} remaining)` : ''}...`,
        color: '#fff',
      };
    }

    if (hasPendingWork) {
      return {
        bg: 'bg-vendora-purple/90',
        icon: 'sync-outline',
        text: `${pendingCount} item${pendingCount > 1 ? 's' : ''} pending sync`,
        color: '#fff',
      };
    }

    return null;
  };

  const config = getBarConfig();
  if (!config) return null;

  return (
    <TouchableOpacity
      className={`${config.bg} px-4 py-2 flex-row items-center justify-center gap-2`}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {config.icon ? (
        <Ionicons name={config.icon} size={16} color={config.color} />
      ) : (
        <ActivityIndicator size="small" color={config.color} />
      )}
      <Text style={{ color: config.color, fontSize: 13, fontWeight: '600' }}>
        {config.text}
      </Text>
      {onPress && (
        <Ionicons name="chevron-forward" size={14} color={config.color} style={{ opacity: 0.7 }} />
      )}
    </TouchableOpacity>
  );
}
