import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

const BUSINESS_TYPES = [
  { id: 'retail', label: 'Retail Store', icon: 'storefront-outline' },
  { id: 'grocery', label: 'Grocery', icon: 'cart-outline' },
  { id: 'food', label: 'Food & Beverages', icon: 'restaurant-outline' },
  { id: 'electronics', label: 'Electronics', icon: 'phone-portrait-outline' },
  { id: 'fashion', label: 'Fashion & Apparel', icon: 'shirt-outline' },
  { id: 'other', label: 'Other', icon: 'grid-outline' },
];

const STEPS = [
  { id: 1, title: 'Business Info', icon: 'business-outline' },
  { id: 2, title: 'Verification', icon: 'shield-checkmark-outline' },
  { id: 3, title: 'Review', icon: 'checkmark-done-outline' },
];

export default function BecomeVendorModal({ visible, onClose, user }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [businessInfo, setBusinessInfo] = useState({
    businessName: '',
    businessType: '',
    description: '',
    address: '',
    city: '',
    phone: '',
    email: user?.email || '',
  });
  const [documents, setDocuments] = useState({
    businessPermit: null,
    validId: null,
    storeLogo: null,
  });
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const pickDocument = async (type) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: type === 'storeLogo' ? [1, 1] : [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setDocuments({ ...documents, [type]: result.assets[0].uri });
    }
  };

  const validateStep1 = () => {
    if (!businessInfo.businessName.trim()) {
      Alert.alert('Required', 'Please enter your business name');
      return false;
    }
    if (!businessInfo.businessType) {
      Alert.alert('Required', 'Please select a business type');
      return false;
    }
    if (!businessInfo.address.trim()) {
      Alert.alert('Required', 'Please enter your business address');
      return false;
    }
    if (!businessInfo.phone.trim()) {
      Alert.alert('Required', 'Please enter your contact number');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!documents.validId) {
      Alert.alert('Required', 'Please upload a valid ID');
      return false;
    }
    if (!agreedToTerms) {
      Alert.alert('Required', 'Please agree to the terms and conditions');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    } else if (currentStep === 2 && validateStep2()) {
      setCurrentStep(3);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    Alert.alert(
      'Application Submitted!',
      'Thank you for applying to become a Vendora vendor. We will review your application and get back to you within 2-3 business days.',
      [
        {
          text: 'OK',
          onPress: () => {
            // Reset form
            setCurrentStep(1);
            setBusinessInfo({
              businessName: '',
              businessType: '',
              description: '',
              address: '',
              city: '',
              phone: '',
              email: user?.email || '',
            });
            setDocuments({
              businessPermit: null,
              validId: null,
              storeLogo: null,
            });
            setAgreedToTerms(false);
            onClose();
          },
        },
      ]
    );
  };

  const renderStepIndicator = () => (
    <View style={{
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 20,
      paddingHorizontal: 16,
      backgroundColor: '#2d1f3d',
      borderBottomWidth: 1,
      borderBottomColor: '#4a3660',
    }}>
      {STEPS.map((step, index) => (
        <React.Fragment key={step.id}>
          <View style={{ alignItems: 'center' }}>
            <View style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: currentStep >= step.id ? '#9333ea' : '#3d2a52',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 4,
            }}>
              {currentStep > step.id ? (
                <Ionicons name="checkmark" size={20} color="#fff" />
              ) : (
                <Ionicons name={step.icon} size={18} color={currentStep >= step.id ? '#fff' : '#9ca3af'} />
              )}
            </View>
            <Text style={{
              color: currentStep >= step.id ? '#a855f7' : '#9ca3af',
              fontSize: 11,
              fontWeight: '500',
            }}>
              {step.title}
            </Text>
          </View>
          {index < STEPS.length - 1 && (
            <View style={{
              width: 40,
              height: 2,
              backgroundColor: currentStep > step.id ? '#9333ea' : '#3d2a52',
              marginHorizontal: 8,
              marginBottom: 20,
            }} />
          )}
        </React.Fragment>
      ))}
    </View>
  );

  const renderStep1 = () => (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
      {/* Store Logo */}
      <View style={{ alignItems: 'center', marginBottom: 24 }}>
        <TouchableOpacity
          onPress={() => pickDocument('storeLogo')}
          style={{
            width: 100,
            height: 100,
            borderRadius: 50,
            backgroundColor: '#3d2a52',
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 2,
            borderColor: '#4a3660',
            borderStyle: 'dashed',
            overflow: 'hidden',
          }}
        >
          {documents.storeLogo ? (
            <Image
              source={{ uri: documents.storeLogo }}
              style={{ width: 100, height: 100 }}
            />
          ) : (
            <>
              <Ionicons name="camera" size={32} color="#9ca3af" />
              <Text style={{ color: '#9ca3af', fontSize: 11, marginTop: 4 }}>Add Logo</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Business Name */}
      <Text style={{ color: '#9ca3af', fontSize: 12, marginBottom: 6 }}>Business Name *</Text>
      <View style={{
        backgroundColor: '#3d2a52',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginBottom: 16,
        flexDirection: 'row',
        alignItems: 'center',
      }}>
        <Ionicons name="storefront-outline" size={20} color="#9ca3af" />
        <TextInput
          style={{ flex: 1, color: '#e5e5e5', fontSize: 16, marginLeft: 12 }}
          placeholder="Your store name"
          placeholderTextColor="#6b7280"
          value={businessInfo.businessName}
          onChangeText={(text) => setBusinessInfo({ ...businessInfo, businessName: text })}
        />
      </View>

      {/* Business Type */}
      <Text style={{ color: '#9ca3af', fontSize: 12, marginBottom: 10 }}>Business Type *</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        {BUSINESS_TYPES.map((type) => (
          <TouchableOpacity
            key={type.id}
            onPress={() => setBusinessInfo({ ...businessInfo, businessType: type.id })}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 10,
              paddingHorizontal: 14,
              borderRadius: 10,
              backgroundColor: businessInfo.businessType === type.id ? '#9333ea' : '#3d2a52',
              borderWidth: 1,
              borderColor: businessInfo.businessType === type.id ? '#9333ea' : '#4a3660',
              gap: 6,
            }}
          >
            <Ionicons
              name={type.icon}
              size={16}
              color={businessInfo.businessType === type.id ? '#fff' : '#9ca3af'}
            />
            <Text style={{
              color: businessInfo.businessType === type.id ? '#fff' : '#9ca3af',
              fontSize: 13,
            }}>
              {type.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Description */}
      <Text style={{ color: '#9ca3af', fontSize: 12, marginBottom: 6 }}>Business Description</Text>
      <View style={{
        backgroundColor: '#3d2a52',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginBottom: 16,
        minHeight: 100,
      }}>
        <TextInput
          style={{ color: '#e5e5e5', fontSize: 16, textAlignVertical: 'top' }}
          placeholder="Tell customers about your business..."
          placeholderTextColor="#6b7280"
          value={businessInfo.description}
          onChangeText={(text) => setBusinessInfo({ ...businessInfo, description: text })}
          multiline
          numberOfLines={4}
        />
      </View>

      {/* Address */}
      <Text style={{ color: '#9ca3af', fontSize: 12, marginBottom: 6 }}>Business Address *</Text>
      <View style={{
        backgroundColor: '#3d2a52',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginBottom: 16,
        flexDirection: 'row',
        alignItems: 'center',
      }}>
        <Ionicons name="location-outline" size={20} color="#9ca3af" />
        <TextInput
          style={{ flex: 1, color: '#e5e5e5', fontSize: 16, marginLeft: 12 }}
          placeholder="Street address"
          placeholderTextColor="#6b7280"
          value={businessInfo.address}
          onChangeText={(text) => setBusinessInfo({ ...businessInfo, address: text })}
        />
      </View>

      {/* City */}
      <Text style={{ color: '#9ca3af', fontSize: 12, marginBottom: 6 }}>City</Text>
      <View style={{
        backgroundColor: '#3d2a52',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginBottom: 16,
      }}>
        <TextInput
          style={{ color: '#e5e5e5', fontSize: 16 }}
          placeholder="City"
          placeholderTextColor="#6b7280"
          value={businessInfo.city}
          onChangeText={(text) => setBusinessInfo({ ...businessInfo, city: text })}
        />
      </View>

      {/* Phone */}
      <Text style={{ color: '#9ca3af', fontSize: 12, marginBottom: 6 }}>Contact Number *</Text>
      <View style={{
        backgroundColor: '#3d2a52',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginBottom: 16,
        flexDirection: 'row',
        alignItems: 'center',
      }}>
        <Ionicons name="call-outline" size={20} color="#9ca3af" />
        <TextInput
          style={{ flex: 1, color: '#e5e5e5', fontSize: 16, marginLeft: 12 }}
          placeholder="+63 917 123 4567"
          placeholderTextColor="#6b7280"
          value={businessInfo.phone}
          onChangeText={(text) => setBusinessInfo({ ...businessInfo, phone: text })}
          keyboardType="phone-pad"
        />
      </View>

      {/* Email */}
      <Text style={{ color: '#9ca3af', fontSize: 12, marginBottom: 6 }}>Business Email</Text>
      <View style={{
        backgroundColor: '#3d2a52',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginBottom: 24,
        flexDirection: 'row',
        alignItems: 'center',
      }}>
        <Ionicons name="mail-outline" size={20} color="#9ca3af" />
        <TextInput
          style={{ flex: 1, color: '#e5e5e5', fontSize: 16, marginLeft: 12 }}
          placeholder="business@email.com"
          placeholderTextColor="#6b7280"
          value={businessInfo.email}
          onChangeText={(text) => setBusinessInfo({ ...businessInfo, email: text })}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>
    </ScrollView>
  );

  const renderStep2 = () => (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
      <Text style={{ color: '#e5e5e5', fontSize: 18, fontWeight: '600', marginBottom: 8 }}>
        Verification Documents
      </Text>
      <Text style={{ color: '#9ca3af', fontSize: 14, marginBottom: 24 }}>
        Upload the required documents to verify your business
      </Text>

      {/* Valid ID */}
      <View style={{
        backgroundColor: '#2d1f3d',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: documents.validId ? '#22c55e' : '#4a3660',
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <View style={{
            backgroundColor: '#3d2a52',
            padding: 10,
            borderRadius: 10,
            marginRight: 12,
          }}>
            <Ionicons name="id-card-outline" size={24} color="#a855f7" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#e5e5e5', fontSize: 16, fontWeight: '500' }}>
              Valid Government ID *
            </Text>
            <Text style={{ color: '#9ca3af', fontSize: 12 }}>
              Driver's License, Passport, or National ID
            </Text>
          </View>
          {documents.validId && (
            <Ionicons name="checkmark-circle" size={24} color="#22c55e" />
          )}
        </View>
        <TouchableOpacity
          onPress={() => pickDocument('validId')}
          style={{
            backgroundColor: documents.validId ? '#3d2a52' : '#9333ea',
            paddingVertical: 12,
            borderRadius: 10,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <Ionicons
            name={documents.validId ? 'refresh' : 'cloud-upload-outline'}
            size={20}
            color="#fff"
          />
          <Text style={{ color: '#fff', fontWeight: '600' }}>
            {documents.validId ? 'Replace Document' : 'Upload Document'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Business Permit (Optional) */}
      <View style={{
        backgroundColor: '#2d1f3d',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: documents.businessPermit ? '#22c55e' : '#4a3660',
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <View style={{
            backgroundColor: '#3d2a52',
            padding: 10,
            borderRadius: 10,
            marginRight: 12,
          }}>
            <Ionicons name="document-text-outline" size={24} color="#a855f7" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#e5e5e5', fontSize: 16, fontWeight: '500' }}>
              Business Permit
            </Text>
            <Text style={{ color: '#9ca3af', fontSize: 12 }}>
              Optional but recommended for faster approval
            </Text>
          </View>
          {documents.businessPermit && (
            <Ionicons name="checkmark-circle" size={24} color="#22c55e" />
          )}
        </View>
        <TouchableOpacity
          onPress={() => pickDocument('businessPermit')}
          style={{
            backgroundColor: '#3d2a52',
            paddingVertical: 12,
            borderRadius: 10,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <Ionicons
            name={documents.businessPermit ? 'refresh' : 'cloud-upload-outline'}
            size={20}
            color="#a855f7"
          />
          <Text style={{ color: '#a855f7', fontWeight: '600' }}>
            {documents.businessPermit ? 'Replace Document' : 'Upload Document'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Terms and Conditions */}
      <TouchableOpacity
        onPress={() => setAgreedToTerms(!agreedToTerms)}
        style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          backgroundColor: '#2d1f3d',
          padding: 16,
          borderRadius: 16,
          marginTop: 8,
        }}
      >
        <View style={{
          width: 24,
          height: 24,
          borderRadius: 6,
          borderWidth: 2,
          borderColor: agreedToTerms ? '#9333ea' : '#4a3660',
          backgroundColor: agreedToTerms ? '#9333ea' : 'transparent',
          justifyContent: 'center',
          alignItems: 'center',
          marginRight: 12,
        }}>
          {agreedToTerms && (
            <Ionicons name="checkmark" size={16} color="#fff" />
          )}
        </View>
        <Text style={{ flex: 1, color: '#9ca3af', fontSize: 14, lineHeight: 20 }}>
          I agree to Vendora's{' '}
          <Text style={{ color: '#a855f7' }}>Vendor Terms of Service</Text>
          {' '}and{' '}
          <Text style={{ color: '#a855f7' }}>Seller Guidelines</Text>.
          I confirm that all information provided is accurate.
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderStep3 = () => (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
      <View style={{ alignItems: 'center', marginBottom: 24 }}>
        <View style={{
          backgroundColor: '#9333ea',
          width: 80,
          height: 80,
          borderRadius: 40,
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 16,
        }}>
          <Ionicons name="storefront" size={40} color="#fff" />
        </View>
        <Text style={{ color: '#e5e5e5', fontSize: 20, fontWeight: 'bold', marginBottom: 8 }}>
          Review Your Application
        </Text>
        <Text style={{ color: '#9ca3af', fontSize: 14, textAlign: 'center' }}>
          Please review your information before submitting
        </Text>
      </View>

      {/* Business Info Summary */}
      <View style={{
        backgroundColor: '#2d1f3d',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
      }}>
        <Text style={{ color: '#a855f7', fontSize: 14, fontWeight: '600', marginBottom: 12 }}>
          BUSINESS INFORMATION
        </Text>

        <View style={{ gap: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: '#9ca3af', fontSize: 14 }}>Business Name</Text>
            <Text style={{ color: '#e5e5e5', fontSize: 14, fontWeight: '500' }}>
              {businessInfo.businessName}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: '#9ca3af', fontSize: 14 }}>Business Type</Text>
            <Text style={{ color: '#e5e5e5', fontSize: 14, fontWeight: '500' }}>
              {BUSINESS_TYPES.find(t => t.id === businessInfo.businessType)?.label}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: '#9ca3af', fontSize: 14 }}>Address</Text>
            <Text style={{ color: '#e5e5e5', fontSize: 14, fontWeight: '500', textAlign: 'right', flex: 1, marginLeft: 20 }}>
              {businessInfo.address}{businessInfo.city ? `, ${businessInfo.city}` : ''}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: '#9ca3af', fontSize: 14 }}>Contact</Text>
            <Text style={{ color: '#e5e5e5', fontSize: 14, fontWeight: '500' }}>
              {businessInfo.phone}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: '#9ca3af', fontSize: 14 }}>Email</Text>
            <Text style={{ color: '#e5e5e5', fontSize: 14, fontWeight: '500' }}>
              {businessInfo.email}
            </Text>
          </View>
        </View>
      </View>

      {/* Documents Summary */}
      <View style={{
        backgroundColor: '#2d1f3d',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
      }}>
        <Text style={{ color: '#a855f7', fontSize: 14, fontWeight: '600', marginBottom: 12 }}>
          DOCUMENTS
        </Text>

        <View style={{ gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ color: '#9ca3af', fontSize: 14 }}>Valid ID</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="checkmark-circle" size={18} color="#22c55e" />
              <Text style={{ color: '#22c55e', fontSize: 14 }}>Uploaded</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ color: '#9ca3af', fontSize: 14 }}>Business Permit</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              {documents.businessPermit ? (
                <>
                  <Ionicons name="checkmark-circle" size={18} color="#22c55e" />
                  <Text style={{ color: '#22c55e', fontSize: 14 }}>Uploaded</Text>
                </>
              ) : (
                <Text style={{ color: '#9ca3af', fontSize: 14 }}>Not provided</Text>
              )}
            </View>
          </View>
        </View>
      </View>

      {/* What's Next */}
      <View style={{
        backgroundColor: '#2d1f3d',
        borderRadius: 16,
        padding: 16,
      }}>
        <Text style={{ color: '#a855f7', fontSize: 14, fontWeight: '600', marginBottom: 12 }}>
          WHAT'S NEXT?
        </Text>

        <View style={{ gap: 12 }}>
          {[
            { icon: 'time-outline', text: 'Review takes 2-3 business days' },
            { icon: 'mail-outline', text: 'You\'ll receive an email notification' },
            { icon: 'rocket-outline', text: 'Start selling once approved!' },
          ].map((item, index) => (
            <View key={index} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{
                backgroundColor: '#3d2a52',
                padding: 8,
                borderRadius: 8,
              }}>
                <Ionicons name={item.icon} size={18} color="#a855f7" />
              </View>
              <Text style={{ color: '#e5e5e5', fontSize: 14 }}>{item.text}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );

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
              {currentStep > 1 ? (
                <TouchableOpacity onPress={handleBack}>
                  <Ionicons name="arrow-back" size={24} color="#e5e5e5" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={onClose}>
                  <Ionicons name="close" size={24} color="#e5e5e5" />
                </TouchableOpacity>
              )}
              <Text style={{
                color: '#e5e5e5',
                fontSize: 20,
                fontWeight: 'bold',
              }}>
                Become a Vendor
              </Text>
            </View>
          </View>

          {/* Step Indicator */}
          {renderStepIndicator()}

          {/* Step Content */}
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}

          {/* Footer Buttons */}
          <View style={{
            padding: 20,
            borderTopWidth: 1,
            borderTopColor: '#4a3660',
            backgroundColor: '#1a1025',
          }}>
            <TouchableOpacity
              onPress={currentStep === 3 ? handleSubmit : handleNext}
              style={{
                backgroundColor: '#9333ea',
                paddingVertical: 16,
                borderRadius: 12,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
                {currentStep === 3 ? 'Submit Application' : 'Continue'}
              </Text>
              {currentStep !== 3 && (
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
