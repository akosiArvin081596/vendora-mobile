import api, { buildQueryString } from './api';

/**
 * Inventory Service
 * Handles API calls for inventory management (user's own products only)
 */
const inventoryService = {
  /**
   * Get inventory items (products owned by authenticated user)
   * @param {Object} params - Query parameters
   * @param {string} params.search - Search in name or SKU
   * @param {string} params.status - Filter by status (in_stock, low_stock, out_of_stock, critical)
   * @param {number} params.page - Page number
   * @param {number} params.per_page - Items per page
   * @returns {Promise<{data: Array, meta: Object}>}
   */
  getAll: async (params = {}) => {
    const queryString = buildQueryString(params);
    const url = queryString ? `/inventory?${queryString}` : '/inventory';
    const response = await api.get(url);
    return response;
  },

  /**
   * Get inventory summary (total, low stock, out of stock counts)
   * @returns {Promise<{data: Object}>}
   */
  getSummary: async () => {
    const response = await api.get('/inventory/summary');
    return response;
  },

  /**
   * Create inventory adjustment (add, remove, or set stock)
   * @param {Object} adjustmentData - Adjustment data
   * @param {number} adjustmentData.product_id - Product ID
   * @param {string} adjustmentData.type - Adjustment type (add, remove, set)
   * @param {number} adjustmentData.quantity - Quantity to adjust
   * @param {string} adjustmentData.note - Optional note
   * @returns {Promise<{data: Object}>}
   */
  createAdjustment: async (adjustmentData) => {
    const response = await api.post('/inventory/adjustments', adjustmentData);
    return response;
  },
};

export default inventoryService;
