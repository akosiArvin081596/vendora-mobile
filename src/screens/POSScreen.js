import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  FlatList,
  Alert,
  useWindowDimensions,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useProducts } from '../context/ProductContext';
import { useOrders } from '../context/OrderContext';
import { useCart } from '../context/CartContext';
import ProductCard from '../components/ProductCard';
import CartSheet from '../components/CartSheet';
import CartPanel from '../components/CartPanel';
import FilterChip from '../components/FilterChip';
import CheckoutModal from '../components/CheckoutModal';
import ReceiptModal from '../components/ReceiptModal';
import SaveCartModal from '../components/SaveCartModal';
import SavedCartsModal from '../components/SavedCartsModal';

export default function POSScreen() {
  const { width } = useWindowDimensions();
  const isWideScreen = width >= 768;

  const {
    inventory,
    categories,
    getProductBySku,
    decrementStockAfterSale,
    isLoadingInventory,
    fetchInventory,
    error,
    isOffline,
  } = useProducts();

  // Fetch user's inventory on mount
  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);
  const { addOrder } = useOrders();
  const {
    cart,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    savedCarts,
    saveCart,
    loadCart,
    mergeCart,
    deleteSavedCart,
    abandonedCart,
    restoreAbandonedCart,
    clearAbandonedCart,
    totalItems,
    subtotal,
  } = useCart();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Refresh inventory handler
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await fetchInventory({ forceRefresh: true });
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchInventory]);
  const [filters, setFilters] = useState({
    stockEnforced: false,
    barcodeReady: false,
    tapToAdd: true,
  });
  const [showCart, setShowCart] = useState(false);
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [cartNotes, setCartNotes] = useState('');
  const [showCheckout, setShowCheckout] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [showSaveCartModal, setShowSaveCartModal] = useState(false);
  const [showSavedCartsModal, setShowSavedCartsModal] = useState(false);

  // Discount state
  const [selectedDiscount, setSelectedDiscount] = useState('none');
  const [customDiscountType, setCustomDiscountType] = useState('percentage');
  const [customDiscountValue, setCustomDiscountValue] = useState('');
  const [promoCode, setPromoCode] = useState('');

  // Check for abandoned cart on mount
  useEffect(() => {
    if (abandonedCart && abandonedCart.items && abandonedCart.items.length > 0 && cart.length === 0) {
      Alert.alert(
        'Restore Cart?',
        `You have an unsaved cart with ${abandonedCart.items.length} item(s). Would you like to restore it?`,
        [
          {
            text: 'Discard',
            style: 'cancel',
            onPress: () => clearAbandonedCart(),
          },
          {
            text: 'Restore',
            onPress: () => restoreAbandonedCart(inventory),
          },
        ]
      );
    }
  }, [abandonedCart, inventory]);

  // Filter products
  const filteredProducts = inventory.filter((product) => {
    // Normalize category to string for comparison
    const productCategory = typeof product.category === 'object'
      ? (product.category?.slug || product.category?.id || product.category?.name || '')
      : (product.category || '');

    if (selectedCategory !== 'all' && productCategory !== selectedCategory) {
      return false;
    }
    if (filters.stockEnforced && product.stock <= 0) {
      return false;
    }
    if (filters.barcodeReady && !product.hasBarcode) {
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

  // Wrapper for addToCart to pass inventory
  const handleAddToCart = useCallback((product) => {
    addToCart(product, inventory);
  }, [addToCart, inventory]);

  // Wrapper for updateQuantity to pass inventory
  const handleUpdateQuantity = useCallback((productId, change, variantSku = null) => {
    updateQuantity(productId, change, inventory, variantSku);
  }, [updateQuantity, inventory]);

  // Wrapper for removeFromCart
  const handleRemoveFromCart = useCallback((productId, variantSku = null) => {
    removeFromCart(productId, variantSku);
  }, [removeFromCart]);

  // Handle barcode submit
  const handleBarcodeSubmit = async () => {
    const sku = barcodeInput.toUpperCase().trim();
    if (!sku) return;

    try {
      const product = await getProductBySku(sku);
      if (product) {
        handleAddToCart(product);
        setBarcodeInput('');
        setShowBarcodeModal(false);
        Alert.alert('Added', `${product.name} added to cart`);
      } else {
        Alert.alert('Not Found', 'Product not found');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to lookup product');
    }
  };

  // Toggle filter
  const toggleFilter = (filterName) => {
    setFilters((prev) => ({ ...prev, [filterName]: !prev[filterName] }));
  };

  // Handle opening checkout
  const handleOpenCheckout = useCallback(() => {
    if (cart.length === 0) {
      Alert.alert('Cart Empty', 'Add products to checkout');
      return;
    }
    setShowCart(false);
    setShowCheckout(true);
  }, [cart.length]);

  // Handle checkout completion
  const handleCheckoutComplete = useCallback((data) => {
    // Decrement stock for sold items
    decrementStockAfterSale(cart);
    // Save order to order history
    addOrder(data);
    setReceiptData(data);
    setShowCheckout(false);
    setShowReceipt(true);
  }, [cart, decrementStockAfterSale, addOrder]);

  // Handle new transaction
  const handleNewTransaction = useCallback(() => {
    clearCart();
    clearAbandonedCart();
    setCartNotes('');
    setReceiptData(null);
    setShowReceipt(false);
    // Reset discount state
    setSelectedDiscount('none');
    setCustomDiscountType('percentage');
    setCustomDiscountValue('');
    setPromoCode('');
  }, [clearCart, clearAbandonedCart]);

  // Handle save cart
  const handleSaveCart = useCallback(() => {
    setShowSaveCartModal(true);
  }, []);

  // Handle save cart submit
  const handleSaveCartSubmit = useCallback((name) => {
    return saveCart(name);
  }, [saveCart]);

  // Handle open saved carts
  const handleOpenSavedCarts = useCallback(() => {
    setShowSavedCartsModal(true);
  }, []);

  // Handle load cart
  const handleLoadCart = useCallback((savedCartId) => {
    loadCart(savedCartId, inventory);
  }, [loadCart, inventory]);

  // Handle merge cart
  const handleMergeCart = useCallback((savedCartId) => {
    mergeCart(savedCartId, inventory);
  }, [mergeCart, inventory]);

  const selectedCategoryLabel = categories.find(c => c.value === selectedCategory)?.label || 'All Categories';

  return (
    <SafeAreaView className="flex-1 bg-vendora-bg">
      {/* Header */}
      <View className="bg-vendora-card border-b border-vendora-border px-4 py-4">
        <View className="flex-row items-center gap-2">
          {/* Customer Selector */}
          <TouchableOpacity className="flex-1 flex-row items-center gap-2 bg-vendora-input px-4 py-3.5 rounded-2xl">
            <Ionicons name="person-outline" size={20} color="#a855f7" />
            <Text className="text-vendora-text font-medium flex-1" numberOfLines={1}>
              Walk in cust...
            </Text>
            <Ionicons name="chevron-down" size={16} color="#9ca3af" />
          </TouchableOpacity>

          {/* Barcode Scanner Button */}
          <TouchableOpacity
            className="bg-vendora-input p-3.5 rounded-2xl"
            onPress={() => setShowBarcodeModal(true)}
          >
            <Ionicons name="barcode-outline" size={24} color="#a855f7" />
          </TouchableOpacity>

          {/* Quick Add Button */}
          <TouchableOpacity
            className="bg-vendora-purple p-3.5 rounded-2xl"
            onPress={() => setShowBarcodeModal(true)}
            style={Platform.OS === 'web'
              ? { boxShadow: '0px 4px 12px rgba(147, 51, 234, 0.35)' }
              : { elevation: 8 }}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>

          {/* Cart Button - Only show on narrow screens */}
          {!isWideScreen && (
            <TouchableOpacity
              className="bg-vendora-purple p-3.5 rounded-2xl relative"
              onPress={() => setShowCart(true)}
              style={Platform.OS === 'web'
                ? { boxShadow: '0px 4px 12px rgba(147, 51, 234, 0.35)' }
                : { elevation: 8 }}
            >
              <Ionicons name="cart-outline" size={24} color="#fff" />
              {totalItems > 0 && (
                <View className="absolute -top-1 -right-1 bg-red-500 rounded-full min-w-[20px] h-5 items-center justify-center px-1">
                  <Text className="text-white text-xs font-bold">
                    {totalItems > 99 ? '99+' : totalItems}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Main Content - Side by side layout on wide screens */}
      <View className="flex-1 flex-row">
        {/* Left Side - Products (70%) */}
        <View className={isWideScreen ? "flex-[7]" : "flex-1"}>
          {/* Search & Filters */}
          <View className="bg-vendora-bg px-4 py-4 border-b border-vendora-border">
            {/* Search Bar */}
            <View className="flex-row items-center gap-3 bg-vendora-input rounded-2xl px-4 py-3.5 mb-4">
              <Ionicons name="search" size={20} color="#a855f7" />
              <TextInput
                className="flex-1 text-vendora-text text-base"
                placeholder="Search products by name, SKU..."
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

            {/* Filters */}
            <ScrollView
              horizontal={true}
              showsHorizontalScrollIndicator={false}
              className="-mx-4 px-4"
              contentContainerStyle={{ gap: 10 }}
            >
              {/* Category Dropdown */}
              <TouchableOpacity
                className="flex-row items-center gap-2 bg-vendora-purple px-4 py-3 rounded-2xl"
                onPress={() => setShowCategoryPicker(true)}
                style={Platform.OS === 'web'
                  ? { boxShadow: '0px 2px 8px rgba(147, 51, 234, 0.2)' }
                  : { elevation: 4 }}
              >
                <Text className="text-white font-semibold">{selectedCategoryLabel}</Text>
                <Ionicons name="chevron-down" size={16} color="#fff" />
              </TouchableOpacity>

              <FilterChip
                icon="cube-outline"
                label="Stock enforced"
                active={filters.stockEnforced}
                onPress={() => toggleFilter('stockEnforced')}
              />
              <FilterChip
                icon="barcode-outline"
                label="Barcode ready"
                active={filters.barcodeReady}
                onPress={() => toggleFilter('barcodeReady')}
              />
              <FilterChip
                icon="hand-left-outline"
                label="Tap to add"
                active={filters.tapToAdd}
                onPress={() => toggleFilter('tapToAdd')}
              />
            </ScrollView>
          </View>

          {/* Products */}
          <ScrollView
            className="flex-1 px-4 pt-4"
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                tintColor="#9333ea"
                colors={['#9333ea']}
              />
            }
          >
            {/* Offline Banner */}
            {isOffline && (
              <View className="bg-yellow-500/20 border border-yellow-500/50 rounded-xl px-4 py-3 mb-4 flex-row items-center gap-2">
                <Ionicons name="cloud-offline-outline" size={20} color="#eab308" />
                <Text className="text-yellow-500 text-sm flex-1">
                  Offline mode - showing cached products
                </Text>
              </View>
            )}

            {/* Section Header */}
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center gap-2">
                <Ionicons name="cube" size={20} color="#9333ea" />
                <Text className="text-vendora-text font-semibold text-lg">Products</Text>
              </View>
              <Text className="text-vendora-text-muted text-sm">
                {filteredProducts.length} item{filteredProducts.length !== 1 ? 's' : ''}
              </Text>
            </View>

            {/* Loading State */}
            {isLoadingInventory ? (
              <View className="items-center justify-center py-16">
                <ActivityIndicator size="large" color="#9333ea" />
                <Text className="text-vendora-text-muted mt-4">Loading products...</Text>
              </View>
            ) : filteredProducts.length > 0 ? (
              /* Product List */
              filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  cartQuantity={cart.find((item) => item.id === product.id)?.quantity || 0}
                  onAdd={() => handleAddToCart(product)}
                  onUpdateQuantity={(change) => handleUpdateQuantity(product.id, change)}
                  tapToAdd={filters.tapToAdd}
                />
              ))
            ) : (
              <View className="items-center justify-center py-16">
                <View className="w-20 h-20 bg-vendora-card rounded-2xl items-center justify-center mb-4">
                  <Ionicons name="search" size={40} color="#9ca3af" />
                </View>
                <Text className="text-vendora-text-muted text-lg font-medium mb-1">
                  No products found
                </Text>
                <Text className="text-vendora-text-muted text-sm">
                  Try adjusting your search or filters
                </Text>
              </View>
            )}

            {/* Bottom spacing for floating cart on narrow screens */}
            {!isWideScreen && <View className="h-24" />}
          </ScrollView>

          {/* Floating Cart Button - Only on narrow screens */}
          {!isWideScreen && totalItems > 0 && (
            <View className="absolute bottom-0 left-0 right-0 bg-vendora-card/95 border-t border-vendora-border p-4">
              <TouchableOpacity
                className="bg-vendora-purple py-4 rounded-2xl flex-row items-center justify-between px-5"
                onPress={() => setShowCart(true)}
                style={Platform.OS === 'web'
                  ? { boxShadow: '0px 4px 12px rgba(147, 51, 234, 0.35)' }
                  : { elevation: 8 }}
              >
                <View className="flex-row items-center gap-3">
                  <Ionicons name="cart" size={24} color="#fff" />
                  <Text className="text-white font-medium">
                    {totalItems} item{totalItems > 1 ? 's' : ''}
                  </Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <Text className="text-white text-lg font-bold">
                    ₱ {subtotal.toLocaleString()}
                  </Text>
                  <Ionicons name="chevron-up" size={20} color="#fff" />
                </View>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Right Side - Cart Panel (30%, only on wide screens) */}
        {isWideScreen && (
          <View className="flex-[3] p-4 bg-vendora-bg">
            <CartPanel
              cart={cart}
              onUpdateQuantity={handleUpdateQuantity}
              onRemove={handleRemoveFromCart}
              subtotal={subtotal}
              notes={cartNotes}
              onNotesChange={setCartNotes}
              onCheckout={handleOpenCheckout}
              selectedDiscount={selectedDiscount}
              onDiscountChange={setSelectedDiscount}
              onSaveCart={handleSaveCart}
              onOpenSavedCarts={handleOpenSavedCarts}
              savedCartsCount={savedCarts.length}
            />
          </View>
        )}
      </View>

      {/* Cart Sheet Modal - Only used on narrow screens */}
      {!isWideScreen && (
        <CartSheet
          visible={showCart}
          onClose={() => setShowCart(false)}
          cart={cart}
          onUpdateQuantity={handleUpdateQuantity}
          onRemove={handleRemoveFromCart}
          subtotal={subtotal}
          onCheckout={handleOpenCheckout}
          selectedDiscount={selectedDiscount}
          onDiscountChange={setSelectedDiscount}
          onSaveCart={handleSaveCart}
          onOpenSavedCarts={handleOpenSavedCarts}
          savedCartsCount={savedCarts.length}
        />
      )}

      {/* Barcode Modal */}
      <Modal
        visible={showBarcodeModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowBarcodeModal(false)}
      >
        <TouchableOpacity
          className="flex-1 bg-black/70 items-center justify-start pt-24 px-4"
          activeOpacity={1}
          onPress={() => setShowBarcodeModal(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            className="bg-vendora-card rounded-3xl w-full max-w-md p-6"
          >
            <View className="flex-row items-center justify-between mb-5">
              <Text className="text-vendora-text font-semibold text-xl">
                Scan or Enter SKU
              </Text>
              <TouchableOpacity onPress={() => setShowBarcodeModal(false)}>
                <Ionicons name="close" size={24} color="#e5e5e5" />
              </TouchableOpacity>
            </View>

            <View className="flex-row items-center gap-3 bg-vendora-input rounded-2xl px-4 py-4 mb-4">
              <Ionicons name="barcode-outline" size={24} color="#a855f7" />
              <TextInput
                className="flex-1 text-vendora-text text-base"
                placeholder="Scan barcode or type SKU..."
                placeholderTextColor="#9ca3af"
                value={barcodeInput}
                onChangeText={setBarcodeInput}
                autoFocus={true}
                onSubmitEditing={handleBarcodeSubmit}
              />
            </View>

            <TouchableOpacity
              className="bg-vendora-purple py-4 rounded-2xl flex-row items-center justify-center gap-2"
              onPress={handleBarcodeSubmit}
              style={Platform.OS === 'web'
                ? { boxShadow: '0px 4px 12px rgba(147, 51, 234, 0.35)' }
                : { elevation: 8 }}
            >
              <Ionicons name="add" size={20} color="#fff" />
              <Text className="text-white font-semibold text-lg">Add to Cart</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Category Picker Modal */}
      <Modal
        visible={showCategoryPicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCategoryPicker(false)}
      >
        <TouchableOpacity
          className="flex-1 bg-black/70 items-center justify-center px-4"
          activeOpacity={1}
          onPress={() => setShowCategoryPicker(false)}
        >
          <View className="bg-vendora-card rounded-3xl w-full max-w-sm overflow-hidden">
            <Text className="text-vendora-text font-semibold text-lg p-4 border-b border-vendora-border">
              Select Category
            </Text>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.value}
                className={`p-4 border-b border-vendora-border ${
                  selectedCategory === category.value ? 'bg-vendora-purple/20' : ''
                }`}
                onPress={() => {
                  setSelectedCategory(category.value);
                  setShowCategoryPicker(false);
                }}
              >
                <Text
                  className={`text-base ${
                    selectedCategory === category.value
                      ? 'text-vendora-purple-light font-semibold'
                      : 'text-vendora-text'
                  }`}
                >
                  {category.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Checkout Modal */}
      <CheckoutModal
        visible={showCheckout}
        onClose={() => setShowCheckout(false)}
        cart={cart}
        subtotal={subtotal}
        totalItems={totalItems}
        cartNotes={cartNotes}
        onCheckoutComplete={handleCheckoutComplete}
        selectedDiscount={selectedDiscount}
        onDiscountChange={setSelectedDiscount}
        customDiscountType={customDiscountType}
        onCustomDiscountTypeChange={setCustomDiscountType}
        customDiscountValue={customDiscountValue}
        onCustomDiscountValueChange={setCustomDiscountValue}
        promoCode={promoCode}
        onPromoCodeChange={setPromoCode}
      />

      {/* Receipt Modal */}
      <ReceiptModal
        visible={showReceipt}
        onClose={() => setShowReceipt(false)}
        receiptData={receiptData}
        onNewTransaction={handleNewTransaction}
      />

      {/* Save Cart Modal */}
      <SaveCartModal
        visible={showSaveCartModal}
        onClose={() => setShowSaveCartModal(false)}
        onSave={handleSaveCartSubmit}
        itemCount={totalItems}
        totalValue={subtotal}
      />

      {/* Saved Carts Modal */}
      <SavedCartsModal
        visible={showSavedCartsModal}
        onClose={() => setShowSavedCartsModal(false)}
        savedCarts={savedCarts}
        onLoad={handleLoadCart}
        onMerge={handleMergeCart}
        onDelete={deleteSavedCart}
        currentCartHasItems={cart.length > 0}
      />
    </SafeAreaView>
  );
}
