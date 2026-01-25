import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ProductCard({
  product,
  cartQuantity,
  onAdd,
  onUpdateQuantity,
  tapToAdd,
}) {
  const stockColor =
    product.stock > 10
      ? 'bg-green-500/20 text-green-400'
      : product.stock > 0
      ? 'bg-yellow-500/20 text-yellow-400'
      : 'bg-red-500/20 text-red-400';

  return (
    <TouchableOpacity
      className="bg-vendora-card rounded-2xl p-4 mb-3"
      onPress={tapToAdd ? onAdd : undefined}
      activeOpacity={tapToAdd ? 0.8 : 1}
    >
      <View className="flex-row items-start gap-4">
        {/* Product Image */}
        {product.image ? (
          <Image
            source={{ uri: product.image }}
            className="w-14 h-14 rounded-xl"
            style={{ backgroundColor: '#3d2a52' }}
          />
        ) : (
          <View className="w-14 h-14 bg-vendora-input rounded-xl items-center justify-center">
            <Ionicons name="cube-outline" size={28} color="#a855f7" />
          </View>
        )}

        {/* Product Info */}
        <View className="flex-1">
          <Text className="text-vendora-text font-semibold text-base mb-1" numberOfLines={1}>
            {product.name}
          </Text>
          <Text className="text-vendora-text-muted text-sm">
            {product.sku} • {product.unit}
          </Text>
          <View className="flex-row items-center gap-2 mt-1.5">
            <View className={`px-2 py-0.5 rounded-full ${stockColor.split(' ')[0]}`}>
              <Text className={`text-xs ${stockColor.split(' ')[1]}`}>
                {product.stock > 0 ? `Stock: ${product.stock}` : 'Out of stock'}
              </Text>
            </View>
            {product.hasBarcode && (
              <View className="bg-vendora-purple/20 px-2 py-0.5 rounded-full">
                <Text className="text-xs text-vendora-purple-light">Barcode</Text>
              </View>
            )}
          </View>
        </View>

        {/* Price & Actions */}
        <View className="items-end">
          <Text className="text-vendora-purple-light font-bold text-lg mb-2">
            ₱ {product.price.toLocaleString()}
          </Text>

          {cartQuantity > 0 ? (
            <View className="flex-row items-center gap-1 bg-vendora-purple/20 rounded-xl p-1">
              <TouchableOpacity
                className="w-8 h-8 bg-vendora-card rounded-lg items-center justify-center"
                onPress={() => onUpdateQuantity(-1)}
              >
                <Ionicons name="remove" size={16} color="#e5e5e5" />
              </TouchableOpacity>
              <Text className="w-8 text-center text-vendora-text font-bold text-sm">
                {cartQuantity}
              </Text>
              <TouchableOpacity
                className="w-8 h-8 bg-vendora-card rounded-lg items-center justify-center"
                onPress={() => onUpdateQuantity(1)}
              >
                <Ionicons name="add" size={16} color="#e5e5e5" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              className="bg-vendora-purple px-5 py-2.5 rounded-xl"
              onPress={onAdd}
            >
              <Text className="text-white font-medium text-sm">Add</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}
