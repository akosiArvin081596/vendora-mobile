import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import BluetoothPrinterModal from '../components/BluetoothPrinterModal';
import thermalPrinterService from '../services/thermalPrinterService';

export default function SettingsScreen() {
  const [showPrinterModal, setShowPrinterModal] = useState(false);
  const [lastPrinter, setLastPrinter] = useState(null);

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

  return (
    <SafeAreaView className="flex-1 bg-vendora-bg">
      <ScrollView className="flex-1 px-5 py-4">
        <Text className="text-vendora-text text-2xl font-bold mb-6">Settings</Text>

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

        {/* Placeholder for future settings */}
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
    </SafeAreaView>
  );
}
