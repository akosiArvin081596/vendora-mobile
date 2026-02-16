import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import orderService from '../services/orderService';
import { useAuth } from './AuthContext';
import OrderRepository from '../db/repositories/OrderRepository';
import SyncService from '../sync/SyncService';

const OrderContext = createContext();

/**
 * Map frontend payment method to backend-accepted values.
 * Backend accepts: 'cash', 'card', 'online'
 */
const mapPaymentMethod = (method) => {
  const methodMap = {
    cash: 'cash',
    card: 'card',
    ewallet: 'online',
    online: 'online',
  };
  return methodMap[method] || 'cash';
};

/**
 * Map a backend order (snake_case) to the frontend format used by
 * OrdersScreen, ReceiptModal, etc.
 */
const mapBackendOrder = (order) => {
  const items = (order.items || []).map((item) => ({
    id: item.product_id,
    name: item.product?.name || item.product_name || 'Unknown',
    sku: item.product?.sku || item.sku || '',
    unit: item.product?.unit || item.unit || 'pc',
    price: item.price != null ? item.price / 100 : 0,
    quantity: item.quantity,
  }));

  const total = order.total != null ? order.total / 100 : 0;
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return {
    id: order.order_number || `ORD-${order.id}`,
    backendId: order.id,
    localId: order.local_id || null,
    transactionId: order.order_number || `ORD-${order.id}`,
    status: order.status,
    syncStatus: order.sync_status || 'synced',
    createdAt: new Date(order.ordered_at || order.created_at),
    customerName: order.customer?.name || 'Walk-in Customer',
    items,
    subtotal,
    total,
    discount: 0,
    discountLabel: 'None',
    tax: 0,
    taxRate: 0,
    paymentMethod: order.payments?.[0]?.method || 'cash',
    amountTendered: total,
    change: 0,
    vatExempt: false,
  };
};

/**
 * Map a local SQLite order row to the frontend format.
 */
const mapLocalOrder = (row) => {
  const total = row.total != null ? row.total / 100 : 0;
  const subtotal = row.subtotal != null ? row.subtotal / 100 : 0;

  return {
    id: row.order_number || row.local_id,
    backendId: row.id || null,
    localId: row.local_id,
    transactionId: row.order_number || row.local_id,
    status: row.status,
    syncStatus: row.sync_status || 'pending',
    createdAt: new Date(row.ordered_at || row.created_at),
    customerName: 'Walk-in Customer',
    items: [],
    subtotal,
    total,
    discount: row.discount != null ? row.discount / 100 : 0,
    discountLabel: 'None',
    tax: row.tax != null ? row.tax / 100 : 0,
    taxRate: 0,
    paymentMethod: 'cash',
    amountTendered: total,
    change: 0,
    vatExempt: false,
  };
};

