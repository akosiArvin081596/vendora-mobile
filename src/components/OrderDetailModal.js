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
import { formatCurrency, formatDateTime } from '../utils/checkoutHelpers';

const PAYMENT_METHOD_LABELS = {
  cash: { label: 'Cash', icon: 'cash-outline' },
  card: { label: 'Card', icon: 'card-outline' },
  ewallet: { label: 'E-Wallet', icon: 'wallet-outline' },
};

const STATUS_STYLES = {
  completed: {
    bg: 'bg-green-500/20',
    text: 'text-green-400',
    label: 'Completed',
    icon: 'checkmark-circle',
  },
  cancelled: {
    bg: 'bg-red-500/20',
    text: 'text-red-400',
    label: 'Cancelled',
    icon: 'close-circle',
  },
  pending: {
    bg: 'bg-yellow-500/20',
    text: 'text-yellow-400',
    label: 'Pending',
    icon: 'time',
  },
};

export default function OrderDetailModal({
  visible,
  onClose,
  order,
  onCancelOrder,
}) {
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  if (!order) return null;

  const paymentMethod = PAYMENT_METHOD_LABELS[order.paymentMethod] || PAYMENT_METHOD_LABELS.cash;
  const statusStyle = STATUS_STYLES[order.status] || STATUS_STYLES.completed;
  const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);

  const handleCancelOrder = () => {
    if (!cancelReason.trim()) {
      Alert.alert('Required', 'Please provide a reason for cancellation');
      return;
    }
    onCancelOrder(order.id, cancelReason.trim());
    setShowCancelConfirm(false);
    setCancelReason('');
    onClose();
  };

  const handleClose = () => {
    setShowCancelConfirm(false);
    setCancelReason('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View className="flex-1 bg-black/60">
        <TouchableOpacity className="flex-[0.1]" onPress={handleClose} />

        <View className="flex-[0.9] bg-vendora-card rounded-t-3xl">
          {/* Drag Handle */}
          <TouchableOpacity className="items-center py-3" onPress={handleClose}>
            <View className="w-12 h-1.5 bg-vendora-border rounded-full" />
          </TouchableOpacity>

          {/* Header */}
          <View className="flex-row items-center justify-between px-5 pb-4 border-b border-vendora-border">
            <View>
              <Text className="text-vendora-text font-bold text-xl">
                Order Details
              </Text>
              <Text className="text-vendora-text-muted text-sm">{order.id}</Text>
            </View>
            <TouchableOpacity
              className="w-10 h-10 bg-vendora-input rounded-full items-center justify-center"
              onPress={handleClose}
            >
              <Ionicons name="close" size={20} color="#e5e5e5" />
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            {/* Status Badge */}
            <View className="px-5 pt-4">
              <View className={`flex-row items-center gap-2 self-start px-4 py-2 rounded-xl ${statusStyle.bg}`}>
                <Ionicons name={statusStyle.icon} size={18} color={statusStyle.text.replace('text-', '#').replace('-400', '')} />
                <Text className={`font-semibold ${statusStyle.text}`}>
                  {statusStyle.label}
                </Text>
              </View>
            </View>

            {/* Order Info */}
            <View className="px-5 py-4">
              <View className="bg-vendora-bg rounded-xl p-4">
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-vendora-text-muted">Date & Time</Text>
                  <Text className="text-vendora-text font-medium">
                    {formatDateTime(new Date(order.createdAt))}
                  </Text>
                </View>
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-vendora-text-muted">Customer</Text>
                  <Text className="text-vendora-text font-medium">
                    {order.customerName}
                  </Text>
                </View>
                <View className="flex-row items-center justify-between">
                  <Text className="text-vendora-text-muted">Payment Method</Text>
                  <View className="flex-row items-center gap-2">
                    <Ionicons name={paymentMethod.icon} size={16} color="#a855f7" />
                    <Text className="text-vendora-text font-medium">
                      {paymentMethod.label}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Items */}
            <View className="px-5 pb-4">
              <Text className="text-vendora-text font-semibold text-lg mb-3">
                Items ({totalItems})
              </Text>
              <View className="bg-vendora-bg rounded-xl overflow-hidden">
                {order.items.map((item, index) => (
                  <View
                    key={item.id}
                    className={`flex-row items-center gap-3 p-4 ${
                      index !== order.items.length - 1 ? 'border-b border-vendora-border' : ''
                    }`}
                  >
                    <View className="w-12 h-12 bg-vendora-card rounded-xl items-center justify-center">
                      <Ionicons name="cube-outline" size={24} color="#a855f7" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-vendora-text font-medium" numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text className="text-vendora-text-muted text-sm">
                        ₱ {formatCurrency(item.price)} x {item.quantity}
                      </Text>
                    </View>
                    <Text className="text-vendora-text font-semibold">
                      ₱ {formatCurrency(item.price * item.quantity)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Payment Breakdown */}
            <View className="px-5 pb-4">
              <Text className="text-vendora-text font-semibold text-lg mb-3">
                Payment Summary
              </Text>
              <View className="bg-vendora-bg rounded-xl p-4">
                <View className="flex-row justify-between mb-2">
                  <Text className="text-vendora-text-muted">Subtotal</Text>
                  <Text className="text-vendora-text">
                    ₱ {formatCurrency(order.subtotal)}
                  </Text>
                </View>
                {order.discount > 0 && (
                  <View className="flex-row justify-between mb-2">
                    <Text className="text-vendora-text-muted">
                      Discount {order.discountLabel && `(${order.discountLabel})`}
                    </Text>
                    <Text className="text-green-400">
                      - ₱ {formatCurrency(order.discount)}
                    </Text>
                  </View>
                )}
                {order.tax > 0 && (
                  <View className="flex-row justify-between mb-2">
                    <Text className="text-vendora-text-muted">
                      Tax ({order.taxRate}%)
                    </Text>
                    <Text className="text-vendora-text">
                      + ₱ {formatCurrency(order.tax)}
                    </Text>
                  </View>
                )}
                {order.vatExempt && (
                  <View className="flex-row justify-between mb-2">
                    <Text className="text-vendora-text-muted">Tax</Text>
                    <Text className="text-green-400">VAT Exempt</Text>
                  </View>
                )}
                <View className="flex-row justify-between pt-3 border-t border-vendora-border">
                  <Text className="text-vendora-text font-bold text-lg">Total</Text>
                  <Text className="text-vendora-purple-light font-bold text-lg">
                    ₱ {formatCurrency(order.total)}
                  </Text>
                </View>
                {order.paymentMethod === 'cash' && (
                  <>
                    <View className="flex-row justify-between mt-3 pt-3 border-t border-vendora-border">
                      <Text className="text-vendora-text-muted">Amount Tendered</Text>
                      <Text className="text-vendora-text">
                        ₱ {formatCurrency(order.amountTendered)}
                      </Text>
                    </View>
                    <View className="flex-row justify-between mt-2">
                      <Text className="text-vendora-text-muted">Change</Text>
                      <Text className="text-green-400 font-semibold">
                        ₱ {formatCurrency(order.change)}
                      </Text>
                    </View>
                  </>
                )}
              </View>
            </View>

            {/* Notes */}
            {order.notes && (
              <View className="px-5 pb-4">
                <Text className="text-vendora-text font-semibold text-lg mb-3">Notes</Text>
                <View className="bg-vendora-bg rounded-xl p-4">
                  <Text className="text-vendora-text-muted">{order.notes}</Text>
                </View>
              </View>
            )}

            {/* Cancel Reason */}
            {order.status === 'cancelled' && order.cancelReason && (
              <View className="px-5 pb-4">
                <Text className="text-vendora-text font-semibold text-lg mb-3">
                  Cancellation Reason
                </Text>
                <View className="bg-red-500/10 rounded-xl p-4">
                  <Text className="text-red-400">{order.cancelReason}</Text>
                </View>
              </View>
            )}

            {/* Cancel Confirmation */}
            {showCancelConfirm && order.status === 'completed' && (
              <View className="px-5 pb-4">
                <View className="bg-red-500/10 rounded-xl p-4">
                  <Text className="text-red-400 font-semibold mb-3">
                    Cancel this order?
                  </Text>
                  <TextInput
                    className="bg-vendora-card rounded-xl px-4 py-3 text-vendora-text mb-3"
                    placeholder="Enter cancellation reason..."
                    placeholderTextColor="#9ca3af"
                    value={cancelReason}
                    onChangeText={setCancelReason}
                    multiline
                  />
                  <View className="flex-row gap-3">
                    <TouchableOpacity
                      className="flex-1 py-3 bg-vendora-card rounded-xl"
                      onPress={() => {
                        setShowCancelConfirm(false);
                        setCancelReason('');
                      }}
                    >
                      <Text className="text-vendora-text text-center font-medium">
                        Keep Order
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      className="flex-1 py-3 bg-red-500 rounded-xl"
                      onPress={handleCancelOrder}
                    >
                      <Text className="text-white text-center font-medium">
                        Confirm Cancel
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}

            <View className="h-8" />
          </ScrollView>

          {/* Cancel Button */}
          {order.status === 'completed' && !showCancelConfirm && (
            <View className="px-5 pb-8 pt-4 border-t border-vendora-border">
              <TouchableOpacity
                className="py-4 bg-vendora-input rounded-2xl flex-row items-center justify-center gap-2"
                onPress={() => setShowCancelConfirm(true)}
              >
                <Ionicons name="close-circle-outline" size={20} color="#f87171" />
                <Text className="text-red-400 font-semibold">Cancel Order</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}
