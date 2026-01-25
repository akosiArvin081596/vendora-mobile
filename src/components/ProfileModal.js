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
import PaymentMethodsModal from './PaymentMethodsModal';
import BecomeVendorModal from './BecomeVendorModal';
import VendorProfileModal from './VendorProfileModal';

const menuItems = [
  { id: 'orders', icon: 'receipt-outline', label: 'My Orders', subtitle: 'View order history' },
  { id: 'wishlist', icon: 'heart-outline', label: 'My Wishlist', subtitle: 'Saved items' },
  { id: 'addresses', icon: 'location-outline', label: 'Addresses', subtitle: 'Manage delivery addresses' },
  { id: 'payments', icon: 'card-outline', label: 'Payment Methods', subtitle: 'Saved cards & wallets' },
  { id: 'notifications', icon: 'notifications-outline', label: 'Notifications', subtitle: 'Manage preferences' },
  { id: 'settings', icon: 'settings-outline', label: 'Settings', subtitle: 'App preferences' },
  { id: 'help', icon: 'help-circle-outline', label: 'Help & Support', subtitle: 'FAQs & contact us' },
];

export default function ProfileModal({ visible, onClose, user, onLogout }) {
  const [showPaymentMethods, setShowPaymentMethods] = useState(false);
  const [showBecomeVendor, setShowBecomeVendor] = useState(false);
  const [showVendorProfile, setShowVendorProfile] = useState(false);

  const handleMenuPress = (itemId) => {
    switch (itemId) {
      case 'payments':
        setShowPaymentMethods(true);
        break;
      default:
        break;
    }
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
          marginTop: 50,
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
            <Text style={{
              color: '#e5e5e5',
              fontSize: 20,
              fontWeight: 'bold',
            }}>
              My Profile
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Profile Card */}
            <View style={{
              backgroundColor: '#2d1f3d',
              margin: 16,
              borderRadius: 16,
              padding: 20,
              borderWidth: 1,
              borderColor: '#4a3660',
            }}>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
              }}>
                {/* Avatar */}
                <View style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  backgroundColor: '#9333ea',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 16,
                }}>
                  {user?.avatar ? (
                    <Image
                      source={{ uri: user.avatar }}
                      style={{ width: 80, height: 80, borderRadius: 40 }}
                    />
                  ) : (
                    <Text style={{
                      color: '#fff',
                      fontSize: 32,
                      fontWeight: 'bold',
                    }}>
                      {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </Text>
                  )}
                </View>

                {/* User Info */}
                <View style={{ flex: 1 }}>
                  <Text style={{
                    color: '#e5e5e5',
                    fontSize: 20,
                    fontWeight: 'bold',
                    marginBottom: 4,
                  }}>
                    {user?.name || 'User'}
                  </Text>
                  <Text style={{
                    color: '#9ca3af',
                    fontSize: 14,
                    marginBottom: 8,
                  }}>
                    {user?.email || 'user@example.com'}
                  </Text>
                  <TouchableOpacity style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}>
                    <Text style={{ color: '#a855f7', fontSize: 14 }}>
                      Edit Profile
                    </Text>
                    <Ionicons name="chevron-forward" size={16} color="#a855f7" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Stats Row */}
              <View style={{
                flexDirection: 'row',
                marginTop: 20,
                paddingTop: 20,
                borderTopWidth: 1,
                borderTopColor: '#4a3660',
              }}>
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={{
                    color: '#e5e5e5',
                    fontSize: 20,
                    fontWeight: 'bold',
                  }}>
                    {user?.ordersCount || 0}
                  </Text>
                  <Text style={{ color: '#9ca3af', fontSize: 12 }}>Orders</Text>
                </View>
                <View style={{
                  width: 1,
                  backgroundColor: '#4a3660',
                }} />
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={{
                    color: '#e5e5e5',
                    fontSize: 20,
                    fontWeight: 'bold',
                  }}>
                    {user?.wishlistCount || 0}
                  </Text>
                  <Text style={{ color: '#9ca3af', fontSize: 12 }}>Wishlist</Text>
                </View>
                <View style={{
                  width: 1,
                  backgroundColor: '#4a3660',
                }} />
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={{
                    color: '#e5e5e5',
                    fontSize: 20,
                    fontWeight: 'bold',
                  }}>
                    {user?.points || 0}
                  </Text>
                  <Text style={{ color: '#9ca3af', fontSize: 12 }}>Points</Text>
                </View>
              </View>
            </View>

            {/* Membership Card */}
            <View style={{
              marginHorizontal: 16,
              marginBottom: 16,
              borderRadius: 16,
              padding: 16,
              backgroundColor: '#9333ea',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="diamond" size={24} color="#fff" />
                <View style={{ marginLeft: 12 }}>
                  <Text style={{
                    color: '#fff',
                    fontSize: 16,
                    fontWeight: 'bold',
                  }}>
                    {user?.membership || 'Silver'} Member
                  </Text>
                  <Text style={{
                    color: 'rgba(255,255,255,0.8)',
                    fontSize: 12,
                  }}>
                    Earn 2x points on all purchases
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#fff" />
            </View>

            {/* Become a Vendor CTA */}
            <TouchableOpacity
              onPress={() => setShowVendorProfile(true)}
              style={{
                marginHorizontal: 16,
                marginBottom: 16,
                borderRadius: 16,
                padding: 16,
                backgroundColor: '#2d1f3d',
                borderWidth: 2,
                borderColor: '#4a3660',
                borderStyle: 'dashed',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{
                  backgroundColor: '#3d2a52',
                  padding: 12,
                  borderRadius: 12,
                  marginRight: 12,
                }}>
                  <Ionicons name="storefront" size={28} color="#a855f7" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{
                    color: '#e5e5e5',
                    fontSize: 16,
                    fontWeight: 'bold',
                    marginBottom: 2,
                  }}>
                    Become a Vendor
                  </Text>
                  <Text style={{
                    color: '#9ca3af',
                    fontSize: 12,
                  }}>
                    Start selling on Vendora today
                  </Text>
                </View>
                <View style={{
                  backgroundColor: '#9333ea',
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 20,
                }}>
                  <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>Apply</Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Menu Items */}
            <View style={{
              backgroundColor: '#2d1f3d',
              marginHorizontal: 16,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: '#4a3660',
              overflow: 'hidden',
            }}>
              {menuItems.map((item, index) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => handleMenuPress(item.id)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 16,
                    borderBottomWidth: index < menuItems.length - 1 ? 1 : 0,
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

            {/* Logout Button */}
            <TouchableOpacity
              onPress={onLogout}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#2d1f3d',
                marginHorizontal: 16,
                marginTop: 16,
                marginBottom: 32,
                padding: 16,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: '#ef4444',
              }}
            >
              <Ionicons name="log-out-outline" size={20} color="#ef4444" />
              <Text style={{
                color: '#ef4444',
                fontSize: 16,
                fontWeight: '600',
                marginLeft: 8,
              }}>
                Log Out
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>

      {/* Payment Methods Modal */}
      <PaymentMethodsModal
        visible={showPaymentMethods}
        onClose={() => setShowPaymentMethods(false)}
      />

      {/* Become a Vendor Modal */}
      <BecomeVendorModal
        visible={showBecomeVendor}
        onClose={() => setShowBecomeVendor(false)}
        user={user}
      />

      {/* Vendor Profile Modal */}
      <VendorProfileModal
        visible={showVendorProfile}
        onClose={() => setShowVendorProfile(false)}
        user={user}
      />
    </Modal>
  );
}
