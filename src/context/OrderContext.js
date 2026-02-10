import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import orderService from '../services/orderService';
import { useAuth } from './AuthContext';

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
    transactionId: order.order_number || `ORD-${order.id}`,
    status: order.status,
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

export function OrderProvider({ children }) {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch orders from backend
  const fetchOrders = useCallback(async (params = {}) => {
    try {
      setIsLoading(true);
      const response = await orderService.getOrders({
        per_page: 50,
        ...params,
      });

      const backendOrders = (response.data || []).map(mapBackendOrder);
      setOrders(backendOrders);
      return backendOrders;
    } catch (err) {
      console.error('Error fetching orders:', err);
      return orders;
    } finally {
      setIsLoading(false);
    }
  }, [orders]);

  // Load orders when user is authenticated
  useEffect(() => {
    if (currentUser) {
      fetchOrders();
    } else {
      setOrders([]);
    }
  }, [currentUser]);

  // Add a new order via backend API, then create payment
  const addOrder = useCallback(async (orderData) => {
    // Build items array for backend
    const items = (orderData.items || []).map((item) => ({
      product_id: item.id,
      quantity: item.quantity,
    }));

    // Derive ordered_at from checkout data
    const orderedAt = orderData.timestamp
      ? new Date(orderData.timestamp).toISOString()
      : new Date().toISOString();

    // 1. Create order on backend
    const orderResponse = await orderService.createOrder({
      customer_id: orderData.customerId || null,
      ordered_at: orderedAt,
      status: 'completed',
      items,
    });

    const createdOrder = orderResponse.data;

    // 2. Create payment on backend
    const paymentAmount = Math.round((orderData.total || 0) * 100);

    await orderService.createPayment({
      order_id: createdOrder.id,
      paid_at: orderedAt,
      amount: paymentAmount,
      method: mapPaymentMethod(orderData.paymentMethod),
      status: 'completed',
    });

    // 3. Add to local state for immediate UI update
    const frontendOrder = {
      ...orderData,
      id: createdOrder.order_number || `ORD-${createdOrder.id}`,
      backendId: createdOrder.id,
      transactionId: orderData.transactionId || createdOrder.order_number,
      status: 'completed',
      createdAt: orderData.timestamp || new Date(),
    };

    setOrders((prev) => [frontendOrder, ...prev]);
    return frontendOrder;
  }, []);

  // Get order by ID
  const getOrderById = useCallback((id) => {
    return orders.find((order) => order.id === id || order.backendId === id);
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
