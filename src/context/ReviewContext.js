import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

const ReviewContext = createContext();

// Sample reviews data
const initialReviews = [
  // Premium Rice 5kg reviews
  { id: 'r1', productId: 1, customerId: 'c1', customerName: 'Maria Santos', rating: 5, comment: 'Excellent quality rice! Very fragrant and cooks perfectly every time. My family loves it.', createdAt: '2026-01-10T08:30:00Z', helpful: 12, verified: true },
  { id: 'r2', productId: 1, customerId: 'c2', customerName: 'Juan Dela Cruz', rating: 4, comment: 'Good quality, but the packaging could be better. Overall satisfied with the purchase.', createdAt: '2026-01-08T14:20:00Z', helpful: 5, verified: true },
  { id: 'r3', productId: 1, customerId: 'c3', customerName: 'Ana Reyes', rating: 5, comment: 'Best rice I have tried! Will definitely buy again.', createdAt: '2026-01-05T10:15:00Z', helpful: 8, verified: false },

  // Cooking Oil reviews
  { id: 'r4', productId: 2, customerId: 'c1', customerName: 'Maria Santos', rating: 4, comment: 'Good quality oil. No off-taste when frying.', createdAt: '2026-01-12T09:00:00Z', helpful: 3, verified: true },
  { id: 'r5', productId: 2, customerId: 'c4', customerName: 'Pedro Lopez', rating: 5, comment: 'Perfect for everyday cooking. Great value!', createdAt: '2026-01-06T16:45:00Z', helpful: 7, verified: true },

  // Laundry Detergent reviews
  { id: 'r6', productId: 3, customerId: 'c5', customerName: 'Rosa Garcia', rating: 5, comment: 'Removes tough stains easily! Love the fresh scent.', createdAt: '2026-01-11T11:30:00Z', helpful: 15, verified: true },
  { id: 'r7', productId: 3, customerId: 'c6', customerName: 'Carlos Rivera', rating: 3, comment: 'Decent cleaning power but the scent is a bit strong for me.', createdAt: '2026-01-03T08:00:00Z', helpful: 2, verified: false },

  // Cement reviews
  { id: 'r8', productId: 4, customerId: 'c7', customerName: 'Builder Bob', rating: 5, comment: 'High-quality cement. Sets well and has good strength.', createdAt: '2026-01-09T07:30:00Z', helpful: 20, verified: true },
  { id: 'r9', productId: 4, customerId: 'c8', customerName: 'Contractor Joe', rating: 4, comment: 'Good cement for the price. Delivery was fast.', createdAt: '2025-12-28T14:00:00Z', helpful: 10, verified: true },

  // PVC Pipe reviews
  { id: 'r10', productId: 5, customerId: 'c9', customerName: 'Plumber Pete', rating: 4, comment: 'Standard quality PVC. Good for basic plumbing work.', createdAt: '2026-01-07T10:00:00Z', helpful: 4, verified: true },

  // Nails Assorted reviews
  { id: 'r11', productId: 6, customerId: 'c10', customerName: 'Handy Man', rating: 5, comment: 'Great variety pack! Has all the sizes I need.', createdAt: '2026-01-04T15:30:00Z', helpful: 8, verified: true },
  { id: 'r12', productId: 6, customerId: 'c11', customerName: 'DIY Diana', rating: 4, comment: 'Good quality nails at a reasonable price.', createdAt: '2025-12-30T09:15:00Z', helpful: 3, verified: false },

  // Screwdriver Set reviews
  { id: 'r13', productId: 7, customerId: 'c12', customerName: 'Tool Master', rating: 5, comment: 'Excellent screwdriver set! Ergonomic handles and durable tips.', createdAt: '2026-01-02T12:00:00Z', helpful: 11, verified: true },

  // Instant Noodles reviews
  { id: 'r14', productId: 9, customerId: 'c13', customerName: 'Foodie Fred', rating: 5, comment: 'Best instant noodles! The seasoning is so tasty.', createdAt: '2026-01-13T18:30:00Z', helpful: 25, verified: true },
  { id: 'r15', productId: 9, customerId: 'c14', customerName: 'Busy Bee', rating: 4, comment: 'Quick and delicious. Perfect for late night snacks.', createdAt: '2026-01-10T21:00:00Z', helpful: 9, verified: true },
  { id: 'r16', productId: 9, customerId: 'c15', customerName: 'Student Sam', rating: 5, comment: 'My go-to meal when I am in a hurry. Love it!', createdAt: '2026-01-08T19:45:00Z', helpful: 6, verified: false },

  // LED Light Bulb reviews
  { id: 'r17', productId: 10, customerId: 'c16', customerName: 'Energy Saver', rating: 5, comment: 'Very bright and energy efficient. Already saving on electricity bills!', createdAt: '2026-01-11T08:00:00Z', helpful: 14, verified: true },
  { id: 'r18', productId: 10, customerId: 'c17', customerName: 'Home Owner', rating: 4, comment: 'Good quality LED bulb. Takes a second to warm up to full brightness.', createdAt: '2026-01-05T16:30:00Z', helpful: 5, verified: true },
];

