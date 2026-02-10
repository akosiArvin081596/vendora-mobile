// Environment configuration for Vendora POS
// Primary config is loaded from .env file (see .env.example for template)

// Current environment - change this for different builds
const CURRENT_ENV = process.env.EXPO_PUBLIC_ENV || 'production';

// Fallback values if .env is not configured
const FALLBACK = {
  development: {
    API_URL: 'http://localhost:8000/api',
    WEBSOCKET_URL: 'http://localhost:3001',
  },
  staging: {
    API_URL: 'https://staging-api.vendora.com/api',
    WEBSOCKET_URL: 'wss://staging-ws.vendora.com',
  },
  production: {
    API_URL: 'https://api.vendora.com/api',
    WEBSOCKET_URL: 'wss://ws.vendora.com',
  },
};

export const API_URL = process.env.EXPO_PUBLIC_API_URL || FALLBACK[CURRENT_ENV].API_URL;
export const WEBSOCKET_URL = process.env.EXPO_PUBLIC_WEBSOCKET_URL || FALLBACK[CURRENT_ENV].WEBSOCKET_URL;
export const ENVIRONMENT = CURRENT_ENV;

export default {
  API_URL,
  WEBSOCKET_URL,
  ENVIRONMENT,
};
