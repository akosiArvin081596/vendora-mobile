import React from 'react';
import { TouchableOpacity, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function PaymentMethodCard({ icon, label, selected, onSelect, disabled }) {
  return (
    <TouchableOpacity
      className={`flex-1 items-center p-4 rounded-2xl border-2 ${
        selected
          ? 'bg-vendora-purple/20 border-vendora-purple'
          : 'bg-vendora-input border-transparent'
      } ${disabled ? 'opacity-50' : ''}`}
      onPress={onSelect}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <View
        className={`w-12 h-12 rounded-full items-center justify-center mb-2 ${
          selected ? 'bg-vendora-purple' : 'bg-vendora-card'
        }`}
      >
        <Ionicons
          name={icon}
          size={24}
          color={selected ? '#fff' : '#a855f7'}
        />
      </View>
      <Text
        className={`font-medium text-sm ${
          selected ? 'text-vendora-purple-light' : 'text-vendora-text'
        }`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}
