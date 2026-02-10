import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function StockUpdateModal({
  visible,
  onClose,
  product,
  onUpdateStock,
}) {
  const [adjustmentType, setAdjustmentType] = useState('add');
  const [quantity, setQuantity] = useState('');
  const [unitCost, setUnitCost] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (visible) {
      setAdjustmentType('add');
      setQuantity('');
      setUnitCost('');
      setNotes('');
    }
  }, [visible]);

  const handleSubmit = () => {
    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      Alert.alert('Invalid Quantity', 'Please enter a valid quantity greater than 0');
      return;
    }

    if (adjustmentType === 'add' && unitCost.trim() && (isNaN(parseFloat(unitCost)) || parseFloat(unitCost) < 0)) {
      Alert.alert('Invalid Cost', 'Please enter a valid unit cost');
      return;
    }

    const adjustment = adjustmentType === 'add' ? qty : -qty;
    const newStock = product.stock + adjustment;

    if (newStock < 0) {
      Alert.alert('Invalid Adjustment', 'Cannot reduce stock below 0');
      return;
    }

    const costValue = adjustmentType === 'add' && unitCost.trim() ? parseFloat(unitCost) : null;
    onUpdateStock(product.id, adjustment, notes, costValue);
    Alert.alert(
      'Stock Updated',
      `${product.name} stock ${adjustmentType === 'add' ? 'increased' : 'decreased'} by ${qty}. New stock: ${newStock}`
    );
    onClose();
  };

  if (!product) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <TouchableOpacity
          className="flex-1 bg-black/70 items-center justify-center px-4"
          activeOpacity={1}
          onPress={onClose}
        >
          <TouchableOpacity
            activeOpacity={1}
            className="bg-vendora-card rounded-3xl w-full max-w-md p-6"
            onPress={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <View className="flex-row items-center justify-between mb-5">
              <Text className="text-vendora-text font-semibold text-xl">
                Update Stock
              </Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color="#e5e5e5" />
              </TouchableOpacity>
            </View>

            {/* Product Info */}
            <View className="bg-vendora-input rounded-2xl p-4 mb-4">
              <Text className="text-vendora-text font-semibold text-lg">
                {product.name}
              </Text>
              <Text className="text-vendora-muted text-sm mt-1">
                SKU: {product.sku}
              </Text>
              <View className="flex-row items-center mt-2">
                <Text className="text-vendora-muted text-sm">Current Stock: </Text>
                <Text className={`font-bold text-lg ${
                  product.stock === 0
                    ? 'text-red-500'
                    : product.stock <= 10
                    ? 'text-yellow-500'
                    : 'text-green-500'
                }`}>
                  {product.stock} {product.unit}
                </Text>
              </View>
            </View>

            {/* Adjustment Type */}
            <Text className="text-vendora-muted text-sm mb-2">Adjustment Type</Text>
            <View className="flex-row gap-3 mb-4">
              <TouchableOpacity
                className={`flex-1 flex-row items-center justify-center gap-2 py-3 rounded-xl ${
                  adjustmentType === 'add'
                    ? 'bg-green-500/20 border-2 border-green-500'
                    : 'bg-vendora-input'
                }`}
                onPress={() => setAdjustmentType('add')}
              >
                <Ionicons
                  name="add-circle"
                  size={20}
                  color={adjustmentType === 'add' ? '#22c55e' : '#9ca3af'}
                />
                <Text className={`font-semibold ${
                  adjustmentType === 'add' ? 'text-green-500' : 'text-vendora-muted'
                }`}>
                  Stock In
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-1 flex-row items-center justify-center gap-2 py-3 rounded-xl ${
                  adjustmentType === 'subtract'
                    ? 'bg-red-500/20 border-2 border-red-500'
                    : 'bg-vendora-input'
                }`}
                onPress={() => setAdjustmentType('subtract')}
              >
                <Ionicons
                  name="remove-circle"
                  size={20}
                  color={adjustmentType === 'subtract' ? '#ef4444' : '#9ca3af'}
                />
                <Text className={`font-semibold ${
                  adjustmentType === 'subtract' ? 'text-red-500' : 'text-vendora-muted'
                }`}>
                  Stock Out
                </Text>
              </TouchableOpacity>
            </View>

            {/* Quantity Input */}
            <Text className="text-vendora-muted text-sm mb-2">Quantity</Text>
            <View className="flex-row items-center gap-3 bg-vendora-input rounded-xl px-4 py-3 mb-4">
              <Ionicons name="cube-outline" size={20} color="#a855f7" />
              <TextInput
                className="flex-1 text-lg"
                style={{ color: '#e5e5e5' }}
                placeholder="Enter quantity"
                placeholderTextColor="#9ca3af"
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="numeric"
                autoFocus={true}
              />
              <Text className="text-vendora-muted">{product.unit}</Text>
            </View>

            {/* Unit Cost Input (only for Stock In) */}
            {adjustmentType === 'add' && (
              <>
                <Text className="text-vendora-muted text-sm mb-2">Unit Cost / Acquisition Price (Optional)</Text>
                <View className="flex-row items-center gap-3 bg-vendora-input rounded-xl px-4 py-3 mb-4">
                  <Ionicons name="cash-outline" size={20} color="#a855f7" />
                  <Text style={{ color: '#9ca3af', fontSize: 16 }}>₱</Text>
                  <TextInput
                    className="flex-1 text-lg"
                    style={{ color: '#e5e5e5' }}
                    placeholder="0.00"
                    placeholderTextColor="#9ca3af"
                    value={unitCost}
                    onChangeText={setUnitCost}
                    keyboardType="decimal-pad"
                  />
                </View>
              </>
            )}

            {/* Notes Input */}
            <Text className="text-vendora-muted text-sm mb-2">Notes (Optional)</Text>
            <View className="flex-row items-start gap-3 bg-vendora-input rounded-xl px-4 py-3 mb-6">
              <Ionicons name="document-text-outline" size={20} color="#a855f7" style={{ marginTop: 2 }} />
              <TextInput
                className="flex-1 text-base"
                style={{ color: '#e5e5e5' }}
                placeholder="Reason for adjustment..."
                placeholderTextColor="#9ca3af"
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={2}
              />
            </View>

            {/* Preview */}
            <View className="bg-vendora-purple/10 rounded-xl p-4 mb-6">
              <Text className="text-vendora-muted text-sm text-center">
                New stock after adjustment:
              </Text>
              <Text className="text-vendora-purple-light text-2xl font-bold text-center mt-1">
                {quantity
                  ? Math.max(
                      0,
                      product.stock + (adjustmentType === 'add' ? parseInt(quantity, 10) || 0 : -(parseInt(quantity, 10) || 0))
                    )
                  : product.stock}{' '}
                {product.unit}
              </Text>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
            className={`py-4 rounded-2xl flex-row items-center justify-center gap-2 ${
              adjustmentType === 'add' ? 'bg-green-500' : 'bg-red-500'
            }`}
            onPress={handleSubmit}
            style={
              Platform.OS === 'web'
                ? { boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.25)' }
                : { elevation: 8 }
            }
          >
              <Ionicons
                name={adjustmentType === 'add' ? 'add-circle' : 'remove-circle'}
                size={20}
                color="#fff"
              />
              <Text className="text-white font-semibold text-lg">
                {adjustmentType === 'add' ? 'Add Stock' : 'Remove Stock'}
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
}
