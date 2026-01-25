import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function FlashSaleCard({
  product,
  cartQuantity = 0,
  onAddToCart,
  onPress,
}) {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft(product.flashSaleEnds));

  function getTimeLeft(endDate) {
    const now = new Date().getTime();
    const end = new Date(endDate).getTime();
    const diff = end - now;

    if (diff <= 0) {
      return { hours: 0, minutes: 0, seconds: 0, expired: true };
    }

    return {
      hours: Math.floor(diff / (1000 * 60 * 60)),
      minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((diff % (1000 * 60)) / 1000),
      expired: false,
    };
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(getTimeLeft(product.flashSaleEnds));
    }, 1000);

    return () => clearInterval(timer);
  }, [product.flashSaleEnds]);

  const discountPercent = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const isOutOfStock = product.stock <= 0;

  if (timeLeft.expired) return null;

  return (
    <TouchableOpacity
      className="bg-vendora-card rounded-2xl overflow-hidden w-40 mr-3"
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Image with Flash Badge */}
      <View className="h-32 bg-vendora-input items-center justify-center relative overflow-hidden">
        {product.image ? (
          <Image
            source={{ uri: product.image }}
            className="w-full h-full"
            resizeMode="cover"
          />
        ) : (
          <Ionicons name="cube-outline" size={40} color="#a855f7" />
        )}

        {/* Flash Sale Badge */}
        <View className="absolute top-2 left-2 bg-red-500 px-2 py-1 rounded-lg flex-row items-center gap-1">
          <Ionicons name="flash" size={12} color="#fff" />
          <Text className="text-white text-xs font-bold">-{discountPercent}%</Text>
        </View>

        {/* Cart Badge */}
        {cartQuantity > 0 ? (
          <View className="absolute bottom-2 right-2 bg-vendora-purple px-2 py-1 rounded-full flex-row items-center gap-1">
            <Ionicons name="cart" size={10} color="#fff" />
            <Text className="text-white text-xs font-bold">{cartQuantity}</Text>
          </View>
        ) : null}
      </View>

      {/* Content */}
      <View className="p-3">
        <Text className="text-vendora-text font-semibold text-sm mb-1" numberOfLines={1}>
          {product.name}
        </Text>

        {/* Price */}
        <View className="flex-row items-center gap-2 mb-2">
          <Text className="text-vendora-purple-light font-bold">
            ₱{product.price}
          </Text>
          {product.originalPrice ? (
            <Text className="text-vendora-text-muted text-xs line-through">
              ₱{product.originalPrice}
            </Text>
          ) : null}
        </View>

        {/* Countdown Timer */}
        <View className="bg-red-500/10 rounded-lg p-2 mb-2">
          <View className="flex-row items-center justify-center gap-1">
            <Ionicons name="time-outline" size={12} color="#ef4444" />
            <Text className="text-red-400 text-xs font-bold">
              {String(timeLeft.hours).padStart(2, '0')}:
              {String(timeLeft.minutes).padStart(2, '0')}:
              {String(timeLeft.seconds).padStart(2, '0')}
            </Text>
          </View>
        </View>

        {/* Add Button */}
        <TouchableOpacity
          className={`py-2 rounded-lg flex-row items-center justify-center gap-1 ${
            isOutOfStock ? 'bg-vendora-input' : 'bg-red-500'
          }`}
          onPress={(e) => {
            e.stopPropagation();
            if (!isOutOfStock) onAddToCart();
          }}
          disabled={isOutOfStock}
        >
          <Ionicons
            name={isOutOfStock ? 'ban-outline' : 'flash'}
            size={14}
            color={isOutOfStock ? '#9ca3af' : '#fff'}
          />
          <Text className={`text-xs font-semibold ${
            isOutOfStock ? 'text-vendora-text-muted' : 'text-white'
          }`}>
            {isOutOfStock ? 'Sold Out' : 'Buy Now'}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}
