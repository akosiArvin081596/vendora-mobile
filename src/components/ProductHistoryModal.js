import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatCurrency, formatDateTime } from '../utils/checkoutHelpers';
import LedgerRepository from '../db/repositories/LedgerRepository';

const TYPE_STYLES = {
  stock_in: {
    icon: 'arrow-down-circle',
    color: '#22c55e',
    bg: 'bg-green-500/20',
    text: 'text-green-400',
    label: 'Stock In',
  },
  stock_out: {
    icon: 'arrow-up-circle',
    color: '#ef4444',
    bg: 'bg-red-500/20',
    text: 'text-red-400',
    label: 'Stock Out',
  },
  sale: {
    icon: 'cash',
    color: '#22c55e',
    bg: 'bg-green-500/20',
    text: 'text-green-400',
    label: 'Sale',
  },
  expense: {
    icon: 'receipt',
    color: '#ef4444',
    bg: 'bg-red-500/20',
    text: 'text-red-400',
    label: 'Expense',
  },
  adjustment: {
    icon: 'swap-horizontal',
    color: '#eab308',
    bg: 'bg-yellow-500/20',
    text: 'text-yellow-400',
    label: 'Adjustment',
  },
  return: {
    icon: 'return-down-back',
    color: '#3b82f6',
    bg: 'bg-blue-500/20',
    text: 'text-blue-400',
    label: 'Return',
  },
};

export default function ProductHistoryModal({ visible, onClose, product }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && product) {
      fetchHistory();
    }
    if (!visible) {
      setEntries([]);
    }
  }, [visible, product]);

  const fetchHistory = () => {
    setLoading(true);
    try {
      const rows = LedgerRepository.getAll({ product_id: product.id });
      setEntries(rows);
    } catch (error) {
      console.error('Failed to fetch product history:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!product) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        className="flex-1 bg-black/70 items-center justify-center px-4"
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          activeOpacity={1}
          className="bg-vendora-card rounded-3xl w-full max-w-md"
          style={{ maxHeight: '80%' }}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between p-6 pb-0">
            <Text className="text-vendora-text font-semibold text-xl">
              Product History
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#e5e5e5" />
            </TouchableOpacity>
          </View>

          {/* Product Info */}
          <View className="bg-vendora-input rounded-2xl p-4 mx-6 mt-4">
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

          {/* Entries */}
          {loading ? (
            <View className="items-center justify-center py-12">
              <ActivityIndicator size="large" color="#a855f7" />
              <Text className="text-vendora-muted mt-3">Loading history...</Text>
            </View>
          ) : entries.length > 0 ? (
            <ScrollView
              className="px-6 mt-4"
              contentContainerStyle={{ paddingBottom: 24 }}
              showsVerticalScrollIndicator={false}
            >
              <Text className="text-vendora-muted text-sm mb-3">
                {entries.length} entr{entries.length !== 1 ? 'ies' : 'y'}
              </Text>
              {entries.map((entry) => {
                const style = TYPE_STYLES[entry.type] || TYPE_STYLES.adjustment;
                const isInventory = entry.category === 'inventory';

                return (
                  <View
                    key={entry.id}
                    className="bg-vendora-input rounded-2xl p-3 mb-2"
                  >
                    <View className="flex-row items-start gap-3">
                      <View className={`w-9 h-9 rounded-xl items-center justify-center ${style.bg}`}>
                        <Ionicons name={style.icon} size={18} color={style.color} />
                      </View>
                      <View className="flex-1">
                        <View className="flex-row items-center justify-between mb-1">
                          <Text className="text-vendora-text font-semibold text-sm flex-1" numberOfLines={1}>
                            {entry.description}
                          </Text>
                          {isInventory ? (
                            <Text className={`font-bold text-sm ${entry.quantity >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {entry.quantity >= 0 ? '+' : ''}{entry.quantity}
                            </Text>
                          ) : (
                            <Text className={`font-bold text-sm ${entry.amount >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {entry.amount >= 0 ? '+' : ''}₱ {formatCurrency(Math.abs(entry.amount) / 100)}
                            </Text>
                          )}
                        </View>
                        <View className="flex-row items-center gap-2">
                          <View className={`px-2 py-0.5 rounded ${style.bg}`}>
                            <Text className={`text-xs font-medium ${style.text}`}>{style.label}</Text>
                          </View>
                          {entry.balance_qty !== undefined && entry.balance_qty !== null && (
                            <Text className="text-vendora-muted text-xs">
                              Bal: {entry.balance_qty}
                            </Text>
                          )}
                        </View>
                        <View className="flex-row items-center justify-between mt-1.5">
                          {entry.reference ? (
                            <Text className="text-vendora-muted text-xs">
                              Ref: {entry.reference}
                            </Text>
                          ) : (
                            <View />
                          )}
                          <Text className="text-vendora-muted text-xs">
                            {formatDateTime(new Date(entry.created_at))}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          ) : (
            <View className="items-center justify-center py-12 px-6">
              <View className="w-16 h-16 bg-vendora-input rounded-full items-center justify-center mb-3">
                <Ionicons name="book-outline" size={32} color="#6b7280" />
              </View>
              <Text className="text-vendora-text font-semibold text-base mb-1">
                No history
              </Text>
              <Text className="text-vendora-muted text-center text-sm">
                Ledger entries for this product will appear here
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}
