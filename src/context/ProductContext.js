import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { products as fallbackProducts, categories as fallbackCategories } from '../data/products';
import ProductRepository from '../db/repositories/ProductRepository';
import CategoryRepository from '../db/repositories/CategoryRepository';
import InventoryAdjustmentRepository from '../db/repositories/InventoryAdjustmentRepository';
import SyncQueueRepository from '../db/repositories/SyncQueueRepository';
import SyncManager from '../sync/SyncManager';
import SyncService from '../sync/SyncService';

/**
 * Convert a blob: URL to a base64 data URI so it persists beyond the blob's lifetime.
 * Only needed on web — native platforms use file:// URIs that persist.
 */
const persistImageUri = async (uri) => {
  if (!uri) return null;
  if (Platform.OS !== 'web') return uri;
  if (!uri.startsWith('blob:')) return uri;

  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.warn('[ProductContext] Failed to persist blob URL:', err.message);
    return uri;
  }
};

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

  /**
   * Load public/ecommerce products from SQLite.
   */
  const loadPublicProductsFromLocal = useCallback(() => {
    try {
      const rows = ProductRepository.getAll();
      // Filter to active ecommerce products
      const ecommerceRows = rows.filter((r) => r.is_active === 1 && r.is_ecommerce === 1);
      if (ecommerceRows.length > 0) {
        const normalized = ecommerceRows.map(normalizeLocalProduct);
        setPublicProducts(normalized);
        productsLoaded.current = true;
        return normalized;
      }
    } catch (err) {
      console.warn('[ProductContext] Error loading local public products:', err.message);
    }
    return [];
  }, []);

  // Fetch public products (e-commerce) - offline-first via SQLite + pull-sync
  const fetchProducts = useCallback(async (options = {}) => {
    const { forceRefresh = false } = options;

    // Skip if already loaded and not forcing refresh
    if (productsLoaded.current && !forceRefresh) {
      return publicProducts;
    }

    // Step 1: Load from SQLite
    const localData = loadPublicProductsFromLocal();
    if (localData.length > 0 && !forceRefresh) {
      // Background pull-sync (silent)
      _backgroundRefreshInventory();
      return localData;
    }

    // Step 2: Pull-sync via SyncManager, but never fail loudly
    setIsLoadingProducts(true);
    try {
      await SyncManager.syncProducts({ full: !productsLoaded.current });

      // Reload from SQLite
      const reloaded = loadPublicProductsFromLocal();
      if (reloaded.length > 0) {
        setIsOffline(false);
        return reloaded;
      }

      // Use fallback only if no data at all
      if (!productsLoaded.current) {
        setPublicProducts(fallbackProducts);
      }
      return publicProducts;
    } catch (err) {
      // Silent — offline-first: local data is already displayed
      console.warn('[ProductContext] Products sync skipped (offline):', err.message);
      setIsOffline(true);

      // Use fallback only if absolutely no data
      if (!productsLoaded.current && localData.length === 0) {
        setPublicProducts(fallbackProducts);
      }
      return localData.length > 0 ? localData : publicProducts;
    } finally {
      setIsLoadingProducts(false);
    }
  }, [publicProducts, loadPublicProductsFromLocal]);

  // Fetch inventory (user's products) - offline-first via SQLite + background pull-sync
  const fetchInventory = useCallback(async (options = {}) => {
    const { forceRefresh = false } = options;

    // Skip if already loaded and not forcing refresh
    if (inventoryLoaded.current && !forceRefresh) {
      return inventory;
    }

    // Step 1: Always load from SQLite first (instant)
    const localData = loadInventoryFromLocal();

    if (localData.length > 0 && !forceRefresh) {
      // Data displayed from local — background pull-sync (silent)
      _backgroundRefreshInventory();
      return localData;
    }

    // Step 2: Try pull-sync via SyncManager, but never fail loudly
    setIsLoadingInventory(true);
    try {
      await SyncManager.syncProducts({ full: !inventoryLoaded.current });

      // Reload from SQLite after sync
      const rows = ProductRepository.getAll();
      const normalized = rows.map(normalizeLocalProduct);
      setInventory(normalized);
      inventoryLoaded.current = true;
      setIsOffline(false);
      return normalized;
    } catch (err) {
      // Silent — offline-first: local data is already displayed
      console.warn('[ProductContext] Inventory sync skipped (offline):', err.message);
      setIsOffline(true);

      // Return whatever is in SQLite (already loaded in step 1)
      return localData;
    } finally {
      setIsLoadingInventory(false);
    }
  }, [inventory, loadInventoryFromLocal]);

  /**
   * Background refresh: pull-sync via SyncManager and reload from SQLite.
   */
  const _backgroundRefreshInventory = useCallback(async () => {
    try {
      await SyncManager.syncProducts();

      // Reload from SQLite after sync
      const rows = ProductRepository.getAll();
      if (rows.length > 0) {
        const normalized = rows.map(normalizeLocalProduct);
        setInventory(normalized);
        inventoryLoaded.current = true;
      }
      setIsOffline(false);
    } catch (err) {
      // Silent failure — local data is already displayed
      console.warn('[ProductContext] Background refresh failed:', err.message);
    }
  }, []);

  // Fetch categories - offline-first via SQLite + background pull-sync
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

    // Step 2: Pull-sync via SyncManager, but never fail loudly
    setIsLoadingCategories(true);
    try {
      await SyncManager.syncCategories({ full: !categoriesLoaded.current });

      // Reload from SQLite
      const reloaded = loadCategoriesFromLocal();
      if (reloaded.length > 0) {
        return reloaded;
      }
      return categories;
    } catch (err) {
      // Silent — offline-first: local data is already displayed
      console.warn('[ProductContext] Categories sync skipped (offline):', err.message);

      // Use fallback only if absolutely no data
      if (!categoriesLoaded.current && localCats.length === 0) {
        setCategories(fallbackCategories);
      }
      return localCats.length > 0 ? localCats : categories;
    } finally {
      setIsLoadingCategories(false);
    }
  }, [categories, loadCategoriesFromLocal]);

  /**
   * Background refresh categories via SyncManager.
   */
  const _backgroundRefreshCategories = useCallback(async () => {
    try {
      await SyncManager.syncCategories();

      // Reload from SQLite
      const rows = CategoryRepository.getAll();
      if (rows.length > 0) {
        const formatted = [
          { value: 'all', label: 'All Categories', icon: 'grid-outline' },
          ...rows.map((cat) => ({
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
    // Resolve product — productId may be server id or local_id
    let dbProduct = null;
    try {
      dbProduct = ProductRepository.getById(productId);
      if (!dbProduct) {
        dbProduct = ProductRepository.getByLocalId(productId);
      }
    } catch (err) {
      // ignore
    }

    const currentStock = dbProduct?.stock
      ?? inventory.find((p) => p.id === productId || p.local_id === productId)?.stock
      ?? 0;

    const serverId = dbProduct?.id || null;
    const localId = dbProduct?.local_id || productId;

    // Create a 'set' adjustment
    try {
      InventoryAdjustmentRepository.createAdjustment({
        productId: serverId,
        productLocalId: localId,
        type: 'set',
        quantity: newStock,
        currentStock,
      });
    } catch (err) {
      console.error('[ProductContext] SQLite stock set failed:', err);
      throw err;
    }

    // Update React state — match by id or local_id
    const updateFn = (prev) =>
      prev.map((product) =>
        (serverId && product.id === serverId) || product.local_id === localId
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

    // Resolve product from SQLite — productId may be server id or local_id
    let dbProduct = null;
    try {
      dbProduct = ProductRepository.getById(productId);
      if (!dbProduct) {
        dbProduct = ProductRepository.getByLocalId(productId);
      }
    } catch (err) {
      // ignore
    }

    const currentStock = dbProduct?.stock
      ?? inventory.find((p) => p.id === productId || p.local_id === productId)?.stock
      ?? 0;

    const serverId = dbProduct?.id || null;
    const localId = dbProduct?.local_id || productId;

    // 1. Create adjustment in SQLite + update stock + enqueue sync
    let result;
    try {
      result = InventoryAdjustmentRepository.createAdjustment({
        productId: serverId,
        productLocalId: localId,
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

    // 2. Update React state immediately — match by id or local_id
    const updateFn = (prev) =>
      prev.map((product) =>
        (serverId && product.id === serverId) || product.local_id === localId
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
  const addProduct = useCallback(async (productData) => {
    // 0. On web, convert blob: URLs to base64 data URIs before they expire
    const persistedImageUri = await persistImageUri(productData.image);

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
        image: persistedImageUri,
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
          _localImageUri: persistedImageUri,
        },
      });
    } catch (err) {
      console.warn('[ProductContext] Sync enqueue failed:', err.message);
    }

    // 3. Immediately add to React state
    const newProduct = {
      ...productData,
      local_id: localId,
      id: null,
      sync_status: 'pending',
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
  const updateProduct = useCallback(async (productId, updates) => {
    // 0. On web, convert blob: URLs to base64 data URIs before they expire
    const persistedImageUri = updates.image ? await persistImageUri(updates.image) : null;

    // 1. Update SQLite
    try {
      ProductRepository.updateLocal(productId, {
        ...updates,
        ...(persistedImageUri ? { image: persistedImageUri } : {}),
      });
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
          _localImageUri: persistedImageUri,
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

  // Get product by SKU — check in-memory, then SQLite (no API fallback)
  const getProductBySku = useCallback(async (sku) => {
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

    return localProduct || null;
  }, [inventory, publicProducts]);

  // Get product by barcode — check in-memory, then SQLite (no API fallback)
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

    return localProduct || null;
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
