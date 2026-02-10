import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Platform,
  Text,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

// Navigation item configuration with icons
const NAV_ITEM_CONFIG = {
  POS: { icon: 'cart-outline', activeIcon: 'cart', label: 'POS' },
  Dashboard: { icon: 'grid-outline', activeIcon: 'grid', label: 'Dashboard' },
  Sales: { icon: 'trending-up-outline', activeIcon: 'trending-up', label: 'Sales' },
  Inventory: { icon: 'cube-outline', activeIcon: 'cube', label: 'Inventory' },
  Ledger: { icon: 'book-outline', activeIcon: 'book', label: 'Ledger' },
  Products: { icon: 'pricetag-outline', activeIcon: 'pricetag', label: 'Products' },
  Orders: { icon: 'receipt-outline', activeIcon: 'receipt', label: 'Orders' },
  Reports: { icon: 'bar-chart-outline', activeIcon: 'bar-chart', label: 'Reports' },
  Settings: { icon: 'settings-outline', activeIcon: 'settings', label: 'Settings' },
  Store: { icon: 'storefront-outline', activeIcon: 'storefront', label: 'Store' },
  Admin: { icon: 'shield-outline', activeIcon: 'shield', label: 'Admin' },
};

export default function FloatingNav({
  currentScreen,
  onNavigate,
  isAuthenticated,
  currentUser,
  availableScreens = [],
}) {
  const { logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);
  const animation = useRef(new Animated.Value(0)).current;
  const fabOpacity = useRef(new Animated.Value(0.4)).current;
  const fadeTimeout = useRef(null);

  // Build navigation items from available screens
  const navItems = useMemo(() => {
    return availableScreens
      .map((screenName) => {
        const config = NAV_ITEM_CONFIG[screenName];
        if (!config) return null;
        return {
          name: screenName,
          ...config,
        };
      })
      .filter(Boolean);
  }, [availableScreens]);

  // Fade out FAB after inactivity
  useEffect(() => {
    if (!isOpen) {
      fadeTimeout.current = setTimeout(() => {
        Animated.timing(fabOpacity, {
          toValue: 0.4,
          duration: 300,
          useNativeDriver: Platform.OS !== 'web',
        }).start();
      }, 2000);
    } else {
      // Keep visible while open
      Animated.timing(fabOpacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: Platform.OS !== 'web',
      }).start();
    }

    return () => {
      if (fadeTimeout.current) {
        clearTimeout(fadeTimeout.current);
      }
    };
  }, [isOpen]);

  const openMenu = () => {
    setIsOpen(true);
    Animated.spring(animation, {
      toValue: 1,
      friction: 6,
      tension: 40,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  };

  const closeMenu = () => {
    Animated.spring(animation, {
      toValue: 0,
      friction: 6,
      tension: 40,
      useNativeDriver: Platform.OS !== 'web',
    }).start(() => {
      setIsOpen(false);
    });
  };

  const handleFabPress = () => {
    // Make FAB fully visible when pressed
    Animated.timing(fabOpacity, {
      toValue: 1,
      duration: 150,
      useNativeDriver: Platform.OS !== 'web',
    }).start();

    if (isOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  };

  const handleNavPress = (screenName) => {
    onNavigate(screenName);
    closeMenu();
  };

  const handleLogout = async () => {
    closeMenu();
    await logout();
  };

  const rotation = animation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  // Calculate the base offset (start above the FAB)
  const baseOffset = 70;
  // Calculate spacing between items
  const itemSpacing = 55;

  return (
    <>
      {/* Backdrop */}
      {isOpen ? (
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={closeMenu}
        />
      ) : null}

      {/* Navigation Items */}
      {isOpen ? (
        <View style={styles.navItemsContainer}>
          {/* Logout button at the top */}
          {isAuthenticated ? (
            <Animated.View
              style={[
                styles.navItem,
                {
                  transform: [
                    {
                      translateY: animation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -(baseOffset + navItems.length * itemSpacing)],
                      }),
                    },
                    {
                      scale: animation.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [0, 0.5, 1],
                      }),
                    },
                  ],
                  opacity: animation.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0, 0, 1],
                  }),
                },
              ]}
            >
              {Platform.OS === 'web' && hoveredItem === 'logout' ? (
                <View style={styles.tooltip}>
                  <Text style={styles.tooltipText}>Logout</Text>
                </View>
              ) : null}
              <TouchableOpacity
                style={[styles.navButton, styles.logoutButton]}
                onPress={handleLogout}
                activeOpacity={0.8}
                {...(Platform.OS === 'web' && {
                  onMouseEnter: () => setHoveredItem('logout'),
                  onMouseLeave: () => setHoveredItem(null),
                })}
              >
                <Ionicons name="log-out-outline" size={24} color="#ef4444" />
              </TouchableOpacity>
            </Animated.View>
          ) : null}

          {/* Navigation items */}
          {navItems.map((item, index) => {
            const translateY = animation.interpolate({
              inputRange: [0, 1],
              outputRange: [0, -(baseOffset + index * itemSpacing)],
            });

            const scale = animation.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [0, 0.5, 1],
            });

            const itemOpacity = animation.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [0, 0, 1],
            });

            const isActive = currentScreen === item.name;
            const isHovered = hoveredItem === item.name;

            return (
              <Animated.View
                key={item.name}
                style={[
                  styles.navItem,
                  {
                    transform: [{ translateY }, { scale }],
                    opacity: itemOpacity,
                  },
                ]}
              >
                {/* Tooltip label */}
                {Platform.OS === 'web' && isHovered ? (
                  <View style={styles.tooltip}>
                    <Text style={styles.tooltipText}>{item.label}</Text>
                  </View>
                ) : null}
                <TouchableOpacity
                  style={[
                    styles.navButton,
                    isActive && styles.navButtonActive,
                  ]}
                  onPress={() => handleNavPress(item.name)}
                  activeOpacity={0.8}
                  {...(Platform.OS === 'web' && {
                    onMouseEnter: () => setHoveredItem(item.name),
                    onMouseLeave: () => setHoveredItem(null),
                  })}
                >
                  <Ionicons
                    name={isActive ? item.activeIcon : item.icon}
                    size={24}
                    color={isActive ? '#fff' : '#a855f7'}
                  />
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>
      ) : null}

      {/* Main FAB Button with User Badge */}
      <Animated.View style={[styles.fabContainer, { opacity: fabOpacity }]}>
        <View style={styles.fabRow}>
          {/* User Badge */}
          {isAuthenticated && currentUser ? (
            <View style={styles.userBadge}>
              <View style={styles.userAvatar}>
                <Ionicons name="person" size={14} color="#a855f7" />
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName} numberOfLines={1}>
                  {currentUser.name || currentUser.email?.split('@')[0] || 'User'}
                </Text>
                <Text style={styles.userRole} numberOfLines={1}>
                  {currentUser.role ? currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1) : ''}
                </Text>
              </View>
            </View>
          ) : null}

          {/* FAB Button */}
          <TouchableOpacity
            style={styles.fab}
            onPress={handleFabPress}
            activeOpacity={0.9}
          >
            <Animated.View style={{ transform: [{ rotate: rotation }] }}>
              <Ionicons
                name={isOpen ? 'close' : 'apps'}
                size={28}
                color="#fff"
              />
            </Animated.View>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 998,
  },
  navItemsContainer: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 60,
    alignItems: 'center',
    zIndex: 999,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    zIndex: 1000,
  },
  fabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  userBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2d1f3d',
    paddingVertical: 8,
    paddingLeft: 8,
    paddingRight: 14,
    borderRadius: 25,
    gap: 8,
    borderWidth: 1,
    borderColor: '#4a3660',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0px 3px 10px rgba(0,0,0,0.3)' }
      : { elevation: 6 }),
  },
  userAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#3d2a52',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#a855f7',
  },
  userInfo: {
    maxWidth: 100,
  },
  userName: {
    color: '#e5e5e5',
    fontSize: 13,
    fontWeight: '600',
  },
  userRole: {
    color: '#a855f7',
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#a855f7',
    justifyContent: 'center',
    alignItems: 'center',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0px 4px 12px rgba(147, 51, 234, 0.4)' }
      : { elevation: 10 }),
  },
  navItem: {
    position: 'absolute',
    bottom: 0,
    left: 5,
  },
  navButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#2d1f3d',
    justifyContent: 'center',
    alignItems: 'center',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0px 3px 8px rgba(0,0,0,0.3)' }
      : { elevation: 5 }),
    borderWidth: 2,
    borderColor: '#4a3660',
  },
  navButtonActive: {
    backgroundColor: '#a855f7',
    borderColor: '#a855f7',
  },
  logoutButton: {
    borderColor: '#ef4444',
    backgroundColor: '#2d1f3d',
  },
  tooltip: {
    position: 'absolute',
    right: 60,
    backgroundColor: '#2d1f3d',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#4a3660',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0px 2px 8px rgba(0,0,0,0.3)' }
      : { elevation: 5 }),
  },
  tooltipText: {
    color: '#e5e5e5',
    fontSize: 13,
    fontWeight: '500',
    whiteSpace: 'nowrap',
  },
});
