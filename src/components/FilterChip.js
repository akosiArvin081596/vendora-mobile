import React from 'react';
import { TouchableOpacity, Text, View, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function FilterChip({ icon, label, active, onPress }) {
  return (
    <TouchableOpacity
      className={`flex-row items-center gap-2 px-4 py-3 rounded-2xl ${
        active ? 'bg-vendora-purple' : 'bg-vendora-input'
      }`}
      onPress={onPress}
      style={
        active
          ? (Platform.OS === 'web'
            ? { boxShadow: '0px 2px 8px rgba(147, 51, 234, 0.2)' }
            : { elevation: 4 })
          : {}
      }
    >
      <Ionicons
        name={icon}
        size={20}
        color={active ? '#fff' : '#a855f7'}
      />
      <Text
        className={`font-medium text-sm ${
          active ? 'text-white' : 'text-vendora-text'
        }`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}
