import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Modal,
  Image,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useProducts } from '../context/ProductContext';

const { width } = Dimensions.get('window');
const isWide = width >= 768;

export default function ProductsScreen() {
  const { inventory, categories, fetchInventory, isLoading } = useProducts();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const filteredProducts = useMemo(() => {
    let filtered = [...inventory];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (product) =>
          (product.name || '').toLowerCase().includes(query) ||
          (product.sku || '').toLowerCase().includes(query) ||
          (product.description || '').toLowerCase().includes(query)
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((product) => {
        const productCategory =
          typeof product.category === 'object'
            ? product.category?.id || product.category?.name
            : product.category || product.category_id;
        return productCategory?.toString() === selectedCategory.toString();
      });
    }

    return filtered;
  }, [inventory, searchQuery, selectedCategory]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (fetchInventory) {
      await fetchInventory();
    }
    setRefreshing(false);
  };

  const formatCurrency = (amount) => {
    return `₱${(amount || 0).toLocaleString('en-PH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const openProductDetail = (product) => {
    setSelectedProduct(product);
    setShowDetailModal(true);
  };

  const CategoryFilter = ({ label, value, active, onPress }) => (
    <TouchableOpacity
      className={`px-4 py-2 rounded-full mr-2 ${
        active ? 'bg-vendora-purple' : 'bg-vendora-input'
      }`}
      onPress={onPress}
    >
      <Text className={`text-sm font-medium ${active ? 'text-white' : 'text-vendora-text-muted'}`}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const ProductCard = ({ product }) => {
    const stock = product.stock || product.quantity || 0;
    const isLowStock = stock < 10;
    const isOutOfStock = stock === 0;

    if (viewMode === 'list') {
      return (
        <TouchableOpacity
          className="bg-vendora-card rounded-xl p-3 mb-3 flex-row"
          style={
            Platform.OS === 'web'
              ? { boxShadow: '0px 2px 6px rgba(0,0,0,0.15)' }
              : { elevation: 3 }
          }
          onPress={() => openProductDetail(product)}
          activeOpacity={0.7}
        >
          <View className="w-16 h-16 rounded-lg bg-vendora-input overflow-hidden mr-3">
            {product.image || product.image_url ? (
              <Image
                source={{ uri: product.image || product.image_url }}
                className="w-full h-full"
                resizeMode="cover"
              />
            ) : (
              <View className="w-full h-full items-center justify-center">
                <Ionicons name="cube-outline" size={24} color="#6b7280" />
              </View>
            )}
          </View>
          <View className="flex-1">
            <Text className="text-vendora-text font-semibold" numberOfLines={1}>
              {product.name}
            </Text>
            <Text className="text-vendora-text-muted text-xs" numberOfLines={1}>
              SKU: {product.sku || 'N/A'}
            </Text>
            <View className="flex-row items-center justify-between mt-1">
              <Text className="text-vendora-purple font-bold">
                {formatCurrency(product.price)}
              </Text>
              <View
                className={`px-2 py-1 rounded-full ${
                  isOutOfStock
                    ? 'bg-red-500/20'
                    : isLowStock
                    ? 'bg-amber-500/20'
                    : 'bg-green-500/20'
                }`}
              >
                <Text
                  className={`text-xs font-medium ${
                    isOutOfStock
                      ? 'text-red-400'
                      : isLowStock
                      ? 'text-amber-400'
                      : 'text-green-400'
                  }`}
                >
                  {isOutOfStock ? 'Out of Stock' : `${stock} in stock`}
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        className="bg-vendora-card rounded-xl overflow-hidden"
        style={[
          { width: isWide ? '23%' : '48%', marginBottom: 12 },
          Platform.OS === 'web'
            ? { boxShadow: '0px 2px 6px rgba(0,0,0,0.15)' }
            : { elevation: 3 },
        ]}
        onPress={() => openProductDetail(product)}
        activeOpacity={0.7}
      >
        <View className="w-full aspect-square bg-vendora-input">
          {product.image || product.image_url ? (
            <Image
              source={{ uri: product.image || product.image_url }}
              className="w-full h-full"
              resizeMode="cover"
            />
          ) : (
            <View className="w-full h-full items-center justify-center">
              <Ionicons name="cube-outline" size={40} color="#6b7280" />
            </View>
          )}
          {isOutOfStock ? (
            <View className="absolute top-2 right-2 bg-red-500 px-2 py-1 rounded-full">
              <Text className="text-white text-xs font-medium">Out of Stock</Text>
            </View>
          ) : isLowStock ? (
            <View className="absolute top-2 right-2 bg-amber-500 px-2 py-1 rounded-full">
              <Text className="text-white text-xs font-medium">Low Stock</Text>
            </View>
          ) : null}
        </View>
        <View className="p-3">
          <Text className="text-vendora-text font-semibold" numberOfLines={1}>
            {product.name}
          </Text>
          <Text className="text-vendora-text-muted text-xs" numberOfLines={1}>
            {product.sku || 'No SKU'}
          </Text>
          <View className="flex-row items-center justify-between mt-2">
            <Text className="text-vendora-purple font-bold">
              {formatCurrency(product.price)}
            </Text>
            <Text className="text-vendora-text-muted text-xs">{stock} pcs</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-vendora-bg" edges={['top']}>
      {/* Header */}
      <View className="px-4 pt-4 pb-2 flex-row items-center justify-between">
        <View>
          <Text className="text-vendora-text text-2xl font-bold">Products</Text>
          <Text className="text-vendora-text-muted">
            {filteredProducts.length} product(s)
          </Text>
        </View>
        <TouchableOpacity
          className="bg-vendora-purple px-4 py-2 rounded-xl flex-row items-center"
          onPress={() => setShowAddModal(true)}
        >
          <Ionicons name="add" size={20} color="#fff" />
          <Text className="text-white font-medium ml-1">Add</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View className="px-4 mb-3">
        <View className="flex-row items-center bg-vendora-input rounded-xl px-4 py-3">
          <Ionicons name="search" size={20} color="#9ca3af" />
          <TextInput
            className="flex-1 text-vendora-text ml-3"
            placeholder="Search products..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#9ca3af" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* View Mode Toggle & Category Filter */}
      <View className="px-4 mb-3 flex-row items-center justify-between">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="flex-1"
          contentContainerStyle={{ paddingRight: 60 }}
        >
          <CategoryFilter
            label="All"
            active={selectedCategory === 'all'}
            onPress={() => setSelectedCategory('all')}
          />
          {categories.map((category) => (
            <CategoryFilter
              key={category.id || category.name}
              label={category.name}
              active={selectedCategory === (category.id || category.name)?.toString()}
              onPress={() => setSelectedCategory((category.id || category.name)?.toString())}
            />
          ))}
        </ScrollView>
        <View className="flex-row bg-vendora-input rounded-lg p-1 ml-2">
          <TouchableOpacity
            className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-vendora-purple' : ''}`}
            onPress={() => setViewMode('grid')}
          >
            <Ionicons
              name="grid"
              size={18}
              color={viewMode === 'grid' ? '#fff' : '#9ca3af'}
            />
          </TouchableOpacity>
          <TouchableOpacity
            className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-vendora-purple' : ''}`}
            onPress={() => setViewMode('list')}
          >
            <Ionicons
              name="list"
              size={18}
              color={viewMode === 'list' ? '#fff' : '#9ca3af'}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Products Grid/List */}
      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{
          paddingBottom: 100,
          ...(viewMode === 'grid' && {
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
          }),
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing || isLoading}
            onRefresh={onRefresh}
            tintColor="#a855f7"
          />
        }
      >
        {filteredProducts.length > 0 ? (
          filteredProducts.map((product, index) => (
            <ProductCard key={product.id || index} product={product} />
          ))
        ) : (
          <View className="flex-1 items-center justify-center py-12 w-full">
            <Ionicons name="cube-outline" size={60} color="#4b5563" />
            <Text className="text-vendora-text-muted text-lg mt-4">No products found</Text>
            <Text className="text-vendora-text-muted text-sm mt-1">
              {searchQuery || selectedCategory !== 'all'
                ? 'Try adjusting your filters'
                : 'Add products to get started'}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Product Detail Modal */}
      <Modal
        visible={showDetailModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-vendora-bg rounded-t-3xl max-h-[85%]">
            <View className="flex-row items-center justify-between p-4 border-b border-vendora-border">
              <Text className="text-vendora-text text-xl font-bold">Product Details</Text>
              <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                <Ionicons name="close" size={24} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            {selectedProduct ? (
              <ScrollView className="p-4">
                {/* Product Image */}
                <View className="w-full aspect-video bg-vendora-input rounded-xl overflow-hidden mb-4">
                  {selectedProduct.image || selectedProduct.image_url ? (
                    <Image
                      source={{ uri: selectedProduct.image || selectedProduct.image_url }}
                      className="w-full h-full"
                      resizeMode="contain"
                    />
                  ) : (
                    <View className="w-full h-full items-center justify-center">
                      <Ionicons name="cube-outline" size={60} color="#6b7280" />
                    </View>
                  )}
                </View>

                {/* Product Info */}
                <Text className="text-vendora-text text-xl font-bold">
                  {selectedProduct.name}
                </Text>
                <Text className="text-vendora-text-muted text-sm mt-1">
                  SKU: {selectedProduct.sku || 'N/A'}
                </Text>

                <View className="flex-row items-center mt-4">
                  <Text className="text-vendora-purple text-2xl font-bold">
                    {formatCurrency(selectedProduct.price)}
                  </Text>
                  {selectedProduct.original_price &&
                  selectedProduct.original_price > selectedProduct.price ? (
                    <Text className="text-vendora-text-muted line-through ml-2">
                      {formatCurrency(selectedProduct.original_price)}
                    </Text>
                  ) : null}
                </View>

                {/* Stock Info */}
                <View className="bg-vendora-input rounded-xl p-4 mt-4">
                  <View className="flex-row justify-between mb-2">
                    <Text className="text-vendora-text-muted">Current Stock</Text>
                    <Text className="text-vendora-text font-semibold">
                      {selectedProduct.stock || selectedProduct.quantity || 0} units
                    </Text>
                  </View>
                  {selectedProduct.low_stock_threshold ? (
                    <View className="flex-row justify-between mb-2">
                      <Text className="text-vendora-text-muted">Low Stock Alert</Text>
                      <Text className="text-vendora-text">
                        {selectedProduct.low_stock_threshold} units
                      </Text>
                    </View>
                  ) : null}
                  {selectedProduct.category ? (
                    <View className="flex-row justify-between">
                      <Text className="text-vendora-text-muted">Category</Text>
                      <Text className="text-vendora-text">
                        {typeof selectedProduct.category === 'object'
                          ? selectedProduct.category?.name
                          : selectedProduct.category}
                      </Text>
                    </View>
                  ) : null}
                </View>

                {/* Description */}
                {selectedProduct.description ? (
                  <View className="mt-4">
                    <Text className="text-vendora-text font-semibold mb-2">Description</Text>
                    <Text className="text-vendora-text-muted">
                      {selectedProduct.description}
                    </Text>
                  </View>
                ) : null}

                {/* Action Buttons */}
                <View className="flex-row gap-3 mt-6 mb-4">
                  <TouchableOpacity className="flex-1 bg-vendora-input py-3 rounded-xl flex-row items-center justify-center">
                    <Ionicons name="create-outline" size={20} color="#a855f7" />
                    <Text className="text-vendora-purple font-medium ml-2">Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity className="flex-1 bg-vendora-purple py-3 rounded-xl flex-row items-center justify-center">
                    <Ionicons name="add-circle-outline" size={20} color="#fff" />
                    <Text className="text-white font-medium ml-2">Add Stock</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>

      {/* Add Product Modal Placeholder */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center p-4">
          <View className="bg-vendora-bg rounded-2xl p-6 w-full max-w-md">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-vendora-text text-xl font-bold">Add Product</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color="#9ca3af" />
              </TouchableOpacity>
            </View>
            <View className="items-center py-8">
              <Ionicons name="cube-outline" size={60} color="#6b7280" />
              <Text className="text-vendora-text-muted mt-4 text-center">
                Product creation form coming soon.{'\n'}Use the Inventory screen to add products.
              </Text>
            </View>
            <TouchableOpacity
              className="bg-vendora-purple py-3 rounded-xl mt-4"
              onPress={() => setShowAddModal(false)}
            >
              <Text className="text-white font-medium text-center">Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
