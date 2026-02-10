import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
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

// Quick discount options for cart view (subset of all presets)
const QUICK_DISCOUNTS = DISCOUNT_PRESETS.filter((p) =>
  ['none', 'senior', 'pwd', 'employee'].includes(p.id)
);

export default function CartPanel({
  cart,
  onUpdateQuantity,
  onRemove,
  subtotal,
  notes,
  onNotesChange,
  onCheckout,
  selectedDiscount,
  onDiscountChange,
  onSaveCart,
  onOpenSavedCarts,
  savedCartsCount = 0,
}) {
  const [detailsExpanded, setDetailsExpanded] = useState(false);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

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
    <View className="flex-1 bg-vendora-card rounded-3xl overflow-hidden">
      {/* Header */}
      <View className="px-5 pt-5 pb-4">
        <View className="flex-row items-center justify-between mb-1">
          <View className="flex-row items-center gap-3">
            <Ionicons name="cart-outline" size={20} color="#e5e5e5" />
            <Text className="text-vendora-text font-bold text-lg">Cart</Text>
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
                size={18}
                color={cart.length > 0 ? '#a855f7' : '#6b7280'}
              />
            </TouchableOpacity>
            {/* Saved Carts Button */}
            <TouchableOpacity
              className="p-2 rounded-lg bg-vendora-input relative"
              onPress={onOpenSavedCarts}
            >
              <Ionicons name="folder-outline" size={18} color="#a855f7" />
              {savedCartsCount > 0 ? (
                <View className="absolute -top-1 -right-1 bg-vendora-purple rounded-full min-w-[16px] h-4 items-center justify-center px-1">
                  <Text className="text-white text-[10px] font-bold">
                    {savedCartsCount > 9 ? '9+' : savedCartsCount}
                  </Text>
                </View>
              ) : null}
            </TouchableOpacity>
          </View>
        </View>
        <Text className="text-vendora-text-muted text-sm">
          Adjust quantity then go checkout
        </Text>
      </View>

      {/* Cart Items */}
      <ScrollView className="flex-1 px-4">
        {cart.length === 0 ? (
          <View
            className="items-center justify-center py-8 mx-1 rounded-xl"
            style={{
              borderWidth: 1,
              borderStyle: 'dashed',
              borderColor: '#374151',
            }}
          >
            <Text className="text-vendora-text-muted font-medium">Cart is empty</Text>
          </View>
        ) : (
          cart.map((item) => (
            <View
              key={item.id}
              className="bg-vendora-input rounded-xl p-3 mb-3"
            >
              {/* Top Row: Name and Delete */}
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-vendora-text font-medium text-sm flex-1 mr-2" numberOfLines={2}>
                  {item.name}
                </Text>
                <TouchableOpacity
                  className="p-1"
                  onPress={() => onRemove(item.id)}
                >
                  <Ionicons name="trash-outline" size={18} color="#f87171" />
                </TouchableOpacity>
              </View>
              {/* Bottom Row: Price and Quantity */}
              <View className="flex-row items-center justify-between">
                <Text className="text-vendora-purple-light font-semibold text-sm">
                  ₱ {formatCurrency(item.price)}
                </Text>
                <View className="flex-row items-center gap-1">
                  <TouchableOpacity
                    className="w-8 h-8 bg-vendora-card rounded-lg items-center justify-center"
                    onPress={() => onUpdateQuantity(item.id, -1)}
                  >
                    <Ionicons name="remove" size={16} color="#e5e5e5" />
                  </TouchableOpacity>
                  <Text className="w-8 text-center text-vendora-text font-bold text-sm">
                    {item.quantity}
                  </Text>
                  <TouchableOpacity
                    className="w-8 h-8 bg-vendora-card rounded-lg items-center justify-center"
                    onPress={() => onUpdateQuantity(item.id, 1)}
                  >
                    <Ionicons name="add" size={16} color="#e5e5e5" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Summary */}
      <View className="bg-vendora-bg/50 rounded-t-3xl p-4">
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

        {/* Total - Always visible, tap to expand details */}
        <TouchableOpacity
          className="flex-row items-center justify-between py-2"
          onPress={() => setDetailsExpanded(!detailsExpanded)}
        >
          <View className="flex-row items-center gap-2">
            <Text className="text-vendora-text font-bold text-lg">Total</Text>
            <Ionicons
              name={detailsExpanded ? "chevron-up" : "chevron-down"}
              size={18}
              color="#9ca3af"
            />
          </View>
          <Text className="text-vendora-purple-light font-bold text-lg">
            ₱ {formatCurrency(subtotal - discountAmount)}
          </Text>
        </TouchableOpacity>

        {/* Collapsible Details: Notes + Breakdown */}
        {detailsExpanded ? (
          <View className="mt-3 pt-3 border-t border-vendora-border">
            {/* Notes */}
            <View className="mb-4">
              <Text className="text-vendora-text font-medium text-sm mb-2">Notes</Text>
              <TextInput
                className="bg-vendora-input rounded-xl px-4 py-3 text-vendora-text text-sm"
                placeholder="Optional"
                placeholderTextColor="#6b7280"
                value={notes}
                onChangeText={onNotesChange}
                multiline={true}
              />
            </View>

            {/* Breakdown */}
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
          </View>
        ) : null}

        {/* Checkout Button */}
        <TouchableOpacity
          className="bg-vendora-purple py-4 rounded-2xl flex-row items-center justify-center gap-2 mt-4"
          onPress={handleCheckout}
          style={
            Platform.OS === 'web'
              ? { boxShadow: '0px 4px 12px rgba(147, 51, 234, 0.35)' }
              : { elevation: 8 }
          }
        >
          <Text className="text-white font-semibold text-base">Checkout</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
