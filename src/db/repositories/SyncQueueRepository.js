import * as Crypto from 'expo-crypto';
import { getDatabase, nowISO } from '../database';

/**
 * Repository for the sync_queue (outbox) table.
 * Manages enqueue, dequeue, retry, and dependency resolution.
 */
const SyncQueueRepository = {
  /**
   * Enqueue a new sync operation.
   * @returns {string} The idempotency key for the queued item.
   */
  enqueue({ entityType, entityLocalId, action, endpoint, method = 'POST', payload = {}, dependsOn = null }) {
    const db = getDatabase();
    const idempotencyKey = Crypto.randomUUID();
    const now = nowISO();

    db.runSync(
      `INSERT INTO sync_queue
        (idempotency_key, entity_type, entity_local_id, action, endpoint, method, payload, depends_on, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
      [idempotencyKey, entityType, entityLocalId, action, endpoint, method, JSON.stringify(payload), dependsOn, now, now]
    );

    return idempotencyKey;
  },

  /**
   * Get the next batch of items ready to process (pending, no unresolved dependencies, past retry time).
   * @param {number} limit - Max items to return.
   */
  getReadyItems(limit = 10) {
    const db = getDatabase();
    const now = nowISO();

    return db.getAllSync(
      `SELECT * FROM sync_queue
       WHERE status = 'pending'
         AND (depends_on IS NULL
              OR depends_on IN (SELECT idempotency_key FROM sync_queue WHERE status = 'completed'))
         AND (next_retry_at IS NULL OR next_retry_at <= ?)
       ORDER BY created_at ASC
       LIMIT ?`,
      [now, limit]
    );
  },

  /**
   * Mark an item as in-progress.
   */
  markInProgress(id) {
    const db = getDatabase();
    db.runSync(`UPDATE sync_queue SET status = 'in_progress', updated_at = ? WHERE id = ?`, [nowISO(), id]);
  },

  /**
   * Mark an item as completed.
   */
  markCompleted(id) {
    const db = getDatabase();
    db.runSync(`UPDATE sync_queue SET status = 'completed', updated_at = ? WHERE id = ?`, [nowISO(), id]);
  },

  /**
   * Mark an item as failed with backoff.
   */
  markFailed(id, errorMessage) {
    const db = getDatabase();
    const item = db.getFirstSync('SELECT retry_count, max_retries FROM sync_queue WHERE id = ?', [id]);

    if (!item) {
      return;
    }

    const newRetryCount = item.retry_count + 1;

    if (newRetryCount >= item.max_retries) {
      // Mark as dead — needs manual intervention
      db.runSync(
        `UPDATE sync_queue SET status = 'dead', error_message = ?, retry_count = ?, updated_at = ? WHERE id = ?`,
        [errorMessage, newRetryCount, nowISO(), id]
      );
      return;
    }

    // Exponential backoff: 2^retry * 1000ms, with 20% jitter, max 5 min
    const baseDelay = Math.min(Math.pow(2, newRetryCount) * 1000, 5 * 60 * 1000);
    const jitter = baseDelay * 0.2 * Math.random();
    const delay = baseDelay + jitter;
    const nextRetry = new Date(Date.now() + delay).toISOString();

    db.runSync(
      `UPDATE sync_queue SET status = 'pending', error_message = ?, retry_count = ?, next_retry_at = ?, updated_at = ? WHERE id = ?`,
      [errorMessage, newRetryCount, nextRetry, nowISO(), id]
    );
  },

  /**
   * Get counts of items by status.
   */
  getCounts() {
    const db = getDatabase();
    const rows = db.getAllSync(
      `SELECT status, COUNT(*) as count FROM sync_queue GROUP BY status`
    );

    const counts = { pending: 0, in_progress: 0, completed: 0, failed: 0, dead: 0 };
    for (const row of rows) {
      counts[row.status] = row.count;
    }
    return counts;
  },

  /**
   * Get all dead (permanently failed) items for user review.
   */
  getDeadItems() {
    const db = getDatabase();
    return db.getAllSync(
      `SELECT * FROM sync_queue WHERE status = 'dead' ORDER BY updated_at DESC`
    );
  },

  /**
   * Retry a dead item (reset to pending with cleared retry count).
   */
  retryDeadItem(id) {
    const db = getDatabase();
    db.runSync(
      `UPDATE sync_queue SET status = 'pending', retry_count = 0, next_retry_at = NULL, error_message = NULL, updated_at = ? WHERE id = ? AND status = 'dead'`,
      [nowISO(), id]
    );
  },

  /**
   * Discard a dead item.
   */
  discardItem(id) {
    const db = getDatabase();
    db.runSync(`DELETE FROM sync_queue WHERE id = ? AND status = 'dead'`, [id]);
  },

  /**
   * Clean up completed items older than given hours.
   */
  cleanCompleted(hoursOld = 24) {
    const db = getDatabase();
    const cutoff = new Date(Date.now() - hoursOld * 60 * 60 * 1000).toISOString();
    db.runSync(`DELETE FROM sync_queue WHERE status = 'completed' AND updated_at < ?`, [cutoff]);
  },

  /**
   * Check if there are any pending or in-progress items.
   */
  hasPendingWork() {
    const db = getDatabase();
    const row = db.getFirstSync(
      `SELECT COUNT(*) as count FROM sync_queue WHERE status IN ('pending', 'in_progress')`
    );
    return row.count > 0;
  },
};

export default SyncQueueRepository;
