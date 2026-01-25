import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ActionSheet({ visible, onClose, title, options }) {
  const isVisible = Boolean(visible);
  if (!isVisible) return null;

  return (
    <View style={styles.overlay}>
      <TouchableOpacity
        style={styles.backdrop}
        onPress={onClose}
        activeOpacity={1}
      />

      <View style={styles.sheet}>
        {/* Drag Handle */}
        <TouchableOpacity style={styles.handleContainer} onPress={onClose}>
          <View style={styles.handle} />
        </TouchableOpacity>

        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{title}</Text>
        </View>

        {/* Options */}
        <View style={styles.optionsContainer}>
          {options.map((option, index) => {
            const isDisabled = Boolean(option.disabled);
            return (
              <TouchableOpacity
                key={option.id || index}
                style={[
                  styles.optionButton,
                  isDisabled && styles.optionDisabled,
                ]}
                onPress={() => {
                  if (!isDisabled && option.onPress) {
                    option.onPress();
                  }
                }}
                disabled={isDisabled}
                activeOpacity={isDisabled ? 1 : 0.7}
              >
                <View
                  style={[
                    styles.iconContainer,
                    isDisabled && styles.iconContainerDisabled,
                  ]}
                >
                  <Ionicons
                    name={option.icon}
                    size={22}
                    color={isDisabled ? '#6b7280' : '#a855f7'}
                  />
                </View>
                <View style={styles.optionTextContainer}>
                  <Text
                    style={[
                      styles.optionLabel,
                      isDisabled && styles.optionLabelDisabled,
                    ]}
                  >
                    {option.label}
                  </Text>
                  {option.subtitle && (
                    <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
                  )}
                </View>
                {isDisabled ? (
                  <View style={styles.soonBadge}>
                    <Text style={styles.soonText}>Soon</Text>
                  </View>
                ) : (
                  <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Cancel Button */}
        <View style={styles.cancelContainer}>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  sheet: {
    backgroundColor: '#2d1f3d',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handle: {
    width: 48,
    height: 6,
    backgroundColor: '#4a3660',
    borderRadius: 3,
  },
  titleContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#4a3660',
  },
  title: {
    color: '#e5e5e5',
    fontSize: 18,
    fontWeight: '600',
  },
  optionsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#3d2a52',
    borderRadius: 12,
    marginBottom: 8,
  },
  optionDisabled: {
    opacity: 0.5,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(147, 51, 234, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconContainerDisabled: {
    backgroundColor: '#2d1f3d',
  },
  optionTextContainer: {
    flex: 1,
  },
  optionLabel: {
    color: '#e5e5e5',
    fontSize: 16,
    fontWeight: '500',
  },
  optionLabelDisabled: {
    color: '#9ca3af',
  },
  optionSubtitle: {
    color: '#9ca3af',
    fontSize: 13,
    marginTop: 2,
  },
  soonBadge: {
    backgroundColor: '#2d1f3d',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  soonText: {
    color: '#9ca3af',
    fontSize: 12,
  },
  cancelContainer: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    paddingTop: 8,
  },
  cancelButton: {
    backgroundColor: '#1a1025',
    paddingVertical: 16,
    borderRadius: 12,
  },
  cancelText: {
    color: '#e5e5e5',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
});
