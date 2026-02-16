import { Platform } from 'react-native';
import api from '../services/api';
import SyncQueueRepository from '../db/repositories/SyncQueueRepository';
import ConflictResolver from './ConflictResolver';
import ProductRepository from '../db/repositories/ProductRepository';
import CustomerRepository from '../db/repositories/CustomerRepository';
import InventoryAdjustmentRepository from '../db/repositories/InventoryAdjustmentRepository';

let _isProcessing = false;
let _onStatusChange = null;

/**
 * Helper to check if a URI is a local file (not a remote URL).
 */
const isLocalFile = (uri) => {
  if (!uri) return false;
  return (
    uri.startsWith('file://') ||
    uri.startsWith('content://') ||
    uri.startsWith('blob:') ||
    uri.startsWith('/')
  );
};

/**
 * Convert blob URL to File object (for web).
 */
const blobUrlToFile = async (blobUrl, filename = 'image.jpg') => {
  const response = await fetch(blobUrl);
  const blob = await response.blob();
  const type = blob.type || 'image/jpeg';
  const ext = type.split('/')[1] || 'jpg';
  const finalFilename = filename.includes('.') ? filename : `${filename}.${ext}`;
  return new File([blob], finalFilename, { type });
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
   * Handles both JSON and multipart (image upload) payloads.
   */
  async _sendToServer(item) {
    const payload = JSON.parse(item.payload);
    const localImageUri = payload._localImageUri;
    delete payload._localImageUri;

    const config = {
      headers: {
        'X-Idempotency-Key': item.idempotency_key,
      },
    };

    // Check if this needs multipart (has a local image file)
    if (localImageUri && isLocalFile(localImageUri) && (item.method === 'POST' || item.method === 'PUT')) {
      return await this._sendMultipart(item, payload, localImageUri, config);
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
   * Send a multipart request with image file.
   */
  async _sendMultipart(item, payload, imageUri, config) {
    const formData = new FormData();

    // Add all payload fields except internal ones
    Object.entries(payload).forEach(([key, value]) => {
      if (key === 'image') return;
      if (key === 'bulk_pricing' && Array.isArray(value)) {
        value.forEach((tier, index) => {
          formData.append(`bulk_pricing[${index}][min_qty]`, tier.min_qty);
          formData.append(`bulk_pricing[${index}][price]`, tier.price);
        });
      } else if (typeof value === 'boolean') {
        formData.append(key, value ? '1' : '0');
      } else if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });

    // Add image file
    if (Platform.OS === 'web') {
      const file = await blobUrlToFile(imageUri, 'product-image');
      formData.append('image', file);
    } else {
      const filename = imageUri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';
      formData.append('image', { uri: imageUri, name: filename, type });
    }

    const multipartConfig = {
      ...config,
      headers: {
        ...config.headers,
        // Remove default 'application/json' Content-Type so Axios auto-sets
        // multipart/form-data with the correct boundary for FormData.
        'Content-Type': undefined,
      },
      timeout: 60000,
    };

    if (item.method === 'PUT') {
      // Laravel needs POST with _method for multipart PUT/PATCH
      formData.append('_method', 'PATCH');
      return await api.post(item.endpoint, formData, multipartConfig);
    }

    return await api.post(item.endpoint, formData, multipartConfig);
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

    // Network errors and server errors get retried with backoff
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
