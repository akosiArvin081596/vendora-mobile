import * as Crypto from 'expo-crypto';
import { getDatabase, nowISO, getCurrentUserId } from '../database';
import SyncQueueRepository from './SyncQueueRepository';

/**
 * Repository for orders, order_items, and payments in local SQLite.
 * Supports offline-first POS checkout with atomic transactions.
 */
const OrderRepository = {
  /**
   * Create a complete order with items and payment in a single SQLite transaction.
   * Also decrements product stock locally and enqueues sync operations.
   *
   * @param {Object} params
   * @param {Array} params.items - Cart items: [{ id, name, sku, price, quantity, cost }]
   * @param {number} params.subtotal - In whole currency units
   * @param {number} params.discount - Discount amount in whole units
   * @param {number} params.tax - Tax amount in whole units
   * @param {number} params.total - Total in whole units
   * @param {string} params.paymentMethod - 'cash' | 'card' | 'ewallet' | 'online'
   * @param {number} params.amountTendered - Cash tendered in whole units
   * @param {number|null} params.customerId - Server customer ID (nullable)
   * @param {string|null} params.customerLocalId - Local customer UUID (nullable)
   * @param {string|null} params.notes - Order notes
   * @param {number|null} params.storeId - Store ID
   * @param {number|null} params.userId - Current user ID
   * @param {string} params.orderedAt - ISO timestamp
   * @returns {{ orderLocalId: string, paymentLocalId: string, orderIdempotencyKey: string, paymentIdempotencyKey: string }}
   */
  createOrderWithItems({
    items,
    subtotal,
    discount = 0,
    tax = 0,
    total,
    paymentMethod = 'cash',
    amountTendered = 0,
    customerId = null,
    customerLocalId = null,
    notes = null,
    storeId = null,
    userId = null,
    orderedAt = null,
  }) {
    const db = getDatabase();
    const orderLocalId = Crypto.randomUUID();
    const paymentLocalId = Crypto.randomUUID();
    const now = orderedAt || nowISO();

    // Map frontend payment method to backend values
    const methodMap = { cash: 'cash', card: 'card', ewallet: 'online', online: 'online' };
    const backendMethod = methodMap[paymentMethod] || 'cash';

    // Convert whole units to cents for SQLite storage
    const subtotalCents = Math.round(subtotal * 100);
    const discountCents = Math.round(discount * 100);
    const taxCents = Math.round(tax * 100);
    const totalCents = Math.round(total * 100);
    const amountCents = Math.round(amountTendered * 100) || totalCents;

    // Build backend-format items for the sync payload
    const backendItems = items.map((item) => ({
      product_id: item.id,
      quantity: item.quantity,
    }));

    let orderIdempotencyKey = null;
    let paymentIdempotencyKey = null;

    db.withTransactionSync(() => {
      // 1. Insert order
      db.runSync(
        `INSERT INTO orders
          (local_id, user_id, customer_id, customer_local_id, store_id,
           ordered_at, status, subtotal, tax, discount, total, notes, channel,
           sync_status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, 'completed', ?, ?, ?, ?, ?, 'pos', 'pending', ?, ?)`,
        [
          orderLocalId, userId ?? getCurrentUserId(), customerId, customerLocalId, storeId,
          now, subtotalCents, taxCents, discountCents, totalCents, notes,
          now, now,
        ]
      );

      // 2. Insert order items
      for (const item of items) {
        const itemLocalId = Crypto.randomUUID();
        const unitPriceCents = Math.round((item.price || 0) * 100);
        const unitCostCents = Math.round((item.cost || 0) * 100);
        const lineTotalCents = unitPriceCents * item.quantity;

        db.runSync(
          `INSERT INTO order_items
            (local_id, order_local_id, product_id, product_name, quantity,
             unit_price, unit_cost, line_total)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            itemLocalId, orderLocalId, item.id, item.name,
            item.quantity, unitPriceCents, unitCostCents, lineTotalCents,
          ]
        );
      }

      // 3. Insert payment
      db.runSync(
        `INSERT INTO payments
          (local_id, order_local_id, amount, method, status,
           sync_status, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'completed', 'pending', ?, ?)`,
        [paymentLocalId, orderLocalId, amountCents, backendMethod, now, now]
      );

      // 4. Decrement product stock locally
      for (const item of items) {
        if (item.id) {
          db.runSync(
            `UPDATE products SET stock = MAX(stock - ?, 0), updated_at = ? WHERE id = ?`,
            [item.quantity, now, item.id]
          );
        }
      }

      // 5. Enqueue order sync (order must sync before payment)
      orderIdempotencyKey = SyncQueueRepository.enqueue({
        entityType: 'order',
        entityLocalId: orderLocalId,
        action: 'create',
        endpoint: '/orders',
        method: 'POST',
        payload: {
          customer_id: customerId,
          ordered_at: now,
          status: 'completed',
          items: backendItems,
        },
      });

      // 6. Enqueue payment sync (depends on order sync)
      paymentIdempotencyKey = SyncQueueRepository.enqueue({
        entityType: 'payment',
        entityLocalId: paymentLocalId,
        action: 'create',
        endpoint: '/payments',
        method: 'POST',
        payload: {
          order_id: '__PENDING__', // Will be resolved after order syncs
          paid_at: now,
          amount: totalCents,
          method: backendMethod,
          status: 'completed',
        },
        dependsOn: orderIdempotencyKey,
      });
    });

    return {
      orderLocalId,
      paymentLocalId,
      orderIdempotencyKey,
      paymentIdempotencyKey,
    };
  },

  /**
   * Get all orders from local DB, newest first.
   */
  getAll() {
    const db = getDatabase();
    const userId = getCurrentUserId();
    if (userId) {
      return db.getAllSync(
        'SELECT * FROM orders WHERE user_id = ? ORDER BY ordered_at DESC, created_at DESC',
        [userId]
      );
    }
    return db.getAllSync('SELECT * FROM orders ORDER BY ordered_at DESC, created_at DESC');
  },

  /**
   * Get an order by server ID.
   */
  getById(serverId) {
    const db = getDatabase();
    return db.getFirstSync('SELECT * FROM orders WHERE id = ?', [serverId]);
  },

  /**
   * Get an order by local_id.
   */
  getByLocalId(localId) {
    const db = getDatabase();
    return db.getFirstSync('SELECT * FROM orders WHERE local_id = ?', [localId]);
  },

  /**
   * Get order items for a given order local_id.
   */
  getItemsByOrderLocalId(orderLocalId) {
    const db = getDatabase();
    return db.getAllSync('SELECT * FROM order_items WHERE order_local_id = ?', [orderLocalId]);
  },

  /**
   * Get payment(s) for a given order local_id.
   */
  getPaymentsByOrderLocalId(orderLocalId) {
    const db = getDatabase();
    return db.getAllSync('SELECT * FROM payments WHERE order_local_id = ?', [orderLocalId]);
  },

  /**
   * Update order with server data after successful sync.
   * Sets the server-assigned ID and order_number.
   */
  updateAfterSync(localId, serverData) {
    const db = getDatabase();
    db.runSync(
      `UPDATE orders
       SET id = ?, order_number = ?, sync_status = 'synced', server_updated_at = ?, updated_at = ?
       WHERE local_id = ?`,
      [serverData.id, serverData.order_number, serverData.updated_at || nowISO(), nowISO(), localId]
    );

    // Also update the payment's order_id now that we have the server order ID
    db.runSync(
      `UPDATE payments SET order_id = ?, updated_at = ? WHERE order_local_id = ?`,
      [serverData.id, nowISO(), localId]
    );

    return serverData.id;
  },

  /**
   * Update payment with server data after successful sync.
   */
  updatePaymentAfterSync(localId, serverData) {
    const db = getDatabase();
    db.runSync(
      `UPDATE payments
       SET id = ?, sync_status = 'synced', server_updated_at = ?, updated_at = ?
       WHERE local_id = ?`,
      [serverData.id, serverData.updated_at || nowISO(), nowISO(), localId]
    );
  },

  /**
   * Upsert an order from server data (for pull sync).
   */
  upsertFromServer(order) {
    const db = getDatabase();
    const existing = order.id ? db.getFirstSync('SELECT local_id FROM orders WHERE id = ?', [order.id]) : null;
    const localId = existing?.local_id || Crypto.randomUUID();

    db.runSync(
      `INSERT OR REPLACE INTO orders
        (id, local_id, user_id, customer_id, store_id, order_number,
         ordered_at, status, subtotal, tax, discount, total, notes, channel,
         sync_status, server_updated_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced', ?, ?, ?)`,
      [
        order.id, localId, order.user_id, order.customer_id, order.store_id,
        order.order_number, order.ordered_at, order.status,
        order.subtotal ?? 0, order.tax ?? 0, order.discount ?? 0, order.total ?? 0,
        order.notes, order.channel ?? 'pos',
        order.updated_at || nowISO(), order.created_at || nowISO(), order.updated_at || nowISO(),
      ]
    );

    // Upsert items if present
    if (order.items?.length) {
      for (const item of order.items) {
        const itemLocalId = Crypto.randomUUID();
        db.runSync(
          `INSERT OR REPLACE INTO order_items
            (local_id, order_local_id, product_id, product_name, quantity,
             unit_price, unit_cost, line_total)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            itemLocalId, localId, item.product_id,
            item.product?.name || item.product_name || 'Unknown',
            item.quantity, item.price ?? 0, item.cost ?? 0,
            (item.price ?? 0) * item.quantity,
          ]
        );
      }
    }

    // Upsert payments if present
    if (order.payments?.length) {
      for (const payment of order.payments) {
        const payLocalId = Crypto.randomUUID();
        db.runSync(
          `INSERT OR REPLACE INTO payments
            (id, local_id, order_id, order_local_id, amount, method, status,
             sync_status, server_updated_at, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'synced', ?, ?, ?)`,
          [
            payment.id, payLocalId, payment.order_id, localId,
            payment.amount ?? 0, payment.method ?? 'cash', payment.status ?? 'completed',
            payment.updated_at || nowISO(), payment.created_at || nowISO(), payment.updated_at || nowISO(),
          ]
        );
      }
    }

    return localId;
  },

  /**
   * Bulk upsert orders from server.
   */
  bulkUpsertFromServer(orders) {
    const db = getDatabase();
    db.withTransactionSync(() => {
      for (const order of orders) {
        OrderRepository.upsertFromServer(order);
      }
    });
  },

  /**
   * Clear all local orders, items, and payments (for full re-sync).
   */
  clear() {
    const db = getDatabase();
    db.withTransactionSync(() => {
      db.runSync('DELETE FROM order_items');
      db.runSync('DELETE FROM payments');
      db.runSync('DELETE FROM orders');
    });
  },
};

export default OrderRepository;
