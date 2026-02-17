/**
 * Migration 002: Add ledger_entries and admin_users tables
 * for offline-first support.
 */
export const migration_002_ledger_admin = {
  version: 2,
  up: (db) => {
    db.execSync(`
      CREATE TABLE IF NOT EXISTS ledger_entries (
        id INTEGER,
        local_id TEXT NOT NULL PRIMARY KEY,
        user_id INTEGER,
        type TEXT NOT NULL,
        category TEXT,
        description TEXT,
        quantity INTEGER,
        amount INTEGER,
        product TEXT,
        product_id INTEGER,
        reference TEXT,
        sync_status TEXT NOT NULL DEFAULT 'pending',
        server_updated_at TEXT,
        created_at TEXT,
        updated_at TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_ledger_sync ON ledger_entries(sync_status);
      CREATE UNIQUE INDEX IF NOT EXISTS idx_ledger_server_id ON ledger_entries(id) WHERE id IS NOT NULL;

      CREATE TABLE IF NOT EXISTS admin_users (
        id INTEGER,
        local_id TEXT NOT NULL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        user_type TEXT NOT NULL,
        phone TEXT,
        status TEXT DEFAULT 'active',
        last_login_at TEXT,
        sync_status TEXT NOT NULL DEFAULT 'pending',
        server_updated_at TEXT,
        created_at TEXT,
        updated_at TEXT
      );

      CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_users_server_id ON admin_users(id) WHERE id IS NOT NULL;
      CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
    `);
  },
};
