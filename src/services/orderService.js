import api, { buildQueryString } from './api';

/**
 * Order Service
 * Handles all API calls related to orders and payments
 */
const orderService = {
  /**
   * Create a new order
   * @param {Object} data
   * @param {number|null} data.customer_id - Customer ID (nullable)
   * @param {string} data.ordered_at - Date string (required)
   * @param {string} data.status - 'pending' | 'processing' | 'completed' | 'cancelled'
   * @param {Array} data.items - Array of { product_id, quantity }
   * @returns {Promise<{data: Object}>}
   */
  createOrder: async (data) => {
    const response = await api.post('/orders', data);
    return response;
  },

  /**
   * Create a payment for an order
   * @param {Object} data
   * @param {number} data.order_id - Order ID (required)
   * @param {string} data.paid_at - Date string (required)
   * @param {number} data.amount - Amount in centavos (integer, required)
   * @param {string} data.method - 'cash' | 'card' | 'online'
   * @param {string} data.status - 'completed' | 'pending' | 'refunded'
   * @returns {Promise<{data: Object}>}
   */
  createPayment: async (data) => {
    const response = await api.post('/payments', data);
    return response;
  },

  /**
   * Get paginated orders with optional filters
   * @param {Object} params - Query parameters (page, per_page, status, etc.)
   * @returns {Promise<{data: Array, meta: Object}>}
   */
  getOrders: async (params = {}) => {
    const queryString = buildQueryString(params);
    const url = queryString ? `/orders?${queryString}` : '/orders';
    const response = await api.get(url);
    return response;
  },

  /**
   * Get a single order by ID
   * @param {number} id - Order ID
   * @returns {Promise<{data: Object}>}
   */
  getOrderById: async (id) => {
    const response = await api.get(`/orders/${id}`);
    return response;
  },
};

export default orderService;
