import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatCurrency } from '../utils/checkoutHelpers';
import { useReviews } from '../context/ReviewContext';

export default function ProductQuickViewModal({
  visible,
  onClose,
  product,
  cartQuantity = 0,
  isWishlisted = false,
  onAddToCart,
  onUpdateQuantity,
  onToggleWishlist,
  onShowReviews,
}) {
  const [quantity, setQuantity] = useState(1);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const { getProductRatingStats } = useReviews();
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

  if (!product) return null;

  const isOutOfStock = product.stock <= 0;
  const maxQuantity = product.stock - cartQuantity;
  const isOnSale = product.isOnSale && product.originalPrice;
  const discountPercent = isOnSale
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  // Use product description or generate default
  const categoryName = typeof product.category === 'object'
    ? (product.category?.label || product.category?.name || product.category?.slug || 'general')
    : product.category;
  const description = product.description || `Quality ${categoryName} product. ${product.name} - available in ${product.unit}.`;

  // Get real rating data from context
  const stats = getProductRatingStats(product.id);
  const rating = stats.averageRating;
  const reviewCount = stats.totalReviews;

  const renderStars = () => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<Ionicons key={i} name="star" size={16} color="#fbbf24" />);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<Ionicons key={i} name="star-half" size={16} color="#fbbf24" />);
      } else {
        stars.push(<Ionicons key={i} name="star-outline" size={16} color="#6b7280" />);
      }
    }
    return stars;
  };

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      onAddToCart();
    }
    setQuantity(1);
    onClose();
  };

  const incrementQuantity = () => {
    if (quantity < maxQuantity) {
      setQuantity((prev) => prev + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  };

  const handleClose = () => {
    setQuantity(1);
    setShowImageViewer(false);
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
        <TouchableOpacity className="flex-[0.15]" onPress={handleClose} />

        <View className="flex-[0.85] bg-vendora-card rounded-t-3xl">
          {/* Drag Handle */}
          <TouchableOpacity className="items-center py-3" onPress={handleClose}>
            <View className="w-12 h-1.5 bg-vendora-border rounded-full" />
          </TouchableOpacity>

          <ScrollView
            className="flex-1"
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            {/* Product Image */}
            <View className="h-48 bg-vendora-input mx-5 rounded-2xl items-center justify-center mb-5 relative overflow-hidden">
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => product.image && setShowImageViewer(true)}
                className="w-full h-full items-center justify-center"
              >
                {product.image ? (
                  <>
                    <Image
                      source={{ uri: product.image }}
                      className="w-full h-full"
                      resizeMode="contain"
                    />
                    {/* Zoom hint icon */}
                    <View className="absolute bottom-3 right-3 bg-black/50 rounded-full p-2">
                      <Ionicons name="expand-outline" size={16} color="#fff" />
                    </View>
                  </>
                ) : (
                  <Ionicons name="cube-outline" size={80} color="#a855f7" />
                )}
              </TouchableOpacity>

              {/* Wishlist Button */}
              <TouchableOpacity
                className="absolute top-3 right-3 w-10 h-10 bg-vendora-card rounded-full items-center justify-center"
                onPress={onToggleWishlist}
              >
                <Ionicons
                  name={isWishlisted ? 'heart' : 'heart-outline'}
                  size={22}
                  color={isWishlisted ? '#ef4444' : '#9ca3af'}
                />
              </TouchableOpacity>

              {/* Sale Badge */}
              {isOnSale && !product.isFlashSale && (
                <View className="absolute top-3 left-3 bg-red-500 px-3 py-1.5 rounded-lg">
                  <Text className="text-white text-sm font-bold">-{discountPercent}% OFF</Text>
                </View>
              )}

              {/* Flash Sale Badge */}
              {product.isFlashSale && (
                <View className="absolute top-3 left-3 bg-orange-500 px-3 py-1.5 rounded-lg flex-row items-center gap-1">
                  <Ionicons name="flash" size={14} color="#fff" />
                  <Text className="text-white text-sm font-bold">-{discountPercent}% FLASH</Text>
                </View>
              )}

              {/* Stock Badge */}
              {isOutOfStock && (
                <View className="absolute bottom-3 left-3 bg-red-500 px-3 py-1.5 rounded-lg">
                  <Text className="text-white text-sm font-semibold">Out of Stock</Text>
                </View>
              )}
            </View>

            {/* Product Details */}
            <View className="px-5">
              {/* Category */}
              <Text className="text-vendora-purple-light text-sm uppercase font-medium mb-2">
                {typeof product.category === 'object'
                  ? (product.category?.label || product.category?.name || product.category?.slug || 'General')
                  : product.category}
              </Text>

              {/* Name */}
              <Text className="text-vendora-text font-bold text-2xl mb-2">
                {product.name}
              </Text>

              {/* SKU */}
              <Text className="text-vendora-text-muted text-sm mb-3">
                SKU: {product.sku} | Unit: {product.unit}
              </Text>

              {/* Rating */}
              <TouchableOpacity
                className="flex-row items-center gap-2 mb-4"
                onPress={() => onShowReviews?.(product)}
                activeOpacity={0.7}
              >
                <View className="flex-row">{renderStars()}</View>
                <Text className="text-vendora-text font-medium">{rating.toFixed(1)}</Text>
                <Text className="text-vendora-text-muted">({reviewCount} reviews)</Text>
                <Ionicons name="chevron-forward" size={16} color="#a855f7" />
                <Text className="text-vendora-purple-light text-sm">See all</Text>
              </TouchableOpacity>

              {/* Price */}
              <View className="flex-row items-center gap-3 mb-4">
                <Text className="text-vendora-purple-light font-bold text-3xl">
                  ₱ {formatCurrency(product.price)}
                </Text>
                {isOnSale && (
                  <View className="flex-row items-center gap-2">
                    <Text className="text-vendora-text-muted text-xl line-through">
                      ₱ {formatCurrency(product.originalPrice)}
                    </Text>
                    <View className="bg-red-500 px-2 py-1 rounded">
                      <Text className="text-white text-xs font-bold">SAVE ₱{formatCurrency(product.originalPrice - product.price)}</Text>
                    </View>
                  </View>
                )}
              </View>

              {/* Stock Info */}
              <View className="flex-row items-center gap-2 mb-4">
                <View className={`w-3 h-3 rounded-full ${
                  product.stock > 10 ? 'bg-green-500' :
                  product.stock > 0 ? 'bg-yellow-500' : 'bg-red-500'
                }`} />
                <Text className={`font-medium ${
                  product.stock > 10 ? 'text-green-400' :
                  product.stock > 0 ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                </Text>
                {cartQuantity > 0 && (
                  <Text className="text-vendora-text-muted">
                    ({cartQuantity} in cart)
                  </Text>
                )}
              </View>

              {/* Description */}
              <View className="bg-vendora-bg rounded-xl p-4 mb-5">
                <Text className="text-vendora-text font-semibold mb-2">Description</Text>
                <Text className="text-vendora-text-muted leading-6">{description}</Text>
              </View>

              {/* Quantity Selector */}
              {!isOutOfStock && maxQuantity > 0 && (
                <View className="mb-5">
                  <Text className="text-vendora-text font-semibold mb-3">Quantity</Text>
                  <View className="flex-row items-center gap-4">
                    <View className="flex-row items-center bg-vendora-bg rounded-xl">
                      <TouchableOpacity
                        className="w-12 h-12 items-center justify-center"
                        onPress={decrementQuantity}
                        disabled={quantity <= 1}
                      >
                        <Ionicons
                          name="remove"
                          size={20}
                          color={quantity <= 1 ? '#6b7280' : '#e5e5e5'}
                        />
                      </TouchableOpacity>
                      <Text className="w-12 text-center text-vendora-text font-bold text-lg">
                        {quantity}
                      </Text>
                      <TouchableOpacity
                        className="w-12 h-12 items-center justify-center"
                        onPress={incrementQuantity}
                        disabled={quantity >= maxQuantity}
                      >
                        <Ionicons
                          name="add"
                          size={20}
                          color={quantity >= maxQuantity ? '#6b7280' : '#e5e5e5'}
                        />
                      </TouchableOpacity>
                    </View>
                    <Text className="text-vendora-text-muted">
                      Max: {maxQuantity} {product.unit}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </ScrollView>

          {/* Add to Cart Button */}
          <View className="px-5 pb-8 pt-4 border-t border-vendora-border">
            <TouchableOpacity
              className={`py-4 rounded-2xl flex-row items-center justify-center gap-2 ${
                isOutOfStock || maxQuantity <= 0 ? 'bg-vendora-input' : 'bg-vendora-purple'
              }`}
              onPress={handleAddToCart}
              disabled={isOutOfStock || maxQuantity <= 0}
              style={!isOutOfStock && maxQuantity > 0 ? {
                shadowColor: '#9333ea',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 8,
              } : {}}
            >
              <Ionicons
                name={isOutOfStock ? 'ban-outline' : 'cart-outline'}
                size={20}
                color={isOutOfStock || maxQuantity <= 0 ? '#9ca3af' : '#fff'}
              />
              <Text className={`font-semibold text-lg ${
                isOutOfStock || maxQuantity <= 0 ? 'text-vendora-text-muted' : 'text-white'
              }`}>
                {isOutOfStock
                  ? 'Out of Stock'
                  : maxQuantity <= 0
                  ? 'Max in Cart'
                  : `Add ${quantity} to Cart - ₱ ${formatCurrency(product.price * quantity)}`}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Floating Image Viewer */}
      <Modal
        visible={showImageViewer}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowImageViewer(false)}
      >
        <View className="flex-1 bg-black/95 items-center justify-center">
          {/* Close Button */}
          <TouchableOpacity
            className="absolute top-12 right-5 z-10 w-10 h-10 bg-white/20 rounded-full items-center justify-center"
            onPress={() => setShowImageViewer(false)}
          >
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>

          {/* Product Name */}
          <View className="absolute top-12 left-5 right-16">
            <Text className="text-white font-semibold text-lg" numberOfLines={2}>
              {product.name}
            </Text>
          </View>

          {/* Full Size Image */}
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setShowImageViewer(false)}
            className="w-full h-full items-center justify-center px-5"
          >
            <Image
              source={{ uri: product.image }}
              style={{
                width: screenWidth - 40,
                height: screenHeight * 0.6,
              }}
              resizeMode="contain"
            />
          </TouchableOpacity>

          {/* Tap to close hint */}
          <View className="absolute bottom-12 items-center">
            <Text className="text-white/60 text-sm">Tap anywhere to close</Text>
          </View>
        </View>
      </Modal>
    </Modal>
  );
}