export function OrderProvider({ children }) {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const ordersLoaded = useRef(false);

  /**
   * Load orders from SQLite for instant display.
   */
  const loadOrdersFromLocal = useCallback(() => {
    try {
      const rows = OrderRepository.getAll();
      if (rows.length > 0) {
        const localOrders = rows.map(mapLocalOrder);
        setOrders(localOrders);
        ordersLoaded.current = true;
        return localOrders;
      }
    } catch (err) {
      console.warn('[OrderContext] Error loading local orders:', err.message);
    }
    return [];
  }, []);

  /**
   * Fetch orders from API (local-first, then background refresh).
   */
  const fetchOrders = useCallback(async (params = {}) => {
    const forceRefresh = params.forceRefresh;

    if (ordersLoaded.current && !forceRefresh) {
      return orders;
    }

    // Step 1: Load from SQLite instantly
    const localData = loadOrdersFromLocal();
    if (localData.length > 0 && !forceRefresh) {
      _backgroundRefreshOrders(params);
      return localData;
    }

    // Step 2: Fetch from API
    try {
      setIsLoading(true);
      const response = await orderService.getOrders({
        per_page: 50,
        ...params,
      });

      const backendOrders = (response.data || []).map(mapBackendOrder);
      setOrders(backendOrders);
      ordersLoaded.current = true;

      // Cache to SQLite
      try {
        OrderRepository.bulkUpsertFromServer(response.data || []);
      } catch (dbErr) {
        console.warn('[OrderContext] Error caching orders:', dbErr.message);
      }

      return backendOrders;
    } catch (err) {
      console.error('[OrderContext] Error fetching orders:', err);
      // Fallback to local
      if (!ordersLoaded.current) {
        loadOrdersFromLocal();
      }
      return orders;
    } finally {
      setIsLoading(false);
    }
  }, [orders, loadOrdersFromLocal]);

  /**
   * Background refresh orders from API.
   */
  const _backgroundRefreshOrders = useCallback(async (params = {}) => {
    try {
      const response = await orderService.getOrders({
        per_page: 50,
        ...params,
      });
      const backendOrders = (response.data || []).map(mapBackendOrder);

      if (backendOrders.length > 0) {
        OrderRepository.bulkUpsertFromServer(response.data || []);
        setOrders(backendOrders);
        ordersLoaded.current = true;
      }
    } catch (err) {
      console.warn('[OrderContext] Background refresh failed:', err.message);
    }
  }, []);

  // Load orders when user is authenticated
  useEffect(() => {
    if (currentUser) {
      fetchOrders();
    } else {
      setOrders([]);
      ordersLoaded.current = false;
    }
  }, [currentUser]);

  /**
   * Add a new order — offline-first.
   * Writes to SQLite immediately, enqueues sync, triggers queue processing.
   * Returns instantly without waiting for the server.
   */
  const addOrder = useCallback((orderData) => {
    const orderedAt = orderData.timestamp
      ? new Date(orderData.timestamp).toISOString()
      : new Date().toISOString();

    // 1. Write to SQLite + enqueue sync (atomic transaction)
    let result;
    try {
      result = OrderRepository.createOrderWithItems({
        items: orderData.items || [],
        subtotal: orderData.subtotal || 0,
        discount: orderData.discount || 0,
        tax: orderData.tax || 0,
        total: orderData.total || 0,
        paymentMethod: orderData.paymentMethod || 'cash',
        amountTendered: orderData.amountTendered || orderData.total || 0,
        customerId: orderData.customerId || null,
        notes: orderData.notes || null,
        userId: currentUser?.id || null,
        orderedAt,
      });
    } catch (err) {
      console.error('[OrderContext] SQLite order creation failed:', err);
      throw err;
    }

    // 2. Immediately add to React state for UI update
    const frontendOrder = {
      ...orderData,
      id: orderData.transactionId || result.orderLocalId,
      localId: result.orderLocalId,
      backendId: null,
      transactionId: orderData.transactionId || result.orderLocalId,
      status: 'completed',
      syncStatus: 'pending',
      createdAt: orderData.timestamp || new Date(),
    };

    setOrders((prev) => [frontendOrder, ...prev]);

    // 3. Trigger sync queue processing (fire-and-forget)
    SyncService.processQueue().catch((err) =>
      console.warn('[OrderContext] Sync queue processing failed:', err.message)
    );

    return frontendOrder;
  }, [currentUser]);

  // Get order by ID
  const getOrderById = useCallback((id) => {
    return orders.find((order) => order.id === id || order.backendId === id || order.localId === id);
  }, [orders]);

  // Get today's orders
  const getTodaysOrders = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return orders.filter((order) => {
      const orderDate = new Date(order.createdAt);
      orderDate.setHours(0, 0, 0, 0);
      return orderDate.getTime() === today.getTime();
    });
  }, [orders]);

  // Get order statistics
  const getOrderStats = useCallback(() => {
    const todaysOrders = getTodaysOrders();
    const completedOrders = orders.filter((order) => order.status === 'completed');
    const cancelledOrders = orders.filter((order) => order.status === 'cancelled');

    const todaysSales = todaysOrders
      .filter((order) => order.status === 'completed')
      .reduce((sum, order) => sum + order.total, 0);

    const totalRevenue = completedOrders.reduce((sum, order) => sum + order.total, 0);
    const totalItems = completedOrders.reduce((sum, order) => {
      return sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0);
    }, 0);

    return {
      todaysOrders: todaysOrders.length,
      todaysSales,
      totalOrders: orders.length,
      completedOrders: completedOrders.length,
      cancelledOrders: cancelledOrders.length,
      totalRevenue,
      totalItems,
    };
  }, [orders, getTodaysOrders]);

  // Update order status
  const updateOrderStatus = useCallback((orderId, status) => {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId
          ? { ...order, status, updatedAt: new Date() }
          : order
      )
    );
  }, []);

  // Cancel order with reason
  const cancelOrder = useCallback((orderId, reason = '') => {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId
          ? {
              ...order,
              status: 'cancelled',
              cancelReason: reason,
              cancelledAt: new Date(),
              updatedAt: new Date(),
            }
          : order
      )
    );
  }, []);

  // Search orders by transaction ID or customer name
  const searchOrders = useCallback((query) => {
    if (!query) return orders;
    const searchLower = query.toLowerCase();
    return orders.filter(
      (order) =>
        order.id?.toLowerCase().includes(searchLower) ||
        order.customerName?.toLowerCase().includes(searchLower)
    );
  }, [orders]);

  // Filter orders by status
  const filterOrdersByStatus = useCallback((status) => {
    if (!status || status === 'all') return orders;
    return orders.filter((order) => order.status === status);
  }, [orders]);

  // Filter orders by date range
  const filterOrdersByDate = useCallback((startDate, endDate) => {
    return orders.filter((order) => {
      const orderDate = new Date(order.createdAt);
      if (startDate && orderDate < startDate) return false;
      if (endDate && orderDate > endDate) return false;
      return true;
    });
  }, [orders]);

  const value = {
    orders,
    isLoading,
    addOrder,
    fetchOrders,
    getOrderById,
    getTodaysOrders,
    getOrderStats,
    updateOrderStatus,
    cancelOrder,
    searchOrders,
    filterOrdersByStatus,
    filterOrdersByDate,
  };

  return (
    <OrderContext.Provider value={value}>
      {children}
    </OrderContext.Provider>
  );
}

export function useOrders() {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrders must be used within an OrderProvider');
  }
  return context;
}

export default OrderContext;
