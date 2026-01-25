import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ProductListCard({
  product,
  cartQuantity = 0,
  isWishlisted = false,
  onAddToCart,
  onPress,
  onToggleWishlist,
  onUpdateQuantity,
}) {
  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;
  const isOnSale = product.isOnSale && product.originalPrice;
  const discountPercent = isOnSale
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <TouchableOpacity
      className="bg-vendora-card rounded-2xl p-4 mb-3 mx-4 flex-row gap-4"
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Product Image */}
      <View className="w-24 h-24 bg-vendora-input rounded-xl items-center justify-center relative overflow-hidden">
        {product.image ? (
          <Image
            source={{ uri: product.image }}
            className="w-full h-full"
            resizeMode="cover"
          />
        ) : (
          <Ionicons name="cube-outline" size={36} color="#a855f7" />
        )}

        {/* Sale Badge */}
        {isOnSale && (
          <View className="absolute top-1 left-1 bg-red-500 px-1.5 py-0.5 rounded">
            <Text className="text-white text-xs font-bold">-{discountPercent}%</Text>
          </View>
        )}

        {/* Flash Sale Badge */}
        {product.isFlashSale && (
          <View className="absolute bottom-1 left-1 bg-orange-500 px-1.5 py-0.5 rounded flex-row items-center gap-0.5">
            <Ionicons name="flash" size={10} color="#fff" />
            <Text className="text-white text-xs font-bold">Flash</Text>
          </View>
        )}
      </View>

      {/* Product Info */}
      <View className="flex-1">
        {/* Store Name */}
        {product.vendor?.name && (
          <View className="flex-row items-center gap-1 mb-0.5">
            <Ionicons name="storefront-outline" size={10} color="#9ca3af" />
            <Text className="text-vendora-text-muted text-xs" numberOfLines={1}>
              {product.vendor.name}
            </Text>
          </View>
        )}

        {/* Category */}
        <Text className="text-vendora-purple-light text-xs uppercase font-medium mb-0.5">
          {typeof product.category === 'object'
            ? (product.category?.label || product.category?.name || product.category?.slug || 'General')
            : product.category}
        </Text>

        {/* Name */}
        <Text className="text-vendora-text font-semibold text-base mb-1" numberOfLines={2}>
          {product.name}
        </Text>

        {/* Stock Status */}
        <View className="flex-row items-center gap-2 mb-2">
          {isOutOfStock ? (
            <View className="bg-red-500/20 px-2 py-0.5 rounded">
              <Text className="text-red-400 text-xs font-medium">Out of Stock</Text>
            </View>
          ) : isLowStock ? (
            <View className="bg-yellow-500/20 px-2 py-0.5 rounded">
              <Text className="text-yellow-400 text-xs font-medium">Low Stock: {product.stock}</Text>
            </View>
          ) : (
            <View className="bg-green-500/20 px-2 py-0.5 rounded">
              <Text className="text-green-400 text-xs font-medium">In Stock</Text>
            </View>
          )}
        </View>

        {/* Price */}
        <View className="flex-row items-center gap-2">
          <Text className="text-vendora-purple-light font-bold text-lg">
            ₱ {product.price.toLocaleString()}
          </Text>
          {isOnSale && (
            <Text className="text-vendora-text-muted text-sm line-through">
              ₱ {product.originalPrice.toLocaleString()}
            </Text>
          )}
        </View>
      </View>

      {/* Actions */}
      <View className="items-end justify-between">
        {/* Wishlist */}
        <TouchableOpacity
          className="w-8 h-8 bg-vendora-input rounded-full items-center justify-center"
          onPress={(e) => {
            e.stopPropagation();
            onToggleWishlist();
          }}
        >
          <Ionicons
            name={isWishlisted ? 'heart' : 'heart-outline'}
            size={18}
            color={isWishlisted ? '#ef4444' : '#9ca3af'}
          />
        </TouchableOpacity>

        {/* Cart Controls */}
        {cartQuantity > 0 ? (
          <View className="flex-row items-center bg-vendora-purple/20 rounded-lg">
            <TouchableOpacity
              className="w-8 h-8 items-center justify-center"
              onPress={(e) => {
                e.stopPropagation();
                onUpdateQuantity(-1);
              }}
            >
              <Ionicons name="remove" size={16} color="#a855f7" />
            </TouchableOpacity>
            <Text className="w-6 text-center text-vendora-purple-light font-bold">
              {cartQuantity}
            </Text>
            <TouchableOpacity
              className="w-8 h-8 items-center justify-center"
              onPress={(e) => {
                e.stopPropagation();
                onUpdateQuantity(1);
              }}
            >
              <Ionicons name="add" size={16} color="#a855f7" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            className={`px-4 py-2 rounded-lg ${
              isOutOfStock ? 'bg-vendora-input' : 'bg-vendora-purple'
            }`}
            onPress={(e) => {
              e.stopPropagation();
              if (!isOutOfStock) onAddToCart();
            }}
            disabled={isOutOfStock}
          >
            <Ionicons
              name={isOutOfStock ? 'ban-outline' : 'add'}
              size={20}
              color={isOutOfStock ? '#9ca3af' : '#fff'}
            />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}
