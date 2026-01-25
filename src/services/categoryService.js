import api from './api';

/**
 * Category Service
 * Handles all API calls related to categories
 */
const categoryService = {
  /**
   * Get all categories
   * @param {Object} params - Query parameters
   * @param {boolean} params.include_count - Include product count
   * @param {boolean} params.is_active - Filter by active status
   * @returns {Promise<{data: Array}>}
   */
  getAll: async (params = {}) => {
    const response = await api.get('/categories', { params });
    return response;
  },

  /**
   * Get a single category by ID
   * @param {string} id - Category ID
   * @returns {Promise<{data: Object}>}
   */
  getById: async (id) => {
    const response = await api.get(`/categories/${id}`);
    return response;
  },

  /**
   * Get a category by slug
   * @param {string} slug - Category slug
   * @returns {Promise<{data: Object}>}
   */
  getBySlug: async (slug) => {
    const response = await api.get(`/categories/slug/${encodeURIComponent(slug)}`);
    return response;
  },

  /**
   * Create a new category
   * @param {Object} categoryData - Category data
   * @param {string} categoryData.name - Category name
   * @param {string} categoryData.description - Category description
   * @param {string} categoryData.icon - Icon name
   * @returns {Promise<{data: Object}>}
   */
  create: async (categoryData) => {
    const response = await api.post('/categories', categoryData);
    return response;
  },

  /**
   * Update a category
   * @param {string} id - Category ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<{data: Object}>}
   */
  update: async (id, updates) => {
    const response = await api.put(`/categories/${id}`, updates);
    return response;
  },

  /**
   * Delete a category
   * @param {string} id - Category ID
   * @returns {Promise<{data: Object}>}
   */
  delete: async (id) => {
    const response = await api.delete(`/categories/${id}`);
    return response;
  },

  /**
   * Get products in a category
   * @param {string} categoryId - Category ID
   * @param {Object} params - Additional query parameters
   * @returns {Promise<{data: Array, pagination: Object}>}
   */
  getProducts: async (categoryId, params = {}) => {
    const response = await api.get(`/categories/${categoryId}/products`, { params });
    return response;
  },
};

export default categoryService;
