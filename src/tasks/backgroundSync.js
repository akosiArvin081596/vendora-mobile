import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';

const BACKGROUND_SYNC_TASK = 'vendora-background-sync';

/**
 * Define the background sync task.
 * This runs periodically (~15 min on iOS, configurable on Android)
 * and processes the sync queue.
 */
TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
  try {
    // Lazy imports to avoid circular dependencies at module load
    const { getDatabase } = require('../db/database');
    const SyncService = require('../sync/SyncService').default;
    const SyncQueueRepository = require('../db/repositories/SyncQueueRepository').default;

    // Ensure database is available
    getDatabase();

    if (!SyncQueueRepository.hasPendingWork()) {
      console.log('[BackgroundSync] No pending work.');
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    const synced = await SyncService.processQueue();
    console.log(`[BackgroundSync] Synced ${synced} items.`);

    return synced > 0
      ? BackgroundFetch.BackgroundFetchResult.NewData
      : BackgroundFetch.BackgroundFetchResult.NoData;
  } catch (error) {
    console.error('[BackgroundSync] Error:', error.message);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

/**
 * Register the background sync task.
 * Call once during app startup.
 */
export async function registerBackgroundSync() {
  try {
    const status = await BackgroundFetch.getStatusAsync();

    if (status === BackgroundFetch.BackgroundFetchStatus.Denied) {
      console.log('[BackgroundSync] Background fetch denied by user.');
      return false;
    }

    if (status === BackgroundFetch.BackgroundFetchStatus.Restricted) {
      console.log('[BackgroundSync] Background fetch restricted.');
      return false;
    }

    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_SYNC_TASK);
    if (isRegistered) {
      console.log('[BackgroundSync] Already registered.');
      return true;
    }

    await BackgroundFetch.registerTaskAsync(BACKGROUND_SYNC_TASK, {
      minimumInterval: 15 * 60, // 15 minutes
      stopOnTerminate: false,
      startOnBoot: true,
    });

    console.log('[BackgroundSync] Task registered successfully.');
    return true;
  } catch (error) {
    console.warn('[BackgroundSync] Registration failed:', error.message);
    return false;
  }
}

/**
 * Unregister background sync (e.g., on logout).
 */
export async function unregisterBackgroundSync() {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_SYNC_TASK);
    if (isRegistered) {
      await BackgroundFetch.unregisterTaskAsync(BACKGROUND_SYNC_TASK);
      console.log('[BackgroundSync] Task unregistered.');
    }
  } catch (error) {
    console.warn('[BackgroundSync] Unregister failed:', error.message);
  }
}
