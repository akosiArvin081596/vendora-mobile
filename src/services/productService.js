import api, { buildQueryString } from './api';

import { Platform } from 'react-native';

/**
 * Helper to check if a URI is a local file or blob (not a remote URL)
 */
const isLocalFile = (uri) => {
  if (!uri) return false;
  return (
    uri.startsWith('file://') ||
    uri.startsWith('content://') ||
    uri.startsWith('blob:') ||
    uri.startsWith('/')
  );
};

/**
 * Convert blob URL to File object (for web)
 */
const blobUrlToFile = async (blobUrl, filename = 'image.jpg') => {
  const response = await fetch(blobUrl);
  const blob = await response.blob();
  const type = blob.type || 'image/jpeg';
  const ext = type.split('/')[1] || 'jpg';
  const finalFilename = filename.includes('.') ? filename : `${filename}.${ext}`;
  return new File([blob], finalFilename, { type });
};

/**
 * Product Service
 * Handles all API calls related to products
 */
const productService = {
  /**
   * Get all products with optional filters and pagination
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number (default: 1)
   * @param {number} params.limit - Items per page (default: 20)
   * @param {string} params.category - Filter by category slug
   * @param {string} params.search - Search in name, SKU, description
   * @param {number} params.stock_lte - Stock less than or equal
   * @param {number} params.stock_gte - Stock greater than or equal
   * @param {boolean} params.in_stock - Only products with stock > 0
   * @param {boolean} params.has_barcode - Filter by barcode availability
   * @param {boolean} params.is_active - Filter by active status
   * @param {string} params.sort - Sort field (name, price, stock, createdAt)
   * @param {string} params.order - Sort order (asc, desc)
   * @returns {Promise<{data: Array, pagination: Object}>}
   */
  getAll: async (params = {}) => {
    const queryString = buildQueryString(params);
    const url = queryString ? `/products?${queryString}` : '/products';
    const response = await api.get(url);
    return response;
  },

  /**
   * Get a single product by ID
   * @param {string} id - Product ID
   * @returns {Promise<{data: Object}>}
   */
  getById: async (id) => {
    const response = await api.get(`/products/${id}`);
    return response;
  },

  /**
   * Get a product by SKU
   * @param {string} sku - Product SKU
   * @returns {Promise<{data: Object}>}
   */
  getBySku: async (sku) => {
    const response = await api.get(`/products/sku/${encodeURIComponent(sku)}`);
    return response;
  },

  /**
   * Get a product by barcode
   * @param {string} barcode - Product barcode
   * @returns {Promise<{data: Object}>}
   */
  getByBarcode: async (barcode) => {
    const response = await api.get(`/products/barcode/${encodeURIComponent(barcode)}`);
    return response;
  },

  /**
   * Create a new product
   * @param {Object} productData - Product data
   * @returns {Promise<{data: Object}>}
   */
  create: async (productData) => {
    const hasLocalImage = isLocalFile(productData.image);

    if (hasLocalImage) {
      const formData = new FormData();

      // Add all fields except image
      Object.entries(productData).forEach(([key, value]) => {
        if (key === 'image') return;
        if (key === 'bulk_pricing' && Array.isArray(value)) {
          value.forEach((tier, index) => {
            formData.append(`bulk_pricing[${index}][min_qty]`, tier.min_qty);
            formData.append(`bulk_pricing[${index}][price]`, tier.price);
          });
        } else if (typeof value === 'boolean') {
          // Convert booleans to "1"/"0" for Laravel
          formData.append(key, value ? '1' : '0');
        } else if (value !== undefined && value !== null) {
          formData.append(key, value);
        }
      });

      // Add image file
      const imageUri = productData.image;

      if (Platform.OS === 'web') {
        // Web: Convert blob URL to File object
        const file = await blobUrlToFile(imageUri, 'product-image');
        formData.append('image', file);
      } else {
        // Mobile: Use URI object format
        const filename = imageUri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        formData.append('image', {
          uri: imageUri,
          name: filename,
          type,
        });
      }

      const response = await api.post('/products', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // 60 seconds for file uploads
      });
      return response;
    }

    // No local image, send as JSON
    const response = await api.post('/products', productData);
    return response;
  },

  /**
   * Update a product
   * @param {string} id - Product ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<{data: Object}>}
   */
  update: async (id, updates) => {
    const hasLocalImage = isLocalFile(updates.image);

    if (hasLocalImage) {
      const formData = new FormData();

      // Add all fields except image
      Object.entries(updates).forEach(([key, value]) => {
        if (key === 'image') return;
        if (key === 'bulk_pricing' && Array.isArray(value)) {
          value.forEach((tier, index) => {
            formData.append(`bulk_pricing[${index}][min_qty]`, tier.min_qty);
            formData.append(`bulk_pricing[${index}][price]`, tier.price);
          });
        } else if (typeof value === 'boolean') {
          // Convert booleans to "1"/"0" for Laravel
          formData.append(key, value ? '1' : '0');
        } else if (value !== undefined && value !== null) {
          formData.append(key, value);
        }
      });

      // Add image file
      const imageUri = updates.image;

      if (Platform.OS === 'web') {
        // Web: Convert blob URL to File object
        const file = await blobUrlToFile(imageUri, 'product-image');
        formData.append('image', file);
      } else {
        // Mobile: Use URI object format
        const filename = imageUri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        formData.append('image', {
          uri: imageUri,
          name: filename,
          type,
        });
      }

      // Use POST with _method for Laravel to handle as PATCH with file upload
      formData.append('_method', 'PATCH');
      const response = await api.post(`/products/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // 60 seconds for file uploads
      });
      return response;
    }

    // No local image, send as JSON with PUT
    const response = await api.put(`/products/${id}`, updates);
    return response;
  },

  /**
   * Delete a product (soft delete)
   * @param {string} id - Product ID
   * @returns {Promise<{data: Object}>}
   */
  delete: async (id) => {
    const response = await api.delete(`/products/${id}`);
    return response;
  },

  /**
   * Update product stock level
   * @param {string} id - Product ID
   * @param {number} stock - New stock level
   * @returns {Promise<{data: Object}>}
   */
  updateStock: async (id, stock) => {
    const response = await api.patch(`/products/${id}/stock`, { stock });
    return response;
  },

  /**
   * Adjust product stock (add or subtract)
   * @param {string} id - Product ID
   * @param {number} adjustment - Amount to adjust (positive or negative)
   * @returns {Promise<{data: Object}>}
   */
  adjustStock: async (id, adjustment) => {
    const response = await api.patch(`/products/${id}/stock`, { adjustment });
    return response;
  },

  /**
   * Bulk decrement stock after a sale
   * @param {Array} items - Array of items to decrement
   * @param {string} items[].productId - Product ID
   * @param {string} items[].variantSku - Variant SKU (optional)
   * @param {number} items[].quantity - Quantity to decrement
   * @param {string} orderId - Order ID for audit trail
   * @returns {Promise<{data: {updated: Array, failed: Array}}>}
   */
  bulkDecrementStock: async (items, orderId) => {
    const response = await api.post('/products/bulk-stock-decrement', {
      items,
      orderId,
    });
    return response;
  },

  /**
   * Get low stock products
   * @param {number} threshold - Stock threshold (default: 10)
   * @returns {Promise<{data: Array}>}
   */
  getLowStock: async (threshold = 10) => {
    const response = await api.get(`/products?stock_lte=${threshold}&stock_gte=1&is_active=true`);
    return response;
  },

  /**
   * Get out of stock products
   * @returns {Promise<{data: Array}>}
   */
  getOutOfStock: async () => {
    const response = await api.get('/products?stock_lte=0&is_active=true');
    return response;
  },

  /**
   * Search products
   * @param {string} query - Search query
   * @param {Object} options - Additional options
   * @returns {Promise<{data: Array}>}
   */
  search: async (query, options = {}) => {
    const params = { search: query, ...options };
    return productService.getAll(params);
  },
};

export default productService;
