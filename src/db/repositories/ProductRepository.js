import * as Crypto from 'expo-crypto';
import { getDatabase, nowISO } from '../database';

/**
 * Repository for products in local SQLite.
 * Handles caching server data and offline lookups.
 */
const ProductRepository = {
  /**
   * Get all products from local DB.
   */
  getAll() {
    const db = getDatabase();
    return db.getAllSync('SELECT * FROM products WHERE sync_status != ? ORDER BY name', ['deleted']);
  },

  /**
   * Get a product by server ID.
   */
  getById(serverId) {
    const db = getDatabase();
    return db.getFirstSync('SELECT * FROM products WHERE id = ?', [serverId]);
  },

  /**
   * Get a product by local_id.
   */
  getByLocalId(localId) {
    const db = getDatabase();
    return db.getFirstSync('SELECT * FROM products WHERE local_id = ?', [localId]);
  },

  /**
   * Get a product by barcode (POS scanner lookup).
   */
  getByBarcode(barcode) {
    const db = getDatabase();
    return db.getFirstSync(
      'SELECT * FROM products WHERE barcode = ? AND sync_status != ?',
      [barcode, 'deleted']
    );
  },

  /**
   * Get a product by SKU.
   */
  getBySku(sku) {
    const db = getDatabase();
    return db.getFirstSync(
      'SELECT * FROM products WHERE UPPER(sku) = UPPER(?) AND sync_status != ?',
      [sku, 'deleted']
    );
  },

  /**
   * Upsert a product from server data. Server-wins: always overwrite local.
   * @param {Object} product - Product data from API (already normalized by context).
   */
  upsertFromServer(product) {
    const db = getDatabase();
    const existing = product.id ? db.getFirstSync('SELECT local_id FROM products WHERE id = ?', [product.id]) : null;
    const localId = existing?.local_id || product.local_id || require('expo-crypto').randomUUID();

    db.runSync(
      `INSERT OR REPLACE INTO products
        (id, local_id, user_id, category_id, name, sku, barcode, price, cost, stock,
         low_stock_threshold, reorder_point, image, description, is_active, is_ecommerce,
         sync_status, server_updated_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced', ?, ?, ?)`,
      [
        product.id,
        localId,
        product.user_id ?? null,
        product.category_id ?? (typeof product.category === 'object' ? product.category?.id : null),
        product.name,
        product.sku ?? null,
        product.barcode ?? null,
        product.price ?? 0,
        product.cost ?? 0,
        product.stock ?? 0,
        product.low_stock_threshold ?? product.lowStockThreshold ?? 10,
        product.reorder_point ?? product.reorderPoint ?? 5,
        product.image ?? null,
        product.description ?? null,
        product.is_active !== undefined ? (product.is_active ? 1 : 0) : 1,
        product.is_ecommerce !== undefined ? (product.is_ecommerce ? 1 : 0) : 0,
        product.updated_at ?? nowISO(),
        product.created_at ?? nowISO(),
        product.updated_at ?? nowISO(),
      ]
    );

    return localId;
  },

  /**
   * Bulk upsert products from server (for initial/incremental sync).
   */
  bulkUpsertFromServer(products) {
    const db = getDatabase();
    db.withTransactionSync(() => {
      for (const product of products) {
        this.upsertFromServer(product);
      }
    });
  },

  /**
   * Create a product locally (offline-first, before sync).
   * @param {Object} product - Product data from frontend form
   * @returns {string} The local_id
   */
  createLocal(product) {
    const db = getDatabase();
    const localId = Crypto.randomUUID();
    const now = nowISO();

    db.runSync(
      `INSERT INTO products
        (local_id, user_id, category_id, name, sku, barcode, price, cost, stock,
         low_stock_threshold, reorder_point, image, description, is_active, is_ecommerce,
         sync_status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
      [
        localId,
        product.user_id ?? null,
        product.category_id ?? null,
        product.name,
        product.sku ?? null,
        product.barcode ?? null,
        product.price ?? 0,
        product.cost ?? 0,
        product.stock ?? 0,
        product.low_stock_threshold ?? 10,
        product.reorder_point ?? 5,
        product.image ?? null,
        product.description ?? null,
        product.is_active !== undefined ? (product.is_active ? 1 : 0) : 1,
        product.is_ecommerce !== undefined ? (product.is_ecommerce ? 1 : 0) : 0,
        now, now,
      ]
    );

    return localId;
  },

  /**
   * Update a product locally (offline-first, before sync).
   * Only updates the specified fields.
   */
  updateLocal(serverId, updates) {
    const db = getDatabase();
    const now = nowISO();
    const sets = ['updated_at = ?', "sync_status = 'pending'"];
    const values = [now];

    const fieldMap = {
      name: 'name', sku: 'sku', barcode: 'barcode',
      price: 'price', cost: 'cost', stock: 'stock',
      category_id: 'category_id', description: 'description',
      image: 'image', is_active: 'is_active', is_ecommerce: 'is_ecommerce',
      low_stock_threshold: 'low_stock_threshold', reorder_point: 'reorder_point',
    };

    for (const [key, col] of Object.entries(fieldMap)) {
      if (updates[key] !== undefined) {
        sets.push(`${col} = ?`);
        if (key === 'is_active' || key === 'is_ecommerce') {
          values.push(updates[key] ? 1 : 0);
        } else {
          values.push(updates[key]);
        }
      }
    }

    values.push(serverId);
    db.runSync(`UPDATE products SET ${sets.join(', ')} WHERE id = ?`, values);
  },

  /**
   * Update product after successful sync with server data.
   */
  updateAfterSync(localId, serverData) {
    const db = getDatabase();
    db.runSync(
      `UPDATE products
       SET id = ?, sync_status = 'synced', server_updated_at = ?, updated_at = ?
       WHERE local_id = ?`,
      [serverData.id, serverData.updated_at || nowISO(), nowISO(), localId]
    );
  },

  /**
   * Mark a product as deleted (for soft-deleted server records).
   */
  markDeleted(serverId) {
    const db = getDatabase();
    db.runSync(
      `UPDATE products SET sync_status = 'deleted', updated_at = ? WHERE id = ?`,
      [nowISO(), serverId]
    );
  },

  /**
   * Update stock locally (for offline POS).
   */
  updateStock(serverId, newStock) {
    const db = getDatabase();
    db.runSync('UPDATE products SET stock = ?, updated_at = ? WHERE id = ?', [newStock, nowISO(), serverId]);
  },

  /**
   * Get count of local products.
   */
  getCount() {
    const db = getDatabase();
    const row = db.getFirstSync('SELECT COUNT(*) as count FROM products WHERE sync_status != ?', ['deleted']);
    return row?.count ?? 0;
  },

  /**
   * Clear all local products (for full re-sync).
   */
  clear() {
    const db = getDatabase();
    db.runSync('DELETE FROM products');
  },
};

export default ProductRepository;
