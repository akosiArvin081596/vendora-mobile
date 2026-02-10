import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ENTRY_TYPES = [
  { id: 'stock_in', label: 'Stock In', icon: 'arrow-down-circle', color: '#22c55e' },
  { id: 'expense', label: 'Expense', icon: 'arrow-up-circle', color: '#ef4444' },
];

export default function AddLedgerEntryModal({
  visible,
  onClose,
  onSubmit,
  products = [],
}) {
  const [type, setType] = useState('stock_in');
  const [productId, setProductId] = useState(null);
  const [productSearch, setProductSearch] = useState('');
  const [quantity, setQuantity] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [reference, setReference] = useState('');
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const selectedProduct = products.find((p) => p.id === productId);

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  const resetForm = () => {
    setType('stock_in');
    setProductId(null);
    setProductSearch('');
    setQuantity('');
    setAmount('');
    setDescription('');
    setReference('');
    setShowProductPicker(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    if (!description.trim()) {
      Alert.alert('Required', 'Please enter a description');
      return;
    }

    if (type === 'stock_in') {
      if (!productId) {
        Alert.alert('Required', 'Please select a product');
        return;
      }
      if (!quantity || parseInt(quantity, 10) < 1) {
        Alert.alert('Required', 'Please enter a valid quantity');
        return;
      }
    }

    if (type === 'expense') {
      if (!amount || parseInt(amount, 10) < 1) {
        Alert.alert('Required', 'Please enter a valid amount');
        return;
      }
    }

    setSubmitting(true);
    try {
      const data = {
        type,
        description: description.trim(),
        reference: reference.trim() || undefined,
      };

      if (type === 'stock_in') {
        data.product_id = productId;
        data.quantity = parseInt(quantity, 10);
      } else {
        data.amount = parseInt(amount, 10);
      }

      await onSubmit(data);
      handleClose();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to create entry');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View className="flex-1 bg-black/60">
        <TouchableOpacity className="flex-[0.15]" onPress={handleClose} />

        <View className="flex-[0.85] bg-vendora-card rounded-t-3xl">
          {/* Drag Handle */}
          <TouchableOpacity className="items-center py-3" onPress={handleClose}>
            <View className="w-12 h-1.5 bg-vendora-border rounded-full" />
          </TouchableOpacity>

          {/* Header */}
          <View className="flex-row items-center justify-between px-5 pb-4 border-b border-vendora-border">
            <View>
              <Text className="text-vendora-text font-bold text-xl">
                Add Entry
              </Text>
              <Text className="text-vendora-text-muted text-sm">
                Manual ledger entry
              </Text>
            </View>
            <TouchableOpacity
              className="w-10 h-10 bg-vendora-input rounded-full items-center justify-center"
              onPress={handleClose}
            >
              <Ionicons name="close" size={20} color="#e5e5e5" />
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 px-5 pt-4" showsVerticalScrollIndicator={false}>
            {/* Type Selector */}
            <Text className="text-vendora-text font-semibold mb-3">Type</Text>
            <View className="flex-row gap-3 mb-5">
              {ENTRY_TYPES.map((t) => (
                <TouchableOpacity
                  key={t.id}
                  className={`flex-1 flex-row items-center gap-2 p-4 rounded-xl ${
                    type === t.id ? 'bg-vendora-purple/20 border border-vendora-purple' : 'bg-vendora-bg'
                  }`}
                  onPress={() => setType(t.id)}
                >
                  <Ionicons name={t.icon} size={24} color={type === t.id ? '#a855f7' : t.color} />
                  <Text className={`font-medium ${type === t.id ? 'text-vendora-purple-light' : 'text-vendora-text'}`}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Product Picker (for stock_in) */}
            {type === 'stock_in' && (
              <>
                <Text className="text-vendora-text font-semibold mb-3">Product</Text>
                <TouchableOpacity
                  className="bg-vendora-bg rounded-xl px-4 py-3 mb-2"
                  onPress={() => setShowProductPicker(!showProductPicker)}
                >
                  <Text className={selectedProduct ? 'text-vendora-text' : 'text-vendora-text-muted'}>
                    {selectedProduct ? selectedProduct.name : 'Select a product...'}
                  </Text>
                </TouchableOpacity>

                {showProductPicker && (
                  <View className="bg-vendora-bg rounded-xl mb-3 max-h-48">
                    <View className="flex-row items-center gap-2 px-3 py-2 border-b border-vendora-border">
                      <Ionicons name="search" size={16} color="#9ca3af" />
                      <TextInput
                        className="flex-1 text-vendora-text text-sm"
                        placeholder="Search products..."
                        placeholderTextColor="#9ca3af"
                        value={productSearch}
                        onChangeText={setProductSearch}
                      />
                    </View>
                    <ScrollView nestedScrollEnabled className="max-h-36">
                      {filteredProducts.map((p) => (
                        <TouchableOpacity
                          key={p.id}
                          className={`px-4 py-3 border-b border-vendora-border ${
                            productId === p.id ? 'bg-vendora-purple/10' : ''
                          }`}
                          onPress={() => {
                            setProductId(p.id);
                            setShowProductPicker(false);
                            setProductSearch('');
                          }}
                        >
                          <Text className="text-vendora-text text-sm">{p.name}</Text>
                          <Text className="text-vendora-text-muted text-xs">
                            Stock: {p.stock} | SKU: {p.sku || 'N/A'}
                          </Text>
                        </TouchableOpacity>
                      ))}
                      {filteredProducts.length === 0 && (
                        <Text className="text-vendora-text-muted text-sm px-4 py-3">
                          No products found
                        </Text>
                      )}
                    </ScrollView>
                  </View>
                )}

                <Text className="text-vendora-text font-semibold mb-3 mt-2">Quantity</Text>
                <TextInput
                  className="bg-vendora-bg rounded-xl px-4 py-3 text-vendora-text mb-5"
                  placeholder="Enter quantity"
                  placeholderTextColor="#9ca3af"
                  keyboardType="numeric"
                  value={quantity}
                  onChangeText={setQuantity}
                />
              </>
            )}

            {/* Amount (for expense) */}
            {type === 'expense' && (
              <>
                <Text className="text-vendora-text font-semibold mb-3">Amount</Text>
                <TextInput
                  className="bg-vendora-bg rounded-xl px-4 py-3 text-vendora-text mb-5"
                  placeholder="Enter amount (in cents)"
                  placeholderTextColor="#9ca3af"
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={setAmount}
                />
              </>
            )}

            {/* Description */}
            <Text className="text-vendora-text font-semibold mb-3">Description</Text>
            <TextInput
              className="bg-vendora-bg rounded-xl px-4 py-3 text-vendora-text mb-5"
              placeholder="Enter description"
              placeholderTextColor="#9ca3af"
              value={description}
              onChangeText={setDescription}
              multiline
            />

            {/* Reference */}
            <Text className="text-vendora-text font-semibold mb-3">Reference (optional)</Text>
            <TextInput
              className="bg-vendora-bg rounded-xl px-4 py-3 text-vendora-text mb-5"
              placeholder="e.g. PO-001, INV-123"
              placeholderTextColor="#9ca3af"
              value={reference}
              onChangeText={setReference}
            />

            <View className="h-8" />
          </ScrollView>

          {/* Submit Button */}
          <View className="px-5 pb-8 pt-4 border-t border-vendora-border">
            <TouchableOpacity
              className={`py-4 rounded-2xl flex-row items-center justify-center gap-2 ${
                submitting ? 'bg-vendora-purple/50' : 'bg-vendora-purple'
              }`}
              onPress={handleSubmit}
              disabled={submitting}
            >
              <Ionicons name="add-circle" size={20} color="white" />
              <Text className="text-white font-semibold">
                {submitting ? 'Creating...' : 'Add Entry'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
