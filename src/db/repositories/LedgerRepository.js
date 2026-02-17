import * as Crypto from 'expo-crypto';
import { getDatabase, nowISO, getCurrentUserId } from '../database';

/**
 * Repository for ledger entries in local SQLite.
 */
const LedgerRepository = {
  getAll(filters = {}) {
    const db = getDatabase();
    const conditions = ["sync_status != 'deleted'"];
    const params = [];

    const userId = getCurrentUserId();
    if (userId) {
      conditions.push('user_id = ?');
      params.push(userId);
    }

    if (filters.type) {
      conditions.push('type = ?');
      params.push(filters.type);
    }

    if (filters.category) {
      conditions.push('category = ?');
      params.push(filters.category);
    }

    if (filters.date_from) {
      conditions.push('DATE(created_at) >= ?');
      params.push(filters.date_from);
    }

    if (filters.date_to) {
      conditions.push('DATE(created_at) <= ?');
      params.push(filters.date_to);
    }

    if (filters.product_id) {
      conditions.push('product_id = ?');
      params.push(filters.product_id);
    }

    if (filters.search) {
      conditions.push('(description LIKE ? OR product LIKE ? OR reference LIKE ?)');
      const term = `%${filters.search}%`;
      params.push(term, term, term);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    return db.getAllSync(
      `SELECT * FROM ledger_entries ${where} ORDER BY created_at DESC`,
      params
    );
  },

  getSummary() {
    const db = getDatabase();
    const userId = getCurrentUserId();
    const conditions = ["sync_status != 'deleted'"];
    const params = [];

    if (userId) {
      conditions.push('user_id = ?');
      params.push(userId);
    }

    const where = conditions.join(' AND ');
    const row = db.getFirstSync(`
      SELECT
        COALESCE(SUM(CASE WHEN type = 'stock_in' THEN quantity ELSE 0 END), 0) AS total_stock_in,
        COALESCE(SUM(CASE WHEN type = 'stock_out' THEN ABS(quantity) ELSE 0 END), 0) AS total_stock_out,
        COALESCE(SUM(CASE WHEN type = 'sale' THEN amount ELSE 0 END), 0) AS total_revenue,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN ABS(amount) ELSE 0 END), 0) AS total_expenses
      FROM ledger_entries
      WHERE ${where}
    `, params);

    return {
      ...row,
      net_profit: (row?.total_revenue || 0) - (row?.total_expenses || 0),
    };
  },

  createLocal(entry) {
    const db = getDatabase();
    const localId = Crypto.randomUUID();
    const now = nowISO();

    db.runSync(
      `INSERT INTO ledger_entries
        (local_id, user_id, type, category, description, quantity, amount,
         product, product_id, reference, sync_status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
      [
        localId,
        entry.user_id ?? getCurrentUserId(),
        entry.type,
        entry.category ?? null,
        entry.description ?? null,
        entry.quantity ?? null,
        entry.amount ?? null,
        entry.product ?? null,
        entry.product_id ?? null,
        entry.reference ?? null,
        now, now,
      ]
    );

    return localId;
  },

  upsertFromServer(entry) {
    const db = getDatabase();
    const existing = entry.id
      ? db.getFirstSync('SELECT local_id FROM ledger_entries WHERE id = ?', [entry.id])
      : null;
    const localId = existing?.local_id || Crypto.randomUUID();

    db.runSync(
      `INSERT OR REPLACE INTO ledger_entries
        (id, local_id, user_id, type, category, description, quantity, amount,
         product, product_id, reference, sync_status, server_updated_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced', ?, ?, ?)`,
      [
        entry.id,
        localId,
        entry.user_id ?? null,
        entry.type,
        entry.category ?? null,
        entry.description ?? null,
        entry.quantity ?? null,
        entry.amount ?? null,
        entry.product ?? null,
        entry.product_id ?? null,
        entry.reference ?? null,
        entry.updated_at ?? nowISO(),
        entry.created_at ?? nowISO(),
        entry.updated_at ?? nowISO(),
      ]
    );

    return localId;
  },

  bulkUpsertFromServer(entries) {
    const db = getDatabase();
    db.withTransactionSync(() => {
      for (const entry of entries) {
        this.upsertFromServer(entry);
      }
    });
  },

  updateAfterSync(localId, serverData) {
    const db = getDatabase();
    db.runSync(
      `UPDATE ledger_entries
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
        "SELECT COUNT(*) as count FROM ledger_entries WHERE sync_status != 'deleted' AND user_id = ?",
        [userId]
      );
      return row?.count ?? 0;
    }
    const row = db.getFirstSync(
      "SELECT COUNT(*) as count FROM ledger_entries WHERE sync_status != 'deleted'"
    );
    return row?.count ?? 0;
  },

  clear() {
    const db = getDatabase();
    db.runSync('DELETE FROM ledger_entries');
  },
};

export default LedgerRepository;
