import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useOrders } from '../context/OrderContext';
import { formatCurrency, formatDateTime } from '../utils/checkoutHelpers';
import OrderDetailModal from '../components/OrderDetailModal';

const STATUS_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
];

const STATUS_STYLES = {
  completed: {
    bg: 'bg-green-500/20',
    text: 'text-green-400',
    label: 'Completed',
  },
  cancelled: {
    bg: 'bg-red-500/20',
    text: 'text-red-400',
    label: 'Cancelled',
  },
  pending: {
    bg: 'bg-yellow-500/20',
    text: 'text-yellow-400',
    label: 'Pending',
  },
};

export default function OrdersScreen() {
  const { orders, getOrderStats, cancelOrder, searchOrders, filterOrdersByStatus } = useOrders();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetail, setShowOrderDetail] = useState(false);

  const stats = getOrderStats();

  // Filter and search orders
  const filteredOrders = useMemo(() => {
    let result = orders;

    // Apply status filter
    if (statusFilter !== 'all') {
      result = filterOrdersByStatus(statusFilter);
    }

    // Apply search
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      result = result.filter(
        (order) =>
          order.id.toLowerCase().includes(searchLower) ||
          order.customerName.toLowerCase().includes(searchLower)
      );
    }

    return result;
  }, [orders, statusFilter, searchQuery, filterOrdersByStatus]);

  const openOrderDetail = (order) => {
    setSelectedOrder(order);
    setShowOrderDetail(true);
  };

  const handleCancelOrder = (orderId, reason) => {
    cancelOrder(orderId, reason);
  };

  const renderOrderCard = ({ item: order }) => {
    const statusStyle = STATUS_STYLES[order.status] || STATUS_STYLES.completed;
    const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);

    return (
      <TouchableOpacity
        className="bg-vendora-card rounded-2xl p-4 mb-3 mx-4"
        onPress={() => openOrderDetail(order)}
        activeOpacity={0.8}
      >
        <View className="flex-row items-start justify-between mb-3">
          <View className="flex-1">
            <Text className="text-vendora-text font-semibold text-base">
              {order.id}
            </Text>
            <Text className="text-vendora-text-muted text-sm">
              {formatDateTime(new Date(order.createdAt))}
            </Text>
          </View>
          <View className={`px-3 py-1 rounded-lg ${statusStyle.bg}`}>
            <Text className={`text-xs font-semibold ${statusStyle.text}`}>
              {statusStyle.label}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center gap-3 mb-3">
          <View className="w-10 h-10 bg-vendora-input rounded-xl items-center justify-center">
            <Ionicons name="person-outline" size={20} color="#a855f7" />
          </View>
          <View className="flex-1">
            <Text className="text-vendora-text font-medium">
              {order.customerName}
            </Text>
            <Text className="text-vendora-text-muted text-sm">
              {totalItems} item{totalItems !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center justify-between pt-3 border-t border-vendora-border">
          <View className="flex-row items-center gap-2">
            <Ionicons
              name={
                order.paymentMethod === 'cash'
                  ? 'cash-outline'
                  : order.paymentMethod === 'card'
                  ? 'card-outline'
                  : 'wallet-outline'
              }
              size={16}
              color="#9ca3af"
            />
            <Text className="text-vendora-text-muted text-sm capitalize">
              {order.paymentMethod}
            </Text>
          </View>
          <Text className="text-vendora-purple-light font-bold text-lg">
            ₱ {formatCurrency(order.total)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-vendora-bg">
      {/* Header */}
      <View className="bg-vendora-card border-b border-vendora-border px-4 py-4">
        <Text className="text-vendora-text font-bold text-2xl mb-1">Orders</Text>
        <Text className="text-vendora-text-muted">Transaction history</Text>
      </View>

      {/* Stats Cards */}
      <View className="px-4 py-4">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 12 }}
        >
          {/* Today's Sales */}
          <View className="bg-vendora-card rounded-2xl p-4 w-40">
            <View className="w-10 h-10 bg-green-500/20 rounded-xl items-center justify-center mb-3">
              <Ionicons name="trending-up" size={20} color="#22c55e" />
            </View>
            <Text className="text-vendora-text-muted text-sm mb-1">Today's Sales</Text>
            <Text className="text-vendora-text font-bold text-xl">
              ₱ {formatCurrency(stats.todaysSales)}
            </Text>
          </View>

          {/* Today's Orders */}
          <View className="bg-vendora-card rounded-2xl p-4 w-40">
            <View className="w-10 h-10 bg-vendora-purple/20 rounded-xl items-center justify-center mb-3">
              <Ionicons name="receipt" size={20} color="#a855f7" />
            </View>
            <Text className="text-vendora-text-muted text-sm mb-1">Today's Orders</Text>
            <Text className="text-vendora-text font-bold text-xl">
              {stats.todaysOrders}
            </Text>
          </View>

          {/* Total Revenue */}
          <View className="bg-vendora-card rounded-2xl p-4 w-40">
            <View className="w-10 h-10 bg-blue-500/20 rounded-xl items-center justify-center mb-3">
              <Ionicons name="wallet" size={20} color="#3b82f6" />
            </View>
            <Text className="text-vendora-text-muted text-sm mb-1">Total Revenue</Text>
            <Text className="text-vendora-text font-bold text-xl">
              ₱ {formatCurrency(stats.totalRevenue)}
            </Text>
          </View>

          {/* Total Orders */}
          <View className="bg-vendora-card rounded-2xl p-4 w-40">
            <View className="w-10 h-10 bg-yellow-500/20 rounded-xl items-center justify-center mb-3">
              <Ionicons name="document-text" size={20} color="#eab308" />
            </View>
            <Text className="text-vendora-text-muted text-sm mb-1">Total Orders</Text>
            <Text className="text-vendora-text font-bold text-xl">
              {stats.totalOrders}
            </Text>
          </View>
        </ScrollView>
      </View>

      {/* Search & Filter */}
      <View className="px-4 pb-4">
        {/* Search Bar */}
        <View className="flex-row items-center gap-3 bg-vendora-card rounded-2xl px-4 py-3 mb-3">
          <Ionicons name="search" size={20} color="#a855f7" />
          <TextInput
            className="flex-1 text-vendora-text text-base"
            placeholder="Search by Order ID or Customer..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>

        {/* Status Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 10 }}
        >
          {STATUS_FILTERS.map((filter) => (
            <TouchableOpacity
              key={filter.id}
              className={`px-4 py-2.5 rounded-xl ${
                statusFilter === filter.id ? 'bg-vendora-purple' : 'bg-vendora-card'
              }`}
              onPress={() => setStatusFilter(filter.id)}
              style={statusFilter === filter.id
                ? (Platform.OS === 'web'
                  ? { boxShadow: '0px 2px 8px rgba(147, 51, 234, 0.3)' }
                  : { elevation: 4 })
                : {}}
            >
              <Text
                className={`font-medium ${
                  statusFilter === filter.id ? 'text-white' : 'text-vendora-text'
                }`}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Orders List */}
      <View className="flex-1">
        <View className="flex-row items-center justify-between px-4 mb-3">
          <Text className="text-vendora-text font-semibold">
            {filteredOrders.length} Order{filteredOrders.length !== 1 ? 's' : ''}
          </Text>
          <TouchableOpacity className="flex-row items-center gap-1">
            <Ionicons name="filter" size={16} color="#a855f7" />
            <Text className="text-vendora-purple-light text-sm">Sort</Text>
          </TouchableOpacity>
        </View>

        {filteredOrders.length > 0 ? (
          <FlatList
            data={filteredOrders}
            renderItem={renderOrderCard}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
          />
        ) : (
          <View className="flex-1 items-center justify-center px-4">
            <View className="w-24 h-24 bg-vendora-card rounded-full items-center justify-center mb-4">
              <Ionicons name="receipt-outline" size={48} color="#6b7280" />
            </View>
            <Text className="text-vendora-text font-semibold text-lg mb-1">
              No orders found
            </Text>
            <Text className="text-vendora-text-muted text-center">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your search or filter'
                : 'Completed transactions will appear here'}
            </Text>
          </View>
        )}
      </View>

      {/* Order Detail Modal */}
      <OrderDetailModal
        visible={showOrderDetail}
        onClose={() => {
          setShowOrderDetail(false);
          setSelectedOrder(null);
        }}
        order={selectedOrder}
        onCancelOrder={handleCancelOrder}
      />
    </SafeAreaView>
  );
}
