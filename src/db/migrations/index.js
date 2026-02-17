import { migration_001_initial } from './001_initial';
import { migration_002_ledger_admin } from './002_ledger_admin';

const migrations = [migration_001_initial, migration_002_ledger_admin];

/**
 * Runs all pending migrations in order.
 * Tracks applied versions in a `_migrations` meta table.
 */
export function runMigrations(db) {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS _migrations (
      version INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL
    );
  `);

  const applied = db.getAllSync('SELECT version FROM _migrations ORDER BY version');
  const appliedSet = new Set(applied.map((r) => r.version));

  for (const migration of migrations) {
    if (!appliedSet.has(migration.version)) {
      console.log(`[DB] Running migration v${migration.version}...`);
      db.withTransactionSync(() => {
        migration.up(db);
        db.runSync('INSERT INTO _migrations (version, applied_at) VALUES (?, ?)', [
          migration.version,
          new Date().toISOString(),
        ]);
      });
      console.log(`[DB] Migration v${migration.version} applied.`);
    }
  }
}
