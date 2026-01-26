import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useOrder } from '../context/OrderContext';
import { useProduct } from '../context/ProductContext';

const { width } = Dimensions.get('window');
const isWide = width >= 768;

export default function DashboardScreen() {
  const { currentUser } = useAuth();
  const { orders } = useOrder();
  const { userInventory } = useProduct();
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    todaySales: 0,
    totalOrders: 0,
    lowStockItems: 0,
    totalProducts: 0,
  });

  useEffect(() => {
    calculateStats();
  }, [orders, userInventory]);

  const calculateStats = () => {
    const today = new Date().toDateString();

    // Calculate today's sales
    const todayOrders = orders.filter(
      (order) => new Date(order.created_at || order.createdAt).toDateString() === today
    );
    const todaySales = todayOrders.reduce(
      (sum, order) => sum + (order.total || order.totalAmount || 0),
      0
    );

    // Count low stock items (less than 10 units)
    const lowStockItems = userInventory.filter(
      (product) => (product.stock || product.quantity || 0) < 10
    ).length;

    setStats({
      todaySales,
      totalOrders: orders.length,
      lowStockItems,
      totalProducts: userInventory.length,
    });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    calculateStats();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const formatCurrency = (amount) => {
    return `₱${(amount || 0).toLocaleString('en-PH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const StatCard = ({ title, value, icon, color, subtitle }) => (
    <View
      className="bg-vendora-card rounded-2xl p-4 flex-1 min-w-[140px]"
      style={
        Platform.OS === 'web'
          ? { boxShadow: '0px 2px 8px rgba(0,0,0,0.2)' }
          : { elevation: 4 }
      }
    >
      <View className="flex-row items-center justify-between mb-3">
        <View
          className="w-10 h-10 rounded-xl items-center justify-center"
          style={{ backgroundColor: `${color}20` }}
        >
          <Ionicons name={icon} size={22} color={color} />
        </View>
      </View>
      <Text className="text-vendora-text text-2xl font-bold">{value}</Text>
      <Text className="text-vendora-text-muted text-sm mt-1">{title}</Text>
      {subtitle ? (
        <Text className="text-vendora-text-muted text-xs mt-1">{subtitle}</Text>
      ) : null}
    </View>
  );

  const QuickAction = ({ title, icon, onPress, color }) => (
    <TouchableOpacity
      className="bg-vendora-card rounded-xl p-4 items-center justify-center"
      style={[
        { minWidth: 100 },
        Platform.OS === 'web'
          ? { boxShadow: '0px 2px 6px rgba(0,0,0,0.15)' }
          : { elevation: 3 },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View
        className="w-12 h-12 rounded-full items-center justify-center mb-2"
        style={{ backgroundColor: `${color}20` }}
      >
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text className="text-vendora-text text-sm font-medium text-center">
        {title}
      </Text>
    </TouchableOpacity>
  );

  const RecentOrder = ({ order }) => (
    <View className="bg-vendora-input rounded-xl p-3 mb-2 flex-row items-center justify-between">
      <View className="flex-row items-center flex-1">
        <View className="w-10 h-10 rounded-full bg-vendora-purple/20 items-center justify-center mr-3">
          <Ionicons name="receipt-outline" size={18} color="#a855f7" />
        </View>
        <View className="flex-1">
          <Text className="text-vendora-text font-medium" numberOfLines={1}>
            Order #{order.id || order.order_number}
          </Text>
          <Text className="text-vendora-text-muted text-xs">
            {new Date(order.created_at || order.createdAt).toLocaleString()}
          </Text>
        </View>
      </View>
      <Text className="text-vendora-purple font-semibold">
        {formatCurrency(order.total || order.totalAmount)}
      </Text>
    </View>
  );

  const recentOrders = orders.slice(0, 5);

  return (
    <SafeAreaView className="flex-1 bg-vendora-bg" edges={['top']}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#a855f7"
          />
        }
      >
        {/* Header */}
        <View className="mb-6">
          <Text className="text-vendora-text text-2xl font-bold">
            Welcome back, {currentUser?.name || 'Vendor'}!
          </Text>
          <Text className="text-vendora-text-muted mt-1">
            Here's your business overview
          </Text>
        </View>

        {/* Stats Grid */}
        <View className={`flex-row flex-wrap gap-3 mb-6 ${isWide ? 'gap-4' : ''}`}>
          <StatCard
            title="Today's Sales"
            value={formatCurrency(stats.todaySales)}
            icon="cash-outline"
            color="#10b981"
          />
          <StatCard
            title="Total Orders"
            value={stats.totalOrders}
            icon="receipt-outline"
            color="#3b82f6"
          />
          <StatCard
            title="Low Stock"
            value={stats.lowStockItems}
            icon="warning-outline"
            color="#f59e0b"
            subtitle="Items need restock"
          />
          <StatCard
            title="Products"
            value={stats.totalProducts}
            icon="cube-outline"
            color="#8b5cf6"
          />
        </View>

        {/* Quick Actions */}
        <View className="mb-6">
          <Text className="text-vendora-text text-lg font-semibold mb-3">
            Quick Actions
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-3">
              <QuickAction
                title="New Sale"
                icon="cart-outline"
                color="#10b981"
                onPress={() => {}}
              />
              <QuickAction
                title="Add Product"
                icon="add-circle-outline"
                color="#3b82f6"
                onPress={() => {}}
              />
              <QuickAction
                title="View Reports"
                icon="bar-chart-outline"
                color="#8b5cf6"
                onPress={() => {}}
              />
              <QuickAction
                title="Manage Stock"
                icon="cube-outline"
                color="#f59e0b"
                onPress={() => {}}
              />
            </View>
          </ScrollView>
        </View>

        {/* Recent Orders */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-vendora-text text-lg font-semibold">
              Recent Orders
            </Text>
            <TouchableOpacity>
              <Text className="text-vendora-purple text-sm">View All</Text>
            </TouchableOpacity>
          </View>
          {recentOrders.length > 0 ? (
            recentOrders.map((order, index) => (
              <RecentOrder key={order.id || index} order={order} />
            ))
          ) : (
            <View className="bg-vendora-input rounded-xl p-6 items-center">
              <Ionicons name="receipt-outline" size={40} color="#6b7280" />
              <Text className="text-vendora-text-muted mt-2">No orders yet</Text>
            </View>
          )}
        </View>

        {/* Low Stock Alert */}
        {stats.lowStockItems > 0 ? (
          <View className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
            <View className="flex-row items-center">
              <Ionicons name="warning" size={24} color="#f59e0b" />
              <View className="ml-3 flex-1">
                <Text className="text-amber-400 font-semibold">
                  Low Stock Alert
                </Text>
                <Text className="text-amber-400/80 text-sm">
                  {stats.lowStockItems} item(s) are running low on stock
                </Text>
              </View>
              <TouchableOpacity className="bg-amber-500/20 px-3 py-2 rounded-lg">
                <Text className="text-amber-400 text-sm font-medium">View</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
