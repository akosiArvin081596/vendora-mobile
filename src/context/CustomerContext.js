import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import CustomerRepository from '../db/repositories/CustomerRepository';
import SyncQueueRepository from '../db/repositories/SyncQueueRepository';
import SyncManager from '../sync/SyncManager';
import SyncService from '../sync/SyncService';

const CustomerContext = createContext();

// Loyalty tiers configuration
export const LOYALTY_TIERS = {
  bronze: { name: 'Bronze', minPoints: 0, pointsMultiplier: 1, color: '#cd7f32' },
  silver: { name: 'Silver', minPoints: 100, pointsMultiplier: 1.25, color: '#c0c0c0' },
  gold: { name: 'Gold', minPoints: 200, pointsMultiplier: 1.5, color: '#ffd700' },
  platinum: { name: 'Platinum', minPoints: 400, pointsMultiplier: 2, color: '#e5e4e2' },
};

// Points earned per peso spent
const POINTS_PER_PESO = 0.01; // 1 point per 100 pesos

/**
 * Normalize a SQLite customer row.
 */
const normalizeLocalCustomer = (row) => {
  if (!row) return null;
  return {
    ...row,
    loyaltyPoints: row.loyaltyPoints ?? 0,
    totalSpent: row.total_spent ?? row.totalSpent ?? 0,
    orderCount: row.orders_count ?? row.orderCount ?? 0,
    memberSince: row.created_at ? new Date(row.created_at) : new Date(),
    tier: 'bronze',
  };
};

