import React, { createContext, useContext, useState, useCallback } from 'react';

const OrderContext = createContext();

// Sample order data
const today = new Date();
const yesterday = new Date(today);
yesterday.setDate(yesterday.getDate() - 1);
const twoDaysAgo = new Date(today);
twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
const threeDaysAgo = new Date(today);
threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

const INITIAL_ORDERS = [
  {
    id: 'TXN-20260116-A1B2',
    transactionId: 'TXN-20260116-A1B2',
    status: 'completed',
    createdAt: new Date(today.setHours(10, 30, 0)),
    customerName: 'Maria Santos',
    items: [
      { id: 1, name: 'Premium Rice 5kg', sku: 'GR-1001', unit: 'bag', price: 1250, quantity: 2 },
      { id: 2, name: 'Cooking Oil 1L', sku: 'GR-1020', unit: 'bottle', price: 160, quantity: 3 },
    ],
    subtotal: 2980,
    discount: 0,
    discountLabel: 'None',
    tax: 357.60,
    taxRate: 12,
    total: 3337.60,
    paymentMethod: 'cash',
    amountTendered: 3500,
    change: 162.40,
    vatExempt: false,
  },
  {
    id: 'TXN-20260116-C3D4',
    transactionId: 'TXN-20260116-C3D4',
    status: 'completed',
    createdAt: new Date(today.setHours(9, 15, 0)),
    customerName: 'Juan Dela Cruz',
    items: [
      { id: 4, name: 'Cement 40kg', sku: 'HW-2001', unit: 'bag', price: 360, quantity: 5 },
      { id: 6, name: 'Nails Assorted', sku: 'HW-3102', unit: 'pack', price: 55, quantity: 2 },
    ],
    subtotal: 1910,
    discount: 382,
    discountLabel: 'Senior Citizen',
    discountPreset: 'senior',
    tax: 0,
    taxRate: 0,
    total: 1528,
    paymentMethod: 'cash',
    amountTendered: 1600,
    change: 72,
    vatExempt: true,
  },
  {
    id: 'TXN-20260115-E5F6',
    transactionId: 'TXN-20260115-E5F6',
    status: 'completed',
    createdAt: new Date(yesterday.setHours(14, 45, 0)),
    customerName: 'Ana Reyes',
    items: [
      { id: 3, name: 'Laundry Detergent 1kg', sku: 'GR-1201', unit: 'pack', price: 150, quantity: 4 },
      { id: 2, name: 'Cooking Oil 1L', sku: 'GR-1020', unit: 'bottle', price: 160, quantity: 2 },
    ],
    subtotal: 920,
    discount: 0,
    discountLabel: 'None',
    tax: 110.40,
    taxRate: 12,
    total: 1030.40,
    paymentMethod: 'card',
    amountTendered: 1030.40,
    change: 0,
    vatExempt: false,
  },
  {
    id: 'TXN-20260115-G7H8',
    transactionId: 'TXN-20260115-G7H8',
    status: 'cancelled',
    createdAt: new Date(yesterday.setHours(11, 20, 0)),
    customerName: 'Pedro Garcia',
    items: [
      { id: 7, name: 'Screwdriver Set', sku: 'HW-0902', unit: 'set', price: 260, quantity: 1 },
      { id: 5, name: 'PVC Pipe 1 inch', sku: 'HW-1023', unit: 'pc', price: 95, quantity: 3 },
    ],
    subtotal: 545,
    discount: 0,
    discountLabel: 'None',
    tax: 65.40,
    taxRate: 12,
    total: 610.40,
    paymentMethod: 'cash',
    amountTendered: 700,
    change: 89.60,
    vatExempt: false,
    cancelReason: 'Customer changed mind',
    cancelledAt: new Date(yesterday.setHours(11, 35, 0)),
  },
  {
    id: 'TXN-20260114-I9J0',
    transactionId: 'TXN-20260114-I9J0',
    status: 'completed',
    createdAt: new Date(twoDaysAgo.setHours(16, 0, 0)),
    customerName: 'Rosa Mendoza',
    items: [
      { id: 1, name: 'Premium Rice 5kg', sku: 'GR-1001', unit: 'bag', price: 1250, quantity: 1 },
      { id: 3, name: 'Laundry Detergent 1kg', sku: 'GR-1201', unit: 'pack', price: 150, quantity: 2 },
    ],
    subtotal: 1550,
    discount: 155,
    discountLabel: 'Employee',
    discountPreset: 'employee',
    tax: 167.40,
    taxRate: 12,
    total: 1562.40,
    paymentMethod: 'ewallet',
    amountTendered: 1562.40,
    change: 0,
    vatExempt: false,
  },
  {
    id: 'TXN-20260113-K1L2',
    transactionId: 'TXN-20260113-K1L2',
    status: 'completed',
    createdAt: new Date(threeDaysAgo.setHours(13, 30, 0)),
    customerName: 'Walk-in Customer',
    items: [
      { id: 8, name: 'General Item', sku: 'GN-0001', unit: 'pc', price: 99, quantity: 5 },
    ],
    subtotal: 495,
    discount: 0,
    discountLabel: 'None',
    tax: 59.40,
    taxRate: 12,
    total: 554.40,
    paymentMethod: 'cash',
    amountTendered: 600,
    change: 45.60,
    vatExempt: false,
  },
];

export function OrderProvider({ children }) {
  const [orders, setOrders] = useState(INITIAL_ORDERS);

  // Add a new order after checkout
  const addOrder = useCallback((orderData) => {
    const order = {
      ...orderData,
      id: orderData.transactionId,
      status: 'completed',
      createdAt: orderData.timestamp || new Date(),
    };
    setOrders((prev) => [order, ...prev]);
    return order;
  }, []);

  // Get order by ID
  const getOrderById = useCallback((id) => {
    return orders.find((order) => order.id === id);
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
    const today = new Date();
    today.setHours(0, 0, 0, 0);

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
        order.id.toLowerCase().includes(searchLower) ||
        order.customerName.toLowerCase().includes(searchLower)
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
    addOrder,
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
