import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatCurrency } from '../utils/checkoutHelpers';

export default function SaveCartModal({
  visible,
  onClose,
  onSave,
  itemCount,
  totalValue,
}) {
  const [cartName, setCartName] = useState('');

  const handleSave = () => {
    const trimmedName = cartName.trim();
    if (!trimmedName) {
      Alert.alert('Name Required', 'Please enter a name for this cart');
      return;
    }

    const success = onSave(trimmedName);
    if (success) {
      setCartName('');
      onClose();
      Alert.alert('Cart Saved', `"${trimmedName}" has been saved successfully`);
    }
  };

  const handleClose = () => {
    setCartName('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <TouchableOpacity
        className="flex-1 bg-black/70 items-center justify-center px-4"
        activeOpacity={1}
        onPress={handleClose}
      >
        <TouchableOpacity
          activeOpacity={1}
          className="bg-vendora-card rounded-3xl w-full max-w-md p-6"
        >
          {/* Header */}
          <View className="flex-row items-center justify-between mb-5">
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 bg-vendora-purple/20 rounded-xl items-center justify-center">
                <Ionicons name="bookmark" size={20} color="#a855f7" />
              </View>
              <Text className="text-vendora-text font-semibold text-xl">
                Save Cart
              </Text>
            </View>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={24} color="#e5e5e5" />
            </TouchableOpacity>
          </View>

          {/* Cart Summary */}
          <View className="bg-vendora-input rounded-xl p-4 mb-4">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-vendora-text-muted text-sm">Items</Text>
              <Text className="text-vendora-text font-medium">{itemCount}</Text>
            </View>
            <View className="flex-row items-center justify-between">
              <Text className="text-vendora-text-muted text-sm">Total Value</Text>
              <Text className="text-vendora-purple-light font-semibold">
                {formatCurrency(totalValue)}
              </Text>
            </View>
          </View>

          {/* Name Input */}
          <View className="mb-4">
            <Text className="text-vendora-text font-medium text-sm mb-2">
              Cart Name
            </Text>
            <View className="flex-row items-center gap-3 bg-vendora-input rounded-2xl px-4 py-4">
              <Ionicons name="create-outline" size={20} color="#9ca3af" />
              <TextInput
                className="flex-1 text-vendora-text text-base"
                placeholder="e.g., Weekly Groceries, John's Order"
                placeholderTextColor="#6b7280"
                value={cartName}
                onChangeText={setCartName}
                autoFocus={true}
                maxLength={50}
              />
            </View>
          </View>

          {/* Buttons */}
          <View className="flex-row gap-3">
            <TouchableOpacity
              className="flex-1 bg-vendora-input py-4 rounded-2xl items-center"
              onPress={handleClose}
            >
              <Text className="text-vendora-text font-medium">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 bg-vendora-purple py-4 rounded-2xl flex-row items-center justify-center gap-2"
              onPress={handleSave}
              style={{ shadowColor: '#9333ea', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 }}
            >
              <Ionicons name="bookmark" size={18} color="#fff" />
              <Text className="text-white font-semibold">Save</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}
