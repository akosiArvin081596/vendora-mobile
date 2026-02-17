import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { AppState } from 'react-native';
import SyncService from '../sync/SyncService';
import SyncQueueRepository from '../db/repositories/SyncQueueRepository';
import { useNetwork } from './NetworkContext';

const SyncContext = createContext();

/**
 * Sync status values:
 * - 'idle'     — no pending work
 * - 'pending'  — items queued, waiting for processing
 * - 'syncing'  — actively sending to server
 * - 'waiting'  — has items but can't process yet (dependencies, backoff, offline)
 */
export function SyncProvider({ children }) {
  const { isOnline, onReconnect } = useNetwork();
  const [syncStatus, setSyncStatus] = useState('idle');
  const [counts, setCounts] = useState({ pending: 0, in_progress: 0, completed: 0, dead: 0 });
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const appState = useRef(AppState.currentState);

  const refreshCounts = useCallback(() => {
    const newCounts = SyncQueueRepository.getCounts();
    setCounts(newCounts);
    return newCounts;
  }, []);

  const processQueue = useCallback(async () => {
    if (!isOnline) {
      setSyncStatus('waiting');
      return;
    }

    const synced = await SyncService.processQueue();
    if (synced > 0) {
      setLastSyncedAt(new Date().toISOString());
    }
    refreshCounts();
  }, [isOnline, refreshCounts]);

  // Register status change listener
  useEffect(() => {
    SyncService.onStatusChange((status) => {
      setSyncStatus(status);
      refreshCounts();
    });
  }, [refreshCounts]);

  // Process queue on reconnect
  useEffect(() => {
    const unsubscribe = onReconnect(() => {
      processQueue();
    });
    return unsubscribe;
  }, [onReconnect, processQueue]);

  // Process queue when app comes to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (appState.current.match(/inactive|background/) && nextState === 'active') {
        processQueue();
      }
      appState.current = nextState;
    });

    return () => subscription.remove();
  }, [processQueue]);

  // Periodic retry timer — processes queue every 30s when there's pending work
  useEffect(() => {
    const interval = setInterval(() => {
      if (isOnline && SyncQueueRepository.hasPendingWork()) {
        processQueue();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [isOnline, processQueue]);

  // Initial count refresh
  useEffect(() => {
    refreshCounts();
  }, [refreshCounts]);

  const value = {
    syncStatus,
    counts,
    lastSyncedAt,
    processQueue,
    refreshCounts,
    hasPendingWork: counts.pending > 0 || counts.in_progress > 0,
    hasDeadItems: counts.dead > 0,
  };

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

export function useSync() {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSync must be used within a SyncProvider');
  }
  return context;
}
