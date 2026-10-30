// Environment configuration for Vendora POS
// Primary config is loaded from .env file (see .env.example for template)

// Current environment - change this for different builds
const CURRENT_ENV = process.env.EXPO_PUBLIC_ENV || 'production';

// Only development falls back to a local server. Staging and production
// builds must set EXPO_PUBLIC_API_URL and EXPO_PUBLIC_WEBSOCKET_URL: a
// guessed default would send sign-ins to a host Vendora doesn't control.
const DEVELOPMENT_FALLBACK = {
  API_URL: 'http://localhost:8000/api',
  WEBSOCKET_URL: 'http://localhost:3001',
};

function resolve(name, value) {
  if (value) {
    return value;
  }
  if (CURRENT_ENV === 'development') {
    return DEVELOPMENT_FALLBACK[name];
  }
  throw new Error(
    `EXPO_PUBLIC_${name} is not set for this ${CURRENT_ENV} build. Set it in .env or in the build's environment.`
  );
}

// Each variable is read by its full name: Expo only inlines EXPO_PUBLIC_*
// values written out like this.
export const API_URL = resolve('API_URL', process.env.EXPO_PUBLIC_API_URL);
export const WEBSOCKET_URL = resolve('WEBSOCKET_URL', process.env.EXPO_PUBLIC_WEBSOCKET_URL);
export const ENVIRONMENT = CURRENT_ENV;

export default {
  API_URL,
  WEBSOCKET_URL,
  ENVIRONMENT,
};
