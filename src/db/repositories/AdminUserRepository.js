import * as Crypto from 'expo-crypto';
import { getDatabase, nowISO } from '../database';

/**
 * Repository for admin users in local SQLite.
 */
const AdminUserRepository = {
  getAll(filters = {}) {
    const db = getDatabase();
    const conditions = ["sync_status != 'deleted'"];
    const params = [];

    if (filters.search) {
      conditions.push('(name LIKE ? OR email LIKE ?)');
      const term = `%${filters.search}%`;
      params.push(term, term);
    }

    if (filters.status) {
      conditions.push('status = ?');
      params.push(filters.status);
    }

    if (filters.user_type) {
      conditions.push('user_type = ?');
      params.push(filters.user_type);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    return db.getAllSync(
      `SELECT * FROM admin_users ${where} ORDER BY name`,
      params
    );
  },

  getById(serverId) {
    const db = getDatabase();
    return db.getFirstSync('SELECT * FROM admin_users WHERE id = ?', [serverId]);
  },

  getByLocalId(localId) {
    const db = getDatabase();
    return db.getFirstSync('SELECT * FROM admin_users WHERE local_id = ?', [localId]);
  },

  upsertFromServer(user) {
    const db = getDatabase();
    const existing = user.id
      ? db.getFirstSync('SELECT local_id FROM admin_users WHERE id = ?', [user.id])
      : null;
    const localId = existing?.local_id || Crypto.randomUUID();

    db.runSync(
      `INSERT OR REPLACE INTO admin_users
        (id, local_id, name, email, user_type, phone, status, last_login_at,
         sync_status, server_updated_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'synced', ?, ?, ?)`,
      [
        user.id,
        localId,
        user.name,
        user.email,
        user.user_type,
        user.phone ?? null,
        user.status ?? 'active',
        user.last_login_at ?? null,
        user.updated_at ?? nowISO(),
        user.created_at ?? nowISO(),
        user.updated_at ?? nowISO(),
      ]
    );

    return localId;
  },

  bulkUpsertFromServer(users) {
    const db = getDatabase();
    db.withTransactionSync(() => {
      for (const user of users) {
        this.upsertFromServer(user);
      }
    });
  },

  createLocal(user) {
    const db = getDatabase();
    const localId = Crypto.randomUUID();
    const now = nowISO();

    db.runSync(
      `INSERT INTO admin_users
        (local_id, name, email, user_type, phone, status,
         sync_status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
      [
        localId,
        user.name,
        user.email,
        user.user_type,
        user.phone ?? null,
        user.status ?? 'active',
        now, now,
      ]
    );

    return localId;
  },

  updateLocal(serverId, updates) {
    const db = getDatabase();
    const now = nowISO();
    const sets = ['updated_at = ?', "sync_status = 'pending'"];
    const values = [now];

    const fieldMap = {
      name: 'name', email: 'email', user_type: 'user_type',
      phone: 'phone', status: 'status',
    };

    for (const [key, col] of Object.entries(fieldMap)) {
      if (updates[key] !== undefined) {
        sets.push(`${col} = ?`);
        values.push(updates[key]);
      }
    }

    values.push(serverId);
    db.runSync(`UPDATE admin_users SET ${sets.join(', ')} WHERE id = ?`, values);
  },

  updateAfterSync(localId, serverData) {
    const db = getDatabase();
    db.runSync(
      `UPDATE admin_users
       SET id = ?, sync_status = 'synced', server_updated_at = ?, updated_at = ?
       WHERE local_id = ?`,
      [serverData.id, serverData.updated_at || nowISO(), nowISO(), localId]
    );
  },

  markDeleted(serverId) {
    const db = getDatabase();
    db.runSync(
      "UPDATE admin_users SET sync_status = 'deleted', updated_at = ? WHERE id = ?",
      [nowISO(), serverId]
    );
  },

  getCount() {
    const db = getDatabase();
    const row = db.getFirstSync(
      "SELECT COUNT(*) as count FROM admin_users WHERE sync_status != 'deleted'"
    );
    return row?.count ?? 0;
  },

  clear() {
    const db = getDatabase();
    db.runSync('DELETE FROM admin_users');
  },
};

export default AdminUserRepository;
