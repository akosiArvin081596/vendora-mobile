import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import thermalPrinterService from '../services/thermalPrinterService';

export default function BluetoothPrinterModal({ visible, onClose, onConnected }) {
  const [devices, setDevices] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [connecting, setConnecting] = useState(null);
  const [connectedAddress, setConnectedAddress] = useState(null);

  useEffect(() => {
    if (visible) {
      loadLastPrinter();
    }
  }, [visible]);

  const loadLastPrinter = async () => {
    const last = await thermalPrinterService.getLastPrinter();
    if (last) {
      setConnectedAddress(last);
    }
  };

  const handleScan = async () => {
    if (!thermalPrinterService.isAvailable()) {
      Alert.alert(
        'Not Available',
        'Bluetooth printer module is not available. Please use a development build instead of Expo Go.'
      );
      return;
    }

    setScanning(true);
    setDevices([]);
    try {
      const found = await thermalPrinterService.getPairedDevices();
      setDevices(found);
      if (found.length === 0) {
        Alert.alert('No Devices', 'No paired Bluetooth devices found. Pair your printer in your phone Bluetooth settings first.');
      }
    } catch (error) {
      Alert.alert('Scan Error', error.message || 'Failed to scan for devices.');
    } finally {
      setScanning(false);
    }
  };

  const handleConnect = async (device) => {
    setConnecting(device.address);
    try {
      await thermalPrinterService.connect(device.address);
      setConnectedAddress(device.address);
      Alert.alert('Connected', `Connected to ${device.name || device.address}`);
      if (onConnected) {
        onConnected(device);
      }
    } catch (error) {
      Alert.alert('Connection Failed', error.message || 'Could not connect to printer.');
    } finally {
      setConnecting(null);
    }
  };

  const handleDisconnect = async () => {
    await thermalPrinterService.disconnect();
    setConnectedAddress(null);
  };

  const renderDevice = ({ item }) => {
    const isConnected = connectedAddress === item.address;
    const isConnecting = connecting === item.address;

    return (
      <TouchableOpacity
        className={`flex-row items-center p-4 rounded-xl mb-2 ${
          isConnected ? 'bg-green-500/20 border border-green-500/40' : 'bg-vendora-input'
        }`}
        onPress={() => (isConnected ? handleDisconnect() : handleConnect(item))}
        disabled={isConnecting}
      >
        <Ionicons
          name={isConnected ? 'bluetooth-outline' : 'print-outline'}
          size={24}
          color={isConnected ? '#22c55e' : '#a855f7'}
        />
        <View className="flex-1 ml-3">
          <Text className="text-vendora-text font-medium">
            {item.name || 'Unknown Device'}
          </Text>
          <Text className="text-vendora-text-muted text-xs">{item.address}</Text>
        </View>
        {isConnecting ? (
          <ActivityIndicator size="small" color="#a855f7" />
        ) : isConnected ? (
          <Text className="text-green-400 text-xs font-medium">Connected</Text>
        ) : (
          <Ionicons name="chevron-forward" size={18} color="#71717a" />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-black/70 justify-end">
        <View className="bg-vendora-card rounded-t-3xl max-h-[80%]">
          {/* Header */}
          <View className="flex-row items-center justify-between p-5 border-b border-vendora-border">
            <Text className="text-vendora-text text-lg font-bold">
              Bluetooth Printer
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#e5e5e5" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View className="p-5">
            {/* Scan Button */}
            <TouchableOpacity
              className="bg-vendora-purple py-3 rounded-xl flex-row items-center justify-center gap-2 mb-4"
              onPress={handleScan}
              disabled={scanning}
            >
              {scanning ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="search-outline" size={18} color="#fff" />
              )}
              <Text className="text-white font-semibold">
                {scanning ? 'Loading...' : 'Find Paired Printers'}
              </Text>
            </TouchableOpacity>

            {/* Device List */}
            {devices.length > 0 ? (
              <FlatList
                data={devices}
                keyExtractor={(item) => item.address}
                renderItem={renderDevice}
                style={{ maxHeight: 300 }}
              />
            ) : !scanning ? (
              <View className="items-center py-8">
                <Ionicons name="bluetooth-outline" size={48} color="#71717a" />
                <Text className="text-vendora-text-muted text-center mt-3">
                  Tap "Find Paired Printers" to see your paired Bluetooth printers.
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>
    </Modal>
  );
}
