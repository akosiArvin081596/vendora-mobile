import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import productService from '../services/productService';
import inventoryService from '../services/inventoryService';
import categoryService from '../services/categoryService';
import { products as fallbackProducts, categories as fallbackCategories } from '../data/products';

const ProductContext = createContext();

// Helper to normalize product data from API (snake_case) to frontend format (camelCase)
const normalizeProduct = (p) => {
  const categoryValue = typeof p.category === 'object'
    ? p.category.slug || p.category.id || p.category.name || 'general'
    : p.category;

  // Normalize bulk_pricing from API (snake_case, cents) to bulkPricing (camelCase, decimal)
  const apiBulkPricing = p.bulk_pricing || p.bulkPricing || [];
  const normalizedBulkPricing = apiBulkPricing.map((tier) => ({
    minQty: tier.min_qty ?? tier.minQty,
    // API returns price in cents, convert to decimal
    price: tier.min_qty !== undefined ? tier.price / 100 : tier.price,
  }));

  // API stores prices in cents, convert to decimal PHP
  const rawPrice = p.price_cents ?? p.price ?? 0;
  const normalizedPrice = rawPrice / 100;

  // Similarly for cost
  const rawCost = p.cost_cents ?? p.cost;
  const normalizedCost = rawCost != null ? rawCost / 100 : undefined;

  return {
    ...p,
    price: normalizedPrice,
    cost: normalizedCost,
    category: categoryValue,
    createdAt: p.createdAt || p.created_at || p.createdAt || p.created || p.createdAt,
    bulkPricing: normalizedBulkPricing,
  };
};

