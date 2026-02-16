import React from 'react';
import { View } from 'react-native';

/**
 * Small colored dot indicating entity sync status.
 * - green: synced
 * - yellow: pending sync
 * - red: failed/dead
 *
 * @param {'synced'|'pending'|'failed'|'dead'} status
 * @param {number} size - Dot diameter in pixels (default 8)
 */
export default function SyncIndicatorBadge({ status = 'synced', size = 8 }) {
  const getColor = () => {
    switch (status) {
      case 'pending':
        return '#eab308'; // yellow
      case 'failed':
      case 'dead':
        return '#ef4444'; // red
      case 'synced':
      default:
        return '#22c55e'; // green
    }
  };

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: getColor(),
      }}
    />
  );
}
