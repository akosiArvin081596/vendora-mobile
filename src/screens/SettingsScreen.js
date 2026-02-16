import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import BluetoothPrinterModal from '../components/BluetoothPrinterModal';
import SyncQueueModal from '../components/SyncQueueModal';
import thermalPrinterService from '../services/thermalPrinterService';
import { useSync } from '../context/SyncContext';
import { useNetwork } from '../context/NetworkContext';
import SyncManager from '../sync/SyncManager';

export default function SettingsScreen() {
  const [showPrinterModal, setShowPrinterModal] = useState(false);
  const [showSyncQueue, setShowSyncQueue] = useState(false);
  const [lastPrinter, setLastPrinter] = useState(null);
  const [syncing, setSyncing] = useState(false);

  const { counts, lastSyncedAt, processQueue, hasPendingWork, hasDeadItems } = useSync();
  const { isOnline } = useNetwork();

  useEffect(() => {
    loadPrinterInfo();
  }, []);

  const loadPrinterInfo = async () => {
    const address = await thermalPrinterService.getLastPrinter();
    setLastPrinter(address);
  };

  const handlePrinterConnected = (device) => {
    setShowPrinterModal(false);
    setLastPrinter(device.address);
  };

  const handleManualSync = async () => {
    if (!isOnline) {
      Alert.alert('Offline', 'Cannot sync while offline.');
      return;
    }
    setSyncing(true);
    try {
      await processQueue();
    } finally {
      setSyncing(false);
    }
  };

  const handleClearLocalData = () => {
    Alert.alert(
      'Clear Local Data',
      'This will clear all cached data and sync queue. You will need to re-sync from the server. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            SyncManager.clearAllLocalData();
            Alert.alert('Done', 'Local data cleared. Data will re-sync on next refresh.');
          },
        },
      ]
    );
  };

  const pendingCount = counts.pending + counts.in_progress;

  const getSyncStatusText = () => {
    if (!isOnline) return 'Offline';
    if (syncing) return 'Syncing...';
    if (hasDeadItems) return `${counts.dead} failed`;
    if (hasPendingWork) return `${pendingCount} pending`;
    return 'All synced';
  };

  const getSyncStatusColor = () => {
    if (!isOnline) return '#eab308';
    if (hasDeadItems) return '#ef4444';
    if (hasPendingWork) return '#a855f7';
    return '#22c55e';
  };

  const formatLastSynced = () => {
    if (!lastSyncedAt) return 'Never';
    const date = new Date(lastSyncedAt);
    const now = new Date();
    const diffMs = now - date;
    const diffMin = Math.floor(diffMs / 60000);

    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <SafeAreaView className="flex-1 bg-vendora-bg">
      <ScrollView className="flex-1 px-5 py-4">
        <Text className="text-vendora-text text-2xl font-bold mb-6">Settings</Text>

        {/* Sync Section */}
        <View className="mb-6">
          <Text className="text-vendora-text-muted text-xs font-semibold uppercase tracking-wider mb-3">
            Sync
          </Text>

          {/* Sync Status Card */}
          <View className="bg-vendora-card p-4 rounded-2xl mb-3">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center gap-2">
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: getSyncStatusColor(),
                  }}
                />
                <Text className="text-vendora-text font-medium">
                  {getSyncStatusText()}
                </Text>
              </View>
              <Text className="text-vendora-text-muted text-xs">
                Last: {formatLastSynced()}
              </Text>
            </View>

            {/* Counts Row */}
            <View className="flex-row gap-3">
              <View className="flex-1 bg-vendora-input rounded-xl p-2.5 items-center">
                <Text className="text-vendora-purple font-bold">{pendingCount}</Text>
                <Text className="text-vendora-text-muted text-xs">Pending</Text>
              </View>
              <View className="flex-1 bg-vendora-input rounded-xl p-2.5 items-center">
                <Text className="text-green-400 font-bold">{counts.completed}</Text>
                <Text className="text-vendora-text-muted text-xs">Synced</Text>
              </View>
              <View className="flex-1 bg-vendora-input rounded-xl p-2.5 items-center">
                <Text className="text-red-400 font-bold">{counts.dead}</Text>
                <Text className="text-vendora-text-muted text-xs">Failed</Text>
              </View>
            </View>
          </View>

          {/* Sync Actions */}
          <TouchableOpacity
            className="bg-vendora-card p-4 rounded-2xl flex-row items-center mb-2"
            onPress={handleManualSync}
            disabled={syncing || !isOnline}
          >
            <View className="w-10 h-10 bg-blue-500/20 rounded-xl items-center justify-center">
              {syncing ? (
                <ActivityIndicator size="small" color="#3b82f6" />
              ) : (
                <Ionicons name="sync-outline" size={22} color="#3b82f6" />
              )}
            </View>
            <View className="flex-1 ml-3">
              <Text className="text-vendora-text font-medium">Sync Now</Text>
              <Text className="text-vendora-text-muted text-xs mt-0.5">
                {isOnline ? 'Push pending changes to server' : 'Not available offline'}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-vendora-card p-4 rounded-2xl flex-row items-center mb-2"
            onPress={() => setShowSyncQueue(true)}
          >
            <View className="w-10 h-10 bg-vendora-purple/20 rounded-xl items-center justify-center">
              <Ionicons name="list-outline" size={22} color="#a855f7" />
            </View>
            <View className="flex-1 ml-3">
              <Text className="text-vendora-text font-medium">View Sync Queue</Text>
              <Text className="text-vendora-text-muted text-xs mt-0.5">
                Manage pending and failed items
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#71717a" />
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-vendora-card p-4 rounded-2xl flex-row items-center"
            onPress={handleClearLocalData}
          >
            <View className="w-10 h-10 bg-red-500/20 rounded-xl items-center justify-center">
              <Ionicons name="trash-outline" size={22} color="#ef4444" />
            </View>
            <View className="flex-1 ml-3">
              <Text className="text-vendora-text font-medium">Clear Local Data</Text>
              <Text className="text-vendora-text-muted text-xs mt-0.5">
                Remove cached data and re-sync
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Printer Section */}
        <View className="mb-6">
          <Text className="text-vendora-text-muted text-xs font-semibold uppercase tracking-wider mb-3">
            Printer
          </Text>
          <TouchableOpacity
            className="bg-vendora-card p-4 rounded-2xl flex-row items-center"
            onPress={() => setShowPrinterModal(true)}
          >
            <View className="w-10 h-10 bg-vendora-purple/20 rounded-xl items-center justify-center">
              <Ionicons name="print-outline" size={22} color="#a855f7" />
            </View>
            <View className="flex-1 ml-3">
              <Text className="text-vendora-text font-medium">Thermal Printer</Text>
              {lastPrinter ? (
                <Text className="text-green-400 text-xs mt-0.5">
                  Last connected: {lastPrinter}
                </Text>
              ) : (
                <Text className="text-vendora-text-muted text-xs mt-0.5">
                  No printer paired
                </Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={18} color="#71717a" />
          </TouchableOpacity>
        </View>

        {/* General Section */}
        <View className="mb-6">
          <Text className="text-vendora-text-muted text-xs font-semibold uppercase tracking-wider mb-3">
            General
          </Text>
          <View className="bg-vendora-card p-6 rounded-2xl items-center">
            <Ionicons name="settings-outline" size={48} color="#71717a" />
            <Text className="text-vendora-text-muted text-center mt-3">
              More settings coming soon.
            </Text>
          </View>
        </View>
      </ScrollView>

      <BluetoothPrinterModal
        visible={showPrinterModal}
        onClose={() => setShowPrinterModal(false)}
        onConnected={handlePrinterConnected}
      />

      <SyncQueueModal
        visible={showSyncQueue}
        onClose={() => setShowSyncQueue(false)}
      />
    </SafeAreaView>
  );
}
