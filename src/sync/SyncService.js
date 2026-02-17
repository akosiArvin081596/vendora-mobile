import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import api from '../services/api';
import SyncQueueRepository from '../db/repositories/SyncQueueRepository';
import ConflictResolver from './ConflictResolver';
import ProductRepository from '../db/repositories/ProductRepository';
import CustomerRepository from '../db/repositories/CustomerRepository';
import InventoryAdjustmentRepository from '../db/repositories/InventoryAdjustmentRepository';
import LedgerRepository from '../db/repositories/LedgerRepository';
import AdminUserRepository from '../db/repositories/AdminUserRepository';

let _isProcessing = false;
let _onStatusChange = null;

/**
 * Helper to check if a URI is a local file or data URI (not a remote URL).
 */
const isLocalFile = (uri) => {
  if (!uri) return false;
  return (
    uri.startsWith('file://') ||
    uri.startsWith('content://') ||
    uri.startsWith('blob:') ||
    uri.startsWith('data:') ||
    uri.startsWith('/')
  );
};

/**
 * Read a local image file and return a base64 data URI.
 * Works on both native (file://, content://) and web (blob:, data:) URIs.
 */
const imageToBase64 = async (uri) => {
  if (!uri) return null;

  // Already a data URI — return as-is
  if (uri.startsWith('data:')) {
    return uri;
  }

  // Web: blob URL — fetch and convert
  if (Platform.OS === 'web' && uri.startsWith('blob:')) {
    const response = await fetch(uri);
    const blob = await response.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  // Native (Android/iOS): read file via expo-file-system
  const base64Data = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  // Detect MIME type from extension
  const ext = uri.split('.').pop()?.toLowerCase() || 'jpg';
  const mimeMap = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp' };
  const mime = mimeMap[ext] || 'image/jpeg';

  return `data:${mime};base64,${base64Data}`;
};

/**
 * Core sync engine. Processes the outbox queue in FIFO order,
 * respecting dependencies and using exponential backoff on failures.
 */
const SyncService = {
  /**
   * Register a callback for sync status changes.
   */
  onStatusChange(callback) {
    _onStatusChange = callback;
  },

  /**
   * Process the sync queue. Skips if already processing.
   * Returns the number of successfully synced items.
   */
  async processQueue() {
    if (_isProcessing) {
      return 0;
    }

    _isProcessing = true;
    _onStatusChange?.('syncing');

    let synced = 0;

    try {
      const items = SyncQueueRepository.getReadyItems(10);

      if (items.length === 0) {
        _onStatusChange?.(SyncQueueRepository.hasPendingWork() ? 'waiting' : 'idle');
        return 0;
      }

      for (const item of items) {
        SyncQueueRepository.markInProgress(item.id);

        try {
          const result = await this._sendToServer(item);
          await this._handleSuccess(item, result);
          SyncQueueRepository.markCompleted(item.id);
          synced++;
        } catch (error) {
          console.error(`[Sync] FAILED ${item.entity_type}:${item.entity_local_id}`, JSON.stringify({
            message: error?.message,
            code: error?.code,
            endpoint: item.endpoint,
            serverMessage: error?.details || error?.response?.data?.error?.message || error?.response?.data?.message || 'no details',
          }));
          this._handleError(item, error);
        }
      }
    } catch (error) {
      console.error('[Sync] Queue processing error:', error);
    } finally {
      _isProcessing = false;
      _onStatusChange?.(SyncQueueRepository.hasPendingWork() ? 'pending' : 'idle');
    }

    return synced;
  },

  /**
   * Send a sync queue item to the server.
   * Images are sent as base64 JSON (not multipart) to bypass CDN file-upload blocking.
   */
  async _sendToServer(item) {
    const payload = JSON.parse(item.payload);
    const localImageUri = payload._localImageUri;
    delete payload._localImageUri;

    const config = {
      headers: {
        'X-Idempotency-Key': item.idempotency_key,
      },
      timeout: 60000,
    };

    // Convert local image to base64 and add as image_base64 field
    if (localImageUri && isLocalFile(localImageUri) && (item.method === 'POST' || item.method === 'PUT')) {
      // Always remove the local file URI — server can't use it
      delete payload.image;
      try {
        const base64DataUri = await imageToBase64(localImageUri);
        if (base64DataUri) {
          payload.image_base64 = base64DataUri;
        }
      } catch (err) {
        console.warn('[Sync] Failed to read image file, sending without image:', err.message);
      }
    }

    switch (item.method.toUpperCase()) {
      case 'POST':
        return await api.post(item.endpoint, payload, config);
      case 'PUT':
        return await api.put(item.endpoint, payload, config);
      case 'PATCH':
        return await api.patch(item.endpoint, payload, config);
      case 'DELETE':
        return await api.delete(item.endpoint, config);
      default:
        throw new Error(`Unsupported HTTP method: ${item.method}`);
    }
  },

  /**
   * Handle successful sync — update local entity with server data.
   */
  async _handleSuccess(item, result) {
    const serverData = result?.data;
    console.log(`[Sync] Synced ${item.entity_type}:${item.entity_local_id} (${item.action})`);

    if (!serverData) {
      return;
    }

    if (item.entity_type === 'order' && item.action === 'create') {
      const serverId = ConflictResolver.resolveOrderCreated(item.entity_local_id, serverData);
      // Resolve dependent payment's order_id placeholder
      const { getDatabase } = require('../db/database');
      const db = getDatabase();
      const dependentPayment = db.getFirstSync(
        `SELECT idempotency_key FROM sync_queue WHERE depends_on = ? AND entity_type = 'payment'`,
        [item.idempotency_key]
      );
      if (dependentPayment) {
        ConflictResolver.resolvePaymentOrderId(dependentPayment.idempotency_key, serverId);
      }
    } else if (item.entity_type === 'payment' && item.action === 'create') {
      ConflictResolver.resolvePaymentCreated(item.entity_local_id, serverData);
    } else if (item.entity_type === 'product') {
      if (item.action === 'create') {
        ProductRepository.updateAfterSync(item.entity_local_id, serverData);
        // Enqueue any pending inventory adjustments that were waiting for this product's server ID
        const enqueued = InventoryAdjustmentRepository.enqueuePendingForProduct(item.entity_local_id, serverData.id);
        if (enqueued > 0) {
          console.log(`[Sync] Enqueued ${enqueued} pending adjustments for product ${serverData.id}`);
        }
      } else if (item.action === 'update') {
        // Server-wins: overwrite local with server response
        ProductRepository.upsertFromServer(serverData);
      }
    } else if (item.entity_type === 'customer') {
      if (item.action === 'create') {
        CustomerRepository.updateAfterSync(item.entity_local_id, serverData);
      } else if (item.action === 'update') {
        CustomerRepository.upsertFromServer(serverData);
      }
    } else if (item.entity_type === 'inventory_adjustment' && item.action === 'create') {
      InventoryAdjustmentRepository.updateAfterSync(item.entity_local_id, serverData);
      // Update product stock with server's authoritative value
      if (serverData.inventory?.stock != null) {
        ProductRepository.updateStock(serverData.product_id, serverData.inventory.stock);
      }
    } else if (item.entity_type === 'ledger_entry' && item.action === 'create') {
      LedgerRepository.updateAfterSync(item.entity_local_id, serverData);
    } else if (item.entity_type === 'admin_user') {
      if (item.action === 'create') {
        AdminUserRepository.updateAfterSync(item.entity_local_id, serverData);
      } else if (item.action === 'update' || item.action === 'status_change') {
        AdminUserRepository.upsertFromServer(serverData);
      } else if (item.action === 'delete') {
        AdminUserRepository.markDeleted(serverData.id ?? item.entity_local_id);
      }
    }
  },

  /**
   * Handle sync failure — categorize error and decide retry vs dead.
   */
  _handleError(item, error) {
    const errorMessage = error?.message || 'Unknown error';
    const errorCode = error?.code;

    // Validation errors should not be retried — mark dead immediately
    if (errorCode === 'VALIDATION_ERROR') {
      console.warn(`[Sync] Validation error for ${item.entity_type}:${item.entity_local_id}: ${errorMessage}`);
      SyncQueueRepository.markFailed(item.id, errorMessage);
      // Force dead status for validation errors (skip retries)
      const db = require('../db/database').getDatabase();
      db.runSync(
        `UPDATE sync_queue SET status = 'dead', error_message = ?, updated_at = ? WHERE id = ?`,
        [errorMessage, new Date().toISOString(), item.id]
      );
      return;
    }

    // Network/connectivity errors — don't burn retries, just schedule a backoff wait.
    // These are transient and will resolve when connectivity returns.
    if (errorCode === 'NETWORK_ERROR') {
      console.warn(`[Sync] Network error for ${item.entity_type}:${item.entity_local_id} — will retry without burning attempt`);
      SyncQueueRepository.markNetworkError(item.id, errorMessage);
      return;
    }

    // Server errors and other failures get retried with backoff (burns retry count)
    console.warn(`[Sync] Failed ${item.entity_type}:${item.entity_local_id}: ${errorMessage} (retry ${item.retry_count + 1})`);
    SyncQueueRepository.markFailed(item.id, errorMessage);
  },

  /**
   * Check if currently processing.
   */
  isProcessing() {
    return _isProcessing;
  },
};

export default SyncService;
