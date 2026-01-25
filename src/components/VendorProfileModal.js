import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SAMPLE_STORE = {
  name: 'My Vendora Store',
  logo: null,
  rating: 4.8,
  totalReviews: 156,
  followers: 1234,
  joinedDate: 'January 2024',
  verified: true,
};

const SAMPLE_STATS = {
  totalSales: 125680,
  totalOrders: 342,
  totalProducts: 48,
  pendingOrders: 5,
  averageRating: 4.8,
  thisMonthSales: 32450,
  thisMonthOrders: 67,
};

const QUICK_ACTIONS = [
  { id: 'add-product', icon: 'add-circle-outline', label: 'Add Product', color: '#9333ea' },
  { id: 'orders', icon: 'receipt-outline', label: 'Orders', color: '#3b82f6', badge: 5 },
  { id: 'products', icon: 'cube-outline', label: 'Products', color: '#22c55e' },
  { id: 'analytics', icon: 'analytics-outline', label: 'Analytics', color: '#f59e0b' },
];

const MENU_ITEMS = [
  { id: 'store-settings', icon: 'storefront-outline', label: 'Store Settings', subtitle: 'Edit store info & appearance' },
  { id: 'products', icon: 'cube-outline', label: 'Manage Products', subtitle: '48 active products' },
  { id: 'orders', icon: 'receipt-outline', label: 'Order Management', subtitle: '5 pending orders' },
  { id: 'customers', icon: 'people-outline', label: 'Customers', subtitle: 'View customer list' },
  { id: 'reviews', icon: 'star-outline', label: 'Reviews & Ratings', subtitle: '4.8 average rating' },
  { id: 'promotions', icon: 'pricetag-outline', label: 'Promotions', subtitle: 'Manage discounts & sales' },
  { id: 'payments', icon: 'wallet-outline', label: 'Payments & Payouts', subtitle: 'View earnings & withdrawals' },
  { id: 'analytics', icon: 'bar-chart-outline', label: 'Analytics', subtitle: 'Sales & performance reports' },
];

