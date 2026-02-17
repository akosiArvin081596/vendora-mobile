import api from '../services/api';
import ProductRepository from '../db/repositories/ProductRepository';
import CategoryRepository from '../db/repositories/CategoryRepository';
import CustomerRepository from '../db/repositories/CustomerRepository';
import OrderRepository from '../db/repositories/OrderRepository';
import InventoryAdjustmentRepository from '../db/repositories/InventoryAdjustmentRepository';
import LedgerRepository from '../db/repositories/LedgerRepository';
import AdminUserRepository from '../db/repositories/AdminUserRepository';
import { getDatabase } from '../db/database';

/**
 * Orchestrates pull-sync from server to local SQLite.
 * Uses updated_since for incremental sync and tracks last sync timestamps.
 */
const SyncManager = {
  /**
   * Full initial sync after login — pulls all data.
   */
  async initialSync() {
    console.log('[SyncManager] Starting initial sync...');
    const results = await Promise.allSettled([
      this.syncProducts({ full: true }),
      this.syncCategories({ full: true }),
      this.syncCustomers({ full: true }),
      this.syncOrders({ full: true }),
      this.syncLedger({ full: true }),
      this.syncAdminUsers({ full: true }),
    ]);

    const failed = results.filter((r) => r.status === 'rejected');
    if (failed.length > 0) {
      failed.forEach((r) => console.warn('[SyncManager] Sync failed:', r.reason?.message));
    }
    console.log(`[SyncManager] Initial sync complete. ${results.length - failed.length}/${results.length} succeeded.`);
  },

  /**
   * Incremental sync — only fetches records updated since last sync.
   */
  async incrementalSync() {
    console.log('[SyncManager] Starting incremental sync...');
    const results = await Promise.allSettled([
      this.syncProducts(),
      this.syncCategories(),
      this.syncCustomers(),
      this.syncOrders(),
      this.syncLedger(),
      this.syncAdminUsers(),
    ]);

    const failed = results.filter((r) => r.status === 'rejected');
    if (failed.length > 0) {
      failed.forEach((r) => console.warn('[SyncManager] Sync failed:', r.reason?.message));
    }
    console.log(`[SyncManager] Incremental sync complete. ${results.length - failed.length}/${results.length} succeeded.`);
  },

  /**
   * Sync products from GET /products/my.
   * Fetches all pages and upserts into SQLite.
   */
  async syncProducts(options = {}) {
    const { full = false } = options;
    const lastTimestamp = full ? null : this._getLastSyncTimestamp('products');

    try {
      let page = 1;
      let hasMore = true;
      let totalSynced = 0;

      while (hasMore) {
        const params = { per_page: 100, page };
        if (lastTimestamp) {
          params.updated_since = lastTimestamp;
          params.include_deleted = true;
        }

        const response = await api.get('/products/my', { params });
        const products = response.data || [];

        if (products.length > 0) {
          // Store raw API data into SQLite
          ProductRepository.bulkUpsertFromServer(products);
          totalSynced += products.length;
        }

        // Check pagination
        const meta = response.meta;
        if (meta && page < meta.last_page) {
          page++;
        } else {
          hasMore = false;
        }
      }

      this._setLastSyncTimestamp('products', new Date().toISOString());
      if (full) {
        this._markFullSyncCompleted('products');
      }

      console.log(`[SyncManager] Products synced: ${totalSynced} records.`);
      return totalSynced;
    } catch (error) {
      console.error('[SyncManager] Products sync error:', error.message);
      throw error;
    }
  },

  /**
   * Sync categories from GET /categories.
   * Categories are not paginated — single request.
   */
  async syncCategories(options = {}) {
    const { full = false } = options;
    const lastTimestamp = full ? null : this._getLastSyncTimestamp('categories');

    try {
      const params = {};
      if (lastTimestamp) {
        params.updated_since = lastTimestamp;
      }

      const response = await api.get('/categories', { params });
      const categories = response.data || [];

      if (categories.length > 0) {
        CategoryRepository.bulkUpsertFromServer(categories);
      }

      this._setLastSyncTimestamp('categories', new Date().toISOString());
      if (full) {
        this._markFullSyncCompleted('categories');
      }

      console.log(`[SyncManager] Categories synced: ${categories.length} records.`);
      return categories.length;
    } catch (error) {
      console.error('[SyncManager] Categories sync error:', error.message);
      throw error;
    }
  },

  /**
   * Sync customers from GET /customers.
   */
  async syncCustomers(options = {}) {
    const { full = false } = options;
    const lastTimestamp = full ? null : this._getLastSyncTimestamp('customers');

    try {
      let page = 1;
      let hasMore = true;
      let totalSynced = 0;

      while (hasMore) {
        const params = { per_page: 100, page };
        if (lastTimestamp) {
          params.updated_since = lastTimestamp;
        }

        const response = await api.get('/customers', { params });
        const customers = response.data || [];

        if (customers.length > 0) {
          CustomerRepository.bulkUpsertFromServer(customers);
          totalSynced += customers.length;
        }

        const meta = response.meta;
        if (meta && page < meta.last_page) {
          page++;
        } else {
          hasMore = false;
        }
      }

      this._setLastSyncTimestamp('customers', new Date().toISOString());
      if (full) {
        this._markFullSyncCompleted('customers');
      }

      console.log(`[SyncManager] Customers synced: ${totalSynced} records.`);
      return totalSynced;
    } catch (error) {
      console.error('[SyncManager] Customers sync error:', error.message);
      throw error;
    }
  },

  /**
   * Sync orders from GET /orders.
   */
  async syncOrders(options = {}) {
    const { full = false } = options;
    const lastTimestamp = full ? null : this._getLastSyncTimestamp('orders');

    try {
      let page = 1;
      let hasMore = true;
      let totalSynced = 0;

      while (hasMore) {
        const params = { per_page: 100, page };
        if (lastTimestamp) {
          params.updated_since = lastTimestamp;
        }

        const response = await api.get('/orders', { params });
        const orders = response.data || [];

        if (orders.length > 0) {
          OrderRepository.bulkUpsertFromServer(orders);
          totalSynced += orders.length;
        }

        const meta = response.meta;
        if (meta && page < meta.last_page) {
          page++;
        } else {
          hasMore = false;
        }
      }

      this._setLastSyncTimestamp('orders', new Date().toISOString());
      if (full) {
        this._markFullSyncCompleted('orders');
      }

      console.log(`[SyncManager] Orders synced: ${totalSynced} records.`);
      return totalSynced;
    } catch (error) {
      console.error('[SyncManager] Orders sync error:', error.message);
      throw error;
    }
  },

  /**
   * Sync ledger entries from GET /ledger.
   */
  async syncLedger(options = {}) {
    const { full = false } = options;
    const lastTimestamp = full ? null : this._getLastSyncTimestamp('ledger');

    try {
      let page = 1;
      let hasMore = true;
      let totalSynced = 0;

      while (hasMore) {
        const params = { per_page: 100, page };
        if (lastTimestamp) {
          params.updated_since = lastTimestamp;
        }

        const response = await api.get('/ledger', { params });
        const entries = response.data || [];

        if (entries.length > 0) {
          LedgerRepository.bulkUpsertFromServer(entries);
          totalSynced += entries.length;
        }

        const meta = response.meta;
        if (meta && page < meta.last_page) {
          page++;
        } else {
          hasMore = false;
        }
      }

      this._setLastSyncTimestamp('ledger', new Date().toISOString());
      if (full) {
        this._markFullSyncCompleted('ledger');
      }

      console.log(`[SyncManager] Ledger synced: ${totalSynced} records.`);
      return totalSynced;
    } catch (error) {
      console.error('[SyncManager] Ledger sync error:', error.message);
      throw error;
    }
  },

  /**
   * Sync admin users from GET /admin/users.
   */
  async syncAdminUsers(options = {}) {
    const { full = false } = options;
    const lastTimestamp = full ? null : this._getLastSyncTimestamp('admin_users');

    try {
      let page = 1;
      let hasMore = true;
      let totalSynced = 0;

      while (hasMore) {
        const params = { per_page: 100, page };
        if (lastTimestamp) {
          params.updated_since = lastTimestamp;
        }

        const response = await api.get('/admin/users', { params });
        const users = response.data || [];

        if (users.length > 0) {
          AdminUserRepository.bulkUpsertFromServer(users);
          totalSynced += users.length;
        }

        const meta = response.meta;
        if (meta && page < meta.last_page) {
          page++;
        } else {
          hasMore = false;
        }
      }

      this._setLastSyncTimestamp('admin_users', new Date().toISOString());
      if (full) {
        this._markFullSyncCompleted('admin_users');
      }

      console.log(`[SyncManager] Admin users synced: ${totalSynced} records.`);
      return totalSynced;
    } catch (error) {
      console.error('[SyncManager] Admin users sync error:', error.message);
      throw error;
    }
  },

  /**
   * Check if initial sync has been completed for all entity types.
   */
  isInitialSyncComplete() {
    const db = getDatabase();
    const result = db.getFirstSync(
      `SELECT COUNT(*) as count FROM sync_meta WHERE full_sync_completed = 1`
    );
    return (result?.count ?? 0) >= 6; // products, categories, customers, orders, ledger, admin_users
  },

  // --- Internal helpers ---

  _getLastSyncTimestamp(entityType) {
    const db = getDatabase();
    const row = db.getFirstSync(
      'SELECT last_server_timestamp FROM sync_meta WHERE entity_type = ?',
      [entityType]
    );
    return row?.last_server_timestamp ?? null;
  },

  _setLastSyncTimestamp(entityType, timestamp) {
    const db = getDatabase();
    db.runSync(
      `INSERT OR REPLACE INTO sync_meta (entity_type, last_synced_at, last_server_timestamp, full_sync_completed)
       VALUES (?, ?, ?,
         COALESCE((SELECT full_sync_completed FROM sync_meta WHERE entity_type = ?), 0))`,
      [entityType, timestamp, timestamp, entityType]
    );
  },

  _markFullSyncCompleted(entityType) {
    const db = getDatabase();
    db.runSync(
      'UPDATE sync_meta SET full_sync_completed = 1 WHERE entity_type = ?',
      [entityType]
    );
  },

  /**
   * Clear all sync metadata (for logout / full reset).
   */
  clearSyncMeta() {
    const db = getDatabase();
    db.runSync('DELETE FROM sync_meta');
  },

  /**
   * Clear all local data (for logout).
   */
  clearAllLocalData() {
    ProductRepository.clear();
    CategoryRepository.clear();
    CustomerRepository.clear();
    OrderRepository.clear();
    InventoryAdjustmentRepository.clear();
    LedgerRepository.clear();
    AdminUserRepository.clear();
    this.clearSyncMeta();
    console.log('[SyncManager] All local data cleared.');
  },
};

export default SyncManager;
