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
import { PERMISSIONS } from '../utils/permissions';

const NAV_ITEMS = [
  { name: 'POS', icon: 'cart-outline', activeIcon: 'cart', permission: PERMISSIONS.POS_ACCESS },
  { name: 'Store', icon: 'storefront-outline', activeIcon: 'storefront', permission: null }, // Public
  { name: 'Inventory', icon: 'cube-outline', activeIcon: 'cube', permission: PERMISSIONS.INVENTORY_ACCESS },
  { name: 'Orders', icon: 'receipt-outline', activeIcon: 'receipt', permission: PERMISSIONS.ORDERS_ACCESS },
  { name: 'Reports', icon: 'bar-chart-outline', activeIcon: 'bar-chart', permission: PERMISSIONS.REPORTS_ACCESS },
  { name: 'Settings', icon: 'settings-outline', activeIcon: 'settings', permission: null }, // Public
  { name: 'Admin', icon: 'shield-outline', activeIcon: 'shield', permission: PERMISSIONS.ADMIN_PANEL_ACCESS },
];

export default function FloatingNav({ currentScreen, onNavigate }) {
  const { checkPermission, isAuthenticated, currentUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);
  const animation = useRef(new Animated.Value(0)).current;
  const fabOpacity = useRef(new Animated.Value(0.4)).current;
  const fadeTimeout = useRef(null);

  // Filter nav items based on user permissions
  const visibleNavItems = useMemo(() => {
    return NAV_ITEMS.filter((item) => {
      // If no permission required, show to everyone
      if (!item.permission) return true;
      // If user is not authenticated, hide permission-gated items
      if (!isAuthenticated) return false;
      // Check if user has the required permission
      return checkPermission(item.permission);
    });
  }, [isAuthenticated, checkPermission]);

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

  const rotation = animation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

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
          {visibleNavItems.map((item, index) => {
            const translateY = animation.interpolate({
              inputRange: [0, 1],
              outputRange: [0, -(70 + index * 60)],
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
                    <Text style={styles.tooltipText}>{item.name}</Text>
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
              <Text style={styles.userName} numberOfLines={1}>
                {currentUser.name || currentUser.email?.split('@')[0] || 'User'}
              </Text>
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
    backgroundColor: 'transparent',
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
  userName: {
    color: '#e5e5e5',
    fontSize: 13,
    fontWeight: '600',
    maxWidth: 100,
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
