import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';

const SORT_OPTIONS = [
  { value: 'popularity', label: 'Most Popular', icon: 'trending-up' },
  { value: 'newest', label: 'Newest First', icon: 'time-outline' },
  { value: 'price_low', label: 'Price: Low to High', icon: 'arrow-up' },
  { value: 'price_high', label: 'Price: High to Low', icon: 'arrow-down' },
  { value: 'name_asc', label: 'Name: A to Z', icon: 'text' },
  { value: 'name_desc', label: 'Name: Z to A', icon: 'text' },
];

export default function SortFilterModal({
  visible,
  onClose,
  sortBy,
  onSortChange,
  filters,
  onFiltersChange,
  maxPrice = 2000,
  categories = [],
  brands = [],
}) {
  const [localSort, setLocalSort] = useState(sortBy);
  const [localFilters, setLocalFilters] = useState(filters);

  const handleApply = () => {
    onSortChange(localSort);
    onFiltersChange(localFilters);
    onClose();
  };

  const handleReset = () => {
    setLocalSort('popularity');
    setLocalFilters({
      inStockOnly: false,
      onSaleOnly: false,
      categories: [],
      minRating: 0,
      brands: [],
      priceRange: [0, maxPrice],
    });
  };

  const updateFilter = (key, value) => {
    setLocalFilters((prev) => ({ ...prev, [key]: value }));
  };

  const toggleCategory = (value) => {
    setLocalFilters((prev) => {
      const current = prev.categories || [];
      if (current.includes(value)) {
        return { ...prev, categories: current.filter((item) => item !== value) };
      }
      return { ...prev, categories: [...current, value] };
    });
  };

  const toggleBrand = (value) => {
    setLocalFilters((prev) => {
      const current = prev.brands || [];
      if (current.includes(value)) {
        return { ...prev, brands: current.filter((item) => item !== value) };
      }
      return { ...prev, brands: [...current, value] };
    });
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/60">
        <TouchableOpacity className="flex-[0.2]" onPress={onClose} />

        <View className="flex-[0.8] bg-vendora-card rounded-t-3xl">
          {/* Drag Handle */}
          <TouchableOpacity className="items-center py-3" onPress={onClose}>
            <View className="w-12 h-1.5 bg-vendora-border rounded-full" />
          </TouchableOpacity>

          {/* Header */}
          <View className="flex-row items-center justify-between px-5 pb-4 border-b border-vendora-border">
            <Text className="text-vendora-text font-bold text-xl">
              Sort & Filter
            </Text>
            <TouchableOpacity onPress={handleReset}>
              <Text className="text-vendora-purple-light font-medium">Reset</Text>
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
            {/* Sort Options */}
            <View className="py-4 border-b border-vendora-border">
              <Text className="text-vendora-text font-semibold text-lg mb-3">
                Sort By
              </Text>
              <View className="gap-2">
                {SORT_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    className={`flex-row items-center gap-3 p-3 rounded-xl ${
                      localSort === option.value
                        ? 'bg-vendora-purple/20 border border-vendora-purple'
                        : 'bg-vendora-input'
                    }`}
                    onPress={() => setLocalSort(option.value)}
                  >
                    <Ionicons
                      name={option.icon}
                      size={20}
                      color={localSort === option.value ? '#a855f7' : '#9ca3af'}
                    />
                    <Text
                      className={`flex-1 font-medium ${
                        localSort === option.value
                          ? 'text-vendora-purple-light'
                          : 'text-vendora-text'
                      }`}
                    >
                      {option.label}
                    </Text>
                    {localSort === option.value && (
                      <Ionicons name="checkmark-circle" size={20} color="#a855f7" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Filters */}
            <View className="py-4">
              <Text className="text-vendora-text font-semibold text-lg mb-3">
                Filters
              </Text>

              {/* Categories */}
              {categories.length > 0 && (
                <View className="mb-4">
                  <Text className="text-vendora-text font-medium mb-2">
                    Categories
                  </Text>
                  <View className="gap-2">
                    {categories.map((category) => {
                      const isActive = localFilters.categories?.includes(category.value);
                      return (
                        <TouchableOpacity
                          key={category.value}
                          className={`flex-row items-center gap-3 p-3 rounded-xl ${
                            isActive
                              ? 'bg-vendora-purple/20 border border-vendora-purple'
                              : 'bg-vendora-input'
                          }`}
                          onPress={() => toggleCategory(category.value)}
                        >
                          <Ionicons
                            name={isActive ? 'checkbox' : 'square-outline'}
                            size={20}
                            color={isActive ? '#a855f7' : '#9ca3af'}
                          />
                          <Text
                            className={`font-medium ${
                              isActive ? 'text-vendora-purple-light' : 'text-vendora-text'
                            }`}
                          >
                            {category.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* Brands */}
              {brands.length > 0 && (
                <View className="mb-4">
                  <Text className="text-vendora-text font-medium mb-2">
                    Brands
                  </Text>
                  <View className="gap-2">
                    {brands.map((brand) => {
                      const isActive = localFilters.brands?.includes(brand);
                      return (
                        <TouchableOpacity
                          key={brand}
                          className={`flex-row items-center gap-3 p-3 rounded-xl ${
                            isActive
                              ? 'bg-vendora-purple/20 border border-vendora-purple'
                              : 'bg-vendora-input'
                          }`}
                          onPress={() => toggleBrand(brand)}
                        >
                          <Ionicons
                            name={isActive ? 'checkbox' : 'square-outline'}
                            size={20}
                            color={isActive ? '#a855f7' : '#9ca3af'}
                          />
                          <Text
                            className={`font-medium ${
                              isActive ? 'text-vendora-purple-light' : 'text-vendora-text'
                            }`}
                          >
                            {brand}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* Ratings */}
              <View className="mb-4">
                <Text className="text-vendora-text font-medium mb-2">
                  Ratings
                </Text>
                <View className="gap-2">
                  {[4, 3, 2, 1].map((rating) => {
                    const isActive = localFilters.minRating === rating;
                    return (
                      <TouchableOpacity
                        key={rating}
                        className={`flex-row items-center gap-3 p-3 rounded-xl ${
                          isActive
                            ? 'bg-vendora-purple/20 border border-vendora-purple'
                            : 'bg-vendora-input'
                        }`}
                        onPress={() => updateFilter('minRating', isActive ? 0 : rating)}
                      >
                        <Ionicons
                          name={isActive ? 'radio-button-on' : 'radio-button-off'}
                          size={20}
                          color={isActive ? '#a855f7' : '#9ca3af'}
                        />
                        <View className="flex-row items-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Ionicons
                              key={`${rating}-${i}`}
                              name={i < rating ? 'star' : 'star-outline'}
                              size={16}
                              color={i < rating ? '#fbbf24' : '#6b7280'}
                            />
                          ))}
                          <Text className="text-vendora-text-muted text-xs ml-1">
                            & up
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Toggle Filters */}
              <View className="gap-3 mb-4">
                <TouchableOpacity
                  className={`flex-row items-center justify-between p-4 rounded-xl ${
                    localFilters.inStockOnly
                      ? 'bg-vendora-purple/20 border border-vendora-purple'
                      : 'bg-vendora-input'
                  }`}
                  onPress={() => updateFilter('inStockOnly', !localFilters.inStockOnly)}
                >
                  <View className="flex-row items-center gap-3">
                    <Ionicons
                      name="cube"
                      size={20}
                      color={localFilters.inStockOnly ? '#a855f7' : '#9ca3af'}
                    />
                    <Text
                      className={`font-medium ${
                        localFilters.inStockOnly
                          ? 'text-vendora-purple-light'
                          : 'text-vendora-text'
                      }`}
                    >
                      In Stock Only
                    </Text>
                  </View>
                  <View
                    className={`w-12 h-7 rounded-full p-1 ${
                      localFilters.inStockOnly ? 'bg-vendora-purple' : 'bg-vendora-border'
                    }`}
                  >
                    <View
                      className={`w-5 h-5 rounded-full bg-white ${
                        localFilters.inStockOnly ? 'self-end' : 'self-start'
                      }`}
                    />
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  className={`flex-row items-center justify-between p-4 rounded-xl ${
                    localFilters.onSaleOnly
                      ? 'bg-vendora-purple/20 border border-vendora-purple'
                      : 'bg-vendora-input'
                  }`}
                  onPress={() => updateFilter('onSaleOnly', !localFilters.onSaleOnly)}
                >
                  <View className="flex-row items-center gap-3">
                    <Ionicons
                      name="pricetag"
                      size={20}
                      color={localFilters.onSaleOnly ? '#a855f7' : '#9ca3af'}
                    />
                    <Text
                      className={`font-medium ${
                        localFilters.onSaleOnly
                          ? 'text-vendora-purple-light'
                          : 'text-vendora-text'
                      }`}
                    >
                      On Sale Only
                    </Text>
                  </View>
                  <View
                    className={`w-12 h-7 rounded-full p-1 ${
                      localFilters.onSaleOnly ? 'bg-vendora-purple' : 'bg-vendora-border'
                    }`}
                  >
                    <View
                      className={`w-5 h-5 rounded-full bg-white ${
                        localFilters.onSaleOnly ? 'self-end' : 'self-start'
                      }`}
                    />
                  </View>
                </TouchableOpacity>
              </View>

              {/* Price Range */}
              <View className="bg-vendora-input rounded-xl p-4">
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-vendora-text font-medium">Price Range</Text>
                  <Text className="text-vendora-purple-light font-semibold">
                    ₱{localFilters.priceRange?.[0] || 0} - ₱{localFilters.priceRange?.[1] || maxPrice}
                  </Text>
                </View>
                <View className="mb-3">
                  <Text className="text-vendora-text-muted text-xs mb-1">Min</Text>
                  <Slider
                    style={{ width: '100%', height: 40 }}
                    minimumValue={0}
                    maximumValue={maxPrice}
                    value={localFilters.priceRange?.[0] || 0}
                    onValueChange={(value) => {
                      const nextMin = Math.round(value);
                      const currentMax = localFilters.priceRange?.[1] ?? maxPrice;
                      updateFilter('priceRange', [Math.min(nextMin, currentMax), currentMax]);
                    }}
                    minimumTrackTintColor="#a855f7"
                    maximumTrackTintColor="#4a3660"
                    thumbTintColor="#a855f7"
                  />
                </View>
                <View>
                  <Text className="text-vendora-text-muted text-xs mb-1">Max</Text>
                  <Slider
                    style={{ width: '100%', height: 40 }}
                    minimumValue={0}
                    maximumValue={maxPrice}
                    value={localFilters.priceRange?.[1] || maxPrice}
                    onValueChange={(value) => {
                      const nextMax = Math.round(value);
                      const currentMin = localFilters.priceRange?.[0] ?? 0;
                      updateFilter('priceRange', [currentMin, Math.max(nextMax, currentMin)]);
                    }}
                    minimumTrackTintColor="#a855f7"
                    maximumTrackTintColor="#4a3660"
                    thumbTintColor="#a855f7"
                  />
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Apply Button */}
          <View className="px-5 pb-8 pt-4 border-t border-vendora-border">
            <TouchableOpacity
              className="bg-vendora-purple py-4 rounded-2xl flex-row items-center justify-center gap-2"
              onPress={handleApply}
              style={{
                shadowColor: '#9333ea',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 8,
              }}
            >
              <Ionicons name="checkmark" size={20} color="#fff" />
              <Text className="text-white font-semibold text-lg">Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
