import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatCurrency } from '../utils/checkoutHelpers';

// Helper function to format relative time
function formatRelativeTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffWeeks = Math.floor(diffDays / 7);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  if (diffWeeks < 4) return `${diffWeeks} week${diffWeeks > 1 ? 's' : ''} ago`;

  return date.toLocaleDateString();
}

export default function SavedCartsModal({
  visible,
  onClose,
  savedCarts,
  onLoad,
  onMerge,
  onDelete,
  currentCartHasItems,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCartId, setExpandedCartId] = useState(null);

  const filteredCarts = savedCarts.filter(cart =>
    cart.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleLoad = (cart) => {
    if (currentCartHasItems) {
      Alert.alert(
        'Replace Cart?',
        'Loading this cart will replace your current cart items. Continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Replace',
            style: 'destructive',
            onPress: () => {
              onLoad(cart.id);
              onClose();
            }
          },
        ]
      );
    } else {
      onLoad(cart.id);
      onClose();
    }
  };

  const handleMerge = (cart) => {
    onMerge(cart.id);
    Alert.alert('Cart Merged', `Items from "${cart.name}" have been added to your cart`);
    onClose();
  };

  const handleDelete = (cart) => {
    Alert.alert(
      'Delete Cart?',
      `Are you sure you want to delete "${cart.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete(cart.id)
        },
      ]
    );
  };

  const toggleExpanded = (cartId) => {
    setExpandedCartId(expandedCartId === cartId ? null : cartId);
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/60">
        <TouchableOpacity className="flex-1" onPress={onClose} />

        <View className="bg-vendora-card rounded-t-3xl max-h-[85%]">
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
                <Ionicons name="folder" size={20} color="#a855f7" />
              </View>
              <View>
                <Text className="text-vendora-text font-semibold text-lg">Saved Carts</Text>
                <Text className="text-vendora-text-muted text-sm">
                  {savedCarts.length} cart{savedCarts.length !== 1 ? 's' : ''} saved
                </Text>
              </View>
            </View>
            <TouchableOpacity
              className="p-2"
              onPress={onClose}
            >
              <Ionicons name="close" size={24} color="#e5e5e5" />
            </TouchableOpacity>
          </View>

          {/* Search */}
          {savedCarts.length > 0 && (
            <View className="px-4 py-3">
              <View className="flex-row items-center gap-3 bg-vendora-input rounded-2xl px-4 py-3">
                <Ionicons name="search" size={20} color="#9ca3af" />
                <TextInput
                  className="flex-1 text-vendora-text text-base"
                  placeholder="Search saved carts..."
                  placeholderTextColor="#6b7280"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <Ionicons name="close-circle" size={20} color="#9ca3af" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* Saved Carts List */}
          <ScrollView className="flex-1 px-4 pb-8">
            {filteredCarts.length === 0 ? (
              <View className="items-center justify-center py-12">
                <View className="w-16 h-16 bg-vendora-input rounded-2xl items-center justify-center mb-3">
                  <Ionicons
                    name={searchQuery ? "search" : "folder-open-outline"}
                    size={32}
                    color="#9ca3af"
                  />
                </View>
                <Text className="text-vendora-text-muted font-medium">
                  {searchQuery ? 'No matching carts' : 'No saved carts'}
                </Text>
                <Text className="text-vendora-text-muted text-sm text-center mt-1">
                  {searchQuery
                    ? 'Try a different search term'
                    : 'Save your current cart to access it later'}
                </Text>
              </View>
            ) : (
              filteredCarts.map((cart) => (
                <View
                  key={cart.id}
                  className="bg-vendora-input rounded-xl mb-3 overflow-hidden"
                >
                  {/* Cart Header */}
                  <TouchableOpacity
                    className="p-4"
                    onPress={() => toggleExpanded(cart.id)}
                  >
                    <View className="flex-row items-start justify-between mb-2">
                      <View className="flex-1">
                        <Text className="text-vendora-text font-semibold text-base mb-1">
                          {cart.name}
                        </Text>
                        <View className="flex-row items-center gap-3">
                          <View className="flex-row items-center gap-1">
                            <Ionicons name="cube-outline" size={14} color="#9ca3af" />
                            <Text className="text-vendora-text-muted text-sm">
                              {cart.itemCount} item{cart.itemCount !== 1 ? 's' : ''}
                            </Text>
                          </View>
                          <View className="flex-row items-center gap-1">
                            <Ionicons name="time-outline" size={14} color="#9ca3af" />
                            <Text className="text-vendora-text-muted text-sm">
                              {formatRelativeTime(cart.savedAt)}
                            </Text>
                          </View>
                        </View>
                      </View>
                      <View className="items-end">
                        <Text className="text-vendora-purple-light font-bold">
                          {formatCurrency(cart.totalValue)}
                        </Text>
                        <Ionicons
                          name={expandedCartId === cart.id ? "chevron-up" : "chevron-down"}
                          size={18}
                          color="#9ca3af"
                        />
                      </View>
                    </View>
                  </TouchableOpacity>

                  {/* Expanded Items */}
                  {expandedCartId === cart.id && (
                    <View className="px-4 pb-3 border-t border-vendora-border/50">
                      <Text className="text-vendora-text-muted text-xs mt-3 mb-2">
                        Items in this cart:
                      </Text>
                      {cart.items.map((item, index) => (
                        <View
                          key={`${item.id}-${item.variantSku || index}`}
                          className="flex-row items-center justify-between py-2"
                        >
                          <View className="flex-1">
                            <Text className="text-vendora-text text-sm" numberOfLines={1}>
                              {item.name}
                              {item.variantOption && (
                                <Text className="text-vendora-text-muted">
                                  {' '}({item.variantOption})
                                </Text>
                              )}
                            </Text>
                          </View>
                          <View className="flex-row items-center gap-2">
                            <Text className="text-vendora-text-muted text-sm">
                              x{item.quantity}
                            </Text>
                            <Text className="text-vendora-text font-medium text-sm">
                              {formatCurrency(item.price * item.quantity)}
                            </Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Action Buttons */}
                  <View className="flex-row border-t border-vendora-border/50">
                    <TouchableOpacity
                      className="flex-1 flex-row items-center justify-center gap-2 py-3 border-r border-vendora-border/50"
                      onPress={() => handleLoad(cart)}
                    >
                      <Ionicons name="download-outline" size={18} color="#a855f7" />
                      <Text className="text-vendora-purple-light font-medium text-sm">Load</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      className="flex-1 flex-row items-center justify-center gap-2 py-3 border-r border-vendora-border/50"
                      onPress={() => handleMerge(cart)}
                    >
                      <Ionicons name="git-merge-outline" size={18} color="#22c55e" />
                      <Text className="text-green-400 font-medium text-sm">Merge</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      className="flex-1 flex-row items-center justify-center gap-2 py-3"
                      onPress={() => handleDelete(cart)}
                    >
                      <Ionicons name="trash-outline" size={18} color="#f87171" />
                      <Text className="text-red-400 font-medium text-sm">Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
