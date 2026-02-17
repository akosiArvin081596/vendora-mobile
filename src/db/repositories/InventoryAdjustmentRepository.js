import * as Crypto from 'expo-crypto';
import { getDatabase, nowISO, getCurrentUserId } from '../database';
import SyncQueueRepository from './SyncQueueRepository';

/**
 * Repository for inventory adjustments in local SQLite.
 * Supports offline-first stock adjustments with sync queue.
 */
const InventoryAdjustmentRepository = {
  /**
   * Create an inventory adjustment locally and enqueue sync.
   * Also updates the product's stock in SQLite.
   *
   * @param {Object} params
   * @param {number} params.productId - Server product ID
   * @param {string} params.type - 'add' | 'remove' | 'set'
   * @param {number} params.quantity - Quantity to adjust
   * @param {number} params.currentStock - Current stock before adjustment
   * @param {number|null} params.unitCost - Unit cost (for 'add' type, in whole units)
   * @param {string|null} params.note - Reason/note
   * @param {number|null} params.userId - Current user ID
   * @returns {{ localId: string, idempotencyKey: string, newStock: number }}
   */
  createAdjustment({
    productId,
    productLocalId = null,
    type,
    quantity,
    currentStock,
    unitCost = null,
    note = null,
    userId = null,
  }) {
    const db = getDatabase();
    const localId = Crypto.randomUUID();
    const now = nowISO();

    // Calculate new stock
    let newStock;
    if (type === 'set') {
      newStock = quantity;
    } else if (type === 'add') {
      newStock = currentStock + quantity;
    } else {
      // remove
      newStock = Math.max(0, currentStock - quantity);
    }

    // Convert unit cost to cents for storage
    const unitCostCents = unitCost != null ? Math.round(unitCost * 100) : 0;

    let idempotencyKey = null;

    db.withTransactionSync(() => {
      // 1. Insert adjustment record
      db.runSync(
        `INSERT INTO inventory_adjustments
          (local_id, product_id, product_local_id, user_id, type, quantity, stock_before, stock_after,
           unit_cost, note, sync_status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
        [
          localId, productId, productLocalId, userId, type, quantity,
          currentStock, newStock, unitCostCents, note, now, now,
        ]
      );

      // 2. Update product stock in SQLite — use local_id if server id is null
      if (productId) {
        db.runSync(
          'UPDATE products SET stock = ?, updated_at = ? WHERE id = ?',
          [newStock, now, productId]
        );
      } else if (productLocalId) {
        db.runSync(
          'UPDATE products SET stock = ?, updated_at = ? WHERE local_id = ?',
          [newStock, now, productLocalId]
        );
      }

      // 3. Enqueue sync only if product has a server ID
      if (productId) {
        const payload = {
          product_id: productId,
          type,
          quantity,
          note: note || undefined,
        };

        // Include unit_cost for add/set types (backend expects cents)
        if ((type === 'add' || type === 'set') && unitCost != null) {
          payload.unit_cost = unitCostCents;
        }

        idempotencyKey = SyncQueueRepository.enqueue({
          entityType: 'inventory_adjustment',
          entityLocalId: localId,
          action: 'create',
          endpoint: '/inventory/adjustments',
          method: 'POST',
          payload,
        });
      }
      // If no server ID, sync will happen after product itself syncs
    });

    return { localId, idempotencyKey, newStock };
  },

  /**
   * Get all adjustments from local DB.
   */
  getAll() {
    const db = getDatabase();
    const userId = getCurrentUserId();
    if (userId) {
      return db.getAllSync(
        'SELECT * FROM inventory_adjustments WHERE user_id = ? ORDER BY created_at DESC',
        [userId]
      );
    }
    return db.getAllSync('SELECT * FROM inventory_adjustments ORDER BY created_at DESC');
  },

  /**
   * Get adjustments for a specific product.
   */
  getByProductId(productId) {
    const db = getDatabase();
    return db.getAllSync(
      'SELECT * FROM inventory_adjustments WHERE product_id = ? ORDER BY created_at DESC',
      [productId]
    );
  },

  /**
   * Update adjustment after sync with server data.
   */
  updateAfterSync(localId, serverData) {
    const db = getDatabase();
    db.runSync(
      `UPDATE inventory_adjustments
       SET id = ?, sync_status = 'synced', server_updated_at = ?, updated_at = ?
       WHERE local_id = ?`,
      [serverData.id, serverData.updated_at || nowISO(), nowISO(), localId]
    );
  },

  /**
   * Upsert from server data (for pull sync).
   */
  upsertFromServer(adjustment) {
    const db = getDatabase();
    const existing = adjustment.id
      ? db.getFirstSync('SELECT local_id FROM inventory_adjustments WHERE id = ?', [adjustment.id])
      : null;
    const localId = existing?.local_id || Crypto.randomUUID();

    db.runSync(
      `INSERT OR REPLACE INTO inventory_adjustments
        (id, local_id, product_id, user_id, type, quantity, stock_before, stock_after,
         unit_cost, reason, note, sync_status, server_updated_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced', ?, ?, ?)`,
      [
        adjustment.id, localId, adjustment.product_id, adjustment.user_id,
        adjustment.type, adjustment.quantity,
        adjustment.stock_before ?? 0, adjustment.stock_after ?? 0,
        adjustment.unit_cost ?? 0, adjustment.reason, adjustment.note,
        adjustment.updated_at || nowISO(), adjustment.created_at || nowISO(),
        adjustment.updated_at || nowISO(),
      ]
    );

    return localId;
  },

  /**
   * Enqueue pending adjustments for a product that just received its server ID.
   * Called after a product syncs and gets assigned a server ID.
   */
  enqueuePendingForProduct(productLocalId, serverId) {
    const db = getDatabase();
    const pending = db.getAllSync(
      `SELECT * FROM inventory_adjustments
       WHERE product_local_id = ? AND product_id IS NULL AND sync_status = 'pending'
       ORDER BY created_at ASC`,
      [productLocalId]
    );

    for (const adj of pending) {
      // Update the adjustment with the server product ID
      db.runSync(
        'UPDATE inventory_adjustments SET product_id = ?, updated_at = ? WHERE local_id = ?',
        [serverId, nowISO(), adj.local_id]
      );

      // Enqueue sync
      const payload = {
        product_id: serverId,
        type: adj.type,
        quantity: adj.quantity,
        note: adj.note || undefined,
      };

      if ((adj.type === 'add' || adj.type === 'set') && adj.unit_cost) {
        payload.unit_cost = adj.unit_cost;
      }

      SyncQueueRepository.enqueue({
        entityType: 'inventory_adjustment',
        entityLocalId: adj.local_id,
        action: 'create',
        endpoint: '/inventory/adjustments',
        method: 'POST',
        payload,
      });
    }

    return pending.length;
  },

  /**
   * Clear all local adjustments.
   */
  clear() {
    const db = getDatabase();
    db.runSync('DELETE FROM inventory_adjustments');
  },
};

export default InventoryAdjustmentRepository;
