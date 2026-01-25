import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

function ReviewItem({ review, onMarkHelpful }) {
  const renderStars = (rating) => {
    const stars = [];
    for (let i = 0; i < 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i < rating ? 'star' : 'star-outline'}
          size={14}
          color={i < rating ? '#fbbf24' : '#6b7280'}
        />
      );
    }
    return stars;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <View className="bg-vendora-card rounded-xl p-4 mb-3">
      {/* Header */}
      <View className="flex-row items-start justify-between mb-2">
        <View className="flex-row items-center gap-3">
          <View className="w-10 h-10 bg-vendora-purple/20 rounded-full items-center justify-center">
            <Text className="text-vendora-purple-light font-bold">
              {review.customerName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View>
            <View className="flex-row items-center gap-2">
              <Text className="text-vendora-text font-semibold">
                {review.customerName}
              </Text>
              {review.verified && (
                <View className="flex-row items-center gap-0.5 bg-green-500/20 px-1.5 py-0.5 rounded">
                  <Ionicons name="checkmark-circle" size={12} color="#22c55e" />
                  <Text className="text-green-400 text-xs">Verified</Text>
                </View>
              )}
            </View>
            <Text className="text-vendora-text-muted text-xs">
              {formatDate(review.createdAt)}
            </Text>
          </View>
        </View>
        <View className="flex-row">{renderStars(review.rating)}</View>
      </View>

      {/* Comment */}
      <Text className="text-vendora-text leading-6 mb-3">
        {review.comment}
      </Text>

      {/* Helpful */}
      <View className="flex-row items-center justify-between">
        <TouchableOpacity
          className="flex-row items-center gap-2 bg-vendora-bg px-3 py-2 rounded-lg"
          onPress={() => onMarkHelpful && onMarkHelpful(review.id)}
        >
          <Ionicons name="thumbs-up-outline" size={16} color="#9ca3af" />
          <Text className="text-vendora-text-muted text-sm">
            Helpful ({review.helpful})
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function ReviewList({
  reviews = [],
  onMarkHelpful,
  maxItems,
  scrollable = true,
}) {
  const displayReviews = maxItems ? reviews.slice(0, maxItems) : reviews;

  if (reviews.length === 0) {
    return (
      <View className="items-center justify-center py-8">
        <Ionicons name="chatbubbles-outline" size={48} color="#6b7280" />
        <Text className="text-vendora-text-muted mt-3 text-center">
          No reviews yet.{'\n'}Be the first to review!
        </Text>
      </View>
    );
  }

  if (scrollable) {
    return (
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
      >
        {displayReviews.map((review) => (
          <ReviewItem
            key={review.id}
            review={review}
            onMarkHelpful={onMarkHelpful}
          />
        ))}
        {maxItems && reviews.length > maxItems && (
          <Text className="text-vendora-text-muted text-center py-2">
            Showing {maxItems} of {reviews.length} reviews
          </Text>
        )}
      </ScrollView>
    );
  }

  return (
    <View>
      {displayReviews.map((review) => (
        <ReviewItem
          key={review.id}
          review={review}
          onMarkHelpful={onMarkHelpful}
        />
      ))}
    </View>
  );
}
