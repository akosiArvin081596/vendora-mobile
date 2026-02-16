import { useMemo } from 'react';
import { useNetwork } from '../context/NetworkContext';
import { useSync } from '../context/SyncContext';

/**
 * Combines network + sync state into a single offline-readiness indicator.
 *
 * Returns:
 * - isOnline: device has internet
 * - isOfflineReady: local DB has been populated (initial sync done)
 * - syncStatus: 'idle' | 'pending' | 'syncing' | 'waiting'
 * - lastSyncedAt: ISO timestamp of last successful sync
 * - hasPendingWork: outbox has items to push
 * - statusLabel: human-readable string for UI display
 */
export default function useOfflineReady() {
  const { isOnline } = useNetwork();
  const { syncStatus, lastSyncedAt, hasPendingWork, hasDeadItems, counts } = useSync();

  const statusLabel = useMemo(() => {
    if (!isOnline && hasPendingWork) {
      return `Offline (${counts.pending} pending)`;
    }
    if (!isOnline) {
      return 'Offline';
    }
    if (syncStatus === 'syncing') {
      return 'Syncing...';
    }
    if (hasPendingWork) {
      return `${counts.pending} pending`;
    }
    if (hasDeadItems) {
      return `${counts.dead} failed`;
    }
    return 'All synced';
  }, [isOnline, syncStatus, hasPendingWork, hasDeadItems, counts]);

  return {
    isOnline,
    syncStatus,
    lastSyncedAt,
    hasPendingWork,
    hasDeadItems,
    statusLabel,
  };
}
