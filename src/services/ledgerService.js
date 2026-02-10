import api, { buildQueryString } from './api';

/**
 * Ledger Service
 * Handles API calls for ledger (inventory + financial tracking)
 */
const ledgerService = {
  /**
   * Get ledger entries with filters
   * @param {Object} params - Query parameters
   * @param {string} params.type - Filter by type (stock_in, stock_out, sale, expense, adjustment, return)
   * @param {string} params.category - Filter by category (inventory, financial)
   * @param {number} params.product_id - Filter by product
   * @param {string} params.date_from - Start date
   * @param {string} params.date_to - End date
   * @param {string} params.search - Search description, reference, or product name
   * @param {number} params.page - Page number
   * @param {number} params.per_page - Items per page
   * @returns {Promise<{data: Array, meta: Object}>}
   */
  getAll: async (params = {}) => {
    const queryString = buildQueryString(params);
    const url = queryString ? `/ledger?${queryString}` : '/ledger';
    const response = await api.get(url);
    return response;
  },

  /**
   * Get ledger summary (totals for stock in/out, revenue, expenses, net profit)
   * @returns {Promise<{data: Object}>}
   */
  getSummary: async () => {
    const response = await api.get('/ledger/summary');
    return response;
  },

  /**
   * Create a manual ledger entry (stock_in or expense)
   * @param {Object} data - Entry data
   * @param {string} data.type - Entry type (stock_in, expense)
   * @param {number} data.product_id - Product ID (for stock_in)
   * @param {number} data.quantity - Quantity (for stock_in)
   * @param {number} data.amount - Amount in cents (for expense)
   * @param {string} data.description - Description
   * @param {string} data.reference - Optional reference
   * @returns {Promise<{data: Object}>}
   */
  create: async (data) => {
    const response = await api.post('/ledger', data);
    return response;
  },
};

export default ledgerService;
