import React, { useState, useRef, useCallback, useEffect } from "react";
import { View, Animated, StyleSheet, Dimensions, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import VendoraLoading from "../components/VendoraLoading";

import { useAuth, ROLES } from "../context/AuthContext";
import LoginScreen from "../screens/LoginScreen";
import POSScreen from "../screens/POSScreen";
import DashboardScreen from "../screens/DashboardScreen";
import SalesScreen from "../screens/SalesScreen";
import InventoryScreen from "../screens/InventoryScreen";
import ProductsScreen from "../screens/ProductsScreen";
import OrdersScreen from "../screens/OrdersScreen";
import ReportsScreen from "../screens/ReportsScreen";
import SettingsScreen from "../screens/SettingsScreen";
import StoreScreen from "../screens/StoreScreen";
import AdminScreen from "../screens/AdminScreen";
import FloatingNav from "../components/FloatingNav";

const { width } = Dimensions.get('window');

const SCREEN_KEY = "@vendora_current_screen";

// All available screens
const SCREENS = {
  POS: POSScreen,
  Dashboard: DashboardScreen,
  Sales: SalesScreen,
  Inventory: InventoryScreen,
  Products: ProductsScreen,
  Orders: OrdersScreen,
  Reports: ReportsScreen,
  Settings: SettingsScreen,
  Store: StoreScreen,
  Admin: AdminScreen,
};

// Screen order for vendor navigation (POS-focused)
const VENDOR_SCREEN_ORDER = ['POS', 'Dashboard', 'Sales', 'Inventory', 'Products', 'Settings'];

// Screen order for admin navigation (all screens)
const ADMIN_SCREEN_ORDER = ['Admin', 'POS', 'Dashboard', 'Sales', 'Inventory', 'Products', 'Orders', 'Reports', 'Settings', 'Store'];

// Default screen order (all screens)
const ALL_SCREEN_ORDER = ['POS', 'Dashboard', 'Sales', 'Store', 'Inventory', 'Products', 'Orders', 'Reports', 'Settings', 'Admin'];

// Get screen order based on user role
const getScreenOrderForRole = (role) => {
  if (!role) return ['Store']; // Unauthenticated users only see Store

  const normalizedRole = typeof role === 'string' ? role.toLowerCase() : role;

  switch (normalizedRole) {
    case ROLES.ADMIN:
      return ADMIN_SCREEN_ORDER;
    case ROLES.VENDOR:
      return VENDOR_SCREEN_ORDER;
    case ROLES.MANAGER:
      return ADMIN_SCREEN_ORDER;
    case ROLES.CASHIER:
      return ['POS', 'Sales', 'Orders', 'Settings'];
    case ROLES.CUSTOMER:
      return ['Store'];
    default:
      return ALL_SCREEN_ORDER;
  }
};

// Get default screen after login based on role
const getDefaultScreenForRole = (role) => {
  if (!role) return 'Store';

  const normalizedRole = typeof role === 'string' ? role.toLowerCase() : role;

  switch (normalizedRole) {
    case ROLES.ADMIN:
      return 'Admin';
    case ROLES.VENDOR:
      return 'POS';
    case ROLES.MANAGER:
      return 'Admin';
    case ROLES.CASHIER:
      return 'POS';
    case ROLES.CUSTOMER:
      return 'Store';
    default:
      return 'POS';
  }
};

export default function RootNavigator() {
  const { isAuthenticated, isLoading, isInitialized, currentUser } = useAuth();

  const [currentScreen, setCurrentScreen] = useState(null);
  const [hasLoggedInOnce, setHasLoggedInOnce] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Get available screens based on user role
  const availableScreens = getScreenOrderForRole(currentUser?.role);

  // Load saved screen on mount and when auth changes
  useEffect(() => {
    const loadSavedScreen = async () => {
      try {
        const savedScreen = await AsyncStorage.getItem(SCREEN_KEY);

        if (isAuthenticated && currentUser) {
          // User is logged in
          setHasLoggedInOnce(true);

          // Check if saved screen is available for this user's role
          if (savedScreen && availableScreens.includes(savedScreen)) {
            setCurrentScreen(savedScreen);
          } else {
            // Navigate to default screen for role
            const defaultScreen = getDefaultScreenForRole(currentUser.role);
            setCurrentScreen(defaultScreen);
          }
        } else {
          // Not authenticated - show nothing (login screen will be shown)
          setCurrentScreen(null);
        }
      } catch (error) {
        console.log("Error loading saved screen:", error);
        setCurrentScreen(null);
      }
    };

    if (isInitialized) {
      loadSavedScreen();
    }
  }, [isInitialized, isAuthenticated, currentUser?.role]);

  // Save screen when it changes
  useEffect(() => {
    const saveScreen = async () => {
      if (currentScreen) {
        try {
          await AsyncStorage.setItem(SCREEN_KEY, currentScreen);
        } catch (error) {
          console.log("Error saving screen:", error);
        }
      }
    };
    saveScreen();
  }, [currentScreen]);

  const handleNavigate = useCallback((screenName) => {
    if (screenName === currentScreen) return;

    // Only allow navigation to screens available for the user's role
    if (!availableScreens.includes(screenName)) {
      console.log(`Screen ${screenName} not available for role ${currentUser?.role}`);
      return;
    }

    const currentIndex = availableScreens.indexOf(currentScreen);
    const nextIndex = availableScreens.indexOf(screenName);
    const direction = nextIndex > currentIndex ? -1 : 1;

    // Set starting position for new screen
    slideAnim.setValue(direction * -width);

    // Update screen immediately
    setCurrentScreen(screenName);

    // Slide in
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 400,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [currentScreen, availableScreens, currentUser?.role]);

  const handleLoginSuccess = useCallback((user) => {
    setHasLoggedInOnce(true);
    // Navigate to default screen for the user's role
    const defaultScreen = getDefaultScreenForRole(user?.role);

    // Small delay to ensure state updates
    setTimeout(() => {
      setCurrentScreen(defaultScreen);
    }, 100);
  }, []);

  // Show loading screen while initializing
  if (!isInitialized || isLoading) {
    return <VendoraLoading message="Loading..." />;
  }

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <LoginScreen onLoginSuccess={handleLoginSuccess} />
      </View>
    );
  }

  // Don't render anything until we have a screen to show
  if (!currentScreen) {
    return <VendoraLoading message="Preparing your dashboard..." />;
  }

  const CurrentScreenComponent = SCREENS[currentScreen];

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.screenContainer,
          { transform: [{ translateX: slideAnim }] }
        ]}
      >
        <CurrentScreenComponent />
      </Animated.View>

      <FloatingNav
        currentScreen={currentScreen}
        onNavigate={handleNavigate}
        isAuthenticated={isAuthenticated}
        currentUser={currentUser}
        availableScreens={availableScreens}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1025',
  },
  screenContainer: {
    flex: 1,
  },
});
