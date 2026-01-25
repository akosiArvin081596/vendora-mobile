import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Image,
  ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BANNER_WIDTH = SCREEN_WIDTH - 32; // 16px padding on each side

export default function BannerCarousel({ banners, onBannerPress }) {
  const scrollRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);

  // Auto-scroll every 4 seconds
  useEffect(() => {
    if (banners.length <= 1) return;

    const interval = setInterval(() => {
      const nextIndex = (activeIndex + 1) % banners.length;
      scrollRef.current?.scrollTo({
        x: nextIndex * (BANNER_WIDTH + 12),
        animated: true,
      });
      setActiveIndex(nextIndex);
    }, 4000);

    return () => clearInterval(interval);
  }, [activeIndex, banners.length]);

  const handleScroll = (event) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / (BANNER_WIDTH + 12));
    if (index !== activeIndex && index >= 0 && index < banners.length) {
      setActiveIndex(index);
    }
  };

  return (
    <View className="mb-4">
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        decelerationRate="fast"
        snapToInterval={BANNER_WIDTH + 12}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
      >
        {banners.map((banner) => (
          <TouchableOpacity
            key={banner.id}
            className="rounded-2xl overflow-hidden"
            style={{ width: BANNER_WIDTH }}
            onPress={() => onBannerPress?.(banner)}
            activeOpacity={0.9}
          >
            {banner.image ? (
              <ImageBackground
                source={{ uri: banner.image }}
                className="h-36"
                resizeMode="cover"
              >
                {/* Gradient Overlay */}
                <View
                  className="flex-1 p-5 flex-row items-center justify-between"
                  style={{ backgroundColor: `${banner.backgroundColor}CC` }}
                >
                  <View className="flex-1 pr-4">
                    <Text className="text-white font-bold text-xl mb-1">
                      {banner.title}
                    </Text>
                    <Text className="text-white/90 text-sm">
                      {banner.subtitle}
                    </Text>
                  </View>
                  <View className="w-16 h-16 bg-white/20 rounded-full items-center justify-center">
                    <Ionicons name={banner.icon} size={32} color="#fff" />
                  </View>
                </View>
              </ImageBackground>
            ) : (
              <View
                className="h-36 p-5 flex-row items-center justify-between"
                style={{ backgroundColor: banner.backgroundColor }}
              >
                <View className="flex-1 pr-4">
                  <Text className="text-white font-bold text-xl mb-1">
                    {banner.title}
                  </Text>
                  <Text className="text-white/80 text-sm">
                    {banner.subtitle}
                  </Text>
                </View>
                <View className="w-16 h-16 bg-white/20 rounded-full items-center justify-center">
                  <Ionicons name={banner.icon} size={32} color="#fff" />
                </View>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Dots Indicator */}
      {banners.length > 1 ? (
        <View className="flex-row justify-center gap-2 mt-3">
          {banners.map((_, index) => (
            <View
              key={index}
              className={`h-2 rounded-full ${
                index === activeIndex
                  ? 'w-6 bg-vendora-purple'
                  : 'w-2 bg-vendora-border'
              }`}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}
