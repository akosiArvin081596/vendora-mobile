import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { formatCurrency, formatDateTime } from '../utils/checkoutHelpers';
import ledgerService from '../services/ledgerService';
import inventoryService from '../services/inventoryService';
import AddLedgerEntryModal from '../components/AddLedgerEntryModal';

const TYPE_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'stock_in', label: 'Stock In' },
  { id: 'stock_out', label: 'Stock Out' },
  { id: 'sale', label: 'Sales' },
  { id: 'expense', label: 'Expenses' },
];

const DATE_FILTERS = [
  { id: 'all', label: 'All Time' },
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'This Week' },
  { id: 'month', label: 'This Month' },
];

const TYPE_STYLES = {
  stock_in: {
    icon: 'arrow-down-circle',
    color: '#22c55e',
    bg: 'bg-green-500/20',
    text: 'text-green-400',
    label: 'Stock In',
  },
  stock_out: {
    icon: 'arrow-up-circle',
    color: '#ef4444',
    bg: 'bg-red-500/20',
    text: 'text-red-400',
    label: 'Stock Out',
  },
  sale: {
    icon: 'cash',
    color: '#22c55e',
    bg: 'bg-green-500/20',
    text: 'text-green-400',
    label: 'Sale',
  },
  expense: {
    icon: 'receipt',
    color: '#ef4444',
    bg: 'bg-red-500/20',
    text: 'text-red-400',
    label: 'Expense',
  },
  adjustment: {
    icon: 'swap-horizontal',
    color: '#eab308',
    bg: 'bg-yellow-500/20',
    text: 'text-yellow-400',
    label: 'Adjustment',
  },
  return: {
    icon: 'return-down-back',
    color: '#3b82f6',
    bg: 'bg-blue-500/20',
    text: 'text-blue-400',
    label: 'Return',
  },
};

