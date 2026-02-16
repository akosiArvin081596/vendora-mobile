import * as Crypto from 'expo-crypto';
import { getDatabase, nowISO } from '../database';

/**
 * Repository for payments in local SQLite.
 */
const PaymentRepository = {
  /**
   * Get all payments for a given order local_id.
   */
  getByOrderLocalId(orderLocalId) {
    const db = getDatabase();
    return db.getAllSync('SELECT * FROM payments WHERE order_local_id = ?', [orderLocalId]);
  },

  /**
   * Get a payment by server ID.
   */
  getById(serverId) {
    const db = getDatabase();
    return db.getFirstSync('SELECT * FROM payments WHERE id = ?', [serverId]);
  },

  /**
   * Get a payment by local_id.
   */
  getByLocalId(localId) {
    const db = getDatabase();
    return db.getFirstSync('SELECT * FROM payments WHERE local_id = ?', [localId]);
  },

  /**
   * Update payment after sync with server data.
   */
  updateAfterSync(localId, serverData) {
    const db = getDatabase();
    db.runSync(
      `UPDATE payments
       SET id = ?, order_id = ?, sync_status = 'synced', server_updated_at = ?, updated_at = ?
       WHERE local_id = ?`,
      [serverData.id, serverData.order_id, serverData.updated_at || nowISO(), nowISO(), localId]
    );
  },

  /**
   * Upsert a payment from server data (for pull sync).
   */
  upsertFromServer(payment) {
    const db = getDatabase();
    const existing = payment.id ? db.getFirstSync('SELECT local_id FROM payments WHERE id = ?', [payment.id]) : null;
    const localId = existing?.local_id || Crypto.randomUUID();

    db.runSync(
      `INSERT OR REPLACE INTO payments
        (id, local_id, order_id, order_local_id, amount, method, status,
         sync_status, server_updated_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'synced', ?, ?, ?)`,
      [
        payment.id, localId, payment.order_id, payment.order_local_id || localId,
        payment.amount ?? 0, payment.method ?? 'cash', payment.status ?? 'completed',
        payment.updated_at || nowISO(), payment.created_at || nowISO(), payment.updated_at || nowISO(),
      ]
    );

    return localId;
  },

  /**
   * Clear all local payments.
   */
  clear() {
    const db = getDatabase();
    db.runSync('DELETE FROM payments');
  },
};

export default PaymentRepository;
