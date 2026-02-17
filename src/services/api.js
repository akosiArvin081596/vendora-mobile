import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { API_URL } from '../config/env';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const extractValidationMessages = (details) => {
  if (!details) {
    return [];
  }

  if (Array.isArray(details)) {
    return details.flatMap((item) => {
      if (!item) {
        return [];
      }
      if (typeof item === 'string') {
        return [item];
      }
      if (typeof item === 'object') {
        const message = item.message || item.error;
        return message ? [message] : [];
      }
      return [String(item)];
    });
  }

  if (typeof details === 'string') {
    return [details];
  }

  if (typeof details === 'object') {
    return Object.entries(details).flatMap(([field, messages]) => {
      if (Array.isArray(messages)) {
        return messages.map((message) => `${field}: ${message}`);
      }
      if (typeof messages === 'string') {
        return [`${field}: ${messages}`];
      }
      return [];
    });
  }

  return [String(details)];
};

const buildValidationError = (data) => {
  const details = data?.error?.details ?? data?.errors;
  const messages = extractValidationMessages(details);
  const baseMessage = data?.error?.message || data?.message || 'Validation failed.';

  if (!messages.length) {
    return { message: baseMessage, details };
  }

  const limited = messages.slice(0, 5);
  const suffix = messages.length > 5 ? ` (+${messages.length - 5} more)` : '';

  return {
    message: `Validation failed: ${limited.join(' | ')}${suffix}`,
    details,
  };
};

const resolveErrorMessage = (data, fallback) => {
  if (!data) {
    return fallback;
  }

  if (typeof data === 'string') {
    return data;
  }

  if (typeof data?.message === 'string' && data.message.trim()) {
    return data.message;
  }

  if (typeof data?.error === 'string' && data.error.trim()) {
    return data.error;
  }

  if (typeof data?.error?.message === 'string' && data.error.message.trim()) {
    return data.error.message;
  }

  return fallback;
};

const resolveErrorCode = (data, fallback) => {
  if (!data) {
    return fallback;
  }

  if (typeof data?.error?.code === 'string' && data.error.code.trim()) {
    return data.error.code;
  }

  if (typeof data?.error === 'string' && data.error.trim()) {
    return data.error;
  }

  if (typeof data?.code === 'string' && data.code.trim()) {
    return data.code;
  }

  return fallback;
};

// Request interceptor - add auth token and idempotency key
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('@vendora_auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }

    // Auto-attach idempotency key to mutation requests (if not already set)
    const method = (config.method || '').toUpperCase();
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && !config.headers['X-Idempotency-Key']) {
      config.headers['X-Idempotency-Key'] = Crypto.randomUUID();
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle common errors
api.interceptors.response.use(
  (response) => {
    // Return the data directly if it follows our API format
    if (response.data && typeof response.data.success !== 'undefined') {
      if (response.data.success) {
        return response.data;
      } else {
        // API returned success: false
        const error = new Error(resolveErrorMessage(response.data, 'Request failed'));
        error.code = resolveErrorCode(response.data, 'REQUEST_FAILED');
        error.details = response.data?.error?.details;
        return Promise.reject(error);
      }
    }
    return response.data;
  },
  async (error) => {
    // Handle network errors
    if (!error.response) {
      const url = error?.config?.baseURL
        ? `${error.config.baseURL}${error.config.url}`
        : error?.config?.url || 'unknown';
      console.error('[API] Network error details:', {
        message: error.message,
        code: error.code,
        url,
        method: error?.config?.method,
        timeout: error?.config?.timeout,
        hasAuth: !!error?.config?.headers?.Authorization,
      });
      const networkError = new Error(`Network error: ${error.message || 'no response received'}`);
      networkError.code = 'NETWORK_ERROR';
      networkError.originalCode = error.code;
      return Promise.reject(networkError);
    }

    // Handle specific HTTP status codes
    const { status, data } = error.response;

    switch (status) {
      case 401:
        // Unauthorized - clear token and redirect to login
        await AsyncStorage.removeItem('@vendora_auth_token');
        // Log minimal details to help debug auth failures in Expo/Metro console.
        console.warn('API 401', {
          url: error?.config?.url,
          message: data?.error?.message || data?.message,
          code: resolveErrorCode(data, 'UNAUTHORIZED'),
        });
        const isLoginRequest = error?.config?.url?.includes('/auth/login');
        const authFallback = isLoginRequest
          ? 'The email or password you entered is incorrect.'
          : 'Session expired. Please login again.';
        const authError = new Error(resolveErrorMessage(data, authFallback));
        authError.code = resolveErrorCode(data, 'UNAUTHORIZED');
        return Promise.reject(authError);

      case 403:
        const forbiddenError = new Error(resolveErrorMessage(data, 'You do not have permission to perform this action.'));
        forbiddenError.code = resolveErrorCode(data, 'FORBIDDEN');
        return Promise.reject(forbiddenError);

      case 404:
        const notFoundError = new Error(resolveErrorMessage(data, 'Resource not found.'));
        notFoundError.code = resolveErrorCode(data, 'NOT_FOUND');
        return Promise.reject(notFoundError);

      case 422:
        const { message, details } = buildValidationError(data);
        const validationError = new Error(message);
        validationError.code = 'VALIDATION_ERROR';
        validationError.details = details;
        return Promise.reject(validationError);

      case 409:
        const conflictError = new Error(resolveErrorMessage(data, 'Resource already exists.'));
        conflictError.code = resolveErrorCode(data, 'CONFLICT');
        return Promise.reject(conflictError);

      case 500:
      default:
        const serverError = new Error(resolveErrorMessage(data, 'Server error. Please try again later.'));
        serverError.code = resolveErrorCode(data, 'SERVER_ERROR');
        return Promise.reject(serverError);
    }
  }
);

// Helper function to build query string
export const buildQueryString = (params) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.append(key, value);
    }
  });
  return query.toString();
};

export default api;
