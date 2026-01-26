import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Modal,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useOrders } from '../context/OrderContext';

const { width } = Dimensions.get('window');
const isWide = width >= 768;

const STATUS_COLORS = {
  completed: '#10b981',
  pending: '#f59e0b',
  cancelled: '#ef4444',
  processing: '#3b82f6',
};

const STATUS_ICONS = {
  completed: 'checkmark-circle',
  pending: 'time',
  cancelled: 'close-circle',
  processing: 'refresh-circle',
};

export default function SalesScreen() {
  const { orders } = useOrders();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  const filteredOrders = useMemo(() => {
    let filtered = [...orders];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (order) =>
          (order.id || '').toString().includes(query) ||
          (order.order_number || '').toLowerCase().includes(query) ||
          (order.customer_name || order.customerName || '').toLowerCase().includes(query)
      );
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(
        (order) => (order.status || 'pending').toLowerCase() === filterStatus
      );
    }

    // Date filter
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    if (dateFilter === 'today') {
      filtered = filtered.filter((order) => {
        const orderDate = new Date(order.created_at || order.createdAt);
        orderDate.setHours(0, 0, 0, 0);
        return orderDate.getTime() === today.getTime();
      });
    } else if (dateFilter === 'week') {
      filtered = filtered.filter((order) => {
        const orderDate = new Date(order.created_at || order.createdAt);
        return orderDate >= weekAgo;
      });
    } else if (dateFilter === 'month') {
      filtered = filtered.filter((order) => {
        const orderDate = new Date(order.created_at || order.createdAt);
        return orderDate >= monthAgo;
      });
    }

    // Sort by date (newest first)
    filtered.sort(
      (a, b) =>
        new Date(b.created_at || b.createdAt) - new Date(a.created_at || a.createdAt)
    );

    return filtered;
  }, [orders, searchQuery, filterStatus, dateFilter]);

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const formatCurrency = (amount) => {
    return `₱${(amount || 0).toLocaleString('en-PH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const openOrderDetail = (order) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  const FilterButton = ({ label, value, active, onPress }) => (
    <TouchableOpacity
      className={`px-4 py-2 rounded-full mr-2 ${
        active ? 'bg-vendora-purple' : 'bg-vendora-input'
      }`}
      onPress={onPress}
    >
      <Text className={`text-sm font-medium ${active ? 'text-white' : 'text-vendora-text-muted'}`}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const OrderCard = ({ order }) => {
    const status = (order.status || 'pending').toLowerCase();
    const statusColor = STATUS_COLORS[status] || '#9ca3af';
    const statusIcon = STATUS_ICONS[status] || 'help-circle';

    return (
      <TouchableOpacity
        className="bg-vendora-card rounded-xl p-4 mb-3"
        style={
          Platform.OS === 'web'
            ? { boxShadow: '0px 2px 6px rgba(0,0,0,0.15)' }
            : { elevation: 3 }
        }
        onPress={() => openOrderDetail(order)}
        activeOpacity={0.7}
      >
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center">
            <View className="w-10 h-10 rounded-full bg-vendora-purple/20 items-center justify-center mr-3">
              <Ionicons name="receipt-outline" size={20} color="#a855f7" />
            </View>
            <View>
              <Text className="text-vendora-text font-semibold">
                Order #{order.id || order.order_number}
              </Text>
              <Text className="text-vendora-text-muted text-xs">
                {formatDate(order.created_at || order.createdAt)}
              </Text>
            </View>
          </View>
          <View
            className="flex-row items-center px-3 py-1 rounded-full"
            style={{ backgroundColor: `${statusColor}20` }}
          >
            <Ionicons name={statusIcon} size={14} color={statusColor} />
            <Text className="text-xs font-medium ml-1 capitalize" style={{ color: statusColor }}>
              {status}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-vendora-text-muted text-xs">Customer</Text>
            <Text className="text-vendora-text">
              {order.customer_name || order.customerName || 'Walk-in Customer'}
            </Text>
          </View>
          <View className="items-end">
            <Text className="text-vendora-text-muted text-xs">Total</Text>
            <Text className="text-vendora-purple text-lg font-bold">
              {formatCurrency(order.total || order.totalAmount)}
            </Text>
          </View>
        </View>

        {order.items && order.items.length > 0 ? (
          <View className="mt-3 pt-3 border-t border-vendora-border">
            <Text className="text-vendora-text-muted text-xs">
              {order.items.length} item(s)
            </Text>
          </View>
        ) : null}
      </TouchableOpacity>
    );
  };

  const totalSales = filteredOrders
    .filter((o) => (o.status || 'pending').toLowerCase() === 'completed')
    .reduce((sum, order) => sum + (order.total || order.totalAmount || 0), 0);

  return (
    <SafeAreaView className="flex-1 bg-vendora-bg" edges={['top']}>
      {/* Header */}
      <View className="px-4 pt-4 pb-2">
        <Text className="text-vendora-text text-2xl font-bold">Sales</Text>
        <Text className="text-vendora-text-muted">
          Manage and track your sales transactions
        </Text>
      </View>

      {/* Summary Card */}
      <View className="px-4 mb-4">
        <View
          className="bg-gradient-to-r from-vendora-purple to-purple-600 rounded-xl p-4"
          style={[
            { backgroundColor: '#7c3aed' },
            Platform.OS === 'web'
              ? { boxShadow: '0px 4px 12px rgba(147, 51, 234, 0.3)' }
              : { elevation: 5 },
          ]}
        >
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-purple-200 text-sm">Total Sales (Filtered)</Text>
              <Text className="text-white text-2xl font-bold mt-1">
                {formatCurrency(totalSales)}
              </Text>
              <Text className="text-purple-200 text-xs mt-1">
                {filteredOrders.length} transaction(s)
              </Text>
            </View>
            <View className="w-14 h-14 rounded-full bg-white/20 items-center justify-center">
              <Ionicons name="trending-up" size={28} color="#fff" />
            </View>
          </View>
        </View>
      </View>

      {/* Search */}
      <View className="px-4 mb-3">
        <View className="flex-row items-center bg-vendora-input rounded-xl px-4 py-3">
          <Ionicons name="search" size={20} color="#9ca3af" />
          <TextInput
            className="flex-1 text-vendora-text ml-3"
            placeholder="Search orders..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#9ca3af" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Filters */}
      <View className="px-4 mb-3">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <FilterButton
            label="All"
            active={dateFilter === 'all'}
            onPress={() => setDateFilter('all')}
          />
          <FilterButton
            label="Today"
            active={dateFilter === 'today'}
            onPress={() => setDateFilter('today')}
          />
          <FilterButton
            label="This Week"
            active={dateFilter === 'week'}
            onPress={() => setDateFilter('week')}
          />
          <FilterButton
            label="This Month"
            active={dateFilter === 'month'}
            onPress={() => setDateFilter('month')}
          />
        </ScrollView>
      </View>

      <View className="px-4 mb-3">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <FilterButton
            label="All Status"
            active={filterStatus === 'all'}
            onPress={() => setFilterStatus('all')}
          />
          <FilterButton
            label="Completed"
            active={filterStatus === 'completed'}
            onPress={() => setFilterStatus('completed')}
          />
          <FilterButton
            label="Pending"
            active={filterStatus === 'pending'}
            onPress={() => setFilterStatus('pending')}
          />
          <FilterButton
            label="Cancelled"
            active={filterStatus === 'cancelled'}
            onPress={() => setFilterStatus('cancelled')}
          />
        </ScrollView>
      </View>

      {/* Orders List */}
      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#a855f7" />
        }
      >
        {filteredOrders.length > 0 ? (
          filteredOrders.map((order, index) => (
            <OrderCard key={order.id || index} order={order} />
          ))
        ) : (
          <View className="flex-1 items-center justify-center py-12">
            <Ionicons name="receipt-outline" size={60} color="#4b5563" />
            <Text className="text-vendora-text-muted text-lg mt-4">No sales found</Text>
            <Text className="text-vendora-text-muted text-sm mt-1">
              {searchQuery || filterStatus !== 'all' || dateFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Start selling to see your transactions here'}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Order Detail Modal */}
      <Modal
        visible={showDetailModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-vendora-bg rounded-t-3xl max-h-[80%]">
            <View className="flex-row items-center justify-between p-4 border-b border-vendora-border">
              <Text className="text-vendora-text text-xl font-bold">
                Order Details
              </Text>
              <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                <Ionicons name="close" size={24} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            {selectedOrder ? (
              <ScrollView className="p-4">
                <View className="mb-4">
                  <Text className="text-vendora-text-muted text-sm">Order Number</Text>
                  <Text className="text-vendora-text text-lg font-semibold">
                    #{selectedOrder.id || selectedOrder.order_number}
                  </Text>
                </View>

                <View className="flex-row mb-4">
                  <View className="flex-1">
                    <Text className="text-vendora-text-muted text-sm">Date</Text>
                    <Text className="text-vendora-text">
                      {formatDate(selectedOrder.created_at || selectedOrder.createdAt)}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-vendora-text-muted text-sm">Status</Text>
                    <Text
                      className="font-medium capitalize"
                      style={{
                        color: STATUS_COLORS[(selectedOrder.status || 'pending').toLowerCase()],
                      }}
                    >
                      {selectedOrder.status || 'Pending'}
                    </Text>
                  </View>
                </View>

                <View className="mb-4">
                  <Text className="text-vendora-text-muted text-sm">Customer</Text>
                  <Text className="text-vendora-text">
                    {selectedOrder.customer_name || selectedOrder.customerName || 'Walk-in Customer'}
                  </Text>
                </View>

                {selectedOrder.items && selectedOrder.items.length > 0 ? (
                  <View className="mb-4">
                    <Text className="text-vendora-text-muted text-sm mb-2">Items</Text>
                    {selectedOrder.items.map((item, index) => (
                      <View
                        key={index}
                        className="flex-row justify-between py-2 border-b border-vendora-border"
                      >
                        <View className="flex-1">
                          <Text className="text-vendora-text">{item.name || item.product_name}</Text>
                          <Text className="text-vendora-text-muted text-xs">
                            Qty: {item.quantity}
                          </Text>
                        </View>
                        <Text className="text-vendora-text">
                          {formatCurrency(item.price * item.quantity)}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : null}

                <View className="bg-vendora-input rounded-xl p-4 mb-4">
                  <View className="flex-row justify-between mb-2">
                    <Text className="text-vendora-text-muted">Subtotal</Text>
                    <Text className="text-vendora-text">
                      {formatCurrency(selectedOrder.subtotal || selectedOrder.total || selectedOrder.totalAmount)}
                    </Text>
                  </View>
                  {selectedOrder.discount ? (
                    <View className="flex-row justify-between mb-2">
                      <Text className="text-vendora-text-muted">Discount</Text>
                      <Text className="text-green-500">
                        -{formatCurrency(selectedOrder.discount)}
                      </Text>
                    </View>
                  ) : null}
                  {selectedOrder.tax ? (
                    <View className="flex-row justify-between mb-2">
                      <Text className="text-vendora-text-muted">Tax</Text>
                      <Text className="text-vendora-text">
                        {formatCurrency(selectedOrder.tax)}
                      </Text>
                    </View>
                  ) : null}
                  <View className="flex-row justify-between pt-2 border-t border-vendora-border">
                    <Text className="text-vendora-text font-semibold">Total</Text>
                    <Text className="text-vendora-purple text-lg font-bold">
                      {formatCurrency(selectedOrder.total || selectedOrder.totalAmount)}
                    </Text>
                  </View>
                </View>
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
