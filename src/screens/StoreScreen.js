import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  Alert,
  RefreshControl,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useProducts } from '../context/ProductContext';
import { useOrders } from '../context/OrderContext';
import { useCustomers } from '../context/CustomerContext';
import { useReviews } from '../context/ReviewContext';
import { banners } from '../data/products';
import StoreProductCard from '../components/StoreProductCard';
import ReviewModal from '../components/reviews/ReviewModal';
import ProductListCard from '../components/ProductListCard';
import ProductQuickViewModal from '../components/ProductQuickViewModal';
import StoreCartSheet from '../components/StoreCartSheet';
import CheckoutModal from '../components/CheckoutModal';
import ReceiptModal from '../components/ReceiptModal';
import BannerCarousel from '../components/BannerCarousel';
import FlashSaleCard from '../components/FlashSaleCard';
import SortFilterModal from '../components/SortFilterModal';
import LoginModal from '../components/LoginModal';
import ProfileModal from '../components/ProfileModal';
import VendoraLoading from '../components/VendoraLoading';
import { useAuth } from '../context/AuthContext';

export default function StoreScreen() {
  const { width } = useWindowDimensions();
  const numColumns = width >= 768 ? 4 : 2;
  const shadow = (boxShadow, elevation = 4) =>
    Platform.OS === 'web' ? { boxShadow } : { elevation };
  // Calculate card width: (screen width - horizontal padding - gaps between cards) / numColumns
  const cardWidth = (width - 16 - (numColumns * 12)) / numColumns;

  const { publicProducts, categories, decrementStockAfterSale, fetchProducts, isLoadingProducts } = useProducts();

  // Fetch all public products on mount (e-commerce view)
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const { addOrder } = useOrders();
  const { recentlyViewed, addRecentlyViewed } = useCustomers();
  const { allProductRatings } = useReviews();
  const { currentUser, logout: authLogout, isAuthenticated } = useAuth();

  // State
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showQuickView, setShowQuickView] = useState(false);
  const [selectedDiscount, setSelectedDiscount] = useState('none');
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [showSortFilter, setShowSortFilter] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewProduct, setReviewProduct] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [sortBy, setSortBy] = useState('popularity');
  const [filters, setFilters] = useState({
    inStockOnly: false,
    onSaleOnly: false,
    categories: [],
    minRating: 0,
    brands: [],
    priceRange: [0, Number.MAX_SAFE_INTEGER],
  });

  useEffect(() => {
    if (!isAuthenticated) {
      setShowProfileModal(false);
    }
  }, [isAuthenticated]);

  // Flash sale products
  const flashSaleProducts = useMemo(() => {
    return publicProducts.filter((p) => p.isFlashSale && p.stock > 0);
  }, [publicProducts]);

  // Recently viewed products
  const recentlyViewedProducts = useMemo(() => {
    return recentlyViewed
      .map((id) => publicProducts.find((p) => p.id === id))
      .filter(Boolean)
      .slice(0, 6);
  }, [recentlyViewed, publicProducts]);

  const getProductRating = (product) => {
    return allProductRatings[product.id]?.averageRating || 0;
  };

  const maxProductPrice = useMemo(
    () => publicProducts.reduce((max, p) => Math.max(max, p.price || 0), 0),
    [publicProducts]
  );

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let result = publicProducts.filter((product) => {
      // Normalize category to string for comparisons
      const productCategory = typeof product.category === 'object'
        ? (product.category?.slug || product.category?.id || product.category?.name || '')
        : (product.category || '');

      // Category filter
      if (selectedCategory !== 'all' && productCategory !== selectedCategory) {
        return false;
      }
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (
          !product.name.toLowerCase().includes(query) &&
          !product.sku.toLowerCase().includes(query) &&
          !productCategory.toLowerCase().includes(query)
        ) {
          return false;
        }
      }
      // Multi-category filter
      if (filters.categories?.length > 0 && !filters.categories.includes(productCategory)) {
        return false;
      }
      // Brand filter
      if (filters.brands?.length > 0 && !filters.brands.includes(product.brand)) {
        return false;
      }
      // Rating filter
      if (filters.minRating > 0 && getProductRating(product) < filters.minRating) {
        return false;
      }
      // Stock filter
      if (filters.inStockOnly && product.stock <= 0) {
        return false;
      }
      // Sale filter
      if (filters.onSaleOnly && !product.isOnSale) {
        return false;
      }
      // Price range filter
      if (filters.priceRange?.length === 2 && filters.priceRange[1] !== Number.MAX_SAFE_INTEGER) {
        if (product.price < filters.priceRange[0] || product.price > filters.priceRange[1]) {
          return false;
        }
      }
      return true;
    });

    // Sort
    switch (sortBy) {
      case 'popularity':
        result.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
        break;
      case 'newest':
        result.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        break;
      case 'price_low':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price_high':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'name_asc':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name_desc':
        result.sort((a, b) => b.name.localeCompare(a.name));
        break;
    }

    return result;
  }, [publicProducts, selectedCategory, searchQuery, sortBy, filters]);

  // On sale products for featured section
  const saleProducts = useMemo(() => {
    return publicProducts.filter((p) => p.isOnSale && p.stock > 0 && !p.isFlashSale).slice(0, 6);
  }, [publicProducts]);

  // New arrivals (newest products by createdAt)
  const newArrivals = useMemo(() => {
    const sorted = [...publicProducts]
      .filter((p) => p.stock > 0)
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    return sorted.slice(0, 6);
  }, [publicProducts]);

  // Cart operations
  const addToCart = useCallback((product) => {
    const currentProduct = publicProducts.find((p) => p.id === product.id);
    const currentStock = currentProduct ? currentProduct.stock : product.stock;

    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.id === product.id);
      if (existing) {
        if (existing.quantity >= currentStock) {
          Alert.alert('Stock Limit', 'Maximum stock reached');
          return prevCart;
        }
        return prevCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1, stock: currentStock }
            : item
        );
      }
      if (currentStock <= 0) {
        Alert.alert('Out of Stock', 'This product is out of stock');
        return prevCart;
      }
      return [...prevCart, { ...product, stock: currentStock, quantity: 1 }];
    });
  }, [publicProducts]);

  const updateQuantity = useCallback((productId, change) => {
    const currentProduct = publicProducts.find((p) => p.id === productId);

    setCart((prevCart) => {
      return prevCart
        .map((item) => {
          if (item.id === productId) {
            const currentStock = currentProduct ? currentProduct.stock : item.stock;
            const newQty = item.quantity + change;
            if (newQty <= 0) return null;
            if (newQty > currentStock) {
              Alert.alert('Stock Limit', 'Maximum stock reached');
              return item;
            }
            return { ...item, quantity: newQty, stock: currentStock };
          }
          return item;
        })
        .filter(Boolean);
    });
  }, [publicProducts]);

  const removeFromCart = useCallback((productId) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
  }, []);

  // Wishlist operations
  const toggleWishlist = useCallback((productId) => {
    setWishlist((prev) => {
      if (prev.includes(productId)) {
        return prev.filter((id) => id !== productId);
      }
      return [...prev, productId];
    });
  }, []);

  // Quick view
  const openQuickView = useCallback((product) => {
    addRecentlyViewed(product.id);
    setSelectedProduct(product);
    setShowQuickView(true);
  }, [addRecentlyViewed]);

  // Review modal
  const openReviewModal = useCallback((product) => {
    setReviewProduct(product);
    setShowReviewModal(true);
  }, []);

  // Checkout handlers
  const handleOpenCheckout = useCallback(() => {
    if (cart.length === 0) {
      Alert.alert('Cart Empty', 'Add products to checkout');
      return;
    }
    setShowCart(false);
    setShowCheckout(true);
  }, [cart.length]);

  const handleCheckoutComplete = useCallback((data) => {
    decrementStockAfterSale(cart);
    addOrder(data);
    setReceiptData(data);
    setShowCheckout(false);
    setShowReceipt(true);
  }, [cart, decrementStockAfterSale, addOrder]);

  const handleNewTransaction = useCallback(() => {
    setCart([]);
    setReceiptData(null);
    setShowReceipt(false);
    setSelectedDiscount('none');
  }, []);

  // Pull to refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  // Totals
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const getCartQuantity = (productId) => {
    const item = cart.find((i) => i.id === productId);
    return item ? item.quantity : 0;
  };

  // Active filters count
  const activeFiltersCount = [
    filters.inStockOnly,
    filters.onSaleOnly,
    filters.categories?.length > 0,
    filters.minRating > 0,
    filters.brands?.length > 0,
    filters.priceRange[0] > 0 || filters.priceRange[1] < 2000,
  ].filter(Boolean).length + (sortBy !== 'popularity' ? 1 : 0);

  const renderGridItem = ({ item }) => (
    <StoreProductCard
      product={item}
      cartQuantity={getCartQuantity(item.id)}
      isWishlisted={wishlist.includes(item.id)}
      onAddToCart={() => addToCart(item)}
      onQuickView={() => openQuickView(item)}
      onToggleWishlist={() => toggleWishlist(item.id)}
      onUpdateQuantity={(change) => updateQuantity(item.id, change)}
      cardWidth={cardWidth}
      rating={allProductRatings[item.id]?.averageRating}
      reviewCount={allProductRatings[item.id]?.totalReviews}
    />
  );

  const renderListItem = ({ item }) => (
    <ProductListCard
      product={item}
      cartQuantity={getCartQuantity(item.id)}
      isWishlisted={wishlist.includes(item.id)}
      onAddToCart={() => addToCart(item)}
      onPress={() => openQuickView(item)}
      onToggleWishlist={() => toggleWishlist(item.id)}
      onUpdateQuantity={(change) => updateQuantity(item.id, change)}
    />
  );

  // Show branded loading screen while fetching products
  if (isLoadingProducts) {
    return <VendoraLoading message="Loading store..." />;
  }

  return (
    <SafeAreaView className="flex-1 bg-vendora-bg">
      {/* Header */}
      <View className="bg-vendora-card border-b border-vendora-border px-4 py-4">
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className="text-vendora-purple font-extrabold text-3xl tracking-wide">Vendora</Text>
          </View>
          <View className="flex-row items-center gap-2">
            {/* Login/Profile Button */}
            <TouchableOpacity
              className={`relative p-2.5 rounded-xl border ${
                currentUser
                  ? 'bg-vendora-purple/20 border-vendora-purple'
                  : 'bg-vendora-input border-vendora-border'
              }`}
              onPress={() => currentUser ? setShowProfileModal(true) : setShowLoginModal(true)}
              style={currentUser ? shadow('0px 2px 8px rgba(168, 85, 247, 0.25)', 3) : {}}
            >
              <Ionicons
                name={currentUser ? "person" : "person-outline"}
                size={22}
                color={currentUser ? "#a855f7" : "#9ca3af"}
              />
              {currentUser ? (
                <View className="absolute -bottom-0.5 -right-0.5 bg-green-500 w-3 h-3 rounded-full border-2 border-vendora-card" />
              ) : null}
            </TouchableOpacity>

            {/* Wishlist Button */}
            <TouchableOpacity
              className={`relative p-2.5 rounded-xl border ${
                wishlist.length > 0
                  ? 'bg-red-500/10 border-red-500/30'
                  : 'bg-vendora-input border-vendora-border'
              }`}
              style={wishlist.length > 0 ? shadow('0px 2px 8px rgba(239, 68, 68, 0.2)', 3) : {}}
            >
              <Ionicons
                name={wishlist.length > 0 ? "heart" : "heart-outline"}
                size={22}
                color={wishlist.length > 0 ? "#ef4444" : "#9ca3af"}
              />
              {wishlist.length > 0 ? (
                <View
                  className="absolute -top-1.5 -right-1.5 bg-red-500 rounded-full min-w-[20px] h-5 items-center justify-center px-1 border-2 border-vendora-card"
                  style={shadow('0px 2px 4px rgba(239, 68, 68, 0.4)', 4)}
                >
                  <Text className="text-white text-xs font-bold">
                    {wishlist.length > 99 ? '99+' : wishlist.length}
                  </Text>
                </View>
              ) : null}
            </TouchableOpacity>

            {/* Cart Button */}
            <TouchableOpacity
              className={`relative p-2.5 rounded-xl border ${
                totalItems > 0
                  ? 'bg-vendora-purple border-vendora-purple'
                  : 'bg-vendora-input border-vendora-border'
              }`}
              onPress={() => setShowCart(true)}
              style={totalItems > 0 ? shadow('0px 3px 10px rgba(147, 51, 234, 0.4)', 5) : {}}
            >
              <Ionicons
                name={totalItems > 0 ? "bag" : "bag-outline"}
                size={22}
                color={totalItems > 0 ? "#fff" : "#9ca3af"}
              />
              {totalItems > 0 ? (
                <View
                  className="absolute -top-1.5 -right-1.5 bg-orange-500 rounded-full min-w-[20px] h-5 items-center justify-center px-1 border-2 border-vendora-card"
                  style={shadow('0px 2px 4px rgba(249, 115, 22, 0.5)', 4)}
                >
                  <Text className="text-white text-xs font-bold">
                    {totalItems > 99 ? '99+' : totalItems}
                  </Text>
                </View>
              ) : null}
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View className="flex-row items-center gap-3 bg-vendora-input rounded-2xl px-4 py-3">
          <Ionicons name="search" size={20} color="#a855f7" />
          <TextInput
            className="flex-1 text-vendora-text text-base"
            placeholder="Search products..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#9ca3af" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#a855f7"
            colors={['#a855f7']}
          />
        }
      >
        {/* Banner Carousel */}
        <View className="pt-4">
          <BannerCarousel banners={banners} />
        </View>

        {/* Categories */}
        <View className="py-2">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}
          >
            {categories.map((category) => (
              <TouchableOpacity
                key={category.value}
                className={`flex-row items-center gap-2 px-4 py-2.5 rounded-2xl ${
                  selectedCategory === category.value
                    ? 'bg-vendora-purple'
                    : 'bg-vendora-card'
                }`}
                onPress={() => setSelectedCategory(category.value)}
                style={selectedCategory === category.value ? shadow('0px 2px 8px rgba(147, 51, 234, 0.3)', 4) : {}}
              >
                <Ionicons
                  name="cube-outline"
                  size={18}
                  color={selectedCategory === category.value ? '#fff' : '#a855f7'}
                />
                <Text
                  className={`font-semibold ${
                    selectedCategory === category.value
                      ? 'text-white'
                      : 'text-vendora-text'
                  }`}
                >
                  {category.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Flash Sale Section */}
        {flashSaleProducts.length > 0 && selectedCategory === 'all' && !searchQuery ? (
          <View className="py-4">
            <View className="flex-row items-center justify-between px-4 mb-3">
              <View className="flex-row items-center gap-2">
                <View className="bg-orange-500 p-1.5 rounded-lg">
                  <Ionicons name="flash" size={18} color="#fff" />
                </View>
                <Text className="text-vendora-text font-bold text-lg">Flash Sale</Text>
              </View>
              <View className="flex-row items-center gap-1 bg-orange-500/20 px-2 py-1 rounded-lg">
                <Ionicons name="time-outline" size={14} color="#f97316" />
                <Text className="text-orange-400 text-xs font-semibold">Limited Time</Text>
              </View>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16 }}
            >
              {flashSaleProducts.map((product) => (
                <FlashSaleCard
                  key={product.id}
                  product={product}
                  cartQuantity={getCartQuantity(product.id)}
                  onAddToCart={() => addToCart(product)}
                  onPress={() => openQuickView(product)}
                />
              ))}
            </ScrollView>
          </View>
        ) : null}

        {/* On Sale Section */}
        {saleProducts.length > 0 && selectedCategory === 'all' && !searchQuery ? (
          <View className="py-4">
            <View className="flex-row items-center justify-between px-4 mb-3">
              <View className="flex-row items-center gap-2">
                <Ionicons name="pricetag" size={20} color="#ef4444" />
                <Text className="text-vendora-text font-bold text-lg">On Sale</Text>
              </View>
              <TouchableOpacity
                className="flex-row items-center gap-1"
                onPress={() => {
                  setFilters((prev) => ({ ...prev, onSaleOnly: true }));
                }}
              >
                <Text className="text-vendora-purple-light font-medium">See All</Text>
                <Ionicons name="chevron-forward" size={16} color="#a855f7" />
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
            >
              {saleProducts.map((product) => (
                <StoreProductCard
                  key={product.id}
                  product={product}
                  cartQuantity={getCartQuantity(product.id)}
                  isWishlisted={wishlist.includes(product.id)}
                  onAddToCart={() => addToCart(product)}
                  onQuickView={() => openQuickView(product)}
                  onToggleWishlist={() => toggleWishlist(product.id)}
                  onUpdateQuantity={(change) => updateQuantity(product.id, change)}
                  style={{ width: 160, flex: 0, margin: 0 }}
                  rating={allProductRatings[product.id]?.averageRating}
                  reviewCount={allProductRatings[product.id]?.totalReviews}
                />
              ))}
            </ScrollView>
          </View>
        ) : null}

        {/* Debug */}
        <Text style={{ color: 'red', padding: 10 }}>
          Debug: newArrivals count = {newArrivals.length}
        </Text>

        {/* New Arrivals Section */}
        {newArrivals.length > 0 ? (
          <View className="py-4">
            <View className="flex-row items-center justify-between px-4 mb-3">
              <View className="flex-row items-center gap-2">
                <View className="bg-blue-500 p-1.5 rounded-lg">
                  <Ionicons name="sparkles" size={18} color="#fff" />
                </View>
                <Text className="text-vendora-text font-bold text-lg">New Arrivals</Text>
              </View>
              <TouchableOpacity
                className="flex-row items-center gap-1"
                onPress={() => {
                  setSortBy('newest');
                }}
              >
                <Text className="text-vendora-purple-light font-medium">See All</Text>
                <Ionicons name="chevron-forward" size={16} color="#a855f7" />
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
            >
              {newArrivals.map((product) => (
                <View key={product.id} style={{ width: 160 }}>
                  <StoreProductCard
                    product={product}
                    cartQuantity={getCartQuantity(product.id)}
                    isWishlisted={wishlist.includes(product.id)}
                    onAddToCart={() => addToCart(product)}
                    onQuickView={() => openQuickView(product)}
                    onToggleWishlist={() => toggleWishlist(product.id)}
                    onUpdateQuantity={(change) => updateQuantity(product.id, change)}
                    cardWidth={160}
                    rating={allProductRatings[product.id]?.averageRating}
                    reviewCount={allProductRatings[product.id]?.totalReviews}
                  />
                </View>
              ))}
            </ScrollView>
          </View>
        ) : null}

        {/* Recently Viewed */}
        {recentlyViewedProducts.length > 0 && selectedCategory === 'all' && !searchQuery ? (
          <View className="py-4">
            <View className="flex-row items-center justify-between px-4 mb-3">
              <View className="flex-row items-center gap-2">
                <Ionicons name="time" size={20} color="#a855f7" />
                <Text className="text-vendora-text font-bold text-lg">Recently Viewed</Text>
              </View>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
            >
              {recentlyViewedProducts.map((product) => (
                <StoreProductCard
                  key={product.id}
                  product={product}
                  cartQuantity={getCartQuantity(product.id)}
                  isWishlisted={wishlist.includes(product.id)}
                  onAddToCart={() => addToCart(product)}
                  onQuickView={() => openQuickView(product)}
                  onToggleWishlist={() => toggleWishlist(product.id)}
                  onUpdateQuantity={(change) => updateQuantity(product.id, change)}
                  style={{ width: 160, flex: 0, margin: 0 }}
                  rating={allProductRatings[product.id]?.averageRating}
                  reviewCount={allProductRatings[product.id]?.totalReviews}
                />
              ))}
            </ScrollView>
          </View>
        ) : null}

        {/* Products Header with Sort/Filter/View Toggle */}
        <View className="flex-row items-center justify-between px-4 py-3">
          <View className="flex-row items-center">
            <Text className="text-vendora-text font-bold text-lg">
              {selectedCategory === 'all' ? 'All Products' : (categories.find(c => c.value === selectedCategory)?.label || 'Products')}
            </Text>
            <Text className="text-vendora-text-muted font-normal text-sm ml-1">
              ({filteredProducts.length})
            </Text>
          </View>
          <View className="flex-row items-center gap-2">
            {/* Sort & Filter Button */}
            <TouchableOpacity
              className="flex-row items-center gap-1.5 bg-vendora-card px-3 py-2 rounded-xl"
              onPress={() => setShowSortFilter(true)}
            >
              <Ionicons name="options-outline" size={18} color="#a855f7" />
              <Text className="text-vendora-text font-medium">Filter</Text>
              {activeFiltersCount > 0 ? (
                <View className="bg-vendora-purple w-5 h-5 rounded-full items-center justify-center">
                  <Text className="text-white text-xs font-bold">{activeFiltersCount}</Text>
                </View>
              ) : null}
            </TouchableOpacity>

            {/* View Toggle */}
            <View className="flex-row bg-vendora-card rounded-xl overflow-hidden">
              <TouchableOpacity
                className={`p-2 ${viewMode === 'grid' ? 'bg-vendora-purple' : ''}`}
                onPress={() => setViewMode('grid')}
              >
                <Ionicons name="grid" size={18} color={viewMode === 'grid' ? '#fff' : '#9ca3af'} />
              </TouchableOpacity>
              <TouchableOpacity
                className={`p-2 ${viewMode === 'list' ? 'bg-vendora-purple' : ''}`}
                onPress={() => setViewMode('list')}
              >
                <Ionicons name="list" size={18} color={viewMode === 'list' ? '#fff' : '#9ca3af'} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Products Grid/List */}
        <View className="pb-24">
          {filteredProducts.length > 0 ? (
            viewMode === 'grid' ? (
              <FlatList
                data={filteredProducts}
                renderItem={renderGridItem}
                keyExtractor={(item) => item.id.toString()}
                numColumns={numColumns}
                key={`grid-${numColumns}`}
                scrollEnabled={false}
                contentContainerStyle={{ paddingHorizontal: 8 }}
                columnWrapperStyle={{ justifyContent: 'flex-start' }}
              />
            ) : (
              <FlatList
                data={filteredProducts}
                renderItem={renderListItem}
                keyExtractor={(item) => item.id.toString()}
                key="list"
                scrollEnabled={false}
              />
            )
          ) : (
            <View className="items-center justify-center py-16 px-4">
              <View className="w-24 h-24 bg-vendora-card rounded-full items-center justify-center mb-4">
                <Ionicons name="search-outline" size={48} color="#6b7280" />
              </View>
              <Text className="text-vendora-text font-semibold text-lg mb-1">
                No products found
              </Text>
              <Text className="text-vendora-text-muted text-center mb-4">
                Try adjusting your search or filters
              </Text>
              <TouchableOpacity
                className="bg-vendora-purple px-6 py-3 rounded-xl"
                onPress={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setFilters({
                    inStockOnly: false,
                    onSaleOnly: false,
                    categories: [],
                    minRating: 0,
                    brands: [],
                    priceRange: [0, 2000],
                  });
                  setSortBy('popularity');
                }}
              >
                <Text className="text-white font-semibold">Clear Filters</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Floating Cart Summary */}
      {totalItems > 0 ? (
        <View className="absolute bottom-0 left-0 right-0 bg-vendora-card/95 border-t border-vendora-border p-4">
          <TouchableOpacity
            className="bg-vendora-purple py-4 rounded-2xl flex-row items-center justify-between px-5"
            onPress={() => setShowCart(true)}
            style={shadow('0px 4px 12px rgba(147, 51, 234, 0.35)', 8)}
          >
            <View className="flex-row items-center gap-3">
              <View className="bg-white/20 rounded-full px-3 py-1">
                <Text className="text-white font-bold">{totalItems}</Text>
              </View>
              <Text className="text-white font-medium">View Cart</Text>
            </View>
            <Text className="text-white text-lg font-bold">
              ₱ {subtotal.toLocaleString()}
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Product Quick View Modal */}
      <ProductQuickViewModal
        visible={showQuickView}
        onClose={() => {
          setShowQuickView(false);
          setSelectedProduct(null);
        }}
        product={selectedProduct}
        cartQuantity={selectedProduct ? getCartQuantity(selectedProduct.id) : 0}
        isWishlisted={selectedProduct ? wishlist.includes(selectedProduct.id) : false}
        onAddToCart={() => selectedProduct && addToCart(selectedProduct)}
        onUpdateQuantity={(change) => selectedProduct && updateQuantity(selectedProduct.id, change)}
        onToggleWishlist={() => selectedProduct && toggleWishlist(selectedProduct.id)}
        onShowReviews={openReviewModal}
      />

      {/* Cart Sheet */}
      <StoreCartSheet
        visible={showCart}
        onClose={() => setShowCart(false)}
        cart={cart}
        onUpdateQuantity={updateQuantity}
        onRemove={removeFromCart}
        subtotal={subtotal}
        onCheckout={handleOpenCheckout}
      />

      {/* Sort & Filter Modal */}
      <SortFilterModal
        visible={showSortFilter}
        onClose={() => setShowSortFilter(false)}
        sortBy={sortBy}
        onSortChange={setSortBy}
        filters={filters}
        onFiltersChange={setFilters}
        maxPrice={Math.max(2000, maxProductPrice || 0)}
        categories={categories.filter((category) => category.value !== 'all')}
        brands={[
          ...new Set(
            publicProducts
              .map((product) => product.brand)
              .filter(Boolean)
          ),
        ]}
      />

      {/* Checkout Modal */}
      <CheckoutModal
        visible={showCheckout}
        onClose={() => setShowCheckout(false)}
        cart={cart}
        subtotal={subtotal}
        totalItems={totalItems}
        cartNotes=""
        onCheckoutComplete={handleCheckoutComplete}
        selectedDiscount={selectedDiscount}
        onDiscountChange={setSelectedDiscount}
      />

      {/* Receipt Modal */}
      <ReceiptModal
        visible={showReceipt}
        onClose={() => setShowReceipt(false)}
        receiptData={receiptData}
        onNewTransaction={handleNewTransaction}
      />

      {/* Review Modal */}
      <ReviewModal
        visible={showReviewModal}
        onClose={() => {
          setShowReviewModal(false);
          setReviewProduct(null);
        }}
        product={reviewProduct}
      />

      {/* Login Modal */}
      <LoginModal
        visible={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLogin={() => setShowLoginModal(false)}
      />

      {/* Profile Modal */}
      <ProfileModal
        visible={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        user={currentUser}
        onLogout={async () => {
          try {
            await authLogout();
          } catch (error) {
            // Best-effort logout; clear local session regardless of server response.
          } finally {
            setShowProfileModal(false);
          }
        }}
      />
    </SafeAreaView>
  );
}
