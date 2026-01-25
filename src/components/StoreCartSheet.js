import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatCurrency } from '../utils/checkoutHelpers';

export default function StoreCartSheet({
  visible,
  onClose,
  cart,
  onUpdateQuantity,
  onRemove,
  subtotal,
  onCheckout,
}) {
  const isVisible = Boolean(visible);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

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
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' }}>
        <TouchableOpacity style={{ flex: 1 }} onPress={onClose} />

        <View
          style={{
            backgroundColor: '#1a1a2e',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            maxHeight: '85%',
          }}
        >
          {/* Drag Handle */}
          <TouchableOpacity
            style={{ alignItems: 'center', paddingVertical: 12 }}
            onPress={onClose}
          >
            <View
              style={{
                width: 48,
                height: 6,
                backgroundColor: '#374151',
                borderRadius: 3,
              }}
            />
          </TouchableOpacity>

          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 20,
              paddingBottom: 16,
              borderBottomWidth: 1,
              borderBottomColor: '#374151',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View
                style={{
                  width: 48,
                  height: 48,
                  backgroundColor: 'rgba(168, 85, 247, 0.2)',
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="bag" size={24} color="#a855f7" />
              </View>
              <View>
                <Text style={{ color: '#e5e5e5', fontWeight: '700', fontSize: 20 }}>
                  Shopping Cart
                </Text>
                <Text style={{ color: '#9ca3af', fontSize: 14 }}>
                  {totalItems} {totalItems === 1 ? 'item' : 'items'}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={{
                width: 40,
                height: 40,
                backgroundColor: '#1f2937',
                borderRadius: 20,
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onPress={onClose}
            >
              <Ionicons name="close" size={20} color="#e5e5e5" />
            </TouchableOpacity>
          </View>

          {/* Cart Items */}
          {cart.length === 0 ? (
            <View
              style={{
                paddingVertical: 48,
                paddingHorizontal: 20,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <View
                style={{
                  width: 96,
                  height: 96,
                  backgroundColor: '#1f2937',
                  borderRadius: 48,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 16,
                }}
              >
                <Ionicons name="bag-outline" size={48} color="#6b7280" />
              </View>
              <Text
                style={{
                  color: '#e5e5e5',
                  fontWeight: '600',
                  fontSize: 18,
                  marginBottom: 4,
                }}
              >
                Your cart is empty
              </Text>
              <Text style={{ color: '#9ca3af', textAlign: 'center' }}>
                Browse our products and add items to your cart
              </Text>
            </View>
          ) : (
            <ScrollView
              style={{ maxHeight: 300, minHeight: 100 }}
              showsVerticalScrollIndicator={true}
              bounces={true}
            >
              <View style={{ paddingHorizontal: 20, paddingVertical: 8 }}>
                {cart.map((item, index) => (
                  <View
                    key={`cart-item-${item.id}-${index}`}
                    style={{
                      flexDirection: 'row',
                      gap: 16,
                      paddingVertical: 16,
                      borderBottomWidth: index !== cart.length - 1 ? 1 : 0,
                      borderBottomColor: '#374151',
                    }}
                  >
                    {/* Product Image */}
                    <View
                      style={{
                        width: 80,
                        height: 80,
                        backgroundColor: '#1f2937',
                        borderRadius: 12,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Ionicons name="cube-outline" size={32} color="#a855f7" />
                    </View>

                    {/* Product Info */}
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          color: '#e5e5e5',
                          fontWeight: '600',
                          fontSize: 16,
                          marginBottom: 4,
                        }}
                        numberOfLines={2}
                      >
                        {item.name}
                      </Text>
                      <Text style={{ color: '#9ca3af', fontSize: 14, marginBottom: 8 }}>
                        {item.unit}
                      </Text>
                      <Text style={{ color: '#c084fc', fontWeight: '700', fontSize: 18 }}>
                        ₱ {item.price.toLocaleString()}
                      </Text>
                    </View>

                    {/* Quantity & Remove */}
                    <View style={{ alignItems: 'flex-end', justifyContent: 'space-between' }}>
                      {/* Remove Button */}
                      <TouchableOpacity
                        style={{ padding: 4 }}
                        onPress={() => onRemove(item.id)}
                      >
                        <Ionicons name="trash-outline" size={20} color="#f87171" />
                      </TouchableOpacity>

                      {/* Quantity Controls */}
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          backgroundColor: '#111827',
                          borderRadius: 8,
                        }}
                      >
                        <TouchableOpacity
                          style={{
                            width: 32,
                            height: 32,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                          onPress={() => onUpdateQuantity(item.id, -1)}
                        >
                          <Ionicons name="remove" size={16} color="#e5e5e5" />
                        </TouchableOpacity>
                        <Text
                          style={{
                            width: 32,
                            textAlign: 'center',
                            color: '#e5e5e5',
                            fontWeight: '700',
                            fontSize: 14,
                          }}
                        >
                          {item.quantity}
                        </Text>
                        <TouchableOpacity
                          style={{
                            width: 32,
                            height: 32,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                          onPress={() => onUpdateQuantity(item.id, 1)}
                        >
                          <Ionicons name="add" size={16} color="#e5e5e5" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </ScrollView>
          )}

          {/* Summary */}
          {cart.length > 0 && (
            <View
              style={{
                borderTopWidth: 1,
                borderTopColor: '#374151',
                paddingHorizontal: 20,
                paddingVertical: 16,
                backgroundColor: 'rgba(17, 24, 39, 0.3)',
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 8,
                }}
              >
                <Text style={{ color: '#9ca3af' }}>Subtotal</Text>
                <Text style={{ color: '#e5e5e5', fontWeight: '500' }}>
                  ₱ {formatCurrency(subtotal)}
                </Text>
              </View>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 8,
                }}
              >
                <Text style={{ color: '#9ca3af' }}>Shipping</Text>
                <Text style={{ color: '#4ade80', fontWeight: '500' }}>Free</Text>
              </View>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: 12,
                  borderTopWidth: 1,
                  borderTopColor: '#374151',
                }}
              >
                <Text style={{ color: '#e5e5e5', fontWeight: '700', fontSize: 18 }}>
                  Total
                </Text>
                <Text style={{ color: '#c084fc', fontWeight: '700', fontSize: 20 }}>
                  ₱ {formatCurrency(subtotal)}
                </Text>
              </View>
            </View>
          )}

          {/* Checkout Button */}
          <View style={{ paddingHorizontal: 20, paddingBottom: 32, paddingTop: 16 }}>
            <TouchableOpacity
              style={{
                paddingVertical: 16,
                borderRadius: 16,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                backgroundColor: cart.length === 0 ? '#1f2937' : '#9333ea',
                ...(cart.length > 0
                  ? (Platform.OS === 'web'
                    ? { boxShadow: '0px 4px 12px rgba(147, 51, 234, 0.35)' }
                    : { elevation: 8 })
                  : {}),
              }}
              onPress={handleCheckout}
              disabled={cart.length === 0}
            >
              <Ionicons
                name="card-outline"
                size={20}
                color={cart.length === 0 ? '#9ca3af' : '#fff'}
              />
              <Text
                style={{
                  fontWeight: '600',
                  fontSize: 18,
                  color: cart.length === 0 ? '#9ca3af' : '#fff',
                }}
              >
                Proceed to Checkout
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
