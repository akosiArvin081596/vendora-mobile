import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Alert, AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const SAVED_CARTS_KEY = '@vendora_saved_carts';
const ABANDONED_CART_KEY = '@vendora_abandoned_cart';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [savedCarts, setSavedCarts] = useState([]);
  const [abandonedCart, setAbandonedCart] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved carts from AsyncStorage on mount
  useEffect(() => {
    const loadSavedCarts = async () => {
      try {
        const storedCarts = await AsyncStorage.getItem(SAVED_CARTS_KEY);
        if (storedCarts) {
          setSavedCarts(JSON.parse(storedCarts));
        }

        // Check for abandoned cart
        const storedAbandoned = await AsyncStorage.getItem(ABANDONED_CART_KEY);
        if (storedAbandoned) {
          const abandoned = JSON.parse(storedAbandoned);
          if (abandoned.items && abandoned.items.length > 0) {
            setAbandonedCart(abandoned);
          }
        }
      } catch (error) {
        console.error('Error loading saved carts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSavedCarts();
  }, []);

  // Persist saved carts to AsyncStorage whenever they change
  useEffect(() => {
    if (!isLoading) {
      AsyncStorage.setItem(SAVED_CARTS_KEY, JSON.stringify(savedCarts)).catch((error) => {
        console.error('Error saving carts:', error);
      });
    }
  }, [savedCarts, isLoading]);

  // Auto-save cart when app goes to background
  useEffect(() => {
    const saveAbandonedCart = async () => {
      if (cart.length > 0) {
        const abandoned = {
          items: cart,
          abandonedAt: new Date().toISOString(),
          customerId: 'guest',
        };
        try {
          await AsyncStorage.setItem(ABANDONED_CART_KEY, JSON.stringify(abandoned));
        } catch (error) {
          console.error('Error saving abandoned cart:', error);
        }
      }
    };

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        saveAbandonedCart();
      }
    });

    return () => {
      subscription?.remove();
    };
  }, [cart]);

  // Add item to cart
  const addToCart = useCallback((product, products, variantSku = null, variantOption = null) => {
    const currentProduct = products?.find((p) => p.id === product.id) || product;
    let currentStock = currentProduct.stock;
    let itemPrice = product.price;

    // Handle variant stock
    if (variantSku && currentProduct.hasVariants && currentProduct.variants) {
      const variant = currentProduct.variants.find(v => v.sku === variantSku);
      if (variant) {
        currentStock = variant.stock;
        itemPrice = variant.price;
      }
    }

    setCart((prevCart) => {
      const cartItemId = variantSku ? `${product.id}-${variantSku}` : product.id;
      const existing = prevCart.find((item) =>
        variantSku ? item.variantSku === variantSku : item.id === product.id && !item.variantSku
      );

      if (existing) {
        if (existing.quantity >= currentStock) {
          Alert.alert('Stock Limit', 'Maximum stock reached');
          return prevCart;
        }
        return prevCart.map((item) =>
          (variantSku ? item.variantSku === variantSku : item.id === product.id && !item.variantSku)
            ? { ...item, quantity: item.quantity + 1, stock: currentStock }
            : item
        );
      }

      if (currentStock <= 0) {
        Alert.alert('Out of Stock', 'This product is out of stock');
        return prevCart;
      }

      return [...prevCart, {
        ...product,
        id: product.id,
        cartItemId,
        variantSku,
        variantOption,
        price: itemPrice,
        stock: currentStock,
        quantity: 1,
      }];
    });
  }, []);

  // Update item quantity
  const updateQuantity = useCallback((productId, change, products, variantSku = null) => {
    const currentProduct = products?.find((p) => p.id === productId);

    setCart((prevCart) => {
      return prevCart
        .map((item) => {
          const isMatch = variantSku
            ? item.variantSku === variantSku
            : item.id === productId && !item.variantSku;

          if (isMatch) {
            let currentStock = currentProduct ? currentProduct.stock : item.stock;

            // Handle variant stock
            if (variantSku && currentProduct?.hasVariants && currentProduct?.variants) {
              const variant = currentProduct.variants.find(v => v.sku === variantSku);
              if (variant) {
                currentStock = variant.stock;
              }
            }

            const newQty = item.quantity + change;
            if (newQty <= 0) return null;
            if (newQty > currentStock) {
              Alert.alert('Stock Limit', 'Maximum stock reached');
              return item;
            }
            return { ...item, quantity: newQty, stock: currentStock };
          }
          return item;
        })
        .filter(Boolean);
    });
  }, []);

  // Remove item from cart
  const removeFromCart = useCallback((productId, variantSku = null) => {
    setCart((prevCart) => prevCart.filter((item) =>
      variantSku
        ? item.variantSku !== variantSku
        : !(item.id === productId && !item.variantSku)
    ));
  }, []);

  // Clear cart
  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  // Save current cart
  const saveCart = useCallback((name, customerId = 'guest') => {
    if (cart.length === 0) {
      Alert.alert('Empty Cart', 'Add items to cart before saving');
      return false;
    }

    const newSavedCart = {
      id: `saved-${Date.now()}`,
      customerId,
      name,
      items: cart.map(item => ({
        id: item.id,
        name: item.name,
        sku: item.sku,
        variantSku: item.variantSku,
        variantOption: item.variantOption,
        price: item.price,
        quantity: item.quantity,
        unit: item.unit,
      })),
      savedAt: new Date().toISOString(),
      itemCount: cart.reduce((sum, item) => sum + item.quantity, 0),
      totalValue: cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    };

    setSavedCarts(prev => [newSavedCart, ...prev]);
    return true;
  }, [cart]);

  // Load saved cart (replace current cart)
  const loadCart = useCallback((savedCartId, products) => {
    const savedCart = savedCarts.find(sc => sc.id === savedCartId);
    if (!savedCart) return false;

    const loadedItems = savedCart.items.map(item => {
      const currentProduct = products?.find(p => p.id === item.id);
      let currentStock = currentProduct?.stock || 0;

      // Handle variant stock
      if (item.variantSku && currentProduct?.hasVariants && currentProduct?.variants) {
        const variant = currentProduct.variants.find(v => v.sku === item.variantSku);
        if (variant) {
          currentStock = variant.stock;
        }
      }

      return {
        ...item,
        stock: currentStock,
        quantity: Math.min(item.quantity, currentStock),
        image: currentProduct?.image,
        category: currentProduct?.category,
      };
    }).filter(item => item.quantity > 0);

    setCart(loadedItems);
    return true;
  }, [savedCarts]);

  // Merge saved cart with current cart
  const mergeCart = useCallback((savedCartId, products) => {
    const savedCart = savedCarts.find(sc => sc.id === savedCartId);
    if (!savedCart) return false;

    savedCart.items.forEach(item => {
      const currentProduct = products?.find(p => p.id === item.id);
      if (currentProduct) {
        for (let i = 0; i < item.quantity; i++) {
          addToCart(currentProduct, products, item.variantSku, item.variantOption);
        }
      }
    });

    return true;
  }, [savedCarts, addToCart]);

  // Delete saved cart
  const deleteSavedCart = useCallback((savedCartId) => {
    setSavedCarts(prev => prev.filter(sc => sc.id !== savedCartId));
  }, []);

  // Get cart quantity for a specific product
  const getCartQuantity = useCallback((productId, variantSku = null) => {
    const item = cart.find((i) =>
      variantSku
        ? i.variantSku === variantSku
        : i.id === productId && !i.variantSku
    );
    return item ? item.quantity : 0;
  }, [cart]);

  // Restore abandoned cart
  const restoreAbandonedCart = useCallback((products) => {
    if (!abandonedCart || !abandonedCart.items) return false;

    const restoredItems = abandonedCart.items.map(item => {
      const currentProduct = products?.find(p => p.id === item.id);
      let currentStock = currentProduct?.stock || 0;

      // Handle variant stock
      if (item.variantSku && currentProduct?.hasVariants && currentProduct?.variants) {
        const variant = currentProduct.variants.find(v => v.sku === item.variantSku);
        if (variant) {
          currentStock = variant.stock;
        }
      }

      return {
        ...item,
        stock: currentStock,
        quantity: Math.min(item.quantity, currentStock),
        image: currentProduct?.image,
        category: currentProduct?.category,
      };
    }).filter(item => item.quantity > 0);

    setCart(restoredItems);
    clearAbandonedCart();
    return true;
  }, [abandonedCart]);

  // Clear abandoned cart
  const clearAbandonedCart = useCallback(async () => {
    setAbandonedCart(null);
    try {
      await AsyncStorage.removeItem(ABANDONED_CART_KEY);
    } catch (error) {
      console.error('Error clearing abandoned cart:', error);
    }
  }, []);

  // Cart totals
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const value = {
    cart,
    setCart,
    savedCarts,
    abandonedCart,
    isLoading,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    saveCart,
    loadCart,
    mergeCart,
    deleteSavedCart,
    getCartQuantity,
    restoreAbandonedCart,
    clearAbandonedCart,
    totalItems,
    subtotal,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

export default CartContext;
