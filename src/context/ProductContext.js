import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import productService from '../services/productService';
import inventoryService from '../services/inventoryService';
import categoryService from '../services/categoryService';
import { products as fallbackProducts, categories as fallbackCategories } from '../data/products';
import ProductRepository from '../db/repositories/ProductRepository';
import CategoryRepository from '../db/repositories/CategoryRepository';
import InventoryAdjustmentRepository from '../db/repositories/InventoryAdjustmentRepository';
import SyncQueueRepository from '../db/repositories/SyncQueueRepository';
import SyncManager from '../sync/SyncManager';
import SyncService from '../sync/SyncService';

const ProductContext = createContext();

// Helper to normalize product data from API (snake_case) to frontend format (camelCase)
const normalizeProduct = (p) => {
  const categoryValue = typeof p.category === 'object'
    ? p.category.slug || p.category.id || p.category.name || 'general'
    : p.category;

  // Normalize bulk_pricing from API (snake_case) to bulkPricing (camelCase)
  const apiBulkPricing = p.bulk_pricing || p.bulkPricing || [];
  const normalizedBulkPricing = apiBulkPricing.map((tier) => ({
    minQty: tier.min_qty ?? tier.minQty,
    price: tier.price,
  }));

  // API already returns price in whole units (ProductResource divides by 100)
  const normalizedPrice = p.price ?? 0;

  // Similarly for cost
  const normalizedCost = p.cost != null ? p.cost : undefined;

  return {
    ...p,
    price: normalizedPrice,
    cost: normalizedCost,
    category: categoryValue,
    createdAt: p.createdAt || p.created_at || p.createdAt || p.created || p.createdAt,
    bulkPricing: normalizedBulkPricing,
  };
};

/**
 * Convert a SQLite product row to the same shape the rest of the app expects.
 */
