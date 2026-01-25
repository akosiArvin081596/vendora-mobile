import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { AppState } from 'react-native';
import socketService from '../services/socketService';
import { useAuth } from './AuthContext';
import { useProducts } from './ProductContext';
import { useOrders } from './OrderContext';

const SocketContext = createContext(null);

/**
 * Hook to access socket context
 */
export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

/**
 * Socket Provider - manages WebSocket connection and real-time sync
 * Must be placed inside AuthProvider, ProductProvider, and OrderProvider
 */
export function SocketProvider({ children }) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastSyncEvent, setLastSyncEvent] = useState(null);
  const [syncStats, setSyncStats] = useState({
    eventsReceived: 0,
    lastEventTime: null,
  });

  const { currentUser } = useAuth();
  const {
    fetchProducts,
    fetchCategories,
    addProductSilently,
    updateProductSilently,
    removeProductSilently,
  } = useProducts();
  const { addOrder } = useOrders();

  const appStateRef = useRef(AppState.currentState);
  const reconnectTimeoutRef = useRef(null);

  /**
   * Setup event listeners for real-time sync
   */
  const setupEventListeners = useCallback(() => {
    console.log('[Socket] Setting up event listeners...');

    // Product events - use silent updates to avoid loading screen disruption
    socketService.on('product:created', (data) => {
      console.log('[Socket] Received product:created', data);
      // Backend sends product.toArray() directly (product data at root level)
      if (data?.id) {
        addProductSilently(data);
      } else {
        // Fallback to full refresh if no product data
        console.log('[Socket] No product data, falling back to refresh');
        fetchProducts({ forceRefresh: true });
      }
      updateSyncStats('product:created');
    });

    socketService.on('product:updated', (data) => {
      console.log('[Socket] Received product:updated', data);
      // Backend sends product.toArray() directly
      if (data?.id) {
        updateProductSilently(data);
      } else {
        // Fallback to full refresh if no product data
        fetchProducts({ forceRefresh: true });
      }
      updateSyncStats('product:updated');
    });

    socketService.on('product:deleted', (data) => {
      console.log('[Socket] Received product:deleted', data);
      // Backend sends { id: productId }
      if (data?.id) {
        removeProductSilently(data.id);
      } else {
        // Fallback to full refresh if no product ID
        fetchProducts({ forceRefresh: true });
      }
      updateSyncStats('product:deleted');
    });

    socketService.on('stock:updated', (data) => {
      console.log('[Socket] Received stock:updated', data);
      // Backend sends { productId, newStock } - only stock change, not full product
      // For stock updates, we need to fetch the full product or update just the stock field
      if (data?.productId && data?.newStock !== undefined) {
        // Update only the stock field for the specific product
        updateProductSilently({ id: data.productId, stock: data.newStock });
      } else {
        // Fallback to full refresh
        fetchProducts({ forceRefresh: true });
      }
      updateSyncStats('stock:updated');
    });

    // Category events
    socketService.on('category:created', () => {
      fetchCategories();
      updateSyncStats('category:created');
    });

    socketService.on('category:updated', () => {
      fetchCategories();
      updateSyncStats('category:updated');
    });

    socketService.on('category:deleted', () => {
      fetchCategories();
      updateSyncStats('category:deleted');
    });

    // Order events
    socketService.on('order:created', () => {
      updateSyncStats('order:created');
    });

    socketService.on('order:updated', () => {
      updateSyncStats('order:updated');
    });
  }, [fetchProducts, fetchCategories, addProductSilently, updateProductSilently, removeProductSilently]);

  /**
   * Remove event listeners
   */
  const removeEventListeners = useCallback(() => {
    const events = [
      'product:created',
      'product:updated',
      'product:deleted',
      'stock:updated',
      'category:created',
      'category:updated',
      'category:deleted',
      'order:created',
      'order:updated',
    ];

    events.forEach((event) => socketService.off(event));
  }, []);

  /**
   * Update sync statistics
   */
  const updateSyncStats = (eventType) => {
    setLastSyncEvent(eventType);
    setSyncStats((prev) => ({
      eventsReceived: prev.eventsReceived + 1,
      lastEventTime: new Date().toISOString(),
    }));
  };

  /**
   * Connect to WebSocket server
   * Supports both authenticated users and guests
   */
  const connect = useCallback(async () => {
    const socket = await socketService.connect();
    if (socket) {
      // Remove any existing listeners first to avoid duplicates
      socket.off('connect');
      socket.off('disconnect');

      socket.on('connect', () => {
        console.log('[Socket] Connected! Socket ID:', socket.id, currentUser ? '(authenticated)' : '(guest)');
        setIsConnected(true);
        // Setup event listeners after connection is established
        setupEventListeners();
      });

      socket.on('disconnect', () => {
        console.log('[Socket] Disconnected');
        setIsConnected(false);
      });

      // If socket is already connected, setup listeners immediately
      if (socket.connected) {
        console.log('[Socket] Already connected, setting up listeners');
        setIsConnected(true);
        setupEventListeners();
      }
    } else {
      console.log('[Socket] Failed to connect');
    }
  }, [currentUser, setupEventListeners]);

  /**
   * Disconnect from WebSocket server
   */
  const disconnect = useCallback(() => {
    removeEventListeners();
    socketService.disconnect();
    setIsConnected(false);
  }, [removeEventListeners]);

  /**
   * Reconnect with delay
   */
  const reconnect = useCallback(async () => {
    // Clear any pending reconnect
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    // Disconnect first if connected
    if (socketService.isConnected()) {
      disconnect();
    }

    // Wait a bit before reconnecting
    reconnectTimeoutRef.current = setTimeout(async () => {
      await connect();
    }, 1000);
  }, [connect, disconnect]);

  // Connect/disconnect based on auth state
  // Guests can also connect for public events (product updates, etc.)
  useEffect(() => {
    // Always disconnect first to ensure fresh connection
    disconnect();
    // Small delay to ensure token is saved before connecting
    const timer = setTimeout(() => {
      connect();
    }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  // Re-setup event listeners when they change (e.g., when fetchProducts updates)
  // This ensures guests get fresh listeners even though currentUser doesn't change
  useEffect(() => {
    if (socketService.isConnected()) {
      console.log('[Socket] Re-attaching event listeners due to dependency change');
      removeEventListeners();
      setupEventListeners();
    }
  }, [setupEventListeners, removeEventListeners]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  // Handle app state changes (background/foreground)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      const previousState = appStateRef.current;
      appStateRef.current = nextAppState;

      // App came to foreground - reconnect (for both guests and authenticated users)
      if (
        previousState.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        if (!socketService.isConnected()) {
          connect();
        }
      }
    });

    return () => {
      subscription?.remove();
    };
  }, [currentUser, connect]);

  const value = {
    // Connection state
    isConnected,

    // Sync info
    lastSyncEvent,
    syncStats,

    // Actions
    connect,
    disconnect,
    reconnect,

    // Utilities
    ping: () => socketService.ping(),
    getSocketId: () => socketService.getSocketId(),
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}

export default SocketContext;
