import * as Crypto from 'expo-crypto';
import { getDatabase, nowISO } from '../database';

/**
 * Repository for categories in local SQLite.
 */
const CategoryRepository = {
  getAll() {
    const db = getDatabase();
    return db.getAllSync('SELECT * FROM categories WHERE sync_status != ? ORDER BY name', ['deleted']);
  },

  getById(serverId) {
    const db = getDatabase();
    return db.getFirstSync('SELECT * FROM categories WHERE id = ?', [serverId]);
  },

  upsertFromServer(category) {
    const db = getDatabase();
    const existing = category.id ? db.getFirstSync('SELECT local_id FROM categories WHERE id = ?', [category.id]) : null;
    const localId = existing?.local_id || Crypto.randomUUID();

    db.runSync(
      `INSERT OR REPLACE INTO categories
        (id, local_id, name, slug, description, icon, is_active, sync_status, server_updated_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'synced', ?, ?, ?)`,
      [
        category.id,
        localId,
        category.name,
        category.slug ?? null,
        category.description ?? null,
        category.icon ?? null,
        category.is_active !== undefined ? (category.is_active ? 1 : 0) : 1,
        category.updated_at ?? nowISO(),
        category.created_at ?? nowISO(),
        category.updated_at ?? nowISO(),
      ]
    );

    return localId;
  },

  bulkUpsertFromServer(categories) {
    const db = getDatabase();
    db.withTransactionSync(() => {
      for (const category of categories) {
        this.upsertFromServer(category);
      }
    });
  },

  getCount() {
    const db = getDatabase();
    const row = db.getFirstSync('SELECT COUNT(*) as count FROM categories WHERE sync_status != ?', ['deleted']);
    return row?.count ?? 0;
  },

  clear() {
    const db = getDatabase();
    db.runSync('DELETE FROM categories');
  },
};

export default CategoryRepository;
