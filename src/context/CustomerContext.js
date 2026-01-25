import React, { createContext, useContext, useState, useCallback } from 'react';

const CustomerContext = createContext();

// Sample customers with loyalty points
const INITIAL_CUSTOMERS = [
  {
    id: 1,
    name: 'Maria Santos',
    phone: '09171234567',
    email: 'maria.santos@email.com',
    loyaltyPoints: 250,
    totalSpent: 12500,
    orderCount: 15,
    memberSince: new Date('2025-06-15'),
    tier: 'gold',
  },
  {
    id: 2,
    name: 'Juan Dela Cruz',
    phone: '09189876543',
    email: 'juan.dc@email.com',
    loyaltyPoints: 180,
    totalSpent: 8900,
    orderCount: 10,
    memberSince: new Date('2025-08-20'),
    tier: 'silver',
  },
  {
    id: 3,
    name: 'Ana Reyes',
    phone: '09201112233',
    email: 'ana.reyes@email.com',
    loyaltyPoints: 420,
    totalSpent: 21000,
    orderCount: 25,
    memberSince: new Date('2025-03-10'),
    tier: 'platinum',
  },
  {
    id: 4,
    name: 'Pedro Garcia',
    phone: '09334445566',
    email: null,
    loyaltyPoints: 50,
    totalSpent: 2500,
    orderCount: 3,
    memberSince: new Date('2025-12-01'),
    tier: 'bronze',
  },
];

// Loyalty tiers configuration
export const LOYALTY_TIERS = {
  bronze: { name: 'Bronze', minPoints: 0, pointsMultiplier: 1, color: '#cd7f32' },
  silver: { name: 'Silver', minPoints: 100, pointsMultiplier: 1.25, color: '#c0c0c0' },
  gold: { name: 'Gold', minPoints: 200, pointsMultiplier: 1.5, color: '#ffd700' },
  platinum: { name: 'Platinum', minPoints: 400, pointsMultiplier: 2, color: '#e5e4e2' },
};

// Points earned per peso spent
const POINTS_PER_PESO = 0.01; // 1 point per 100 pesos

export function CustomerProvider({ children }) {
  const [customers, setCustomers] = useState(INITIAL_CUSTOMERS);
  const [currentCustomer, setCurrentCustomer] = useState(null);
  const [recentlyViewed, setRecentlyViewed] = useState([]);

  // Get customer by ID
  const getCustomerById = useCallback((id) => {
    return customers.find((c) => c.id === id);
  }, [customers]);

  // Search customers
  const searchCustomers = useCallback((query) => {
    if (!query) return customers;
    const searchLower = query.toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(searchLower) ||
        c.phone.includes(query) ||
        (c.email && c.email.toLowerCase().includes(searchLower))
    );
  }, [customers]);

  // Add new customer
  const addCustomer = useCallback((customerData) => {
    const newCustomer = {
      ...customerData,
      id: Math.max(...customers.map((c) => c.id), 0) + 1,
      loyaltyPoints: 0,
      totalSpent: 0,
      orderCount: 0,
      memberSince: new Date(),
      tier: 'bronze',
    };
    setCustomers((prev) => [...prev, newCustomer]);
    return newCustomer;
  }, [customers]);

  // Update customer
  const updateCustomer = useCallback((customerId, updates) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === customerId ? { ...c, ...updates } : c))
    );
  }, []);

  // Calculate tier based on points
  const calculateTier = (points) => {
    if (points >= LOYALTY_TIERS.platinum.minPoints) return 'platinum';
    if (points >= LOYALTY_TIERS.gold.minPoints) return 'gold';
    if (points >= LOYALTY_TIERS.silver.minPoints) return 'silver';
    return 'bronze';
  };

  // Add loyalty points after purchase
  const addLoyaltyPoints = useCallback((customerId, purchaseAmount) => {
    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === customerId) {
          const tierConfig = LOYALTY_TIERS[c.tier];
          const basePoints = Math.floor(purchaseAmount * POINTS_PER_PESO);
          const earnedPoints = Math.floor(basePoints * tierConfig.pointsMultiplier);
          const newPoints = c.loyaltyPoints + earnedPoints;
          const newTier = calculateTier(newPoints);
          return {
            ...c,
            loyaltyPoints: newPoints,
            totalSpent: c.totalSpent + purchaseAmount,
            orderCount: c.orderCount + 1,
            tier: newTier,
          };
        }
        return c;
      })
    );
  }, []);

  // Redeem loyalty points
  const redeemPoints = useCallback((customerId, points) => {
    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === customerId && c.loyaltyPoints >= points) {
          const newPoints = c.loyaltyPoints - points;
          return {
            ...c,
            loyaltyPoints: newPoints,
            tier: calculateTier(newPoints),
          };
        }
        return c;
      })
    );
  }, []);

  // Convert points to peso discount (10 points = 1 peso)
  const pointsToPeso = (points) => points / 10;
  const pesoToPoints = (peso) => peso * 10;

  // Select current customer for transaction
  const selectCustomer = useCallback((customer) => {
    setCurrentCustomer(customer);
  }, []);

  // Clear current customer
  const clearCurrentCustomer = useCallback(() => {
    setCurrentCustomer(null);
  }, []);

  // Track recently viewed products
  const addRecentlyViewed = useCallback((productId) => {
    setRecentlyViewed((prev) => {
      const filtered = prev.filter((id) => id !== productId);
      return [productId, ...filtered].slice(0, 10); // Keep last 10
    });
  }, []);

  // Clear recently viewed
  const clearRecentlyViewed = useCallback(() => {
    setRecentlyViewed([]);
  }, []);

  const value = {
    customers,
    currentCustomer,
    recentlyViewed,
    getCustomerById,
    searchCustomers,
    addCustomer,
    updateCustomer,
    addLoyaltyPoints,
    redeemPoints,
    pointsToPeso,
    pesoToPoints,
    selectCustomer,
    clearCurrentCustomer,
    addRecentlyViewed,
    clearRecentlyViewed,
    LOYALTY_TIERS,
  };

  return (
    <CustomerContext.Provider value={value}>
      {children}
    </CustomerContext.Provider>
  );
}

export function useCustomers() {
  const context = useContext(CustomerContext);
  if (!context) {
    throw new Error('useCustomers must be used within a CustomerProvider');
  }
  return context;
}

export default CustomerContext;
