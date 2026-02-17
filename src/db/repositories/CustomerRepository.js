import * as Crypto from 'expo-crypto';
import { getDatabase, nowISO, getCurrentUserId } from '../database';

/**
 * Repository for customers in local SQLite.
 */
const CustomerRepository = {
  getAll() {
    const db = getDatabase();
    const userId = getCurrentUserId();
    if (userId) {
      return db.getAllSync(
        'SELECT * FROM customers WHERE sync_status != ? AND user_id = ? ORDER BY name',
        ['deleted', userId]
      );
    }
    return db.getAllSync('SELECT * FROM customers WHERE sync_status != ? ORDER BY name', ['deleted']);
  },

  getById(serverId) {
    const db = getDatabase();
    return db.getFirstSync('SELECT * FROM customers WHERE id = ?', [serverId]);
  },

  getByLocalId(localId) {
    const db = getDatabase();
    return db.getFirstSync('SELECT * FROM customers WHERE local_id = ?', [localId]);
  },

  search(query) {
    const db = getDatabase();
    const userId = getCurrentUserId();
    const term = `%${query}%`;
    if (userId) {
      return db.getAllSync(
        `SELECT * FROM customers
         WHERE sync_status != 'deleted' AND user_id = ?
           AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)
         ORDER BY name`,
        [userId, term, term, term]
      );
    }
    return db.getAllSync(
      `SELECT * FROM customers
       WHERE sync_status != 'deleted'
         AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)
       ORDER BY name`,
      [term, term, term]
    );
  },

  upsertFromServer(customer) {
    const db = getDatabase();
    const existing = customer.id ? db.getFirstSync('SELECT local_id FROM customers WHERE id = ?', [customer.id]) : null;
    const localId = existing?.local_id || Crypto.randomUUID();

    db.runSync(
      `INSERT OR REPLACE INTO customers
        (id, local_id, user_id, name, email, phone, address, notes, status,
         sync_status, server_updated_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced', ?, ?, ?)`,
      [
        customer.id,
        localId,
        customer.user_id ?? null,
        customer.name,
        customer.email ?? null,
        customer.phone ?? null,
        customer.address ?? null,
        customer.notes ?? null,
        customer.status ?? 'active',
        customer.updated_at ?? nowISO(),
        customer.created_at ?? nowISO(),
        customer.updated_at ?? nowISO(),
      ]
    );

    return localId;
  },

  bulkUpsertFromServer(customers) {
    const db = getDatabase();
    db.withTransactionSync(() => {
      for (const customer of customers) {
        this.upsertFromServer(customer);
      }
    });
  },

  /**
   * Create a customer locally (offline-first, before sync).
   * @returns {string} The local_id
   */
  createLocal(customer) {
    const db = getDatabase();
    const localId = Crypto.randomUUID();
    const now = nowISO();

    db.runSync(
      `INSERT INTO customers
        (local_id, user_id, name, email, phone, address, notes, status,
         sync_status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
      [
        localId,
        customer.user_id ?? null,
        customer.name,
        customer.email ?? null,
        customer.phone ?? null,
        customer.address ?? null,
        customer.notes ?? null,
        customer.status ?? 'active',
        now, now,
      ]
    );

    return localId;
  },

  /**
   * Update a customer locally (offline-first).
   */
  updateLocal(serverId, updates) {
    const db = getDatabase();
    const now = nowISO();
    const sets = ['updated_at = ?', "sync_status = 'pending'"];
    const values = [now];

    const fieldMap = {
      name: 'name', email: 'email', phone: 'phone',
      address: 'address', notes: 'notes', status: 'status',
    };

    for (const [key, col] of Object.entries(fieldMap)) {
      if (updates[key] !== undefined) {
        sets.push(`${col} = ?`);
        values.push(updates[key]);
      }
    }

    values.push(serverId);
    db.runSync(`UPDATE customers SET ${sets.join(', ')} WHERE id = ?`, values);
  },

  /**
   * Update customer after successful sync with server data.
   */
  updateAfterSync(localId, serverData) {
    const db = getDatabase();
    db.runSync(
      `UPDATE customers
       SET id = ?, sync_status = 'synced', server_updated_at = ?, updated_at = ?
       WHERE local_id = ?`,
      [serverData.id, serverData.updated_at || nowISO(), nowISO(), localId]
    );
  },

  getCount() {
    const db = getDatabase();
    const userId = getCurrentUserId();
    if (userId) {
      const row = db.getFirstSync(
        'SELECT COUNT(*) as count FROM customers WHERE sync_status != ? AND user_id = ?',
        ['deleted', userId]
      );
      return row?.count ?? 0;
    }
    const row = db.getFirstSync('SELECT COUNT(*) as count FROM customers WHERE sync_status != ?', ['deleted']);
    return row?.count ?? 0;
  },

  clear() {
    const db = getDatabase();
    db.runSync('DELETE FROM customers');
  },
};

export default CustomerRepository;