export function ReviewProvider({ children }) {
  const [reviews, setReviews] = useState(initialReviews);

  // Get reviews for a specific product
  const getProductReviews = useCallback((productId) => {
    return reviews
      .filter(r => r.productId === productId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [reviews]);

  // Get rating stats for a product
  const getProductRatingStats = useCallback((productId) => {
    const productReviews = reviews.filter(r => r.productId === productId);

    if (productReviews.length === 0) {
      return {
        averageRating: 0,
        totalReviews: 0,
        distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      };
    }

    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let totalRating = 0;

    productReviews.forEach(review => {
      distribution[review.rating]++;
      totalRating += review.rating;
    });

    return {
      averageRating: totalRating / productReviews.length,
      totalReviews: productReviews.length,
      distribution,
    };
  }, [reviews]);

  // Add a new review
  const addReview = useCallback((productId, customerId, customerName, rating, comment) => {
    const newReview = {
      id: `r${Date.now()}`,
      productId,
      customerId,
      customerName,
      rating,
      comment,
      createdAt: new Date().toISOString(),
      helpful: 0,
      verified: false,
    };

    setReviews(prev => [newReview, ...prev]);
    return newReview;
  }, []);

  // Mark review as helpful
  const markHelpful = useCallback((reviewId) => {
    setReviews(prev => prev.map(review =>
      review.id === reviewId
        ? { ...review, helpful: review.helpful + 1 }
        : review
    ));
  }, []);

  // Delete review
  const deleteReview = useCallback((reviewId) => {
    setReviews(prev => prev.filter(r => r.id !== reviewId));
  }, []);

  // Check if user has reviewed a product
  const hasUserReviewed = useCallback((productId, customerId) => {
    return reviews.some(r => r.productId === productId && r.customerId === customerId);
  }, [reviews]);

  // Get all rating stats for all products (memoized for performance)
  const allProductRatings = useMemo(() => {
    const ratings = {};
    const productIds = [...new Set(reviews.map(r => r.productId))];

    productIds.forEach(productId => {
      const productReviews = reviews.filter(r => r.productId === productId);
      const totalRating = productReviews.reduce((sum, r) => sum + r.rating, 0);
      ratings[productId] = {
        averageRating: productReviews.length > 0 ? totalRating / productReviews.length : 0,
        totalReviews: productReviews.length,
      };
    });

    return ratings;
  }, [reviews]);

  const value = {
    reviews,
    getProductReviews,
    getProductRatingStats,
    addReview,
    markHelpful,
    deleteReview,
    hasUserReviewed,
    allProductRatings,
  };

  return (
    <ReviewContext.Provider value={value}>
      {children}
    </ReviewContext.Provider>
  );
}

export function useReviews() {
  const context = useContext(ReviewContext);
  if (!context) {
    throw new Error('useReviews must be used within a ReviewProvider');
  }
  return context;
}

export default ReviewContext;
