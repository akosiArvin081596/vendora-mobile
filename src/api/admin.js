import client from './client';

/**
 * Admin API endpoints for user management
 */
export const adminApi = {
  // ============ USER MANAGEMENT ============

  /**
   * Get all users with optional filters
   * @param {Object} params - Query parameters
   * @param {string} [params.search] - Search by name or email
   * @param {string} [params.user_type] - Filter by user type
   * @param {string} [params.status] - Filter by status
   * @param {number} [params.per_page] - Items per page
   * @param {number} [params.page] - Page number
   */
  getUsers: async (params = {}) => {
    const response = await client.get('/admin/users', { params });
    return response.data;
  },

  /**
   * Get a single user by ID
   * @param {number|string} userId - User ID
   */
  getUser: async (userId) => {
    const response = await client.get(`/admin/users/${userId}`);
    return response.data;
  },

  /**
   * Create a new user
   * @param {Object} userData - User data
   * @param {string} userData.name - User name
   * @param {string} userData.email - User email
   * @param {string} userData.password - User password
   * @param {string} userData.user_type - User type (admin, vendor, manager, cashier, buyer)
   * @param {string} [userData.phone] - User phone
   * @param {string} [userData.status] - User status (active, inactive, suspended)
   */
  createUser: async (userData) => {
    const response = await client.post('/admin/users', userData);
    return response.data;
  },

  /**
   * Update a user
   * @param {number|string} userId - User ID
   * @param {Object} userData - User data to update
   */
  updateUser: async (userId, userData) => {
    const response = await client.put(`/admin/users/${userId}`, userData);
    return response.data;
  },

  /**
   * Delete a user
   * @param {number|string} userId - User ID
   */
  deleteUser: async (userId) => {
    const response = await client.delete(`/admin/users/${userId}`);
    return response.data;
  },

  /**
   * Change user status
   * @param {number|string} userId - User ID
   * @param {string} status - New status (active, inactive, suspended)
   */
  changeUserStatus: async (userId, status) => {
    const response = await client.patch(`/admin/users/${userId}/status`, { status });
    return response.data;
  },
};

export default adminApi;