export default function VendorProfileModal({ visible, onClose, user }) {
  const [activeTab, setActiveTab] = useState('dashboard');

  const formatCurrency = (amount) => {
    return '₱' + amount.toLocaleString();
  };

  const handleQuickAction = () => {
    // Handle quick action
  };

  const handleMenuPress = () => {
    // Handle menu press
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={{
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
      }}>
        <View style={{
          flex: 1,
          backgroundColor: '#1a1025',
          marginTop: 30,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
        }}>
          {/* Header */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: 20,
            borderBottomWidth: 1,
            borderBottomColor: '#4a3660',
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="arrow-back" size={24} color="#e5e5e5" />
              </TouchableOpacity>
              <Text style={{
                color: '#e5e5e5',
                fontSize: 20,
                fontWeight: 'bold',
              }}>
                Vendor Dashboard
              </Text>
            </View>
            <TouchableOpacity style={{
              backgroundColor: '#3d2a52',
              padding: 10,
              borderRadius: 12,
            }}>
              <Ionicons name="notifications-outline" size={22} color="#e5e5e5" />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            {/* Store Profile Card */}
            <View style={{
              backgroundColor: '#2d1f3d',
              margin: 16,
              borderRadius: 20,
              padding: 20,
              borderWidth: 1,
              borderColor: '#4a3660',
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {/* Store Logo */}
                <View style={{
                  width: 70,
                  height: 70,
                  borderRadius: 35,
                  backgroundColor: '#9333ea',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 16,
                }}>
                  {SAMPLE_STORE.logo ? (
                    <Image
                      source={{ uri: SAMPLE_STORE.logo }}
                      style={{ width: 70, height: 70, borderRadius: 35 }}
                    />
                  ) : (
                    <Ionicons name="storefront" size={32} color="#fff" />
                  )}
                </View>

                {/* Store Info */}
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={{
                      color: '#e5e5e5',
                      fontSize: 18,
                      fontWeight: 'bold',
                    }}>
                      {SAMPLE_STORE.name}
                    </Text>
                    {SAMPLE_STORE.verified && (
                      <Ionicons name="checkmark-circle" size={18} color="#22c55e" />
                    )}
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                    <Ionicons name="star" size={14} color="#fbbf24" />
                    <Text style={{ color: '#fbbf24', fontSize: 14, fontWeight: '600' }}>
                      {SAMPLE_STORE.rating}
                    </Text>
                    <Text style={{ color: '#9ca3af', fontSize: 14 }}>
                      ({SAMPLE_STORE.totalReviews} reviews)
                    </Text>
                  </View>
                  <Text style={{ color: '#9ca3af', fontSize: 12, marginTop: 4 }}>
                    {SAMPLE_STORE.followers.toLocaleString()} followers • Since {SAMPLE_STORE.joinedDate}
                  </Text>
                </View>
              </View>

              {/* Edit Store Button */}
              <TouchableOpacity style={{
                backgroundColor: '#3d2a52',
                paddingVertical: 10,
                borderRadius: 10,
                alignItems: 'center',
                marginTop: 16,
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 8,
              }}>
                <Ionicons name="create-outline" size={18} color="#a855f7" />
                <Text style={{ color: '#a855f7', fontWeight: '600' }}>Edit Store Profile</Text>
              </TouchableOpacity>
            </View>

            {/* Stats Overview */}
            <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
              <Text style={{ color: '#e5e5e5', fontSize: 16, fontWeight: '600', marginBottom: 12 }}>
                This Month
              </Text>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{
                  flex: 1,
                  backgroundColor: '#2d1f3d',
                  borderRadius: 16,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: '#4a3660',
                }}>
                  <View style={{
                    backgroundColor: '#22c55e20',
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: 8,
                  }}>
                    <Ionicons name="trending-up" size={22} color="#22c55e" />
                  </View>
                  <Text style={{ color: '#22c55e', fontSize: 22, fontWeight: 'bold' }}>
                    {formatCurrency(SAMPLE_STATS.thisMonthSales)}
                  </Text>
                  <Text style={{ color: '#9ca3af', fontSize: 12 }}>Total Sales</Text>
                </View>
                <View style={{
                  flex: 1,
                  backgroundColor: '#2d1f3d',
                  borderRadius: 16,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: '#4a3660',
                }}>
                  <View style={{
                    backgroundColor: '#3b82f620',
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: 8,
                  }}>
                    <Ionicons name="receipt" size={22} color="#3b82f6" />
                  </View>
                  <Text style={{ color: '#3b82f6', fontSize: 22, fontWeight: 'bold' }}>
                    {SAMPLE_STATS.thisMonthOrders}
                  </Text>
                  <Text style={{ color: '#9ca3af', fontSize: 12 }}>Orders</Text>
                </View>
              </View>
            </View>

            {/* All Time Stats */}
            <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
              <View style={{
                backgroundColor: '#2d1f3d',
                borderRadius: 16,
                padding: 16,
                borderWidth: 1,
                borderColor: '#4a3660',
                flexDirection: 'row',
              }}>
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={{ color: '#e5e5e5', fontSize: 18, fontWeight: 'bold' }}>
                    {formatCurrency(SAMPLE_STATS.totalSales)}
                  </Text>
                  <Text style={{ color: '#9ca3af', fontSize: 11 }}>Total Sales</Text>
                </View>
                <View style={{ width: 1, backgroundColor: '#4a3660' }} />
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={{ color: '#e5e5e5', fontSize: 18, fontWeight: 'bold' }}>
                    {SAMPLE_STATS.totalOrders}
                  </Text>
                  <Text style={{ color: '#9ca3af', fontSize: 11 }}>Total Orders</Text>
                </View>
                <View style={{ width: 1, backgroundColor: '#4a3660' }} />
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={{ color: '#e5e5e5', fontSize: 18, fontWeight: 'bold' }}>
                    {SAMPLE_STATS.totalProducts}
                  </Text>
                  <Text style={{ color: '#9ca3af', fontSize: 11 }}>Products</Text>
                </View>
              </View>
            </View>

            {/* Quick Actions */}
            <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
              <Text style={{ color: '#e5e5e5', fontSize: 16, fontWeight: '600', marginBottom: 12 }}>
                Quick Actions
              </Text>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                {QUICK_ACTIONS.map((action) => (
                  <TouchableOpacity
                    key={action.id}
                    onPress={() => handleQuickAction(action.id)}
                    style={{
                      flex: 1,
                      backgroundColor: '#2d1f3d',
                      borderRadius: 16,
                      padding: 16,
                      alignItems: 'center',
                      borderWidth: 1,
                      borderColor: '#4a3660',
                    }}
                  >
                    <View style={{ position: 'relative' }}>
                      <View style={{
                        backgroundColor: action.color + '20',
                        padding: 12,
                        borderRadius: 12,
                        marginBottom: 8,
                      }}>
                        <Ionicons name={action.icon} size={24} color={action.color} />
                      </View>
                      {action.badge && (
                        <View style={{
                          position: 'absolute',
                          top: -4,
                          right: -4,
                          backgroundColor: '#ef4444',
                          width: 20,
                          height: 20,
                          borderRadius: 10,
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}>
                          <Text style={{ color: '#fff', fontSize: 11, fontWeight: 'bold' }}>
                            {action.badge}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text style={{ color: '#e5e5e5', fontSize: 12, fontWeight: '500' }}>
                      {action.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Pending Orders Alert */}
            {SAMPLE_STATS.pendingOrders > 0 && (
              <TouchableOpacity style={{
                backgroundColor: '#f59e0b20',
                marginHorizontal: 16,
                marginBottom: 16,
                borderRadius: 12,
                padding: 16,
                flexDirection: 'row',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: '#f59e0b40',
              }}>
                <View style={{
                  backgroundColor: '#f59e0b30',
                  padding: 10,
                  borderRadius: 10,
                  marginRight: 12,
                }}>
                  <Ionicons name="alert-circle" size={24} color="#f59e0b" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#f59e0b', fontSize: 14, fontWeight: '600' }}>
                    {SAMPLE_STATS.pendingOrders} Pending Orders
                  </Text>
                  <Text style={{ color: '#9ca3af', fontSize: 12 }}>
                    Tap to view and process orders
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#f59e0b" />
              </TouchableOpacity>
            )}

            {/* Menu Items */}
            <View style={{
              backgroundColor: '#2d1f3d',
              marginHorizontal: 16,
              marginBottom: 16,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: '#4a3660',
              overflow: 'hidden',
            }}>
              {MENU_ITEMS.map((item, index) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => handleMenuPress(item.id)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 16,
                    borderBottomWidth: index < MENU_ITEMS.length - 1 ? 1 : 0,
                    borderBottomColor: '#4a3660',
                  }}
                >
                  <View style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    backgroundColor: '#3d2a52',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 12,
                  }}>
                    <Ionicons name={item.icon} size={20} color="#a855f7" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{
                      color: '#e5e5e5',
                      fontSize: 16,
                      fontWeight: '500',
                    }}>
                      {item.label}
                    </Text>
                    <Text style={{
                      color: '#9ca3af',
                      fontSize: 12,
                    }}>
                      {item.subtitle}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                </TouchableOpacity>
              ))}
            </View>

            {/* Switch to Buyer Mode */}
            <TouchableOpacity
              onPress={onClose}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#2d1f3d',
                marginHorizontal: 16,
                marginBottom: 32,
                padding: 16,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: '#4a3660',
                gap: 8,
              }}
            >
              <Ionicons name="swap-horizontal" size={20} color="#a855f7" />
              <Text style={{
                color: '#a855f7',
                fontSize: 16,
                fontWeight: '600',
              }}>
                Switch to Buyer Mode
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
