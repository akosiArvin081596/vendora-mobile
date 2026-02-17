import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import LedgerRepository from '../db/repositories/LedgerRepository';
import SyncQueueRepository from '../db/repositories/SyncQueueRepository';
import SyncManager from '../sync/SyncManager';
import SyncService from '../sync/SyncService';

const LedgerContext = createContext();

/**
 * Normalize a SQLite ledger row for UI consumption.
 */
const normalizeLocalEntry = (row) => {
  if (!row) return null;
  return {
    ...row,
    quantity: row.quantity ?? 0,
    amount: row.amount ?? 0,
  };
};

export function LedgerProvider({ children }) {
  const [entries, setEntries] = useState([]);
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const entriesLoaded = useRef(false);

  /**
   * Load entries from SQLite with optional filters.
   */
  const fetchEntries = useCallback(async (filters = {}, forceRefresh = false) => {
    // Step 1: Load from SQLite
    try {
      const rows = LedgerRepository.getAll(filters);
      const normalized = rows.map(normalizeLocalEntry);
      setEntries(normalized);
      entriesLoaded.current = true;

      // Compute summary from local data
      const localSummary = LedgerRepository.getSummary();
      setSummary(localSummary);
    } catch (err) {
      console.warn('[LedgerContext] Error loading local entries:', err.message);
    }

    // Step 2: Background pull-sync for fresh data
    if (forceRefresh || !entriesLoaded.current) {
      _backgroundRefresh(filters);
    }

    return entries;
  }, [entries]);

  /**
   * Background refresh via SyncManager pull-sync.
   */
  const _backgroundRefresh = useCallback(async (filters = {}) => {
    try {
      await SyncManager.syncLedger();

      // Reload from SQLite after sync
      const rows = LedgerRepository.getAll(filters);
      const normalized = rows.map(normalizeLocalEntry);
      setEntries(normalized);

      const localSummary = LedgerRepository.getSummary();
      setSummary(localSummary);
    } catch (err) {
      console.warn('[LedgerContext] Background refresh failed:', err.message);
    }
  }, []);

  /**
   * Get summary from local SQLite data.
   */
  const fetchSummary = useCallback(() => {
    try {
      const localSummary = LedgerRepository.getSummary();
      setSummary(localSummary);
      return localSummary;
    } catch (err) {
      console.warn('[LedgerContext] Error computing summary:', err.message);
      return summary;
    }
  }, [summary]);

  /**
   * Add a new ledger entry — offline-first.
   * Write to SQLite, enqueue sync, update state immediately.
   */
  const addEntry = useCallback((entryData) => {
    // 1. Write to SQLite
    let localId;
    try {
      localId = LedgerRepository.createLocal({
        type: entryData.type,
        category: entryData.category,
        description: entryData.description,
        quantity: entryData.quantity,
        amount: entryData.amount,
        product: entryData.product,
        product_id: entryData.product_id,
        reference: entryData.reference,
      });
    } catch (err) {
      console.error('[LedgerContext] SQLite entry create failed:', err);
      throw err;
    }

    // 2. Enqueue sync
    try {
      SyncQueueRepository.enqueue({
        entityType: 'ledger_entry',
        entityLocalId: localId,
        action: 'create',
        endpoint: '/ledger',
        method: 'POST',
        payload: entryData,
      });
    } catch (err) {
      console.warn('[LedgerContext] Sync enqueue failed:', err.message);
    }

    // 3. Add to React state immediately
    const newEntry = normalizeLocalEntry({
      local_id: localId,
      ...entryData,
      sync_status: 'pending',
      created_at: new Date().toISOString(),
    });

    setEntries((prev) => [newEntry, ...prev]);

    // 4. Update summary
    const localSummary = LedgerRepository.getSummary();
    setSummary(localSummary);

    // 5. Trigger sync
    SyncService.processQueue().catch(() => {});

    return newEntry;
  }, []);

  const value = {
    entries,
    summary,
    isLoading,
    fetchEntries,
    fetchSummary,
    addEntry,
  };

  return (
    <LedgerContext.Provider value={value}>
      {children}
    </LedgerContext.Provider>
  );
}

export function useLedger() {
  const context = useContext(LedgerContext);
  if (!context) {
    throw new Error('useLedger must be used within a LedgerProvider');
  }
  return context;
}

export default LedgerContext;