export default function LedgerScreen() {
  const [entries, setEntries] = useState([]);
  const [summary, setSummary] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);

  const getDateRange = useCallback((filter) => {
    const now = new Date();
    switch (filter) {
      case 'today':
        return {
          date_from: now.toISOString().split('T')[0],
          date_to: now.toISOString().split('T')[0],
        };
      case 'week': {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        return {
          date_from: weekStart.toISOString().split('T')[0],
          date_to: now.toISOString().split('T')[0],
        };
      }
      case 'month': {
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        return {
          date_from: monthStart.toISOString().split('T')[0],
          date_to: now.toISOString().split('T')[0],
        };
      }
      default:
        return {};
    }
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const params = {
        per_page: 100,
        ...getDateRange(dateFilter),
      };

      if (typeFilter !== 'all') {
        params.type = typeFilter;
      }

      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      const [entriesRes, summaryRes] = await Promise.all([
        ledgerService.getAll(params),
        ledgerService.getSummary(),
      ]);

      setEntries(entriesRes.data || []);
      setSummary(summaryRes.data || null);
    } catch (error) {
      console.error('Failed to fetch ledger data:', error);
    }
  }, [typeFilter, dateFilter, searchQuery, getDateRange]);

  const fetchProducts = useCallback(async () => {
    try {
      const response = await inventoryService.getAll({ per_page: 100 });
      setProducts(response.data || []);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchData(), fetchProducts()]);
      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    if (!loading) {
      fetchData();
    }
  }, [typeFilter, dateFilter]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleSearch = () => {
    fetchData();
  };

  const handleAddEntry = async (data) => {
    await ledgerService.create(data);
    await fetchData();
    await fetchProducts();
  };

  const renderEntryCard = ({ item: entry }) => {
    const style = TYPE_STYLES[entry.type] || TYPE_STYLES.adjustment;
    const isInventory = entry.category === 'inventory';

    return (
      <View className="bg-vendora-card rounded-2xl p-4 mb-3 mx-4">
        <View className="flex-row items-start gap-3">
          <View className={`w-10 h-10 rounded-xl items-center justify-center ${style.bg}`}>
            <Ionicons name={style.icon} size={20} color={style.color} />
          </View>
          <View className="flex-1">
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-vendora-text font-semibold flex-1" numberOfLines={1}>
                {entry.description}
              </Text>
              {isInventory ? (
                <Text className={`font-bold ${entry.quantity >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {entry.quantity >= 0 ? '+' : ''}{entry.quantity}
                </Text>
              ) : (
                <Text className={`font-bold ${entry.amount >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {entry.amount >= 0 ? '+' : ''}₱ {formatCurrency(Math.abs(entry.amount) / 100)}
                </Text>
              )}
            </View>
            <View className="flex-row items-center gap-2">
              <View className={`px-2 py-0.5 rounded ${style.bg}`}>
                <Text className={`text-xs font-medium ${style.text}`}>{style.label}</Text>
              </View>
              {entry.product && (
                <Text className="text-vendora-text-muted text-xs" numberOfLines={1}>
                  {entry.product}
                </Text>
              )}
            </View>
            <View className="flex-row items-center justify-between mt-2">
              {entry.reference && (
                <Text className="text-vendora-text-muted text-xs">
                  Ref: {entry.reference}
                </Text>
              )}
              <Text className="text-vendora-text-muted text-xs">
                {formatDateTime(new Date(entry.created_at))}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-vendora-bg items-center justify-center">
        <ActivityIndicator size="large" color="#a855f7" />
        <Text className="text-vendora-text-muted mt-4">Loading ledger...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-vendora-bg">
      {/* Header */}
      <View className="bg-vendora-card border-b border-vendora-border px-4 py-4">
        <Text className="text-vendora-text font-bold text-2xl mb-1">Ledger</Text>
        <Text className="text-vendora-text-muted">Inventory & financial tracking</Text>
      </View>

      {/* Stats Cards */}
      <View className="px-4 py-4">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 12 }}
        >
          <View className="bg-vendora-card rounded-2xl p-4 w-36">
            <View className="w-10 h-10 bg-green-500/20 rounded-xl items-center justify-center mb-3">
              <Ionicons name="arrow-down-circle" size={20} color="#22c55e" />
            </View>
            <Text className="text-vendora-text-muted text-sm mb-1">Stock In</Text>
            <Text className="text-vendora-text font-bold text-xl">
              {summary?.total_stock_in || 0}
            </Text>
          </View>

          <View className="bg-vendora-card rounded-2xl p-4 w-36">
            <View className="w-10 h-10 bg-red-500/20 rounded-xl items-center justify-center mb-3">
              <Ionicons name="arrow-up-circle" size={20} color="#ef4444" />
            </View>
            <Text className="text-vendora-text-muted text-sm mb-1">Stock Out</Text>
            <Text className="text-vendora-text font-bold text-xl">
              {summary?.total_stock_out || 0}
            </Text>
          </View>

          <View className="bg-vendora-card rounded-2xl p-4 w-36">
            <View className="w-10 h-10 bg-green-500/20 rounded-xl items-center justify-center mb-3">
              <Ionicons name="cash" size={20} color="#22c55e" />
            </View>
            <Text className="text-vendora-text-muted text-sm mb-1">Revenue</Text>
            <Text className="text-vendora-text font-bold text-lg">
              ₱ {formatCurrency((summary?.total_revenue || 0) / 100)}
            </Text>
          </View>

          <View className="bg-vendora-card rounded-2xl p-4 w-36">
            <View className="w-10 h-10 bg-red-500/20 rounded-xl items-center justify-center mb-3">
              <Ionicons name="receipt" size={20} color="#ef4444" />
            </View>
            <Text className="text-vendora-text-muted text-sm mb-1">Expenses</Text>
            <Text className="text-vendora-text font-bold text-lg">
              ₱ {formatCurrency((summary?.total_expenses || 0) / 100)}
            </Text>
          </View>

          <View className="bg-vendora-card rounded-2xl p-4 w-36">
            <View className="w-10 h-10 bg-vendora-purple/20 rounded-xl items-center justify-center mb-3">
              <Ionicons name="trending-up" size={20} color="#a855f7" />
            </View>
            <Text className="text-vendora-text-muted text-sm mb-1">Net Profit</Text>
            <Text className={`font-bold text-lg ${(summary?.net_profit || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              ₱ {formatCurrency((summary?.net_profit || 0) / 100)}
            </Text>
          </View>
        </ScrollView>
      </View>

      {/* Search & Filters */}
      <View className="px-4 pb-4">
        <View className="flex-row items-center gap-3 bg-vendora-card rounded-2xl px-4 py-3 mb-3">
          <Ionicons name="search" size={20} color="#a855f7" />
          <TextInput
            className="flex-1 text-vendora-text text-base"
            placeholder="Search entries..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => {
              setSearchQuery('');
              fetchData();
            }}>
              <Ionicons name="close-circle" size={20} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>

        {/* Type Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
          className="mb-3"
        >
          {TYPE_FILTERS.map((filter) => (
            <TouchableOpacity
              key={filter.id}
              className={`px-4 py-2 rounded-xl ${
                typeFilter === filter.id ? 'bg-vendora-purple' : 'bg-vendora-card'
              }`}
              onPress={() => setTypeFilter(filter.id)}
            >
              <Text
                className={`font-medium text-sm ${
                  typeFilter === filter.id ? 'text-white' : 'text-vendora-text'
                }`}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Date Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
        >
          {DATE_FILTERS.map((filter) => (
            <TouchableOpacity
              key={filter.id}
              className={`px-3 py-1.5 rounded-lg border ${
                dateFilter === filter.id
                  ? 'border-vendora-purple bg-vendora-purple/10'
                  : 'border-vendora-border bg-vendora-card'
              }`}
              onPress={() => setDateFilter(filter.id)}
            >
              <Text
                className={`text-xs font-medium ${
                  dateFilter === filter.id ? 'text-vendora-purple-light' : 'text-vendora-text-muted'
                }`}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Entries List */}
      <View className="flex-1">
        <View className="flex-row items-center justify-between px-4 mb-3">
          <Text className="text-vendora-text font-semibold">
            {entries.length} Entr{entries.length !== 1 ? 'ies' : 'y'}
          </Text>
        </View>

        {entries.length > 0 ? (
          <FlatList
            data={entries}
            renderItem={renderEntryCard}
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 120 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={['#a855f7']}
                tintColor="#a855f7"
              />
            }
          />
        ) : (
          <View className="flex-1 items-center justify-center px-4">
            <View className="w-24 h-24 bg-vendora-card rounded-full items-center justify-center mb-4">
              <Ionicons name="book-outline" size={48} color="#6b7280" />
            </View>
            <Text className="text-vendora-text font-semibold text-lg mb-1">
              No entries found
            </Text>
            <Text className="text-vendora-text-muted text-center">
              {searchQuery || typeFilter !== 'all' || dateFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Ledger entries will appear here'}
            </Text>
          </View>
        )}
      </View>

      {/* FAB */}
      <TouchableOpacity
        className="absolute bottom-24 right-5 w-14 h-14 bg-vendora-purple rounded-full items-center justify-center"
        style={{
          shadowColor: '#a855f7',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        }}
        onPress={() => setShowAddModal(true)}
      >
        <Ionicons name="add" size={28} color="white" />
      </TouchableOpacity>

      {/* Add Entry Modal */}
      <AddLedgerEntryModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddEntry}
        products={products}
      />
    </SafeAreaView>
  );
}
