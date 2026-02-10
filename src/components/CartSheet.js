import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  DISCOUNT_PRESETS,
  getDiscountPreset,
  calculateDiscount,
  formatCurrency,
} from '../utils/checkoutHelpers';

// Quick discount options for cart sheet (subset of all presets)
const QUICK_DISCOUNTS = DISCOUNT_PRESETS.filter((p) =>
  ['none', 'senior', 'pwd', 'employee'].includes(p.id)
);

export default function CartSheet({
  visible,
  onClose,
  cart,
  onUpdateQuantity,
  onRemove,
  subtotal,
  onCheckout,
  selectedDiscount,
  onDiscountChange,
  onSaveCart,
  onOpenSavedCarts,
  savedCartsCount = 0,
}) {
  const isVisible = Boolean(visible);
  const currentPreset = getDiscountPreset(selectedDiscount);

  const discountAmount = useMemo(() => {
    if (currentPreset.percentage) {
      return calculateDiscount(subtotal, 'percentage', currentPreset.percentage);
    }
    return 0;
  }, [subtotal, currentPreset]);
  const handleCheckout = () => {
    if (onCheckout) {
      onCheckout();
    }
  };

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/60">
        <TouchableOpacity className="flex-1" onPress={onClose} />

        <View className="bg-vendora-card rounded-t-3xl max-h-[90%]">
          {/* Drag Handle */}
          <TouchableOpacity
            className="items-center py-3"
            onPress={onClose}
          >
            <View className="w-12 h-1.5 bg-vendora-border rounded-full" />
          </TouchableOpacity>

          {/* Header */}
          <View className="flex-row items-center justify-between px-5 pb-4 border-b border-vendora-border">
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 bg-vendora-purple/20 rounded-xl items-center justify-center">
                <Ionicons name="cart" size={20} color="#a855f7" />
              </View>
              <View>
                <Text className="text-vendora-text font-semibold text-lg">Cart</Text>
                <Text className="text-vendora-text-muted text-sm">
                  Adjust quantity then checkout
                </Text>
              </View>
            </View>
            <View className="flex-row items-center gap-2">
              {/* Save Cart Button */}
              <TouchableOpacity
                className={`p-2 rounded-lg ${cart.length > 0 ? 'bg-vendora-input' : 'bg-vendora-input/50'}`}
                onPress={onSaveCart}
                disabled={cart.length === 0}
              >
                <Ionicons
                  name="bookmark-outline"
                  size={20}
                  color={cart.length > 0 ? '#a855f7' : '#6b7280'}
                />
              </TouchableOpacity>
              {/* Saved Carts Button */}
              <TouchableOpacity
                className="p-2 rounded-lg bg-vendora-input relative"
                onPress={onOpenSavedCarts}
              >
                <Ionicons name="folder-outline" size={20} color="#a855f7" />
                {savedCartsCount > 0 ? (
                  <View className="absolute -top-1 -right-1 bg-vendora-purple rounded-full min-w-[16px] h-4 items-center justify-center px-1">
                    <Text className="text-white text-[10px] font-bold">
                      {savedCartsCount > 9 ? '9+' : savedCartsCount}
                    </Text>
                  </View>
                ) : null}
              </TouchableOpacity>
              <TouchableOpacity
                className="p-2"
                onPress={onClose}
              >
                <Ionicons name="close" size={24} color="#e5e5e5" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Cart Items */}
          <ScrollView className="max-h-64 p-4">
            {cart.length === 0 ? (
              <View className="items-center justify-center py-8">
                <View className="w-16 h-16 bg-vendora-input rounded-2xl items-center justify-center mb-3">
                  <Ionicons name="cart-outline" size={32} color="#9ca3af" />
                </View>
                <Text className="text-vendora-text-muted font-medium">Cart is empty</Text>
                <Text className="text-vendora-text-muted text-sm">
                  Add products to get started
                </Text>
              </View>
            ) : (
              cart.map((item) => (
                <View
                  key={item.id}
                  className="bg-vendora-input rounded-xl p-4 flex-row items-center gap-3 mb-3"
                >
                  <View className="w-12 h-12 bg-vendora-card rounded-xl items-center justify-center">
                    <Ionicons name="cube-outline" size={24} color="#a855f7" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-vendora-text font-medium text-sm" numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text className="text-vendora-purple-light font-semibold">
                      ₱ {formatCurrency(item.price)}
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <TouchableOpacity
                      className="w-10 h-10 bg-vendora-card rounded-xl items-center justify-center"
                      onPress={() => onUpdateQuantity(item.id, -1)}
                    >
                      <Ionicons name="remove" size={20} color="#e5e5e5" />
                    </TouchableOpacity>
                    <Text className="w-10 text-center text-vendora-text font-bold">
                      {item.quantity}
                    </Text>
                    <TouchableOpacity
                      className="w-10 h-10 bg-vendora-card rounded-xl items-center justify-center"
                      onPress={() => onUpdateQuantity(item.id, 1)}
                    >
                      <Ionicons name="add" size={20} color="#e5e5e5" />
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity
                    className="p-2"
                    onPress={() => onRemove(item.id)}
                  >
                    <Ionicons name="trash-outline" size={24} color="#f87171" />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </ScrollView>

          {/* Notes */}
          <View className="px-4 pb-3">
            <Text className="text-vendora-text font-medium text-sm mb-2">Notes</Text>
            <TextInput
              className="bg-vendora-input rounded-xl px-4 py-3 text-vendora-text text-sm"
              placeholder="Add notes (optional)"
              placeholderTextColor="#9ca3af"
            />
          </View>

          {/* Summary */}
          <View className="border-t border-vendora-border p-4 bg-vendora-bg/30">
            {/* Discount Quick Select */}
            <View className="mb-3">
              <Text className="text-vendora-text-muted text-xs mb-2">Discount</Text>
              <ScrollView
                horizontal={true}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8 }}
              >
                {QUICK_DISCOUNTS.map((preset) => (
                  <TouchableOpacity
                    key={preset.id}
                    className={`px-3 py-2 rounded-xl ${
                      selectedDiscount === preset.id
                        ? 'bg-vendora-purple'
                        : 'bg-vendora-input'
                    }`}
                    onPress={() => onDiscountChange(preset.id)}
                  >
                    <Text
                      className={`text-xs font-medium ${
                        selectedDiscount === preset.id
                          ? 'text-white'
                          : 'text-vendora-text'
                      }`}
                    >
                      {preset.shortLabel}
                      {preset.percentage ? ` ${preset.percentage}%` : ''}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Show applied discount */}
              {selectedDiscount !== 'none' && discountAmount > 0 ? (
                <View className="flex-row items-center mt-2">
                  <Ionicons name="pricetag" size={12} color="#22c55e" />
                  <Text className="text-green-400 text-xs ml-1">
                    {currentPreset.label} (-{currentPreset.percentage}%)
                    {currentPreset.vatExempt ? ' • VAT Exempt' : null}
                  </Text>
                </View>
              ) : null}
            </View>

            <View className="flex-row justify-between mb-2">
              <Text className="text-vendora-text-muted text-sm">Subtotal</Text>
              <Text className="text-vendora-text font-medium">
                ₱ {formatCurrency(subtotal)}
              </Text>
            </View>
            <View className="flex-row justify-between mb-2">
              <Text className="text-vendora-text-muted text-sm">
                Discount {currentPreset.percentage ? `(${currentPreset.percentage}%)` : ''}
              </Text>
              <Text className={discountAmount > 0 ? 'text-green-400' : 'text-vendora-text'}>
                {discountAmount > 0 ? `- ₱ ${formatCurrency(discountAmount)}` : '₱ 0.00'}
              </Text>
            </View>
            <View className="flex-row justify-between mb-2">
              <Text className="text-vendora-text-muted text-sm">
                Tax {currentPreset.vatExempt ? '(Exempt)' : null}
              </Text>
              <Text className="text-vendora-text">₱ 0.00</Text>
            </View>
            <View className="flex-row justify-between pt-3 border-t border-vendora-border">
              <Text className="text-vendora-text font-bold text-xl">Total</Text>
              <Text className="text-vendora-purple-light font-bold text-xl">
                ₱ {formatCurrency(subtotal - discountAmount)}
              </Text>
            </View>
          </View>

          {/* Checkout Button */}
          <View className="p-4 pb-8">
            <TouchableOpacity
              className="bg-vendora-purple py-4 rounded-2xl flex-row items-center justify-center gap-2"
              onPress={handleCheckout}
              style={
                Platform.OS === 'web'
                  ? { boxShadow: '0px 4px 12px rgba(147, 51, 234, 0.35)' }
                  : { elevation: 8 }
              }
            >
              <Text className="text-white font-semibold text-lg">Checkout</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
