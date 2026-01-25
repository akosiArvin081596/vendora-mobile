import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function RatingSummary({
  averageRating = 0,
  totalReviews = 0,
  distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  onWriteReview,
  compact = false,
}) {
  const renderStars = (rating, size = 16) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<Ionicons key={i} name="star" size={size} color="#fbbf24" />);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<Ionicons key={i} name="star-half" size={size} color="#fbbf24" />);
      } else {
        stars.push(<Ionicons key={i} name="star-outline" size={size} color="#6b7280" />);
      }
    }
    return stars;
  };

  const maxCount = Math.max(...Object.values(distribution), 1);

  if (compact) {
    return (
      <View className="flex-row items-center gap-2">
        <View className="flex-row items-center gap-1">
          {renderStars(averageRating, 14)}
        </View>
        <Text className="text-vendora-text font-semibold">
          {averageRating.toFixed(1)}
        </Text>
        <Text className="text-vendora-text-muted">
          ({totalReviews} {totalReviews === 1 ? 'review' : 'reviews'})
        </Text>
      </View>
    );
  }

  return (
    <View className="bg-vendora-bg rounded-xl p-4">
      <View className="flex-row gap-6">
        {/* Average Rating */}
        <View className="items-center justify-center">
          <Text className="text-vendora-text font-bold text-4xl mb-1">
            {averageRating.toFixed(1)}
          </Text>
          <View className="flex-row mb-1">
            {renderStars(averageRating, 14)}
          </View>
          <Text className="text-vendora-text-muted text-sm">
            {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
          </Text>
        </View>

        {/* Distribution Bars */}
        <View className="flex-1 gap-1.5">
          {[5, 4, 3, 2, 1].map((star) => (
            <View key={star} className="flex-row items-center gap-2">
              <Text className="text-vendora-text-muted text-xs w-3">{star}</Text>
              <Ionicons name="star" size={10} color="#fbbf24" />
              <View className="flex-1 h-2 bg-vendora-card rounded-full overflow-hidden">
                <View
                  className="h-full bg-yellow-400 rounded-full"
                  style={{
                    width: `${(distribution[star] / maxCount) * 100}%`,
                  }}
                />
              </View>
              <Text className="text-vendora-text-muted text-xs w-6 text-right">
                {distribution[star]}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Write Review Button */}
      {onWriteReview && (
        <TouchableOpacity
          className="mt-4 py-3 bg-vendora-purple/20 rounded-xl flex-row items-center justify-center gap-2"
          onPress={onWriteReview}
        >
          <Ionicons name="create-outline" size={18} color="#a855f7" />
          <Text className="text-vendora-purple-light font-semibold">Write a Review</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
