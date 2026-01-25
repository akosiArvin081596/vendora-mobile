import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import RatingSummary from './RatingSummary';
import ReviewList from './ReviewList';
import ReviewForm from './ReviewForm';
import { useReviews } from '../../context/ReviewContext';

export default function ReviewModal({
  visible,
  onClose,
  product,
}) {
  const [showForm, setShowForm] = useState(false);
  const {
    getProductReviews,
    getProductRatingStats,
    addReview,
    markHelpful,
  } = useReviews();

  if (!product) return null;

  const reviews = getProductReviews(product.id);
  const stats = getProductRatingStats(product.id);

  const handleSubmitReview = (rating, comment) => {
    // Using 'guest' as customer ID and generating a random name for demo
    const customerNames = ['Happy Customer', 'Valued Buyer', 'Loyal Shopper', 'New User'];
    const customerName = customerNames[Math.floor(Math.random() * customerNames.length)];

    addReview(product.id, 'guest', customerName, rating, comment);
    setShowForm(false);
    Alert.alert('Success', 'Thank you for your review!');
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/60">
        <TouchableOpacity className="flex-[0.1]" onPress={onClose} />

        <View className="flex-[0.9] bg-vendora-card rounded-t-3xl">
          {/* Drag Handle */}
          <TouchableOpacity className="items-center py-3" onPress={onClose}>
            <View className="w-12 h-1.5 bg-vendora-border rounded-full" />
          </TouchableOpacity>

          {/* Header */}
          <View className="flex-row items-center justify-between px-5 pb-4 border-b border-vendora-border">
            <View>
              <Text className="text-vendora-text font-bold text-xl">Reviews</Text>
              <Text className="text-vendora-text-muted text-sm" numberOfLines={1}>
                {product.name}
              </Text>
            </View>
            <TouchableOpacity
              className="w-10 h-10 bg-vendora-input rounded-full items-center justify-center"
              onPress={onClose}
            >
              <Ionicons name="close" size={20} color="#e5e5e5" />
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 px-5 pt-4" showsVerticalScrollIndicator={false}>
            {showForm ? (
              <>
                <Text className="text-vendora-text font-semibold text-lg mb-4">
                  Write Your Review
                </Text>
                <ReviewForm
                  productName={product.name}
                  onSubmit={handleSubmitReview}
                  onCancel={() => setShowForm(false)}
                />
              </>
            ) : (
              <>
                {/* Rating Summary */}
                <RatingSummary
                  averageRating={stats.averageRating}
                  totalReviews={stats.totalReviews}
                  distribution={stats.distribution}
                  onWriteReview={() => setShowForm(true)}
                />

                {/* Reviews List */}
                <View className="mt-4 mb-8">
                  <Text className="text-vendora-text font-semibold text-lg mb-3">
                    Customer Reviews
                  </Text>
                  <ReviewList
                    reviews={reviews}
                    onMarkHelpful={markHelpful}
                    scrollable={false}
                  />
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
