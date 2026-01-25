import React, { useEffect, useRef } from 'react';
import { Animated, Text, View, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function Toast({ visible, message, type = 'success', onHide, duration = 3000 }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (visible) {
      // Animate in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto hide after duration
      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onHide) onHide();
    });
  };

  if (!visible) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          bg: '#22c55e',
          icon: 'checkmark-circle',
        };
      case 'error':
        return {
          bg: '#ef4444',
          icon: 'close-circle',
        };
      case 'warning':
        return {
          bg: '#eab308',
          icon: 'warning',
        };
      case 'info':
        return {
          bg: '#3b82f6',
          icon: 'information-circle',
        };
      default:
        return {
          bg: '#22c55e',
          icon: 'checkmark-circle',
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: Platform.OS === 'ios' ? 60 : 40,
        left: 16,
        right: 16,
        zIndex: 9999,
        opacity: fadeAnim,
        transform: [{ translateY }],
      }}
    >
      <View
        style={{
          backgroundColor: styles.bg,
          borderRadius: 12,
          paddingVertical: 14,
          paddingHorizontal: 16,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          ...(Platform.OS === 'web'
            ? { boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.3)' }
            : { elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 }),
        }}
      >
        <Ionicons name={styles.icon} size={24} color="#fff" />
        <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600', flex: 1 }}>
          {message}
        </Text>
      </View>
    </Animated.View>
  );
}