const normalizeLocalProduct = (row) => {
  if (!row) return null;
  return {
    ...row,
    is_active: row.is_active === 1,
    is_ecommerce: row.is_ecommerce === 1,
    category: row.category_id,
    bulkPricing: [],
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

  /**
   * Load products from SQLite as immediate data.
   */
  const loadInventoryFromLocal = useCallback(() => {
    try {
      const rows = ProductRepository.getAll();
      if (rows.length > 0) {
        const normalized = rows.map(normalizeLocalProduct);
        setInventory(normalized);
        inventoryLoaded.current = true;
        return normalized;
      }
    } catch (err) {
      console.warn('[ProductContext] Error loading local inventory:', err.message);
    }
    return [];
  }, []);

  /**
   * Load categories from SQLite as immediate data.
   */
  const loadCategoriesFromLocal = useCallback(() => {
    try {
      const rows = CategoryRepository.getAll();
      if (rows.length > 0) {
        const formattedCategories = [
          { value: 'all', label: 'All Categories', icon: 'grid-outline' },
          ...rows.map((cat) => ({
            value: cat.slug || cat.id,
            label: cat.name,
            icon: cat.icon || 'cube-outline',
            id: cat.id,
          })),
        ];
        setCategories(formattedCategories);
        categoriesLoaded.current = true;
        return formattedCategories;
      }
    } catch (err) {
      console.warn('[ProductContext] Error loading local categories:', err.message);
    }
    return [];
  }, []);

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

  // Fetch inventory (user's products) - local-first, then background API refresh
  const fetchInventory = useCallback(async (options = {}) => {
    const { forceRefresh = false, ...params } = options;

    // Skip if already loaded and not forcing refresh
    if (inventoryLoaded.current && !forceRefresh) {
      return inventory;
    }

    // Step 1: Load from SQLite immediately (instant)
    const localData = loadInventoryFromLocal();
    if (localData.length > 0 && !forceRefresh) {
      // Data displayed from local — background-refresh from API
      _backgroundRefreshInventory(params);
      return localData;
    }

    // Step 2: No local data or force refresh — fetch from API
    try {
      setIsLoadingInventory(true);
      setError(null);

      const response = await inventoryService.getAll({
        per_page: 100,
        ...params,
      });

      const apiProducts = response.data || [];
      const normalized = apiProducts.map(normalizeProduct);

      setInventory(normalized);
      inventoryLoaded.current = true;

      // Cache to SQLite
      try {
        ProductRepository.bulkUpsertFromServer(apiProducts);
      } catch (dbErr) {
        console.warn('[ProductContext] Error caching products to SQLite:', dbErr.message);
      }

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
        // Try local as last resort
        const local = loadInventoryFromLocal();
        if (local.length === 0) {
          setInventory([]);
        }
      }
      return inventory;
    } finally {
      setIsLoadingInventory(false);
    }
  }, [inventory, loadInventoryFromLocal]);

  /**
   * Background refresh: fetch from API and update SQLite + state silently.
   */
  const _backgroundRefreshInventory = useCallback(async (params = {}) => {
    try {
      const response = await inventoryService.getAll({ per_page: 100, ...params });
      const apiProducts = response.data || [];

      if (apiProducts.length > 0) {
        ProductRepository.bulkUpsertFromServer(apiProducts);
        const normalized = apiProducts.map(normalizeProduct);
        setInventory(normalized);
        inventoryLoaded.current = true;
      }
      setIsOffline(false);
    } catch (err) {
      // Silent failure — local data is already displayed
      console.warn('[ProductContext] Background refresh failed:', err.message);
    }
  }, []);

  // Fetch categories - local-first
  const fetchCategories = useCallback(async (forceRefresh = false) => {
    if (categoriesLoaded.current && !forceRefresh) {
      return categories;
    }

    // Step 1: Load from SQLite
    const localCats = loadCategoriesFromLocal();
    if (localCats.length > 0 && !forceRefresh) {
      _backgroundRefreshCategories();
      return localCats;
    }

    // Step 2: Fetch from API
    try {
      setIsLoadingCategories(true);
      const response = await categoryService.getAll({ is_active: true });

      const apiCategories = response.data || [];

      // Cache to SQLite
      try {
        CategoryRepository.bulkUpsertFromServer(apiCategories);
      } catch (dbErr) {
        console.warn('[ProductContext] Error caching categories to SQLite:', dbErr.message);
      }

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
        const local = loadCategoriesFromLocal();
        if (local.length === 0) {
          setCategories(fallbackCategories);
        }
      }
      return categories;
    } finally {
      setIsLoadingCategories(false);
    }
  }, [categories, loadCategoriesFromLocal]);

  /**
   * Background refresh categories.
   */
  const _backgroundRefreshCategories = useCallback(async () => {
    try {
      const response = await categoryService.getAll({ is_active: true });
      const apiCategories = response.data || [];

      if (apiCategories.length > 0) {
        CategoryRepository.bulkUpsertFromServer(apiCategories);
        const formatted = [
          { value: 'all', label: 'All Categories', icon: 'grid-outline' },
          ...apiCategories.map((cat) => ({
            value: cat.slug || cat.id,
            label: cat.name,
            icon: cat.icon || 'cube-outline',
            id: cat.id,
          })),
        ];
        setCategories(formatted);
        categoriesLoaded.current = true;
      }
    } catch (err) {
      console.warn('[ProductContext] Background category refresh failed:', err.message);
    }
  }, []);

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

  /**
   * Update stock (set) — offline-first via inventory adjustment.
   */
  const updateStock = useCallback((productId, newStock) => {
    // Get current stock
    let currentStock = 0;
    try {
      const product = ProductRepository.getById(productId);
      currentStock = product?.stock ?? 0;
    } catch (err) {
      const memProduct = inventory.find((p) => p.id === productId);
      currentStock = memProduct?.stock ?? 0;
    }

    // Create a 'set' adjustment
    try {
      InventoryAdjustmentRepository.createAdjustment({
        productId,
        type: 'set',
        quantity: newStock,
        currentStock,
      });
    } catch (err) {
      console.error('[ProductContext] SQLite stock set failed:', err);
      throw err;
    }

    // Update React state
    const updateFn = (prev) =>
      prev.map((product) =>
        product.id === productId
          ? { ...product, stock: Math.max(0, newStock) }
          : product
      );

    setInventory(updateFn);
    setPublicProducts(updateFn);

    // Trigger sync
    SyncService.processQueue().catch(() => {});
  }, [inventory]);

  /**
   * Adjust stock — offline-first.
   * Writes adjustment to SQLite, updates stock locally, enqueues sync.
   */
  const adjustStock = useCallback((productId, adjustment, note = '', unitCost = null) => {
    const type = adjustment >= 0 ? 'add' : 'remove';
    const quantity = Math.abs(adjustment);

    // Get current stock from SQLite
    let currentStock = 0;
    try {
      const product = ProductRepository.getById(productId);
      currentStock = product?.stock ?? 0;
    } catch (err) {
      // Fallback to in-memory
      const memProduct = inventory.find((p) => p.id === productId);
      currentStock = memProduct?.stock ?? 0;
    }

    // 1. Create adjustment in SQLite + update stock + enqueue sync
    let result;
    try {
      result = InventoryAdjustmentRepository.createAdjustment({
        productId,
        type,
        quantity,
        currentStock,
        unitCost,
        note,
      });
    } catch (err) {
      console.error('[ProductContext] SQLite adjustment failed:', err);
      throw err;
    }

    // 2. Update React state immediately
    const updateFn = (prev) =>
      prev.map((product) =>
        product.id === productId
          ? { ...product, stock: result.newStock }
          : product
      );

    setInventory(updateFn);
    setPublicProducts(updateFn);

    // 3. Trigger sync
    SyncService.processQueue().catch(() => {});

    return { newStock: result.newStock };
  }, [inventory]);

  /**
   * Decrement stock after sale — local-first.
   * SQLite stock is already decremented by OrderRepository.createOrderWithItems().
   * This only updates React state. Backend stock decrement happens via order sync.
   */
  const decrementStockAfterSale = useCallback((cartItems) => {
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
  }, []);

  /**
   * Add new product — offline-first.
   * Writes to SQLite, enqueues sync, returns immediately.
   * Image uploads are handled by SyncService when online.
   */
  const addProduct = useCallback((productData) => {
    // 1. Write to SQLite
    let localId;
    try {
      localId = ProductRepository.createLocal({
        name: productData.name,
        sku: productData.sku,
        barcode: productData.barcode,
        price: productData.price ?? 0,
        cost: productData.cost ?? 0,
        stock: productData.stock ?? 0,
        category_id: productData.category_id,
        description: productData.description,
        image: productData.image ?? null,
        is_active: productData.is_active ?? true,
        is_ecommerce: productData.is_ecommerce ?? false,
        low_stock_threshold: productData.low_stock_threshold ?? 10,
        reorder_point: productData.reorder_point ?? 5,
      });
    } catch (err) {
      console.error('[ProductContext] SQLite product create failed:', err);
      throw err;
    }

    // 2. Enqueue sync (stores image URI for multipart upload)
    try {
      SyncQueueRepository.enqueue({
        entityType: 'product',
        entityLocalId: localId,
        action: 'create',
        endpoint: '/products',
        method: 'POST',
        payload: {
          ...productData,
          _localImageUri: productData.image ?? null,
        },
      });
    } catch (err) {
      console.warn('[ProductContext] Sync enqueue failed:', err.message);
    }

    // 3. Immediately add to React state
    const newProduct = {
      ...productData,
      localId,
      id: null,
      syncStatus: 'pending',
    };

    setInventory((prev) => [...prev, newProduct]);
    if (newProduct.is_ecommerce) {
      setPublicProducts((prev) => [...prev, newProduct]);
    }

    // 4. Trigger sync
    SyncService.processQueue().catch(() => {});

    return newProduct;
  }, []);

  /**
   * Update product — offline-first.
   * Writes to SQLite, enqueues sync, returns immediately.
   */
  const updateProduct = useCallback((productId, updates) => {
    // 1. Update SQLite
    try {
      ProductRepository.updateLocal(productId, updates);
    } catch (err) {
      console.error('[ProductContext] SQLite product update failed:', err);
      throw err;
    }

    // 2. Enqueue sync
    try {
      const product = ProductRepository.getById(productId);
      SyncQueueRepository.enqueue({
        entityType: 'product',
        entityLocalId: product?.local_id || `server-${productId}`,
        action: 'update',
        endpoint: `/products/${productId}`,
        method: 'PUT',
        payload: {
          ...updates,
          _localImageUri: updates.image ?? null,
        },
      });
    } catch (err) {
      console.warn('[ProductContext] Sync enqueue failed:', err.message);
    }

    // 3. Update React state immediately
    const updateFn = (prev) =>
      prev.map((product) =>
        product.id === productId
          ? { ...product, ...updates, syncStatus: 'pending' }
          : product
      );

    setInventory(updateFn);
    setPublicProducts(updateFn);

    // 4. Trigger sync
    SyncService.processQueue().catch(() => {});

    return { id: productId, ...updates };
  }, []);

  /**
   * Delete product — offline-first.
   * Marks deleted in SQLite, enqueues sync, removes from state immediately.
   */
  const deleteProduct = useCallback((productId) => {
    // 1. Mark deleted in SQLite
    try {
      ProductRepository.markDeleted(productId);
    } catch (err) {
      console.warn('[ProductContext] SQLite product delete failed:', err.message);
    }

    // 2. Enqueue sync
    try {
      const product = ProductRepository.getById(productId);
      SyncQueueRepository.enqueue({
        entityType: 'product',
        entityLocalId: product?.local_id || `server-${productId}`,
        action: 'delete',
        endpoint: `/products/${productId}`,
        method: 'DELETE',
      });
    } catch (err) {
      console.warn('[ProductContext] Sync enqueue failed:', err.message);
    }

    // 3. Remove from React state immediately
    const filterFn = (prev) => prev.filter((product) => product.id !== productId);
    setInventory(filterFn);
    setPublicProducts(filterFn);

    // 4. Trigger sync
    SyncService.processQueue().catch(() => {});
  }, []);

  // Silent product updates for real-time sync (no loading state)
  // These are used by SocketContext to seamlessly update the UI

  // Add product silently (for real-time sync)
  const addProductSilently = useCallback((productData) => {
    if (!productData || !productData.id) {
      console.warn('[ProductContext] Invalid product data for silent add');
      return;
    }

    const normalizedProduct = normalizeProduct(productData);

    // Add to public products if it's active and e-commerce enabled
    if (normalizedProduct.is_active !== false) {
      setPublicProducts((prev) => {
        // Check if product already exists
        const exists = prev.some((p) => p.id === normalizedProduct.id);
        if (exists) {
          // Update existing product instead
          return prev.map((p) => p.id === normalizedProduct.id ? normalizedProduct : p);
        }
        // Add to beginning of list (newest first)
        return [normalizedProduct, ...prev];
      });
    }

    // Update SQLite
    try {
      ProductRepository.upsertFromServer(productData);
    } catch (dbErr) {
      console.warn('[ProductContext] SQLite silent add failed:', dbErr.message);
    }

    console.log('[ProductContext] Product added silently:', normalizedProduct.id);
  }, []);

  // Update product silently (for real-time sync)
  const updateProductSilently = useCallback((productData) => {
    if (!productData || !productData.id) {
      console.warn('[ProductContext] Invalid product data for silent update');
      return;
    }

    // For partial updates (e.g. stock:updated only sends id + stock),
    // merge raw fields directly to avoid normalizeProduct overwriting
    // existing values with defaults (e.g. price becoming 0).
    const isFullProduct = productData.name !== undefined && productData.price !== undefined;
    const updates = isFullProduct ? normalizeProduct(productData) : productData;

    const updateFn = (prev) =>
      prev.map((product) =>
        product.id === updates.id
          ? { ...product, ...updates }
          : product
      );

    setInventory(updateFn);
    setPublicProducts(updateFn);

    // Update SQLite (only full products, not partial stock updates)
    if (isFullProduct) {
      try {
        ProductRepository.upsertFromServer(productData);
      } catch (dbErr) {
        console.warn('[ProductContext] SQLite silent update failed:', dbErr.message);
      }
    } else if (productData.stock !== undefined) {
      try {
        ProductRepository.updateStock(productData.id, productData.stock);
      } catch (dbErr) {
        console.warn('[ProductContext] SQLite stock sync failed:', dbErr.message);
      }
    }

    console.log('[ProductContext] Product updated silently:', updates.id);
  }, []);

  // Remove product silently (for real-time sync)
  const removeProductSilently = useCallback((productId) => {
    if (!productId) {
      console.warn('[ProductContext] Invalid productId for silent remove');
      return;
    }

    const filterFn = (prev) => prev.filter((product) => product.id !== productId);

    setInventory(filterFn);
    setPublicProducts(filterFn);

    // Mark deleted in SQLite
    try {
      ProductRepository.markDeleted(productId);
    } catch (dbErr) {
      console.warn('[ProductContext] SQLite silent delete failed:', dbErr.message);
    }

    console.log('[ProductContext] Product removed silently:', productId);
  }, []);

  // Get product by ID from inventory
  const getInventoryProductById = useCallback((productId) => {
    return inventory.find((product) => product.id === productId);
  }, [inventory]);

  // Get product by ID from public products
  const getPublicProductById = useCallback((productId) => {
    return publicProducts.find((product) => product.id === productId);
  }, [publicProducts]);

  // Get product by SKU — check in-memory, then SQLite, then API
  const getProductBySku = useCallback(async (sku, localOnly = true) => {
    // Try in-memory first
    let localProduct = inventory.find(
      (product) => product.sku?.toUpperCase() === sku?.toUpperCase()
    );

    if (!localProduct) {
      localProduct = publicProducts.find(
        (product) => product.sku?.toUpperCase() === sku?.toUpperCase()
      );
    }

    // Try SQLite
    if (!localProduct) {
      try {
        const dbProduct = ProductRepository.getBySku(sku);
        if (dbProduct) {
          localProduct = normalizeLocalProduct(dbProduct);
        }
      } catch (err) {
        console.warn('[ProductContext] SQLite SKU lookup failed:', err.message);
      }
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

  // Get product by barcode — check in-memory, then SQLite, then API
  const getProductByBarcode = useCallback(async (barcode) => {
    let localProduct = inventory.find((product) => product.barcode === barcode);

    if (!localProduct) {
      localProduct = publicProducts.find((product) => product.barcode === barcode);
    }

    // Try SQLite
    if (!localProduct) {
      try {
        const dbProduct = ProductRepository.getByBarcode(barcode);
        if (dbProduct) {
          localProduct = normalizeLocalProduct(dbProduct);
        }
      } catch (err) {
        console.warn('[ProductContext] SQLite barcode lookup failed:', err.message);
      }
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

    // Silent updates for real-time sync (no loading state)
    addProductSilently,
    updateProductSilently,
    removeProductSilently,

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