export function ProductProvider({ children }) {
  // Separate states for different data sources
  const [inventory, setInventory] = useState([]);
  const [publicProducts, setPublicProducts] = useState([]);
  const [categories, setCategories] = useState(fallbackCategories);

  // Separate loading states
  const [isLoadingInventory, setIsLoadingInventory] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);

  // Cache flags - track if data has been loaded
  const inventoryLoaded = useRef(false);
  const productsLoaded = useRef(false);
  const categoriesLoaded = useRef(false);

  const [error, setError] = useState(null);
  const [isOffline, setIsOffline] = useState(false);

  // Pagination states
  const [inventoryPagination, setInventoryPagination] = useState({
    page: 1,
    limit: 100,
    total: 0,
    totalPages: 0,
  });
  const [productsPagination, setProductsPagination] = useState({
    page: 1,
    limit: 100,
    total: 0,
    totalPages: 0,
  });

  // Fetch public products (e-commerce) - with caching
  const fetchProducts = useCallback(async (options = {}) => {
    const { forceRefresh = false, ...params } = options;

    // Skip if already loaded and not forcing refresh
    if (productsLoaded.current && !forceRefresh) {
      return publicProducts;
    }

    try {
      setIsLoadingProducts(true);
      setError(null);

      const response = await productService.getAll({
        limit: 100,
        is_active: true,
        ...params,
      });

      const normalized = (response.data || []).map(normalizeProduct);

      setPublicProducts(normalized);
      productsLoaded.current = true;

      if (response.pagination) {
        setProductsPagination(response.pagination);
      }
      setIsOffline(false);
      return normalized;
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(err.message);
      setIsOffline(true);

      // Use fallback only if no data loaded yet
      if (!productsLoaded.current) {
        setPublicProducts(fallbackProducts);
      }
      return publicProducts;
    } finally {
      setIsLoadingProducts(false);
    }
  }, [publicProducts]);

  // Fetch inventory (user's products) - with caching
  const fetchInventory = useCallback(async (options = {}) => {
    const { forceRefresh = false, ...params } = options;

    // Skip if already loaded and not forcing refresh
    if (inventoryLoaded.current && !forceRefresh) {
      return inventory;
    }

    try {
      setIsLoadingInventory(true);
      setError(null);

      const response = await inventoryService.getAll({
        per_page: 100,
        ...params,
      });

      const normalized = (response.data || []).map(normalizeProduct);

      setInventory(normalized);
      inventoryLoaded.current = true;

      if (response.meta) {
        setInventoryPagination({
          page: response.meta.current_page,
          limit: response.meta.per_page,
          total: response.meta.total,
          totalPages: response.meta.last_page,
        });
      }
      setIsOffline(false);
      return normalized;
    } catch (err) {
      console.error('Error fetching inventory:', err);
      setError(err.message);
      setIsOffline(true);

      // Don't set fallback for inventory - user should see their own products only
      if (!inventoryLoaded.current) {
        setInventory([]);
      }
      return inventory;
    } finally {
      setIsLoadingInventory(false);
    }
  }, [inventory]);

  // Fetch categories - with caching
  const fetchCategories = useCallback(async (forceRefresh = false) => {
    if (categoriesLoaded.current && !forceRefresh) {
      return categories;
    }

    try {
      setIsLoadingCategories(true);
      const response = await categoryService.getAll({ is_active: true });

      const apiCategories = response.data || [];
      const formattedCategories = [
        { value: 'all', label: 'All Categories', icon: 'grid-outline' },
        ...apiCategories.map((cat) => ({
          value: cat.slug || cat.id,
          label: cat.name,
          icon: cat.icon || 'cube-outline',
          id: cat.id,
        })),
      ];

      setCategories(formattedCategories);
      categoriesLoaded.current = true;
      return formattedCategories;
    } catch (err) {
      console.error('Error fetching categories:', err);
      if (!categoriesLoaded.current) {
        setCategories(fallbackCategories);
      }
      return categories;
    } finally {
      setIsLoadingCategories(false);
    }
  }, [categories]);

  // Initialize categories on mount (lightweight)
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Invalidate inventory cache (call after add/update/delete)
  const invalidateInventoryCache = useCallback(() => {
    inventoryLoaded.current = false;
  }, []);

  // Invalidate products cache
  const invalidateProductsCache = useCallback(() => {
    productsLoaded.current = false;
  }, []);

  // Refresh all data (pull-to-refresh)
  const refreshAll = useCallback(async () => {
    await Promise.all([
      fetchProducts({ forceRefresh: true }),
      fetchInventory({ forceRefresh: true }),
      fetchCategories(true),
    ]);
  }, [fetchProducts, fetchInventory, fetchCategories]);

  // Update stock for a product
  const updateStock = useCallback(async (productId, newStock) => {
    try {
      const response = await productService.updateStock(productId, newStock);

      // Update both states
      const updateFn = (prev) =>
        prev.map((product) =>
          product.id === productId
            ? { ...product, stock: Math.max(0, newStock) }
            : product
        );

      setInventory(updateFn);
      setPublicProducts(updateFn);

      return response.data;
    } catch (err) {
      console.error('Error updating stock:', err);
      throw err;
    }
  }, []);

  // Adjust stock (add or subtract)
  const adjustStock = useCallback(async (productId, adjustment) => {
    try {
      const response = await productService.adjustStock(productId, adjustment);

      const updateFn = (prev) =>
        prev.map((product) =>
          product.id === productId
            ? { ...product, stock: Math.max(0, product.stock + adjustment) }
            : product
        );

      setInventory(updateFn);
      setPublicProducts(updateFn);

      return response.data;
    } catch (err) {
      console.error('Error adjusting stock:', err);
      throw err;
    }
  }, []);

  // Decrement stock after sale
  const decrementStockAfterSale = useCallback(async (cartItems, orderId = null) => {
    const items = cartItems.map((item) => ({
      productId: item.id,
      variantSku: item.variantSku || null,
      quantity: item.quantity,
    }));

    try {
      const response = await productService.bulkDecrementStock(items, orderId);

      const updateFn = (prev) =>
        prev.map((product) => {
          const cartItem = cartItems.find((item) => item.id === product.id);
          if (cartItem) {
            return { ...product, stock: Math.max(0, product.stock - cartItem.quantity) };
          }
          return product;
        });

      setInventory(updateFn);
      setPublicProducts(updateFn);

      return response.data;
    } catch (err) {
      console.error('Error decrementing stock:', err);

      // Optimistic update for offline mode
      if (isOffline || err.code === 'NETWORK_ERROR') {
        const updateFn = (prev) =>
          prev.map((product) => {
            const cartItem = cartItems.find((item) => item.id === product.id);
            if (cartItem) {
              return { ...product, stock: Math.max(0, product.stock - cartItem.quantity) };
            }
            return product;
          });

        setInventory(updateFn);
        setPublicProducts(updateFn);
        return { updated: items, failed: [] };
      }
      throw err;
    }
  }, [isOffline]);

  // Add new product
  const addProduct = useCallback(async (productData) => {
    try {
      const response = await productService.create(productData);
      const newProduct = normalizeProduct(response.data);

      // Add to inventory (user's product)
      setInventory((prev) => [...prev, newProduct]);

      // Also add to public products if it's an e-commerce product
      if (newProduct.is_ecommerce) {
        setPublicProducts((prev) => [...prev, newProduct]);
      }

      return newProduct;
    } catch (err) {
      console.error('Error adding product:', err);
      throw err;
    }
  }, []);

  // Update product
  const updateProduct = useCallback(async (productId, updates) => {
    try {
      const response = await productService.update(productId, updates);
      const updatedProduct = normalizeProduct(response.data);

      const updateFn = (prev) =>
        prev.map((product) =>
          product.id === productId
            ? { ...product, ...updatedProduct }
            : product
        );

      setInventory(updateFn);
      setPublicProducts(updateFn);

      return updatedProduct;
    } catch (err) {
      console.error('Error updating product:', err);
      throw err;
    }
  }, []);

  // Delete product
  const deleteProduct = useCallback(async (productId) => {
    try {
      await productService.delete(productId);

      const filterFn = (prev) => prev.filter((product) => product.id !== productId);

      setInventory(filterFn);
      setPublicProducts(filterFn);
    } catch (err) {
      console.error('Error deleting product:', err);
      throw err;
    }
  }, []);

  // Get product by ID from inventory
  const getInventoryProductById = useCallback((productId) => {
    return inventory.find((product) => product.id === productId);
  }, [inventory]);

  // Get product by ID from public products
  const getPublicProductById = useCallback((productId) => {
    return publicProducts.find((product) => product.id === productId);
  }, [publicProducts]);

  // Get product by SKU
  const getProductBySku = useCallback(async (sku, localOnly = true) => {
    // Try inventory first
    let localProduct = inventory.find(
      (product) => product.sku?.toUpperCase() === sku?.toUpperCase()
    );

    // Try public products
    if (!localProduct) {
      localProduct = publicProducts.find(
        (product) => product.sku?.toUpperCase() === sku?.toUpperCase()
      );
    }

    if (localProduct || localOnly) {
      return localProduct || null;
    }

    try {
      const response = await productService.getBySku(sku);
      return response.data;
    } catch (err) {
      if (err.code === 'PRODUCT_NOT_FOUND') {
        return null;
      }
      throw err;
    }
  }, [inventory, publicProducts]);

  // Get product by barcode
  const getProductByBarcode = useCallback(async (barcode) => {
    let localProduct = inventory.find((product) => product.barcode === barcode);

    if (!localProduct) {
      localProduct = publicProducts.find((product) => product.barcode === barcode);
    }

    if (localProduct) {
      return localProduct;
    }

    try {
      const response = await productService.getByBarcode(barcode);
      return response.data;
    } catch (err) {
      if (err.code === 'PRODUCT_NOT_FOUND') {
        return null;
      }
      throw err;
    }
  }, [inventory, publicProducts]);

  // Get low stock products from inventory
  const getLowStockProducts = useCallback((threshold = 10) => {
    return inventory.filter((product) => product.stock > 0 && product.stock <= threshold);
  }, [inventory]);

  // Get out of stock products from inventory
  const getOutOfStockProducts = useCallback(() => {
    return inventory.filter((product) => product.stock === 0);
  }, [inventory]);

  // Search products locally
  const searchProducts = useCallback((query, options = {}) => {
    const source = options.source === 'inventory' ? inventory : publicProducts;

    if (!query) return source;

    const searchLower = query.toLowerCase();
    return source.filter((product) => {
      const matchesName = product.name?.toLowerCase().includes(searchLower);
      const matchesSku = product.sku?.toLowerCase().includes(searchLower);
      const matchesDescription = product.description?.toLowerCase().includes(searchLower);

      let matches = matchesName || matchesSku || matchesDescription;

      if (options.category && options.category !== 'all') {
        const productCategory = typeof product.category === 'object'
          ? (product.category?.slug || product.category?.id || product.category?.name || '')
          : product.category;
        matches = matches && productCategory === options.category;
      }

      if (options.inStock) {
        matches = matches && product.stock > 0;
      }

      return matches;
    });
  }, [inventory, publicProducts]);

  const value = {
    // Data - separate states
    inventory,
    publicProducts,
    products: publicProducts, // Backward compatibility
    categories,

    // Pagination
    inventoryPagination,
    productsPagination,
    pagination: productsPagination, // Backward compatibility

    // Loading states
    isLoadingInventory,
    isLoadingProducts,
    isLoadingCategories,
    isLoading: isLoadingProducts || isLoadingInventory, // Backward compatibility

    // Other states
    error,
    isOffline,

    // Cache status
    isInventoryCached: inventoryLoaded.current,
    isProductsCached: productsLoaded.current,

    // Data fetching
    fetchProducts,
    fetchInventory,
    fetchCategories,
    refreshAll,

    // Cache management
    invalidateInventoryCache,
    invalidateProductsCache,

    // Stock management
    updateStock,
    adjustStock,
    decrementStockAfterSale,

    // Product CRUD
    addProduct,
    updateProduct,
    deleteProduct,

    // Lookups
    getInventoryProductById,
    getPublicProductById,
    getProductById: getPublicProductById, // Backward compatibility
    getProductBySku,
    getProductByBarcode,
    getLowStockProducts,
    getOutOfStockProducts,
    searchProducts,
  };

  return (
    <ProductContext.Provider value={value}>
      {children}
    </ProductContext.Provider>
  );
}

export function useProducts() {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
}

export default ProductContext;