export function CustomerProvider({ children }) {
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState(null);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const customersLoaded = useRef(false);

  /**
   * Load customers from SQLite as immediate data.
   */
  const loadCustomersFromLocal = useCallback(() => {
    try {
      const rows = CustomerRepository.getAll();
      if (rows.length > 0) {
        const normalized = rows.map(normalizeLocalCustomer);
        setCustomers(normalized);
        customersLoaded.current = true;
        return normalized;
      }
    } catch (err) {
      console.warn('[CustomerContext] Error loading local customers:', err.message);
    }
    return [];
  }, []);

  /**
   * Fetch customers — offline-first (SQLite + background pull-sync).
   */
  const fetchCustomers = useCallback(async (forceRefresh = false) => {
    if (customersLoaded.current && !forceRefresh) {
      return customers;
    }

    // Step 1: Load from SQLite
    const localData = loadCustomersFromLocal();
    if (localData.length > 0 && !forceRefresh) {
      _backgroundRefreshCustomers();
      return localData;
    }

    // Step 2: No local data — do a synchronous pull-sync
    try {
      setIsLoading(true);
      await SyncManager.syncCustomers({ full: true });

      // Reload from SQLite
      const rows = CustomerRepository.getAll();
      const normalized = rows.map(normalizeLocalCustomer);
      setCustomers(normalized);
      customersLoaded.current = true;
      return normalized;
    } catch (err) {
      // Silent — offline-first: local data is already displayed
      console.warn('[CustomerContext] Customers sync skipped (offline):', err.message);
      if (!customersLoaded.current) {
        loadCustomersFromLocal();
      }
      return localData.length > 0 ? localData : customers;
    } finally {
      setIsLoading(false);
    }
  }, [customers, loadCustomersFromLocal]);

  /**
   * Background refresh customers via SyncManager pull-sync.
   */
  const _backgroundRefreshCustomers = useCallback(async () => {
    try {
      await SyncManager.syncCustomers();

      // Reload from SQLite after sync
      const rows = CustomerRepository.getAll();
      if (rows.length > 0) {
        const normalized = rows.map(normalizeLocalCustomer);
        setCustomers(normalized);
        customersLoaded.current = true;
      }
    } catch (err) {
      console.warn('[CustomerContext] Background refresh failed:', err.message);
    }
  }, []);

  // Get customer by ID
  const getCustomerById = useCallback((id) => {
    return customers.find((c) => c.id === id);
  }, [customers]);

  // Search customers (in-memory first, fall back to SQLite)
  const searchCustomers = useCallback((query) => {
    if (!query) return customers;
    const searchLower = query.toLowerCase();
    const memoryResults = customers.filter(
      (c) =>
        c.name?.toLowerCase().includes(searchLower) ||
        c.phone?.includes(query) ||
        (c.email && c.email.toLowerCase().includes(searchLower))
    );

    if (memoryResults.length > 0) {
      return memoryResults;
    }

    // Try SQLite for deeper search
    try {
      const dbResults = CustomerRepository.search(query);
      return dbResults.map(normalizeLocalCustomer);
    } catch (err) {
      return [];
    }
  }, [customers]);

  /**
   * Add new customer — offline-first.
   * Writes to SQLite, enqueues sync, returns immediately.
   */
  const addCustomer = useCallback((customerData) => {
    // 1. Write to SQLite
    let localId;
    try {
      localId = CustomerRepository.createLocal({
        name: customerData.name,
        email: customerData.email,
        phone: customerData.phone,
        address: customerData.address,
        notes: customerData.notes,
      });
    } catch (err) {
      console.error('[CustomerContext] SQLite customer create failed:', err);
      throw err;
    }

    // 2. Enqueue sync
    try {
      SyncQueueRepository.enqueue({
        entityType: 'customer',
        entityLocalId: localId,
        action: 'create',
        endpoint: '/customers',
        method: 'POST',
        payload: customerData,
      });
    } catch (err) {
      console.warn('[CustomerContext] Sync enqueue failed:', err.message);
    }

    // 3. Add to React state immediately
    const newCustomer = normalizeLocalCustomer({
      local_id: localId,
      ...customerData,
      sync_status: 'pending',
      created_at: new Date().toISOString(),
    });

    setCustomers((prev) => [...prev, newCustomer]);

    // 4. Trigger sync
    SyncService.processQueue().catch(() => {});

    return newCustomer;
  }, []);

  /**
   * Update customer — offline-first.
   * Writes to SQLite, enqueues sync, returns immediately.
   */
  const updateCustomer = useCallback((customerId, updates) => {
    // 1. Update SQLite
    try {
      CustomerRepository.updateLocal(customerId, updates);
    } catch (err) {
      console.error('[CustomerContext] SQLite customer update failed:', err);
      throw err;
    }

    // 2. Enqueue sync
    try {
      const customer = CustomerRepository.getById(customerId);
      SyncQueueRepository.enqueue({
        entityType: 'customer',
        entityLocalId: customer?.local_id || `server-${customerId}`,
        action: 'update',
        endpoint: `/customers/${customerId}`,
        method: 'PUT',
        payload: updates,
      });
    } catch (err) {
      console.warn('[CustomerContext] Sync enqueue failed:', err.message);
    }

    // 3. Update React state immediately
    setCustomers((prev) =>
      prev.map((c) => (c.id === customerId ? { ...c, ...updates, syncStatus: 'pending' } : c))
    );

    // 4. Trigger sync
    SyncService.processQueue().catch(() => {});

    return { id: customerId, ...updates };
  }, []);

  // Calculate tier based on points
  const calculateTier = (points) => {
    if (points >= LOYALTY_TIERS.platinum.minPoints) return 'platinum';
    if (points >= LOYALTY_TIERS.gold.minPoints) return 'gold';
    if (points >= LOYALTY_TIERS.silver.minPoints) return 'silver';
    return 'bronze';
  };

  // Add loyalty points after purchase (local-only for now)
  const addLoyaltyPoints = useCallback((customerId, purchaseAmount) => {
    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === customerId) {
          const tierConfig = LOYALTY_TIERS[c.tier || 'bronze'];
          const basePoints = Math.floor(purchaseAmount * POINTS_PER_PESO);
          const earnedPoints = Math.floor(basePoints * tierConfig.pointsMultiplier);
          const newPoints = (c.loyaltyPoints || 0) + earnedPoints;
          const newTier = calculateTier(newPoints);
          return {
            ...c,
            loyaltyPoints: newPoints,
            totalSpent: (c.totalSpent || 0) + purchaseAmount,
            orderCount: (c.orderCount || 0) + 1,
            tier: newTier,
          };
        }
        return c;
      })
    );
  }, []);

  // Redeem loyalty points (local-only for now)
  const redeemPoints = useCallback((customerId, points) => {
    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === customerId && (c.loyaltyPoints || 0) >= points) {
          const newPoints = c.loyaltyPoints - points;
          return {
            ...c,
            loyaltyPoints: newPoints,
            tier: calculateTier(newPoints),
          };
        }
        return c;
      })
    );
  }, []);

  // Convert points to peso discount (10 points = 1 peso)
  const pointsToPeso = (points) => points / 10;
  const pesoToPoints = (peso) => peso * 10;

  // Select current customer for transaction
  const selectCustomer = useCallback((customer) => {
    setCurrentCustomer(customer);
  }, []);

  // Clear current customer
  const clearCurrentCustomer = useCallback(() => {
    setCurrentCustomer(null);
  }, []);

  // Track recently viewed products
  const addRecentlyViewed = useCallback((productId) => {
    setRecentlyViewed((prev) => {
      const filtered = prev.filter((id) => id !== productId);
      return [productId, ...filtered].slice(0, 10); // Keep last 10
    });
  }, []);

  // Clear recently viewed
  const clearRecentlyViewed = useCallback(() => {
    setRecentlyViewed([]);
  }, []);

  const value = {
    customers,
    isLoading,
    currentCustomer,
    recentlyViewed,
    getCustomerById,
    searchCustomers,
    addCustomer,
    updateCustomer,
    fetchCustomers,
    addLoyaltyPoints,
    redeemPoints,
    pointsToPeso,
    pesoToPoints,
    selectCustomer,
    clearCurrentCustomer,
    addRecentlyViewed,
    clearRecentlyViewed,
    LOYALTY_TIERS,
  };

  return (
    <CustomerContext.Provider value={value}>
      {children}
    </CustomerContext.Provider>
  );
}

export function useCustomers() {
  const context = useContext(CustomerContext);
  if (!context) {
    throw new Error('useCustomers must be used within a CustomerProvider');
  }
  return context;
}

export default CustomerContext;
