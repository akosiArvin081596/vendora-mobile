import * as SQLite from 'expo-sqlite';
import { runMigrations } from './migrations';

const DB_NAME = 'vendora.db';

let _db = null;

/**
 * Opens (or returns existing) SQLite database and runs migrations.
 */
export function getDatabase() {
  if (_db) {
    return _db;
  }

  _db = SQLite.openDatabaseSync(DB_NAME);

  // Enable WAL mode for better concurrent read/write performance
  _db.execSync('PRAGMA journal_mode = WAL;');
  _db.execSync('PRAGMA foreign_keys = ON;');

  runMigrations(_db);

  console.log('[DB] Database initialized.');
  return _db;
}

/**
 * Close the database connection (for cleanup/testing).
 */
export function closeDatabase() {
  if (_db) {
    _db.closeSync();
    _db = null;
    console.log('[DB] Database closed.');
  }
}

/**
 * Get the current ISO timestamp string.
 */
export function nowISO() {
  return new Date().toISOString();
}
