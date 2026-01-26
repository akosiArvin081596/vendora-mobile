import React, { useState, useMemo, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PaymentMethodCard from './PaymentMethodCard';
import {
  DISCOUNT_PRESETS,
  getDiscountPreset,
  calculateDiscount,
  calculateTax,
  calculateTotal,
  calculateChange,
  generateTransactionId,
  formatCurrency,
  validateCheckout,
} from '../utils/checkoutHelpers';

const PAYMENT_METHODS = [
  { id: 'cash', label: 'Cash', icon: 'cash-outline' },
  { id: 'card', label: 'Card', icon: 'card-outline' },
  { id: 'ewallet', label: 'E-Wallet', icon: 'wallet-outline' },
];

const QUICK_AMOUNTS = [500, 1000, 2000];

export default function CheckoutModal({
  visible,
  onClose,
  cart,
  subtotal,
  totalItems,
  cartNotes,
  onCheckoutComplete,
  selectedDiscount,
  onDiscountChange,
}) {
  const isVisible = Boolean(visible);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountTendered, setAmountTendered] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customDiscountType, setCustomDiscountType] = useState('percentage');
  const [customDiscountValue, setCustomDiscountValue] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [taxRate, setTaxRate] = useState('12');
  const [summaryExpanded, setSummaryExpanded] = useState(false);

  const currentPreset = getDiscountPreset(selectedDiscount);

  // Auto-disable tax when VAT exempt preset is selected
  useEffect(() => {
    if (currentPreset.vatExempt) {
      setTaxRate('0');
    }
  }, [currentPreset.vatExempt]);

  // Calculate discount based on preset or custom value
  const discount = useMemo(() => {
    if (currentPreset.percentage) {
      return calculateDiscount(subtotal, 'percentage', currentPreset.percentage);
    }
    if (selectedDiscount === 'custom' && customDiscountValue) {
      return calculateDiscount(
        subtotal,
        customDiscountType,
        parseFloat(customDiscountValue) || 0
      );
    }
    // Promo code discount - placeholder for future implementation
    if (selectedDiscount === 'promo' && promoCode) {
      // For now, just apply 0 - can be enhanced with promo code validation later
      return 0;
    }
    return 0;
  }, [subtotal, currentPreset, selectedDiscount, customDiscountType, customDiscountValue, promoCode]);

  const amountAfterDiscount = subtotal - discount;

  const tax = useMemo(
    () => calculateTax(amountAfterDiscount, parseFloat(taxRate) || 0),
    [amountAfterDiscount, taxRate]
  );

  const total = useMemo(
    () => calculateTotal(subtotal, discount, tax),
    [subtotal, discount, tax]
  );

  const change = useMemo(
    () => calculateChange(parseFloat(amountTendered) || 0, total),
    [amountTendered, total]
  );

  const tenderedAmount = parseFloat(amountTendered) || 0;
  const isValidCashPayment = paymentMethod !== 'cash' || tenderedAmount >= total;

  const resetForm = () => {
    setPaymentMethod('cash');
    setAmountTendered('');
    setCustomerName('');
    setCustomDiscountType('percentage');
    setCustomDiscountValue('');
    setPromoCode('');
    setTaxRate('12');
    setSummaryExpanded(false);
    onDiscountChange('none');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleConfirm = () => {
    const checkoutData = {
      paymentMethod,
      amountTendered: tenderedAmount,
    };

    const validation = validateCheckout(checkoutData, total, cart.length);

    if (!validation.valid) {
      Alert.alert('Validation Error', validation.error);
      return;
    }

    // Determine discount type and value for receipt
    let receiptDiscountType = 'amount';
    let receiptDiscountValue = 0;
    if (currentPreset.percentage) {
      receiptDiscountType = 'percentage';
      receiptDiscountValue = currentPreset.percentage;
    } else if (selectedDiscount === 'custom') {
      receiptDiscountType = customDiscountType;
      receiptDiscountValue = parseFloat(customDiscountValue) || 0;
    }

    const receiptData = {
      items: cart,
      subtotal,
      discount,
      discountType: receiptDiscountType,
      discountValue: receiptDiscountValue,
      discountPreset: selectedDiscount,
      discountLabel: currentPreset.label,
      vatExempt: currentPreset.vatExempt,
      promoCode: selectedDiscount === 'promo' ? promoCode : '',
      tax,
      taxRate: parseFloat(taxRate) || 0,
      total,
      paymentMethod,
      amountTendered: tenderedAmount,
      change: paymentMethod === 'cash' ? change : 0,
      customerName: customerName.trim() || 'Walk-in Customer',
      transactionId: generateTransactionId(),
      timestamp: new Date(),
      notes: cartNotes,
    };

    resetForm();
    onCheckoutComplete(receiptData);
  };

  const handleQuickAmount = (amount) => {
    setAmountTendered(amount.toString());
  };

  const handleExactAmount = () => {
    setAmountTendered(Math.ceil(total).toString());
  };

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-1 bg-black/60">
          <TouchableOpacity className="flex-[0.1]" onPress={handleClose} />

          <View className="flex-[0.9] bg-vendora-card rounded-t-3xl">
            {/* Drag Handle */}
            <TouchableOpacity
              className="items-center py-3"
              onPress={handleClose}
            >
              <View className="w-12 h-1.5 bg-vendora-border rounded-full" />
            </TouchableOpacity>

            {/* Header */}
            <View className="flex-row items-center justify-between px-5 pb-4 border-b border-vendora-border">
              <View>
                <Text className="text-vendora-text font-bold text-xl">
                  Checkout
                </Text>
                <Text className="text-vendora-text-muted text-sm">
                  Complete your transaction
                </Text>
              </View>
              <TouchableOpacity
                className="w-10 h-10 bg-vendora-input rounded-full items-center justify-center"
                onPress={handleClose}
              >
                <Ionicons name="close" size={20} color="#e5e5e5" />
              </TouchableOpacity>
            </View>

            {/* Scrollable Content */}
            <ScrollView
              className="flex-1 px-5"
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Customer Name */}
              <View className="mt-4">
                <Text className="text-vendora-text font-semibold mb-2">
                  Customer Name (Optional)
                </Text>
                <View className="flex-row items-center bg-vendora-input rounded-xl px-4">
                  <Ionicons name="person-outline" size={20} color="#9ca3af" />
                  <TextInput
                    className="flex-1 py-3.5 px-3 text-vendora-text"
                    placeholder="Enter customer name"
                    placeholderTextColor="#9ca3af"
                    value={customerName}
                    onChangeText={setCustomerName}
                  />
                </View>
              </View>

              {/* Payment Method */}
              <View className="mt-5">
                <Text className="text-vendora-text font-semibold mb-3">
                  Payment Method
                </Text>
                <View className="flex-row gap-3">
                  {PAYMENT_METHODS.map((method) => (
                    <PaymentMethodCard
                      key={method.id}
                      icon={method.icon}
                      label={method.label}
                      selected={paymentMethod === method.id}
                      onSelect={() => setPaymentMethod(method.id)}
                    />
                  ))}
                </View>
              </View>

              {/* Cash Amount Input */}
              {paymentMethod === 'cash' && (
                <View className="mt-5">
                  <Text className="text-vendora-text font-semibold mb-2">
                    Amount Tendered
                  </Text>
                  <View className="flex-row items-center bg-vendora-input rounded-xl px-4">
                    <Text className="text-vendora-purple-light font-bold text-lg">
                      ₱
                    </Text>
                    <TextInput
                      className="flex-1 py-3.5 px-3 text-vendora-text text-lg"
                      placeholder="0.00"
                      placeholderTextColor="#9ca3af"
                      keyboardType="numeric"
                      value={amountTendered}
                      onChangeText={setAmountTendered}
                    />
                  </View>

                  {/* Quick Amount Buttons */}
                  <View className="flex-row gap-2 mt-3">
                    {QUICK_AMOUNTS.map((amount) => (
                      <TouchableOpacity
                        key={amount}
                        className="flex-1 bg-vendora-input py-2.5 rounded-xl"
                        onPress={() => handleQuickAmount(amount)}
                      >
                        <Text className="text-vendora-text text-center font-medium">
                          ₱{amount.toLocaleString()}
                        </Text>
                      </TouchableOpacity>
                    ))}
                    <TouchableOpacity
                      className="flex-1 bg-vendora-purple/20 py-2.5 rounded-xl"
                      onPress={handleExactAmount}
                    >
                      <Text className="text-vendora-purple-light text-center font-medium">
                        Exact
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Change Display */}
                  {tenderedAmount > 0 && (
                    <View className="mt-3 bg-vendora-bg rounded-xl p-4">
                      <View className="flex-row justify-between items-center">
                        <Text className="text-vendora-text-muted">Change</Text>
                        <Text
                          className={`text-xl font-bold ${
                            tenderedAmount >= total
                              ? 'text-green-400'
                              : 'text-red-400'
                          }`}
                        >
                          ₱ {formatCurrency(change)}
                        </Text>
                      </View>
                      {tenderedAmount < total && (
                        <Text className="text-red-400 text-sm mt-1">
                          Insufficient amount (₱{formatCurrency(total - tenderedAmount)} short)
                        </Text>
                      )}
                    </View>
                  )}
                </View>
              )}

              {/* Tax */}
              <View className="mt-5 mb-4">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-vendora-text font-semibold">
                    Tax Rate (%)
                  </Text>
                  {currentPreset.vatExempt && (
                    <View className="bg-green-500/20 px-2 py-1 rounded-lg">
                      <Text className="text-green-400 text-xs font-medium">
                        VAT Exempt
                      </Text>
                    </View>
                  )}
                </View>
                <View className={`flex-row items-center rounded-xl px-4 ${
                  currentPreset.vatExempt ? 'bg-vendora-input/50' : 'bg-vendora-input'
                }`}>
                  <Text className={`font-bold text-lg ${
                    currentPreset.vatExempt ? 'text-vendora-text-muted' : 'text-vendora-purple-light'
                  }`}>
                    %
                  </Text>
                  <TextInput
                    className={`flex-1 py-3.5 px-3 ${
                      currentPreset.vatExempt ? 'text-vendora-text-muted' : 'text-vendora-text'
                    }`}
                    placeholder="0"
                    placeholderTextColor="#9ca3af"
                    keyboardType="numeric"
                    value={taxRate}
                    onChangeText={setTaxRate}
                    editable={!currentPreset.vatExempt}
                  />
                </View>
              </View>
            </ScrollView>

            {/* Order Summary */}
            <View className="border-t border-vendora-border px-5 py-4 bg-vendora-bg/50">
              {/* Total - Always visible, tap to expand */}
              <TouchableOpacity
                className="flex-row items-center justify-between"
                onPress={() => setSummaryExpanded(!summaryExpanded)}
              >
                <View className="flex-row items-center gap-2">
                  <Text className="text-vendora-text font-bold text-lg">
                    Total
                  </Text>
                  <Ionicons
                    name={summaryExpanded ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color="#9ca3af"
                  />
                </View>
                <Text className="text-vendora-purple-light font-bold text-lg">
                  ₱ {formatCurrency(total)}
                </Text>
              </TouchableOpacity>

              {/* Collapsible Details */}
              {summaryExpanded && (
                <View className="mt-3 pt-3 border-t border-vendora-border gap-2">
                  <View className="flex-row justify-between">
                    <Text className="text-vendora-text-muted">
                      Subtotal ({totalItems} items)
                    </Text>
                    <Text className="text-vendora-text">
                      ₱ {formatCurrency(subtotal)}
                    </Text>
                  </View>
                  {discount > 0 && (
                    <View className="flex-row justify-between">
                      <Text className="text-vendora-text-muted">
                        Discount ({currentPreset.label})
                        {currentPreset.percentage && ` ${currentPreset.percentage}%`}
                        {selectedDiscount === 'custom' && customDiscountType === 'percentage' && ` ${customDiscountValue}%`}
                      </Text>
                      <Text className="text-green-400">
                        - ₱ {formatCurrency(discount)}
                      </Text>
                    </View>
                  )}
                  {tax > 0 && (
                    <View className="flex-row justify-between">
                      <Text className="text-vendora-text-muted">
                        Tax ({taxRate}%)
                      </Text>
                      <Text className="text-vendora-text">
                        + ₱ {formatCurrency(tax)}
                      </Text>
                    </View>
                  )}
                  {currentPreset.vatExempt && (
                    <View className="flex-row justify-between">
                      <Text className="text-vendora-text-muted">
                        Tax (VAT Exempt)
                      </Text>
                      <Text className="text-green-400">₱ 0.00</Text>
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* Confirm Button */}
            <View className="px-5 pb-8 pt-2">
              <TouchableOpacity
              className={`py-4 rounded-2xl flex-row items-center justify-center gap-2 ${
                isValidCashPayment
                  ? 'bg-vendora-purple'
                  : 'bg-vendora-purple/50'
              }`}
              onPress={handleConfirm}
              disabled={!isValidCashPayment}
              style={
                isValidCashPayment
                  ? (Platform.OS === 'web'
                    ? { boxShadow: '0px 4px 12px rgba(147, 51, 234, 0.35)' }
                    : { elevation: 8 })
                  : {}
              }
            >
                <Text className="text-white font-semibold text-lg">
                  Confirm Payment
                </Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
