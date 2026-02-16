import OrderRepository from '../db/repositories/OrderRepository';
import PaymentRepository from '../db/repositories/PaymentRepository';
import ProductRepository from '../db/repositories/ProductRepository';

/**
 * Server-wins conflict resolution.
 * When a sync response returns server data, this module updates the local
 * SQLite records to match the server's authoritative version.
 */
const ConflictResolver = {
  /**
   * Resolve a successful order creation sync.
   * Updates local order with server-assigned ID and order_number,
   * and resolves the dependent payment's order_id placeholder.
   *
   * @param {string} localId - The order's local_id
   * @param {Object} serverData - The server response (order data)
   * @returns {number} The server order ID
   */
  resolveOrderCreated(localId, serverData) {
    const serverId = OrderRepository.updateAfterSync(localId, serverData);
    console.log(`[Conflict] Order ${localId} resolved → server ID ${serverId}`);
    return serverId;
  },

  /**
   * Resolve a successful payment creation sync.
   *
   * @param {string} localId - The payment's local_id
   * @param {Object} serverData - The server response (payment data)
   */
  resolvePaymentCreated(localId, serverData) {
    PaymentRepository.updateAfterSync(localId, serverData);
    console.log(`[Conflict] Payment ${localId} resolved → server ID ${serverData.id}`);
  },

  /**
   * Resolve a server-wins conflict for a product.
   * Overwrites local data with server version.
   *
   * @param {Object} serverProduct - Product data from server
   */
  resolveProductConflict(serverProduct) {
    ProductRepository.upsertFromServer(serverProduct);
    console.log(`[Conflict] Product ${serverProduct.id} overwritten with server data`);
  },

  /**
   * Resolve the payment payload's order_id placeholder.
   * Called by SyncService after an order sync succeeds, before the dependent
   * payment sync fires. Replaces '__PENDING__' with the real server order ID.
   *
   * @param {string} paymentIdempotencyKey - The payment's sync_queue idempotency key
   * @param {number} serverOrderId - The server-assigned order ID
   */
  resolvePaymentOrderId(paymentIdempotencyKey, serverOrderId) {
    const { getDatabase, nowISO } = require('../db/database');
    const db = getDatabase();

    const item = db.getFirstSync(
      'SELECT id, payload FROM sync_queue WHERE idempotency_key = ?',
      [paymentIdempotencyKey]
    );

    if (item) {
      const payload = JSON.parse(item.payload);
      payload.order_id = serverOrderId;

      db.runSync(
        'UPDATE sync_queue SET payload = ?, updated_at = ? WHERE id = ?',
        [JSON.stringify(payload), nowISO(), item.id]
      );

      console.log(`[Conflict] Payment queue item ${paymentIdempotencyKey} → order_id=${serverOrderId}`);
    }
  },
};

export default ConflictResolver;
