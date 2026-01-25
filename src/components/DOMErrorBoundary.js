import React from 'react';
import { View, Text } from 'react-native';

/**
 * Error Boundary that catches React 19 DOM reconciliation errors
 * specifically the "removeChild" error that occurs with react-native-web
 */
class DOMErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, retryCount: 0 };
  }

  static getDerivedStateFromError(error) {
    // Check if this is the specific removeChild DOM error
    const isRemoveChildError =
      error?.message?.includes('removeChild') ||
      error?.name === 'NotFoundError' ||
      error?.message?.includes('not a child of this node');

    if (isRemoveChildError) {
      return { hasError: true };
    }

    // For other errors, let them propagate
    throw error;
  }

  componentDidCatch(error, errorInfo) {
    // Log the error for debugging
    console.warn('DOMErrorBoundary caught error:', error?.message);

    // Auto-recover after a brief delay
    if (this.state.retryCount < 3) {
      setTimeout(() => {
        this.setState((prev) => ({
          hasError: false,
          retryCount: prev.retryCount + 1,
        }));
      }, 100);
    }
  }

  render() {
    if (this.state.hasError && this.state.retryCount >= 3) {
      // After 3 retries, show fallback UI
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1025' }}>
          <Text style={{ color: '#9ca3af', fontSize: 16 }}>
            Something went wrong. Please refresh.
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}

export default DOMErrorBoundary;
