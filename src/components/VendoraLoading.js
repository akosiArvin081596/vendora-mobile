import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * Branded loading screen with Vendora logo and text
 * Shows a pulsing logo animation instead of a spinner
 */
export default function VendoraLoading({ message = null }) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    // Pulse animation for the logo
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );

    // Fade animation for the tagline
    const fade = Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0.5,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    pulse.start();
    fade.start();

    return () => {
      pulse.stop();
      fade.stop();
    };
  }, [pulseAnim, fadeAnim]);

  return (
    <View style={styles.container}>
      {/* Logo Container */}
      <Animated.View
        style={[
          styles.logoContainer,
          { transform: [{ scale: pulseAnim }] },
        ]}
      >
        {/* Outer ring */}
        <View style={styles.outerRing}>
          {/* Inner circle with icon */}
          <View style={styles.innerCircle}>
            <Text style={styles.logoLetter}>V</Text>
          </View>
        </View>

        {/* Decorative shopping bag icon */}
        <View style={styles.iconBadge}>
          <Ionicons name="bag-handle" size={18} color="#fff" />
        </View>
      </Animated.View>

      {/* Brand Name */}
      <Text style={styles.brandName}>Vendora</Text>

      {/* Tagline or custom message */}
      <Animated.Text style={[styles.tagline, { opacity: fadeAnim }]}>
        {message || 'Your marketplace awaits'}
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f14',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    position: 'relative',
    marginBottom: 24,
  },
  outerRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'transparent',
    borderWidth: 3,
    borderColor: '#a855f7',
    alignItems: 'center',
    justifyContent: 'center',
    // Gradient effect with shadow
    shadowColor: '#a855f7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  innerCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#1a1a24',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#2a2a3a',
  },
  logoLetter: {
    fontSize: 42,
    fontWeight: '700',
    color: '#a855f7',
    // Text shadow for glow effect
    textShadowColor: '#a855f7',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  iconBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#a855f7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#0f0f14',
    // Shadow
    shadowColor: '#a855f7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 5,
  },
  brandName: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 2,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 14,
    color: '#9ca3af',
    letterSpacing: 0.5,
  },
});
