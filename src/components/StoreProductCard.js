import React from 'react';
import { View, Text, TouchableOpacity, Image, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatCurrency } from '../utils/checkoutHelpers';

export default function StoreProductCard({
  product,
  cartQuantity = 0,
  isWishlisted = false,
  onAddToCart,
  onQuickView,
  onToggleWishlist,
  onUpdateQuantity,
  cardWidth,
  style,
  rating,
  reviewCount,
}) {
  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;
  const isOnSale = product.isOnSale && product.originalPrice;
  const discountPercent = isOnSale
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  // Use rating props with fallback to 0
  const displayRating = rating || 0;
  const displayReviewCount = reviewCount || 0;

  const renderStars = () => {
    const stars = [];
    const fullStars = Math.floor(displayRating);
    const hasHalfStar = displayRating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <Ionicons key={i} name="star" size={12} color="#fbbf24" />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <Ionicons key={i} name="star-half" size={12} color="#fbbf24" />
        );
      } else {
        stars.push(
          <Ionicons key={i} name="star-outline" size={12} color="#6b7280" />
        );
      }
    }
    return stars;
  };

  return (
    <TouchableOpacity
      className="bg-vendora-card rounded-2xl overflow-hidden m-1.5"
      style={[cardWidth ? { width: cardWidth } : {}, style]}
      onPress={onQuickView}
      activeOpacity={0.8}
    >
      {/* Product Image */}
      <View className="aspect-square bg-vendora-input items-center justify-center relative">
        {product.image ? (
          <Image
            source={{ uri: product.image }}
            className="w-full h-full"
            resizeMode="cover"
          />
        ) : (
          <Ionicons name="cube-outline" size={48} color="#a855f7" />
        )}

        {/* Wishlist Button */}
        <TouchableOpacity
          className="absolute top-2 right-2 w-8 h-8 bg-vendora-card/80 rounded-full items-center justify-center"
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

        {/* Sale Badge */}
        {isOnSale && !product.isFlashSale ? (
          <View className="absolute top-2 left-2 bg-red-500 px-2 py-1 rounded-lg">
            <Text className="text-white text-xs font-bold">-{discountPercent}%</Text>
          </View>
        ) : null}

        {/* Flash Sale Badge */}
        {product.isFlashSale ? (
          <View className="absolute top-2 left-2 bg-orange-500 px-2 py-1 rounded-lg flex-row items-center gap-1">
            <Ionicons name="flash" size={12} color="#fff" />
            <Text className="text-white text-xs font-bold">-{discountPercent}%</Text>
          </View>
        ) : null}

        {/* Stock Badge */}
        {isOutOfStock ? (
          <View className="absolute bottom-2 left-2 bg-red-500/90 px-2 py-1 rounded-lg">
            <Text className="text-white text-xs font-semibold">Out of Stock</Text>
          </View>
        ) : null}
        {isLowStock && !isOutOfStock ? (
          <View className="absolute bottom-2 left-2 bg-yellow-500/90 px-2 py-1 rounded-lg">
            <Text className="text-white text-xs font-semibold">Only {product.stock} left</Text>
          </View>
        ) : null}

        {/* Cart Quantity Badge */}
        {cartQuantity > 0 ? (
          <View className="absolute bottom-2 right-2 bg-vendora-purple px-2 py-1 rounded-full flex-row items-center gap-1">
            <Ionicons name="cart" size={12} color="#fff" />
            <Text className="text-white text-xs font-bold">{cartQuantity}</Text>
          </View>
        ) : null}
      </View>

      {/* Product Info */}
      <View className="p-3">
        {/* Store Name */}
        {product.vendor?.name ? (
          <View className="flex-row items-center gap-1 mb-1">
            <Ionicons name="storefront-outline" size={10} color="#9ca3af" />
            <Text className="text-vendora-text-muted text-xs" numberOfLines={1} style={{ color: '#9ca3af' }}>
              {product.vendor.name}
            </Text>
          </View>
        ) : null}

        {/* Category */}
        <Text className="text-vendora-purple-light text-xs uppercase font-medium mb-1" style={{ color: '#a855f7' }}>
          {typeof product.category === 'object'
            ? (product.category?.label || product.category?.name || product.category?.slug || 'General')
            : product.category}
        </Text>

        {/* Name - fixed height for 2 lines to ensure card alignment */}
        <Text
          className="text-vendora-text font-semibold text-sm mb-1"
          numberOfLines={2}
          style={{ height: 36, lineHeight: 18, color: '#e5e5e5' }}
        >
          {product.name}
        </Text>

        {/* Rating */}
        <View className="flex-row items-center gap-1 mb-2">
          {renderStars()}
          <Text className="text-vendora-text-muted text-xs ml-1">
            ({displayReviewCount})
          </Text>
        </View>

        {/* Price */}
        <View className="flex-row items-center gap-2 mb-3">
          <Text className="text-vendora-purple-light font-bold text-lg" style={{ color: '#a855f7' }}>
            ₱ {formatCurrency(product.price)}
          </Text>
          {isOnSale ? (
            <Text className="text-vendora-text-muted text-sm line-through" style={{ color: '#9ca3af' }}>
              ₱ {formatCurrency(product.originalPrice)}
            </Text>
          ) : null}
        </View>

        {/* Add to Cart / Quantity Controls */}
        {cartQuantity > 0 && onUpdateQuantity ? (
          <View className="flex-row items-center justify-between bg-vendora-purple/20 rounded-xl p-1">
            <TouchableOpacity
              className="w-9 h-9 bg-vendora-card rounded-lg items-center justify-center"
              onPress={(e) => {
                e.stopPropagation();
                onUpdateQuantity(-1);
              }}
            >
              <Ionicons name="remove" size={18} color="#a855f7" />
            </TouchableOpacity>
            <Text className="text-vendora-purple-light font-bold text-base">
              {cartQuantity}
            </Text>
            <TouchableOpacity
              className="w-9 h-9 bg-vendora-card rounded-lg items-center justify-center"
              onPress={(e) => {
                e.stopPropagation();
                onUpdateQuantity(1);
              }}
            >
              <Ionicons name="add" size={18} color="#a855f7" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            className={`py-2.5 rounded-xl flex-row items-center justify-center gap-2 ${
              isOutOfStock ? 'bg-vendora-input' : 'bg-vendora-purple'
            }`}
            onPress={(e) => {
              e.stopPropagation();
              if (!isOutOfStock) onAddToCart();
            }}
            disabled={isOutOfStock}
            style={
              !isOutOfStock
                ? (Platform.OS === 'web'
                  ? { boxShadow: '0px 2px 8px rgba(147, 51, 234, 0.3)' }
                  : { elevation: 4 })
                : {}
            }
          >
            <Ionicons
              name={isOutOfStock ? 'ban-outline' : 'cart-outline'}
              size={16}
              color={isOutOfStock ? '#9ca3af' : '#fff'}
            />
            <Text className={`font-semibold text-sm ${
              isOutOfStock ? 'text-vendora-text-muted' : 'text-white'
            }`}>
              {isOutOfStock ? 'Unavailable' : 'Add to Cart'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}
