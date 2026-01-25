import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WEBSOCKET_URL } from '../config/env';

const AUTH_TOKEN_KEY = '@vendora_auth_token';

/**
 * Socket.io client service for real-time synchronization
 */
class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
    this.connectionAttempts = 0;
    this.maxConnectionAttempts = 5;
    this.isIntentionalDisconnect = false;
  }

  /**
   * Connect to WebSocket server
   * @returns {Promise<Socket|null>}
   */
  async connect() {
    // Don't connect if already connected
    if (this.socket?.connected) {
      return this.socket;
    }

    // Get auth token (optional - guests can connect without it)
    const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);

    this.isIntentionalDisconnect = false;

    try {
      this.socket = io(WEBSOCKET_URL, {
        auth: token ? { token } : { guest: true },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: this.maxConnectionAttempts,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        forceNew: true,
      });

      this.setupDefaultHandlers();
      return this.socket;
    } catch (error) {
      console.error('[Socket] Connection error:', error.message);
      return null;
    }
  }

  /**
   * Setup default socket event handlers
   */
  setupDefaultHandlers() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      this.connectionAttempts = 0;
    });

    this.socket.on('disconnect', () => {
      // Socket will attempt to reconnect automatically if not intentional
    });

    this.socket.on('connect_error', () => {
      this.connectionAttempts++;
    });

    this.socket.on('reconnect', () => {
      // Reconnected successfully
    });

    this.socket.on('reconnect_error', () => {
      // Reconnection error
    });

    this.socket.on('reconnect_failed', () => {
      // Failed to reconnect after max attempts
    });

    // Server ping/pong for health check
    this.socket.on('pong', () => {
      // Pong received
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect() {
    if (this.socket) {
      this.isIntentionalDisconnect = true;
      this.socket.disconnect();
      this.socket = null;
      this.listeners.clear();
    }
  }

  /**
   * Subscribe to a socket event
   * @param {string} event - Event name
   * @param {Function} callback - Event handler
   */
  on(event, callback) {
    if (this.socket) {
      // Remove existing listener for this event to avoid duplicates
      if (this.listeners.has(event)) {
        this.socket.off(event, this.listeners.get(event));
      }
      this.socket.on(event, callback);
      this.listeners.set(event, callback);
      console.log(`[Socket] Listener attached for event: ${event}`);
    } else {
      console.warn(`[Socket] Cannot attach listener for ${event}, socket not initialized`);
    }
  }

  /**
   * Unsubscribe from a socket event
   * @param {string} event - Event name
   */
  off(event) {
    if (this.socket && this.listeners.has(event)) {
      this.socket.off(event, this.listeners.get(event));
      this.listeners.delete(event);
    }
  }

  /**
   * Check if socket is connected
   * @returns {boolean}
   */
  isConnected() {
    return this.socket?.connected ?? false;
  }

  /**
   * Emit an event to the server
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  emit(event, data) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn('[Socket] Cannot emit, not connected');
    }
  }

  /**
   * Send ping to check connection health
   */
  ping() {
    if (this.socket?.connected) {
      this.socket.emit('ping');
    }
  }

  /**
   * Get socket ID
   * @returns {string|null}
   */
  getSocketId() {
    return this.socket?.id ?? null;
  }
}

// Export singleton instance
export default new SocketService();
