import React, { useState, useRef, useCallback, useEffect } from "react";
import { View, Animated, StyleSheet, Dimensions, ActivityIndicator, Text, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { useAuth } from "../context/AuthContext";
import LoginScreen from "../screens/LoginScreen";
import POSScreen from "../screens/POSScreen";
import StoreScreen from "../screens/StoreScreen";
import InventoryScreen from "../screens/InventoryScreen";
import OrdersScreen from "../screens/OrdersScreen";
import ReportsScreen from "../screens/ReportsScreen";
import SettingsScreen from "../screens/SettingsScreen";
import AdminScreen from "../screens/AdminScreen";
import FloatingNav from "../components/FloatingNav";

const { width } = Dimensions.get('window');

const SCREEN_KEY = "@vendora_current_screen";

// Define which screens require authentication
const PROTECTED_SCREENS = ['POS', 'Inventory', 'Orders', 'Reports', 'Settings', 'Admin'];
const PUBLIC_SCREENS = ['Store'];

const SCREEN_ORDER = ['POS', 'Store', 'Inventory', 'Orders', 'Reports', 'Settings', 'Admin'];

const SCREENS = {
  POS: POSScreen,
  Store: StoreScreen,
  Inventory: InventoryScreen,
  Orders: OrdersScreen,
  Reports: ReportsScreen,
  Settings: SettingsScreen,
  Admin: AdminScreen,
};

export default function RootNavigator() {
  const { isAuthenticated, isLoading, isInitialized, currentUser } = useAuth();

  const [currentScreen, setCurrentScreen] = useState("Store");
  const [showLogin, setShowLogin] = useState(false);
  const [pendingScreen, setPendingScreen] = useState(null);
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Check if current screen requires auth
  const isProtectedScreen = PROTECTED_SCREENS.includes(currentScreen);

  // Load saved screen on mount
  useEffect(() => {
    const loadSavedScreen = async () => {
      try {
        const savedScreen = await AsyncStorage.getItem(SCREEN_KEY);
        if (savedScreen && SCREEN_ORDER.includes(savedScreen)) {
          // If saved screen is protected and user is not authenticated, stay on Store
          if (PROTECTED_SCREENS.includes(savedScreen) && !isAuthenticated) {
            return;
          }
          setCurrentScreen(savedScreen);
        }
      } catch (error) {
        console.log("Error loading saved screen:", error);
      }
    };

    if (isInitialized) {
      loadSavedScreen();
    }
  }, [isInitialized, isAuthenticated]);

  // Save screen when it changes
  useEffect(() => {
    const saveScreen = async () => {
      try {
        await AsyncStorage.setItem(SCREEN_KEY, currentScreen);
      } catch (error) {
        console.log("Error saving screen:", error);
      }
    };
    saveScreen();
  }, [currentScreen]);

  // Handle navigation when auth state changes
  useEffect(() => {
    if (isInitialized) {
      if (isAuthenticated && pendingScreen) {
        // User just logged in, navigate to pending screen
        handleNavigate(pendingScreen);
        setPendingScreen(null);
        setShowLogin(false);
      } else if (!isAuthenticated && isProtectedScreen) {
        // User logged out while on protected screen, go to Store
        setCurrentScreen("Store");
      }
    }
  }, [isAuthenticated, isInitialized]);

  const handleNavigate = useCallback((screenName) => {
    if (screenName === currentScreen && !showLogin) return;

    // Check if trying to access protected screen without auth
    if (PROTECTED_SCREENS.includes(screenName) && !isAuthenticated) {
      setPendingScreen(screenName);
      setShowLogin(true);
      return;
    }

    // Hide login if showing
    if (showLogin) {
      setShowLogin(false);
    }

    const currentIndex = SCREEN_ORDER.indexOf(currentScreen);
    const nextIndex = SCREEN_ORDER.indexOf(screenName);
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
  }, [currentScreen, showLogin, isAuthenticated]);

  const handleLoginSuccess = useCallback((user) => {
    // Navigate to pending screen or POS
    const targetScreen = pendingScreen || 'POS';
    setPendingScreen(null);
    setShowLogin(false);

    // Small delay to ensure state updates
    setTimeout(() => {
      handleNavigate(targetScreen);
    }, 100);
  }, [pendingScreen, handleNavigate]);

  const handleCancelLogin = useCallback(() => {
    setShowLogin(false);
    setPendingScreen(null);
    // If on a protected screen, go back to Store
    if (isProtectedScreen) {
      setCurrentScreen("Store");
    }
  }, [isProtectedScreen]);

  // Show loading screen while initializing
  if (!isInitialized || isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#9333ea" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // Show login screen if required
  if (showLogin) {
    return (
      <View style={styles.container}>
        <LoginScreen onLoginSuccess={handleLoginSuccess} />
      </View>
    );
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
  loadingContainer: {
    flex: 1,
    backgroundColor: '#1a1025',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#9ca3af',
    marginTop: 16,
    fontSize: 16,
  },
  backButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
});
