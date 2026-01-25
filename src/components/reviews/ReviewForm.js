import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ReviewForm({
  onSubmit,
  onCancel,
  productName,
}) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    setError('');

    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    if (comment.trim().length < 10) {
      setError('Please write at least 10 characters');
      return;
    }

    onSubmit(rating, comment.trim());
  };

  return (
    <View className="bg-vendora-bg rounded-xl p-4">
      {/* Product Name */}
      {productName && (
        <Text className="text-vendora-text-muted text-sm mb-4">
          Reviewing: <Text className="text-vendora-text font-medium">{productName}</Text>
        </Text>
      )}

      {/* Star Rating */}
      <View className="mb-4">
        <Text className="text-vendora-text font-semibold mb-2">Your Rating</Text>
        <View className="flex-row gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity
              key={star}
              onPress={() => setRating(star)}
              className="p-1"
            >
              <Ionicons
                name={star <= rating ? 'star' : 'star-outline'}
                size={32}
                color={star <= rating ? '#fbbf24' : '#6b7280'}
              />
            </TouchableOpacity>
          ))}
        </View>
        {rating > 0 ? (
          <Text className="text-vendora-text-muted text-sm mt-1">
            {rating === 1 ? 'Poor' : rating === 2 ? 'Fair' : rating === 3 ? 'Good' : rating === 4 ? 'Very Good' : 'Excellent'}
          </Text>
        ) : null}
      </View>

      {/* Comment Input */}
      <View className="mb-4">
        <Text className="text-vendora-text font-semibold mb-2">Your Review</Text>
        <TextInput
          className="bg-vendora-card text-vendora-text p-4 rounded-xl min-h-[120px]"
          placeholder="Share your experience with this product..."
          placeholderTextColor="#6b7280"
          multiline
          textAlignVertical="top"
          value={comment}
          onChangeText={setComment}
        />
        <Text className="text-vendora-text-muted text-xs mt-1 text-right">
          {comment.length} characters (min 10)
        </Text>
      </View>

      {/* Error Message */}
      {error && (
        <View className="bg-red-500/20 p-3 rounded-lg mb-4">
          <Text className="text-red-400 text-sm">{error}</Text>
        </View>
      )}

      {/* Action Buttons */}
      <View className="flex-row gap-3">
        {onCancel && (
          <TouchableOpacity
            className="flex-1 py-3 bg-vendora-card rounded-xl items-center"
            onPress={onCancel}
          >
            <Text className="text-vendora-text font-semibold">Cancel</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          className="flex-1 py-3 bg-vendora-purple rounded-xl items-center flex-row justify-center gap-2"
          onPress={handleSubmit}
          style={{
            shadowColor: '#9333ea',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: 4,
          }}
        >
          <Ionicons name="send" size={18} color="#fff" />
          <Text className="text-white font-semibold">Submit Review</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
