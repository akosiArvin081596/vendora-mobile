import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import NetInfo from '@react-native-community/netinfo';

const NetworkContext = createContext();

export function NetworkProvider({ children }) {
  const [isOnline, setIsOnline] = useState(true);
  const [connectionType, setConnectionType] = useState(null);
  const prevOnline = useRef(true);
  const _onReconnectCallbacks = useRef([]);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const online = state.isConnected && state.isInternetReachable !== false;
      setIsOnline(online);
      setConnectionType(state.type);

      // Detect offline → online transition
      if (online && !prevOnline.current) {
        console.log('[Network] Reconnected — triggering sync.');
        _onReconnectCallbacks.current.forEach((cb) => cb());
      }

      prevOnline.current = online;
    });

    return () => unsubscribe();
  }, []);

  const onReconnect = useCallback((callback) => {
    _onReconnectCallbacks.current.push(callback);
    return () => {
      _onReconnectCallbacks.current = _onReconnectCallbacks.current.filter((cb) => cb !== callback);
    };
  }, []);

  const value = {
    isOnline,
    connectionType,
    onReconnect,
  };

  return <NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>;
}

export function useNetwork() {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
}
