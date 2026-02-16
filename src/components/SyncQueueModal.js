import React, { useState, useCallback } from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SyncQueueRepository from '../db/repositories/SyncQueueRepository';
import SyncService from '../sync/SyncService';
import { useSync } from '../context/SyncContext';
import { useNetwork } from '../context/NetworkContext';

const ACTION_LABELS = {
  create: { label: 'Create', icon: 'add-circle-outline', color: '#22c55e' },
  update: { label: 'Update', icon: 'pencil-outline', color: '#3b82f6' },
  delete: { label: 'Delete', icon: 'trash-outline', color: '#ef4444' },
};

const ENTITY_LABELS = {
  order: { label: 'Order', icon: 'receipt-outline' },
  payment: { label: 'Payment', icon: 'card-outline' },
  product: { label: 'Product', icon: 'cube-outline' },
  customer: { label: 'Customer', icon: 'person-outline' },
  inventory_adjustment: { label: 'Stock Adjustment', icon: 'swap-vertical-outline' },
};

export default function SyncQueueModal({ visible, onClose }) {
  const { counts, refreshCounts, processQueue } = useSync();
  const { isOnline } = useNetwork();
  const [deadItems, setDeadItems] = useState([]);
  const [pendingItems, setPendingItems] = useState([]);
  const [activeTab, setActiveTab] = useState('pending');
  const [retrying, setRetrying] = useState(false);

  const loadItems = useCallback(() => {
    setDeadItems(SyncQueueRepository.getDeadItems());
    const ready = SyncQueueRepository.getReadyItems(50);
    setPendingItems(ready);
    refreshCounts();
  }, [refreshCounts]);

  // Reload items whenever modal becomes visible
  React.useEffect(() => {
    if (visible) {
      loadItems();
    }
  }, [visible, loadItems]);

  const handleRetryItem = (id) => {
    SyncQueueRepository.retryDeadItem(id);
    loadItems();
  };

  const handleDiscardItem = (id) => {
    Alert.alert(
      'Discard Item',
      'This will permanently remove this failed sync item. The local data will remain but won\'t be synced to the server.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => {
            SyncQueueRepository.discardItem(id);
            loadItems();
          },
        },
      ]
    );
  };

  const handleRetryAll = async () => {
    deadItems.forEach((item) => SyncQueueRepository.retryDeadItem(item.id));
    loadItems();
    if (isOnline) {
      setRetrying(true);
      await processQueue();
      loadItems();
      setRetrying(false);
    }
  };

  const handleSyncNow = async () => {
    if (!isOnline) {
      Alert.alert('Offline', 'Cannot sync while offline. Items will sync automatically when you reconnect.');
      return;
    }
    setRetrying(true);
    await processQueue();
    loadItems();
    setRetrying(false);
  };

  const handleCleanCompleted = () => {
    SyncQueueRepository.cleanCompleted(0);
    loadItems();
  };

  const renderItem = (item, isDead = false) => {
    const entity = ENTITY_LABELS[item.entity_type] || { label: item.entity_type, icon: 'help-outline' };
    const action = ACTION_LABELS[item.action] || { label: item.action, icon: 'help-outline', color: '#71717a' };

    return (
      <View
        key={item.id}
        className="bg-vendora-input rounded-xl p-3 mb-2"
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1 gap-3">
            <View className="w-9 h-9 rounded-lg items-center justify-center bg-vendora-card">
              <Ionicons name={entity.icon} size={18} color="#a855f7" />
            </View>
            <View className="flex-1">
              <View className="flex-row items-center gap-2">
                <Text className="text-vendora-text font-medium text-sm">
                  {entity.label}
                </Text>
                <View className="px-1.5 py-0.5 rounded" style={{ backgroundColor: `${action.color}20` }}>
                  <Text style={{ color: action.color, fontSize: 10, fontWeight: '600' }}>
                    {action.label}
                  </Text>
                </View>
              </View>
              {item.error_message && (
                <Text className="text-red-400 text-xs mt-1" numberOfLines={2}>
                  {item.error_message}
                </Text>
              )}
              {!isDead && item.retry_count > 0 && (
                <Text className="text-vendora-text-muted text-xs mt-0.5">
                  Retry {item.retry_count}/{item.max_retries}
                </Text>
              )}
            </View>
          </View>

          {isDead && (
            <View className="flex-row gap-2">
              <TouchableOpacity
                className="w-8 h-8 rounded-lg bg-blue-500/20 items-center justify-center"
                onPress={() => handleRetryItem(item.id)}
              >
                <Ionicons name="refresh-outline" size={16} color="#3b82f6" />
              </TouchableOpacity>
              <TouchableOpacity
                className="w-8 h-8 rounded-lg bg-red-500/20 items-center justify-center"
                onPress={() => handleDiscardItem(item.id)}
              >
                <Ionicons name="trash-outline" size={16} color="#ef4444" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  const pendingCount = counts.pending + counts.in_progress;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/60 justify-end">
        <View className="bg-vendora-card rounded-t-3xl max-h-[80%]">
          {/* Header */}
          <View className="flex-row items-center justify-between p-4 border-b border-white/10">
            <Text className="text-vendora-text text-lg font-bold">Sync Queue</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#71717a" />
            </TouchableOpacity>
          </View>

          {/* Status Summary */}
          <View className="flex-row px-4 py-3 gap-3">
            <View className="flex-1 bg-vendora-input rounded-xl p-3 items-center">
              <Text className="text-vendora-purple text-xl font-bold">{pendingCount}</Text>
              <Text className="text-vendora-text-muted text-xs">Pending</Text>
            </View>
            <View className="flex-1 bg-vendora-input rounded-xl p-3 items-center">
              <Text className="text-green-400 text-xl font-bold">{counts.completed}</Text>
              <Text className="text-vendora-text-muted text-xs">Completed</Text>
            </View>
            <View className="flex-1 bg-vendora-input rounded-xl p-3 items-center">
              <Text className="text-red-400 text-xl font-bold">{counts.dead}</Text>
              <Text className="text-vendora-text-muted text-xs">Failed</Text>
            </View>
          </View>

          {/* Tabs */}
          <View className="flex-row px-4 gap-2 mb-2">
            <TouchableOpacity
              className={`flex-1 py-2 rounded-lg items-center ${activeTab === 'pending' ? 'bg-vendora-purple' : 'bg-vendora-input'}`}
              onPress={() => setActiveTab('pending')}
            >
              <Text className={`text-sm font-medium ${activeTab === 'pending' ? 'text-white' : 'text-vendora-text-muted'}`}>
                Pending ({pendingCount})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 py-2 rounded-lg items-center ${activeTab === 'failed' ? 'bg-red-500' : 'bg-vendora-input'}`}
              onPress={() => setActiveTab('failed')}
            >
              <Text className={`text-sm font-medium ${activeTab === 'failed' ? 'text-white' : 'text-vendora-text-muted'}`}>
                Failed ({counts.dead})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Items List */}
          <ScrollView className="px-4" style={{ maxHeight: 300 }}>
            {activeTab === 'pending' ? (
              pendingItems.length > 0 ? (
                pendingItems.map((item) => renderItem(item, false))
              ) : (
                <View className="items-center py-8">
                  <Ionicons name="checkmark-circle-outline" size={40} color="#22c55e" />
                  <Text className="text-vendora-text-muted mt-2">No pending items</Text>
                </View>
              )
            ) : (
              deadItems.length > 0 ? (
                deadItems.map((item) => renderItem(item, true))
              ) : (
                <View className="items-center py-8">
                  <Ionicons name="checkmark-circle-outline" size={40} color="#22c55e" />
                  <Text className="text-vendora-text-muted mt-2">No failed items</Text>
                </View>
              )
            )}
          </ScrollView>

          {/* Actions */}
          <View className="p-4 gap-2 border-t border-white/10">
            {activeTab === 'failed' && deadItems.length > 0 && (
              <TouchableOpacity
                className="bg-blue-500 py-3 rounded-xl items-center flex-row justify-center gap-2"
                onPress={handleRetryAll}
                disabled={retrying}
              >
                {retrying ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="refresh-outline" size={18} color="#fff" />
                )}
                <Text className="text-white font-semibold">Retry All Failed</Text>
              </TouchableOpacity>
            )}
            {activeTab === 'pending' && pendingCount > 0 && (
              <TouchableOpacity
                className="bg-vendora-purple py-3 rounded-xl items-center flex-row justify-center gap-2"
                onPress={handleSyncNow}
                disabled={retrying || !isOnline}
              >
                {retrying ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="sync-outline" size={18} color="#fff" />
                )}
                <Text className="text-white font-semibold">
                  {isOnline ? 'Sync Now' : 'Offline — Cannot Sync'}
                </Text>
              </TouchableOpacity>
            )}
            {counts.completed > 0 && (
              <TouchableOpacity
                className="bg-vendora-input py-3 rounded-xl items-center"
                onPress={handleCleanCompleted}
              >
                <Text className="text-vendora-text-muted font-medium">Clear Completed</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}
