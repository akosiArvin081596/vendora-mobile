import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  useWindowDimensions,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useProducts } from '../context/ProductContext';
import StockUpdateModal from '../components/StockUpdateModal';
import AddProductModal from '../components/AddProductModal';
import Toast from '../components/Toast';

export default function InventoryScreen() {
  const { width } = useWindowDimensions();
  const isWideScreen = width >= 768;

  const {
    inventory,
    categories,
    adjustStock,
    addProduct,
    updateProduct,
    deleteProduct,
    getLowStockProducts,
    getOutOfStockProducts,
    fetchInventory,
    isLoadingInventory,
  } = useProducts();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
  const [showStockModal, setShowStockModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  // Fetch user's inventory on mount
  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
  };

  const hideToast = () => {
    setToast({ visible: false, message: '', type: 'success' });
  };

  const lowStockCount = getLowStockProducts().length;
  const outOfStockCount = getOutOfStockProducts().length;

  const filteredProducts = useMemo(() => {
    return inventory.filter((product) => {
      const productCategory = typeof product.category === 'object'
        ? product.category.slug || product.category.id || product.category.name
        : product.category;

      if (selectedCategory !== 'all' && productCategory !== selectedCategory) {
        return false;
      }
      if (stockFilter === 'low' && (product.stock === 0 || product.stock > 10)) {
        return false;
      }
      if (stockFilter === 'out' && product.stock > 0) {
        return false;
      }
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          product.name.toLowerCase().includes(query) ||
          product.sku.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [inventory, selectedCategory, stockFilter, searchQuery]);

  // Show loading screen while fetching inventory (after all hooks)
  if (isLoadingInventory) {
    return (
      <SafeAreaView className="flex-1 bg-vendora-bg items-center justify-center">
        <ActivityIndicator size="large" color="#a855f7" />
        <Text style={{ color: '#9ca3af', marginTop: 16, fontSize: 16 }}>
          Loading inventory...
        </Text>
      </SafeAreaView>
    );
  }

  const handleOpenStockModal = (product) => {
    setSelectedProduct(product);
    setShowStockModal(true);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setShowAddModal(true);
  };

  const handleDeleteProduct = (product) => {
    Alert.alert(
      'Delete Product',
      `Are you sure you want to delete "${product.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteProduct(product.id);
            Alert.alert('Deleted', 'Product has been deleted');
          },
        },
      ]
    );
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
    setEditingProduct(null);
  };

  const getStockStatusColor = (stock) => {
    if (stock === 0) return 'bg-red-500';
    if (stock <= 10) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStockStatusText = (stock) => {
    if (stock === 0) return 'Out of Stock';
    if (stock <= 10) return 'Low Stock';
    return 'In Stock';
  };

  return (
    <SafeAreaView className="flex-1 bg-vendora-bg">
      {/* Header */}
      <View className="bg-vendora-card border-b border-vendora-border px-4 py-4">
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center gap-3">
            <View
              className="p-2.5 rounded-xl bg-vendora-purple/20 border border-vendora-purple"
              style={
                Platform.OS === 'web'
                  ? { boxShadow: '0px 2px 8px rgba(168, 85, 247, 0.25)' }
                  : { elevation: 3 }
              }
            >
              <Ionicons name="cube" size={24} color="#a855f7" />
            </View>
            <Text style={{ color: '#e5e5e5', fontSize: 24, fontWeight: 'bold' }}>Inventory</Text>
          </View>
          <View className="flex-row items-center gap-2">
            {/* Low Stock Alert */}
            {lowStockCount > 0 && (
              <TouchableOpacity
                className={`relative p-2.5 rounded-xl border ${
                  stockFilter === 'low'
                    ? 'bg-yellow-500 border-yellow-500'
                    : 'bg-yellow-500/10 border-yellow-500/30'
                }`}
                onPress={() => setStockFilter(stockFilter === 'low' ? 'all' : 'low')}
                style={
                  Platform.OS === 'web'
                    ? { boxShadow: '0px 2px 8px rgba(234, 179, 8, 0.2)' }
                    : { elevation: 3 }
                }
              >
                <Ionicons
                  name="warning"
                  size={20}
                  color={stockFilter === 'low' ? '#fff' : '#eab308'}
                />
                <View
                  className="absolute -top-1.5 -right-1.5 bg-yellow-500 rounded-full min-w-[20px] h-5 items-center justify-center px-1 border-2 border-vendora-card"
                  style={
                    Platform.OS === 'web'
                      ? { boxShadow: '0px 2px 4px rgba(234, 179, 8, 0.4)' }
                      : { elevation: 4 }
                  }
                >
                  <Text style={{ color: '#fff', fontSize: 11, fontWeight: 'bold' }}>
                    {lowStockCount > 99 ? '99+' : lowStockCount}
                  </Text>
                </View>
              </TouchableOpacity>
            )}

            {/* Out of Stock Alert */}
            {outOfStockCount > 0 && (
              <TouchableOpacity
                className={`relative p-2.5 rounded-xl border ${
                  stockFilter === 'out'
                    ? 'bg-red-500 border-red-500'
                    : 'bg-red-500/10 border-red-500/30'
                }`}
                onPress={() => setStockFilter(stockFilter === 'out' ? 'all' : 'out')}
                style={
                  Platform.OS === 'web'
                    ? { boxShadow: '0px 2px 8px rgba(239, 68, 68, 0.2)' }
                    : { elevation: 3 }
                }
              >
                <Ionicons
                  name="alert-circle"
                  size={20}
                  color={stockFilter === 'out' ? '#fff' : '#ef4444'}
                />
                <View
                  className="absolute -top-1.5 -right-1.5 bg-red-500 rounded-full min-w-[20px] h-5 items-center justify-center px-1 border-2 border-vendora-card"
                  style={
                    Platform.OS === 'web'
                      ? { boxShadow: '0px 2px 4px rgba(239, 68, 68, 0.4)' }
                      : { elevation: 4 }
                  }
                >
                  <Text style={{ color: '#fff', fontSize: 11, fontWeight: 'bold' }}>
                    {outOfStockCount > 99 ? '99+' : outOfStockCount}
                  </Text>
                </View>
              </TouchableOpacity>
            )}

            {/* Add Product Button */}
            <TouchableOpacity
              className="p-2.5 rounded-xl bg-vendora-purple/20 border border-vendora-purple"
              onPress={() => setShowAddModal(true)}
              style={
                Platform.OS === 'web'
                  ? { boxShadow: '0px 2px 8px rgba(168, 85, 247, 0.25)' }
                  : { elevation: 3 }
              }
            >
              <Ionicons name="add-circle" size={22} color="#a855f7" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Cards */}
        <View className="flex-row gap-3">
          <TouchableOpacity
            className={`flex-1 p-3 rounded-xl ${
              stockFilter === 'all' ? 'bg-vendora-purple' : 'bg-vendora-input'
            }`}
            onPress={() => setStockFilter('all')}
          >
            <Text style={{ fontSize: 12, color: stockFilter === 'all' ? '#e9d5ff' : '#9ca3af' }}>
              Total Products
            </Text>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: stockFilter === 'all' ? '#fff' : '#e5e5e5' }}>
              {inventory.length}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`flex-1 p-3 rounded-xl ${
              stockFilter === 'low' ? 'bg-yellow-500' : 'bg-vendora-input'
            }`}
            onPress={() => setStockFilter(stockFilter === 'low' ? 'all' : 'low')}
          >
            <Text style={{ fontSize: 12, color: stockFilter === 'low' ? '#fef9c3' : '#9ca3af' }}>
              Low Stock
            </Text>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: stockFilter === 'low' ? '#fff' : '#eab308' }}>
              {lowStockCount}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`flex-1 p-3 rounded-xl ${
              stockFilter === 'out' ? 'bg-red-500' : 'bg-vendora-input'
            }`}
            onPress={() => setStockFilter(stockFilter === 'out' ? 'all' : 'out')}
          >
            <Text style={{ fontSize: 12, color: stockFilter === 'out' ? '#fecaca' : '#9ca3af' }}>
              Out of Stock
            </Text>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: stockFilter === 'out' ? '#fff' : '#ef4444' }}>
              {outOfStockCount}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search & Filters */}
      <View className="px-4 py-4 border-b border-vendora-border">
        <View className="flex-row items-center gap-3 bg-vendora-input rounded-2xl px-4 py-3 mb-3">
          <Ionicons name="search" size={20} color="#a855f7" />
          <TextInput
            className="flex-1 text-base"
            style={{ color: '#e5e5e5' }}
            placeholder="Search by name or SKU..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>

        {/* Category Filter */}
        <ScrollView
          horizontal={true}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
        >
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.value}
              className={`px-4 py-2 rounded-xl ${
                selectedCategory === cat.value
                  ? 'bg-vendora-purple'
                  : 'bg-vendora-input'
              }`}
              onPress={() => setSelectedCategory(cat.value)}
            >
              <Text
                style={{
                  fontWeight: '500',
                  color: selectedCategory === cat.value ? '#fff' : '#9ca3af'
                }}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Product List */}
      <ScrollView className="flex-1 px-4 pt-4">
        <View className="flex-row items-center justify-between mb-3">
          <Text style={{ color: '#9ca3af', fontSize: 14 }}>
            Showing {filteredProducts.length} of {inventory.length} products
          </Text>
          {/* View Toggle */}
          <View className="flex-row bg-vendora-input rounded-lg p-1">
            <TouchableOpacity
              className={`px-3 py-1.5 rounded-md ${viewMode === 'list' ? 'bg-vendora-purple' : ''}`}
              onPress={() => setViewMode('list')}
            >
              <Ionicons name="list" size={18} color={viewMode === 'list' ? '#fff' : '#9ca3af'} />
            </TouchableOpacity>
            <TouchableOpacity
              className={`px-3 py-1.5 rounded-md ${viewMode === 'grid' ? 'bg-vendora-purple' : ''}`}
              onPress={() => setViewMode('grid')}
            >
              <Ionicons name="grid" size={18} color={viewMode === 'grid' ? '#fff' : '#9ca3af'} />
            </TouchableOpacity>
          </View>
        </View>

        {filteredProducts.length > 0 ? (
          viewMode === 'list' ? (
            // List View
            filteredProducts.map((product) => (
              <View
                key={product.id}
                className="bg-vendora-card rounded-2xl p-4 mb-3"
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1">
                    <View className="flex-row items-center gap-2 mb-1">
                      <View className={`w-2.5 h-2.5 rounded-full ${getStockStatusColor(product.stock)}`} />
                      <Text style={{ color: '#e5e5e5', fontWeight: '600', fontSize: 18 }} numberOfLines={1}>
                        {product.name}
                      </Text>
                    </View>
                    <Text style={{ color: '#9ca3af', fontSize: 14, marginBottom: 8 }}>
                      SKU: {product.sku} • {typeof product.category === 'object'
                        ? (product.category.label || product.category.name || product.category.slug || product.category.id)
                        : product.category}
                    </Text>
                    <View className="flex-row items-center gap-4 flex-wrap">
                      <View>
                        <Text style={{ color: '#9ca3af', fontSize: 12 }}>Stock</Text>
                        <Text style={{
                          fontWeight: 'bold',
                          fontSize: 18,
                          color: product.stock === 0 ? '#ef4444' : product.stock <= 10 ? '#eab308' : '#22c55e'
                        }}>
                          {product.stock} {product.unit}
                        </Text>
                      </View>
                      <View>
                        <Text style={{ color: '#9ca3af', fontSize: 12 }}>Price</Text>
                        <Text style={{ color: '#e5e5e5', fontWeight: 'bold', fontSize: 18 }}>
                          ₱{(product.price || 0).toLocaleString()}
                        </Text>
                      </View>
                      <View className={`px-2 py-1 rounded-lg ${
                        product.stock === 0
                          ? 'bg-red-500/20'
                          : product.stock <= 10
                          ? 'bg-yellow-500/20'
                          : 'bg-green-500/20'
                      }`}>
                        <Text style={{
                          fontSize: 12,
                          fontWeight: '500',
                          color: product.stock === 0 ? '#f87171' : product.stock <= 10 ? '#facc15' : '#4ade80'
                        }}>
                          {getStockStatusText(product.stock)}
                        </Text>
                      </View>
                      {product.bulkPricing?.length > 0 && (
                        <View className="flex-row items-center gap-1 bg-vendora-purple/20 px-2 py-1 rounded-lg">
                          <Ionicons name="pricetags" size={12} color="#a855f7" />
                          <Text style={{ fontSize: 12, fontWeight: '500', color: '#a855f7' }}>
                            Bulk
                          </Text>
                        </View>
                      )}
                    </View>
                    {product.bulkPricing?.length > 0 && (
                      <View className="mt-2">
                        <Text style={{ color: '#9ca3af', fontSize: 11 }}>
                          Bulk: {product.bulkPricing.map(t => `${t.minQty || 0}+ @ ₱${t.price || 0}`).join(' • ')}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Action Buttons */}
                <View className="flex-row gap-2 mt-4 pt-3 border-t border-vendora-border">
                  <TouchableOpacity
                    className="flex-1 bg-vendora-purple/20 py-2.5 rounded-xl flex-row items-center justify-center gap-2"
                    onPress={() => handleOpenStockModal(product)}
                  >
                    <Ionicons name="swap-vertical" size={18} color="#a855f7" />
                    <Text style={{ color: '#c084fc', fontWeight: '500' }}>Update Stock</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="flex-1 bg-vendora-input py-2.5 rounded-xl flex-row items-center justify-center gap-2"
                    onPress={() => handleEditProduct(product)}
                  >
                    <Ionicons name="create-outline" size={18} color="#9ca3af" />
                    <Text style={{ color: '#9ca3af', fontWeight: '500' }}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="bg-red-500/20 px-4 py-2.5 rounded-xl"
                    onPress={() => handleDeleteProduct(product)}
                  >
                    <Ionicons name="trash-outline" size={18} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          ) : (
            // Grid View
            <View className="flex-row flex-wrap" style={{ marginHorizontal: -6 }}>
              {filteredProducts.map((product) => (
                <View key={product.id} style={{ width: '50%', paddingHorizontal: 6, marginBottom: 12 }}>
                  <View className="bg-vendora-card rounded-2xl p-3">
                    {/* Stock Status Indicator */}
                    <View className={`absolute top-2 right-2 w-3 h-3 rounded-full ${getStockStatusColor(product.stock)}`} />

                    {/* Product Name */}
                    <Text style={{ color: '#e5e5e5', fontWeight: '600', fontSize: 14, marginBottom: 4, paddingRight: 16 }} numberOfLines={2}>
                      {product.name}
                    </Text>

                    {/* SKU */}
                    <Text style={{ color: '#9ca3af', fontSize: 11, marginBottom: 8 }}>
                      {product.sku}
                    </Text>

                    {/* Stock */}
                    <Text style={{
                      fontWeight: 'bold',
                      fontSize: 20,
                      color: product.stock === 0 ? '#ef4444' : product.stock <= 10 ? '#eab308' : '#22c55e'
                    }}>
                      {product.stock}
                    </Text>
                    <Text style={{ color: '#9ca3af', fontSize: 11 }}>{product.unit} in stock</Text>

                    {/* Price */}
                    <Text style={{ color: '#e5e5e5', fontWeight: '600', fontSize: 14, marginTop: 8 }}>
                      ₱{(product.price || 0).toLocaleString()}
                    </Text>

                    {/* Bulk Pricing Badge */}
                    {product.bulkPricing?.length > 0 && (
                      <View className="flex-row items-center gap-1 bg-vendora-purple/20 px-2 py-1 rounded-md mt-2 self-start">
                        <Ionicons name="pricetags" size={10} color="#a855f7" />
                        <Text style={{ fontSize: 10, fontWeight: '500', color: '#a855f7' }}>
                          Bulk Pricing
                        </Text>
                      </View>
                    )}

                    {/* Action Buttons */}
                    <View className="flex-row gap-2 mt-3 pt-2 border-t border-vendora-border">
                      <TouchableOpacity
                        className="flex-1 bg-vendora-purple/20 py-2 rounded-lg items-center"
                        onPress={() => handleOpenStockModal(product)}
                      >
                        <Ionicons name="swap-vertical" size={18} color="#a855f7" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        className="flex-1 bg-vendora-input py-2 rounded-lg items-center"
                        onPress={() => handleEditProduct(product)}
                      >
                        <Ionicons name="create-outline" size={18} color="#9ca3af" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        className="flex-1 bg-red-500/20 py-2 rounded-lg items-center"
                        onPress={() => handleDeleteProduct(product)}
                      >
                        <Ionicons name="trash-outline" size={18} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )
        ) : (
          <View className="items-center justify-center py-16">
            <View className="w-20 h-20 bg-vendora-card rounded-2xl items-center justify-center mb-4">
              <Ionicons name="cube-outline" size={40} color="#9ca3af" />
            </View>
            <Text style={{ color: '#9ca3af', fontSize: 18, fontWeight: '500', marginBottom: 4 }}>
              No products found
            </Text>
            <Text style={{ color: '#9ca3af', fontSize: 14, textAlign: 'center' }}>
              {searchQuery
                ? 'Try adjusting your search'
                : 'Add products to get started'}
            </Text>
          </View>
        )}

        {/* Bottom spacing */}
        <View className="h-20" />
      </ScrollView>

      {/* Stock Update Modal */}
      <StockUpdateModal
        visible={showStockModal}
        onClose={() => {
          setShowStockModal(false);
          setSelectedProduct(null);
        }}
        product={selectedProduct}
        onUpdateStock={adjustStock}
      />

      {/* Add/Edit Product Modal */}
      <AddProductModal
        visible={showAddModal}
        onClose={handleCloseAddModal}
        onAddProduct={addProduct}
        existingProduct={editingProduct}
        onUpdateProduct={updateProduct}
        categories={categories}
        onSuccess={showToast}
      />

      {/* Toast Notification */}
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
      />
    </SafeAreaView>
  );
}
