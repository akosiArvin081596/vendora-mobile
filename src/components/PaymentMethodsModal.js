import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const PAYMENT_TYPES = [
  { id: 'card', label: 'Credit/Debit Card', icon: 'card-outline' },
  { id: 'gcash', label: 'GCash', icon: 'phone-portrait-outline' },
  { id: 'maya', label: 'Maya', icon: 'wallet-outline' },
  { id: 'bank', label: 'Bank Transfer', icon: 'business-outline' },
];

const SAMPLE_METHODS = [
  {
    id: '1',
    type: 'card',
    label: 'Visa ending in 4242',
    details: '**** **** **** 4242',
    expiry: '12/25',
    isDefault: true,
  },
  {
    id: '2',
    type: 'gcash',
    label: 'GCash',
    details: '+63 917 *** **89',
    isDefault: false,
  },
];

export default function PaymentMethodsModal({ visible, onClose }) {
  const [paymentMethods, setPaymentMethods] = useState(SAMPLE_METHODS);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedType, setSelectedType] = useState(null);
  const [newMethod, setNewMethod] = useState({
    cardNumber: '',
    cardHolder: '',
    expiry: '',
    cvv: '',
    phoneNumber: '',
    accountNumber: '',
    bankName: '',
  });

  const getIconForType = (type) => {
    const found = PAYMENT_TYPES.find(t => t.id === type);
    return found ? found.icon : 'card-outline';
  };

  const handleSetDefault = (id) => {
    setPaymentMethods(methods =>
      methods.map(m => ({ ...m, isDefault: m.id === id }))
    );
  };

  const handleDelete = (id) => {
    Alert.alert(
      'Remove Payment Method',
      'Are you sure you want to remove this payment method?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setPaymentMethods(methods => methods.filter(m => m.id !== id));
          },
        },
      ]
    );
  };

  const handleAddMethod = () => {
    if (!selectedType) {
      Alert.alert('Error', 'Please select a payment type');
      return;
    }

    let label = '';
    let details = '';

    if (selectedType === 'card') {
      if (!newMethod.cardNumber || !newMethod.cardHolder || !newMethod.expiry) {
        Alert.alert('Error', 'Please fill in all card details');
        return;
      }
      const last4 = newMethod.cardNumber.slice(-4);
      label = `Card ending in ${last4}`;
      details = `**** **** **** ${last4}`;
    } else if (selectedType === 'gcash' || selectedType === 'maya') {
      if (!newMethod.phoneNumber) {
        Alert.alert('Error', 'Please enter your phone number');
        return;
      }
      label = selectedType === 'gcash' ? 'GCash' : 'Maya';
      const masked = newMethod.phoneNumber.replace(/(\d{4})(\d{3})(\d{2})(\d{2})/, '+63 $1 *** **$4');
      details = masked;
    } else if (selectedType === 'bank') {
      if (!newMethod.bankName || !newMethod.accountNumber) {
        Alert.alert('Error', 'Please fill in bank details');
        return;
      }
      label = newMethod.bankName;
      const last4 = newMethod.accountNumber.slice(-4);
      details = `**** **** ${last4}`;
    }

    const newPayment = {
      id: Date.now().toString(),
      type: selectedType,
      label,
      details,
      expiry: newMethod.expiry || null,
      isDefault: paymentMethods.length === 0,
    };

    setPaymentMethods([...paymentMethods, newPayment]);
    setShowAddModal(false);
    setSelectedType(null);
    setNewMethod({
      cardNumber: '',
      cardHolder: '',
      expiry: '',
      cvv: '',
      phoneNumber: '',
      accountNumber: '',
      bankName: '',
    });
    Alert.alert('Success', 'Payment method added successfully');
  };

  const renderAddForm = () => {
    if (!selectedType) return null;

    if (selectedType === 'card') {
      return (
        <View>
          <Text style={{ color: '#9ca3af', fontSize: 12, marginBottom: 6 }}>Card Number</Text>
          <View style={{
            backgroundColor: '#3d2a52',
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 14,
            marginBottom: 16,
            flexDirection: 'row',
            alignItems: 'center',
          }}>
            <Ionicons name="card-outline" size={20} color="#9ca3af" />
            <TextInput
              style={{ flex: 1, color: '#e5e5e5', fontSize: 16, marginLeft: 12 }}
              placeholder="1234 5678 9012 3456"
              placeholderTextColor="#6b7280"
              value={newMethod.cardNumber}
              onChangeText={(text) => setNewMethod({ ...newMethod, cardNumber: text })}
              keyboardType="numeric"
              maxLength={19}
            />
          </View>

          <Text style={{ color: '#9ca3af', fontSize: 12, marginBottom: 6 }}>Cardholder Name</Text>
          <View style={{
            backgroundColor: '#3d2a52',
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 14,
            marginBottom: 16,
          }}>
            <TextInput
              style={{ color: '#e5e5e5', fontSize: 16 }}
              placeholder="John Doe"
              placeholderTextColor="#6b7280"
              value={newMethod.cardHolder}
              onChangeText={(text) => setNewMethod({ ...newMethod, cardHolder: text })}
              autoCapitalize="words"
            />
          </View>

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#9ca3af', fontSize: 12, marginBottom: 6 }}>Expiry Date</Text>
              <View style={{
                backgroundColor: '#3d2a52',
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 14,
              }}>
                <TextInput
                  style={{ color: '#e5e5e5', fontSize: 16 }}
                  placeholder="MM/YY"
                  placeholderTextColor="#6b7280"
                  value={newMethod.expiry}
                  onChangeText={(text) => setNewMethod({ ...newMethod, expiry: text })}
                  maxLength={5}
                />
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#9ca3af', fontSize: 12, marginBottom: 6 }}>CVV</Text>
              <View style={{
                backgroundColor: '#3d2a52',
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 14,
              }}>
                <TextInput
                  style={{ color: '#e5e5e5', fontSize: 16 }}
                  placeholder="123"
                  placeholderTextColor="#6b7280"
                  value={newMethod.cvv}
                  onChangeText={(text) => setNewMethod({ ...newMethod, cvv: text })}
                  keyboardType="numeric"
                  maxLength={4}
                  secureTextEntry
                />
              </View>
            </View>
          </View>
        </View>
      );
    }

    if (selectedType === 'gcash' || selectedType === 'maya') {
      return (
        <View>
          <Text style={{ color: '#9ca3af', fontSize: 12, marginBottom: 6 }}>
            Mobile Number
          </Text>
          <View style={{
            backgroundColor: '#3d2a52',
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 14,
            flexDirection: 'row',
            alignItems: 'center',
          }}>
            <Text style={{ color: '#9ca3af', fontSize: 16, marginRight: 8 }}>+63</Text>
            <TextInput
              style={{ flex: 1, color: '#e5e5e5', fontSize: 16 }}
              placeholder="917 123 4567"
              placeholderTextColor="#6b7280"
              value={newMethod.phoneNumber}
              onChangeText={(text) => setNewMethod({ ...newMethod, phoneNumber: text })}
              keyboardType="phone-pad"
              maxLength={12}
            />
          </View>
        </View>
      );
    }

    if (selectedType === 'bank') {
      return (
        <View>
          <Text style={{ color: '#9ca3af', fontSize: 12, marginBottom: 6 }}>Bank Name</Text>
          <View style={{
            backgroundColor: '#3d2a52',
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 14,
            marginBottom: 16,
          }}>
            <TextInput
              style={{ color: '#e5e5e5', fontSize: 16 }}
              placeholder="e.g., BDO, BPI, Metrobank"
              placeholderTextColor="#6b7280"
              value={newMethod.bankName}
              onChangeText={(text) => setNewMethod({ ...newMethod, bankName: text })}
            />
          </View>

          <Text style={{ color: '#9ca3af', fontSize: 12, marginBottom: 6 }}>Account Number</Text>
          <View style={{
            backgroundColor: '#3d2a52',
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 14,
          }}>
            <TextInput
              style={{ color: '#e5e5e5', fontSize: 16 }}
              placeholder="Enter account number"
              placeholderTextColor="#6b7280"
              value={newMethod.accountNumber}
              onChangeText={(text) => setNewMethod({ ...newMethod, accountNumber: text })}
              keyboardType="numeric"
            />
          </View>
        </View>
      );
    }

    return null;
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
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="arrow-back" size={24} color="#e5e5e5" />
              </TouchableOpacity>
              <Text style={{
                color: '#e5e5e5',
                fontSize: 20,
                fontWeight: 'bold',
              }}>
                Payment Methods
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setShowAddModal(true)}
              style={{
                backgroundColor: '#9333ea',
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Ionicons name="add" size={18} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '600' }}>Add</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
            {paymentMethods.length === 0 ? (
              <View style={{
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 60,
              }}>
                <View style={{
                  backgroundColor: '#2d1f3d',
                  padding: 24,
                  borderRadius: 50,
                  marginBottom: 16,
                }}>
                  <Ionicons name="card-outline" size={48} color="#9ca3af" />
                </View>
                <Text style={{ color: '#e5e5e5', fontSize: 18, fontWeight: '600', marginBottom: 8 }}>
                  No Payment Methods
                </Text>
                <Text style={{ color: '#9ca3af', fontSize: 14, textAlign: 'center' }}>
                  Add a payment method to make checkout faster
                </Text>
              </View>
            ) : (
              paymentMethods.map((method) => (
                <View
                  key={method.id}
                  style={{
                    backgroundColor: '#2d1f3d',
                    borderRadius: 16,
                    padding: 16,
                    marginBottom: 12,
                    borderWidth: method.isDefault ? 2 : 1,
                    borderColor: method.isDefault ? '#9333ea' : '#4a3660',
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{
                      backgroundColor: '#3d2a52',
                      padding: 12,
                      borderRadius: 12,
                      marginRight: 12,
                    }}>
                      <Ionicons
                        name={getIconForType(method.type)}
                        size={24}
                        color={method.isDefault ? '#a855f7' : '#9ca3af'}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={{ color: '#e5e5e5', fontSize: 16, fontWeight: '600' }}>
                          {method.label}
                        </Text>
                        {method.isDefault && (
                          <View style={{
                            backgroundColor: '#9333ea',
                            paddingHorizontal: 8,
                            paddingVertical: 2,
                            borderRadius: 10,
                          }}>
                            <Text style={{ color: '#fff', fontSize: 10, fontWeight: '600' }}>
                              DEFAULT
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text style={{ color: '#9ca3af', fontSize: 14, marginTop: 2 }}>
                        {method.details}
                      </Text>
                      {method.expiry && (
                        <Text style={{ color: '#6b7280', fontSize: 12, marginTop: 2 }}>
                          Expires {method.expiry}
                        </Text>
                      )}
                    </View>
                  </View>

                  {/* Actions */}
                  <View style={{
                    flexDirection: 'row',
                    gap: 8,
                    marginTop: 12,
                    paddingTop: 12,
                    borderTopWidth: 1,
                    borderTopColor: '#4a3660',
                  }}>
                    {!method.isDefault && (
                      <TouchableOpacity
                        onPress={() => handleSetDefault(method.id)}
                        style={{
                          flex: 1,
                          backgroundColor: '#3d2a52',
                          paddingVertical: 10,
                          borderRadius: 10,
                          alignItems: 'center',
                        }}
                      >
                        <Text style={{ color: '#a855f7', fontWeight: '500' }}>Set as Default</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      onPress={() => handleDelete(method.id)}
                      style={{
                        flex: method.isDefault ? 1 : 0,
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        paddingVertical: 10,
                        paddingHorizontal: 20,
                        borderRadius: 10,
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ color: '#ef4444', fontWeight: '500' }}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}

            {/* Security Notice */}
            <View style={{
              backgroundColor: '#2d1f3d',
              borderRadius: 12,
              padding: 16,
              flexDirection: 'row',
              alignItems: 'center',
              marginTop: 8,
            }}>
              <Ionicons name="shield-checkmark" size={24} color="#22c55e" />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={{ color: '#e5e5e5', fontSize: 14, fontWeight: '500' }}>
                  Your payment info is secure
                </Text>
                <Text style={{ color: '#9ca3af', fontSize: 12 }}>
                  We use encryption to protect your data
                </Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>

      {/* Add Payment Method Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowAddModal(false);
          setSelectedType(null);
        }}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'flex-end',
        }}>
          <View style={{
            backgroundColor: '#1a1025',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            maxHeight: '90%',
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
              <Text style={{ color: '#e5e5e5', fontSize: 18, fontWeight: 'bold' }}>
                Add Payment Method
              </Text>
              <TouchableOpacity onPress={() => {
                setShowAddModal(false);
                setSelectedType(null);
              }}>
                <Ionicons name="close" size={24} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ padding: 20 }}>
              {/* Payment Type Selection */}
              <Text style={{ color: '#9ca3af', fontSize: 14, marginBottom: 12 }}>
                Select Payment Type
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 }}>
                {PAYMENT_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.id}
                    onPress={() => setSelectedType(type.id)}
                    style={{
                      backgroundColor: selectedType === type.id ? '#9333ea' : '#2d1f3d',
                      paddingVertical: 12,
                      paddingHorizontal: 16,
                      borderRadius: 12,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 8,
                      borderWidth: 1,
                      borderColor: selectedType === type.id ? '#9333ea' : '#4a3660',
                    }}
                  >
                    <Ionicons
                      name={type.icon}
                      size={20}
                      color={selectedType === type.id ? '#fff' : '#9ca3af'}
                    />
                    <Text style={{
                      color: selectedType === type.id ? '#fff' : '#9ca3af',
                      fontWeight: '500',
                    }}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Dynamic Form */}
              {renderAddForm()}

              {/* Add Button */}
              {selectedType && (
                <TouchableOpacity
                  onPress={handleAddMethod}
                  style={{
                    backgroundColor: '#9333ea',
                    paddingVertical: 16,
                    borderRadius: 12,
                    alignItems: 'center',
                    marginTop: 24,
                    marginBottom: 40,
                  }}
                >
                  <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
                    Add Payment Method
                  </Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Modal>
  );
}
