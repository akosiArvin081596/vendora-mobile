import React, { useState, useEffect, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { removeBackground } from 'react-native-background-remover';

const UNITS = ['pc', 'bag', 'bottle', 'pack', 'set', 'box', 'kg', 'liter'];

export default function AddProductModal({
  visible,
  onClose,
  onAddProduct,
  existingProduct,
  onUpdateProduct,
  categories = [],
  onSuccess,
}) {
  const isEditing = !!existingProduct;
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [price, setPrice] = useState('');
  const [cost, setCost] = useState('');
  const [currency, setCurrency] = useState('PHP');
  const [stock, setStock] = useState('');
  const [minStock, setMinStock] = useState('');
  const [maxStock, setMaxStock] = useState('');
  const [unit, setUnit] = useState('pc');
  const [category, setCategory] = useState('general');
  const [isActive, setIsActive] = useState(true);
  const [isEcommerce, setIsEcommerce] = useState(true);
  const [image, setImage] = useState('');
  const [description, setDescription] = useState('');
  const [showUnitPicker, setShowUnitPicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [hasBulkPricing, setHasBulkPricing] = useState(false);
  const [bulkPricing, setBulkPricing] = useState([]);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRemovingBackground, setIsRemovingBackground] = useState(false);

  const categoryOptions = useMemo(() => {
    if (categories && categories.length > 0) {
      return categories.filter((c) => c.value !== 'all');
    }
    return [
      { value: 'general', label: 'General' },
    ];
  }, [categories]);

  useEffect(() => {
    if (visible) {
      if (existingProduct) {
        setName(existingProduct.name);
        setSku(existingProduct.sku);
        setBarcode(existingProduct.barcode || '');
        setPrice(existingProduct.price.toString());
        setCost(existingProduct.cost?.toString() || '');
        setCurrency(existingProduct.currency || 'PHP');
        setStock(existingProduct.stock.toString());
        setMinStock(existingProduct.min_stock?.toString() || '');
        setMaxStock(existingProduct.max_stock?.toString() || '');
        setUnit(existingProduct.unit);
        // Normalize category to string value if it's an object
        const categoryValue = typeof existingProduct.category === 'object'
          ? (existingProduct.category?.slug || existingProduct.category?.id || existingProduct.category?.name || 'general')
          : existingProduct.category;
        setCategory(categoryValue);
        setIsActive(
          existingProduct.is_active ??
          existingProduct.isActive ??
          true
        );
        setIsEcommerce(
          existingProduct.is_ecommerce ??
          existingProduct.isEcommerce ??
          existingProduct.is_public ??
          existingProduct.isPublic ??
          true
        );
        setImage(existingProduct.image || '');
        setDescription(existingProduct.description || '');
        // ProductContext normalizes bulk_pricing to bulkPricing with minQty and decimal prices
        const pricing = existingProduct.bulkPricing || [];
        setHasBulkPricing(pricing.length > 0);
        setBulkPricing(pricing.map((tier) => ({
          minQty: tier.minQty?.toString() || '',
          price: tier.price?.toString() || '',
        })));
      } else {
        setName('');
        setSku('');
        setBarcode('');
        setPrice('');
        setCost('');
        setCurrency('PHP');
        setStock('');
        setMinStock('');
        setMaxStock('');
        setUnit('pc');
        setCategory(categoryOptions[0]?.value || 'general');
        setIsActive(true);
        setIsEcommerce(true);
        setImage('');
        setDescription('');
        setHasBulkPricing(false);
        setBulkPricing([]);
      }
    }
  }, [visible, existingProduct, categoryOptions]);

  const addBulkTier = () => {
    setBulkPricing([...bulkPricing, { minQty: '', price: '' }]);
  };

  const removeBulkTier = (index) => {
    setBulkPricing(bulkPricing.filter((_, i) => i !== index));
  };

  const updateBulkTier = (index, field, value) => {
    const updated = [...bulkPricing];
    updated[index] = { ...updated[index], [field]: value };
    setBulkPricing(updated);
  };

  const pickImageFromCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera permission is needed to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImage(result.assets[0].uri);
    }
  };

  const pickImageFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Gallery permission is needed to select photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImage(result.assets[0].uri);
    }
  };

  const removeImage = () => {
    setImage('');
  };

  const handleRemoveBackground = async () => {
    if (!image) return;

    setIsRemovingBackground(true);
    try {
      const result = await removeBackground(image);
      if (result) {
        setImage(result);
        Alert.alert('Success', 'Background removed successfully!');
      }
    } catch (error) {
      console.error('Background removal error:', error);
      Alert.alert(
        'Error',
        'Failed to remove background. This feature requires iOS 15+ or Android with ML Kit support.'
      );
    } finally {
      setIsRemovingBackground(false);
    }
  };

  const openBarcodeScanner = async () => {
    if (!cameraPermission?.granted) {
      const permission = await requestCameraPermission();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Camera permission is needed to scan barcodes.');
        return;
      }
    }
    setScanned(false);
    setShowBarcodeScanner(true);
  };

  const handleBarcodeScanned = ({ type, data }) => {
    if (scanned) return;
    setScanned(true);
    setBarcode(data);
    setShowBarcodeScanner(false);
  };

  const validateForm = () => {
    if (!name.trim()) {
      Alert.alert('Missing Field', 'Please enter a product name');
      return false;
    }
    if (!sku.trim()) {
      Alert.alert('Missing Field', 'Please enter a SKU');
      return false;
    }
    if (!price.trim() || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
      Alert.alert('Invalid Price', 'Please enter a valid price');
      return false;
    }
    if (!stock.trim() || isNaN(parseInt(stock, 10)) || parseInt(stock, 10) < 0) {
      Alert.alert('Invalid Stock', 'Please enter a valid stock quantity');
      return false;
    }
    if (cost.trim() && (isNaN(parseFloat(cost)) || parseFloat(cost) < 0)) {
      Alert.alert('Invalid Cost', 'Please enter a valid cost');
      return false;
    }
    if (minStock.trim() && (isNaN(parseInt(minStock, 10)) || parseInt(minStock, 10) < 0)) {
      Alert.alert('Invalid Min Stock', 'Please enter a valid minimum stock');
      return false;
    }
    if (maxStock.trim() && (isNaN(parseInt(maxStock, 10)) || parseInt(maxStock, 10) < 0)) {
      Alert.alert('Invalid Max Stock', 'Please enter a valid maximum stock');
      return false;
    }
    if (currency.trim() && currency.trim().length !== 3) {
      Alert.alert('Invalid Currency', 'Currency should be a 3-letter code');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    const selectedCategory = categoryOptions.find((c) => c.value === category);
    const categoryPayload = selectedCategory?.id
      ? { category_id: selectedCategory.id }
      : { category };

    const productData = {
      name: name.trim(),
      sku: sku.trim().toUpperCase(),
      barcode: barcode.trim() || undefined,
      price: parseFloat(price),
      stock: parseInt(stock, 10),
      cost: cost.trim() ? parseFloat(cost) : undefined,
      currency: currency.trim() || 'PHP',
      min_stock: minStock.trim() ? parseInt(minStock, 10) : undefined,
      max_stock: maxStock.trim() ? parseInt(maxStock, 10) : undefined,
      unit,
      ...categoryPayload,
      description: description.trim() || undefined,
      is_active: isActive,
      is_ecommerce: isEcommerce,
      image: image.trim() || null,
      bulk_pricing: hasBulkPricing
        ? bulkPricing
            .filter((tier) => tier.minQty && tier.price && parseInt(tier.minQty, 10) >= 2)
            .map((tier) => ({
              min_qty: parseInt(tier.minQty, 10),
              price: parseFloat(tier.price),
            }))
        : [],
    };

    setIsSubmitting(true);
    try {
      if (isEditing) {
        await onUpdateProduct(existingProduct.id, productData);
        if (onSuccess) {
          onSuccess('Product updated successfully');
        }
      } else {
        await onAddProduct(productData);
        if (onSuccess) {
          onSuccess('Product added successfully');
        }
      }
      onClose();
    } catch (error) {
      Alert.alert('Error', error?.message || 'Failed to save product');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <TouchableOpacity
          className="flex-1 bg-black/70 items-center justify-center px-4"
          activeOpacity={1}
          onPress={onClose}
        >
          <TouchableOpacity
            activeOpacity={1}
            className="bg-vendora-card rounded-3xl w-full max-w-md max-h-[90%]"
            onPress={(e) => e.stopPropagation()}
          >
            <ScrollView className="p-6" showsVerticalScrollIndicator={false}>
              {/* Header */}
              <View className="flex-row items-center justify-between mb-5">
                <View className="flex-row items-center gap-3">
                  <View
                    className={`p-2.5 rounded-xl border ${
                      isEditing
                        ? 'bg-blue-500/20 border-blue-500'
                        : 'bg-vendora-purple/20 border-vendora-purple'
                    }`}
                    style={
                      Platform.OS === 'web'
                        ? { boxShadow: isEditing
                            ? '0px 2px 8px rgba(59, 130, 246, 0.25)'
                            : '0px 2px 8px rgba(168, 85, 247, 0.25)'
                          }
                        : { elevation: 3 }
                    }
                  >
                    <Ionicons
                      name={isEditing ? 'create' : 'add-circle'}
                      size={22}
                      color={isEditing ? '#3b82f6' : '#a855f7'}
                    />
                  </View>
                  <Text className="text-vendora-text font-semibold text-xl">
                    {isEditing ? 'Edit Product' : 'Add New Product'}
                  </Text>
                </View>
                <TouchableOpacity
                  className="p-2.5 rounded-xl bg-vendora-input border border-vendora-border"
                  onPress={onClose}
                >
                  <Ionicons name="close" size={22} color="#9ca3af" />
                </TouchableOpacity>
              </View>

              {/* Product Name */}
              <Text className="text-vendora-text text-sm mb-2">Product Name *</Text>
              <View className="flex-row items-center gap-3 bg-vendora-input rounded-xl px-4 py-3 mb-4">
                <Ionicons name="cube-outline" size={20} color="#a855f7" />
                <TextInput
                  className="flex-1 text-base"
                  style={{ color: '#e5e5e5' }}
                  placeholder="Enter product name"
                  placeholderTextColor="#9ca3af"
                  value={name}
                  onChangeText={setName}
                />
              </View>

              {/* SKU */}
              <Text className="text-vendora-text text-sm mb-2">SKU *</Text>
              <View className="flex-row items-center gap-3 bg-vendora-input rounded-xl px-4 py-3 mb-4">
                <Ionicons name="pricetag-outline" size={20} color="#a855f7" />
                <TextInput
                  className="flex-1 text-base"
                  style={{ color: '#e5e5e5' }}
                  placeholder="e.g., GR-1001"
                  placeholderTextColor="#9ca3af"
                  value={sku}
                  onChangeText={setSku}
                  autoCapitalize="characters"
                />
              </View>

              {/* Barcode */}
              <Text className="text-vendora-text text-sm mb-2">Barcode (optional)</Text>
              <View className="flex-row items-center gap-2 mb-4">
                <View className="flex-1 flex-row items-center gap-3 bg-vendora-input rounded-xl px-4 py-3">
                  <Ionicons name="barcode-outline" size={20} color="#a855f7" />
                  <TextInput
                    className="flex-1 text-base"
                    style={{ color: '#e5e5e5' }}
                    placeholder="Scan or enter barcode"
                    placeholderTextColor="#9ca3af"
                    value={barcode}
                    onChangeText={setBarcode}
                  />
                </View>
                <TouchableOpacity
                  className="p-3 rounded-xl bg-vendora-purple/20 border border-vendora-purple"
                  onPress={openBarcodeScanner}
                  style={
                    Platform.OS === 'web'
                      ? { boxShadow: '0px 2px 8px rgba(168, 85, 247, 0.25)' }
                      : { elevation: 3 }
                  }
                >
                  <Ionicons name="scan" size={22} color="#a855f7" />
                </TouchableOpacity>
              </View>

              {/* Product Image */}
              <Text className="text-vendora-text text-sm mb-2">Product Image (optional)</Text>
              {image ? (
                <View className="mb-4">
                  <View className="relative">
                    <Image
                      source={{ uri: image }}
                      style={{
                        width: '100%',
                        height: 200,
                        borderRadius: 12,
                        backgroundColor: '#ffffff',
                      }}
                      resizeMode="cover"
                    />
                    <TouchableOpacity
                      onPress={removeImage}
                      style={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        backgroundColor: 'rgba(239, 68, 68, 0.9)',
                        borderRadius: 20,
                        padding: 8,
                      }}
                    >
                      <Ionicons name="trash-outline" size={20} color="#fff" />
                    </TouchableOpacity>
                  </View>
                  <View className="flex-row gap-2 mt-2">
                    <TouchableOpacity
                      className="flex-1 flex-row items-center justify-center gap-2 bg-vendora-input py-2.5 rounded-xl"
                      onPress={pickImageFromCamera}
                    >
                      <Ionicons name="camera-outline" size={18} color="#a855f7" />
                      <Text style={{ color: '#a855f7', fontSize: 13 }}>Retake</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      className="flex-1 flex-row items-center justify-center gap-2 bg-vendora-input py-2.5 rounded-xl"
                      onPress={pickImageFromGallery}
                    >
                      <Ionicons name="images-outline" size={18} color="#a855f7" />
                      <Text style={{ color: '#a855f7', fontSize: 13 }}>Replace</Text>
                    </TouchableOpacity>
                  </View>
                  {/* Remove Background Button */}
                  {Platform.OS !== 'web' && (
                    <TouchableOpacity
                      className="flex-row items-center justify-center gap-2 bg-vendora-purple/20 border border-vendora-purple py-3 rounded-xl mt-2"
                      onPress={handleRemoveBackground}
                      disabled={isRemovingBackground}
                    >
                      {isRemovingBackground ? (
                        <>
                          <ActivityIndicator size="small" color="#a855f7" />
                          <Text style={{ color: '#a855f7', fontSize: 14, fontWeight: '600' }}>
                            Removing Background...
                          </Text>
                        </>
                      ) : (
                        <>
                          <Ionicons name="cut-outline" size={20} color="#a855f7" />
                          <Text style={{ color: '#a855f7', fontSize: 14, fontWeight: '600' }}>
                            Remove Background
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                <View className="flex-row gap-3 mb-4">
                  <TouchableOpacity
                    className="flex-1 bg-vendora-purple/20 border-2 border-dashed border-vendora-purple rounded-xl py-6 items-center"
                    onPress={pickImageFromCamera}
                  >
                    <View className="bg-vendora-purple/30 p-3 rounded-full mb-2">
                      <Ionicons name="camera" size={28} color="#a855f7" />
                    </View>
                    <Text style={{ color: '#a855f7', fontWeight: '600', fontSize: 14 }}>Camera</Text>
                    <Text style={{ color: '#9ca3af', fontSize: 11 }}>Take a photo</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="flex-1 bg-vendora-input border-2 border-dashed border-vendora-border rounded-xl py-6 items-center"
                    onPress={pickImageFromGallery}
                  >
                    <View className="bg-vendora-card p-3 rounded-full mb-2">
                      <Ionicons name="images" size={28} color="#9ca3af" />
                    </View>
                    <Text style={{ color: '#9ca3af', fontWeight: '600', fontSize: 14 }}>Gallery</Text>
                    <Text style={{ color: '#6b7280', fontSize: 11 }}>Upload image</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Description */}
              <Text className="text-vendora-text text-sm mb-2">Description (optional)</Text>
              <View className="bg-vendora-input rounded-xl px-4 py-3 mb-4">
                <TextInput
                  className="text-base"
                  style={{ color: '#e5e5e5', minHeight: 80 }}
                  placeholder="Add product details"
                  placeholderTextColor="#9ca3af"
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  textAlignVertical="top"
                />
              </View>

              {/* Price and Stock Row */}
              <View className="flex-row gap-3 mb-4">
                <View className="flex-1">
                  <Text className="text-vendora-text text-sm mb-2">Price (₱) *</Text>
                  <View className="flex-row items-center gap-3 bg-vendora-input rounded-xl px-4 py-3">
                    <Ionicons name="cash-outline" size={20} color="#a855f7" />
                    <TextInput
                      className="flex-1 text-base"
                      style={{ color: '#e5e5e5' }}
                      placeholder="0.00"
                      placeholderTextColor="#9ca3af"
                      value={price}
                      onChangeText={setPrice}
                      keyboardType="decimal-pad"
                    />
                  </View>
                </View>
                <View className="flex-1">
                  <Text className="text-vendora-text text-sm mb-2">Stock *</Text>
                  <View className="flex-row items-center gap-3 bg-vendora-input rounded-xl px-4 py-3">
                    <Ionicons name="layers-outline" size={20} color="#a855f7" />
                    <TextInput
                      className="flex-1 text-base"
                      style={{ color: '#e5e5e5' }}
                      placeholder="0"
                      placeholderTextColor="#9ca3af"
                      value={stock}
                      onChangeText={setStock}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              </View>

              {/* Cost and Currency Row */}
              <View className="flex-row gap-3 mb-4">
                <View className="flex-1">
                  <Text className="text-vendora-text text-sm mb-2">Cost (optional)</Text>
                  <View className="flex-row items-center gap-3 bg-vendora-input rounded-xl px-4 py-3">
                    <Ionicons name="wallet-outline" size={20} color="#a855f7" />
                    <TextInput
                      className="flex-1 text-base"
                      style={{ color: '#e5e5e5' }}
                      placeholder="0.00"
                      placeholderTextColor="#9ca3af"
                      value={cost}
                      onChangeText={setCost}
                      keyboardType="decimal-pad"
                    />
                  </View>
                </View>
                <View className="flex-1">
                  <Text className="text-vendora-text text-sm mb-2">Currency</Text>
                  <View className="flex-row items-center gap-3 bg-vendora-input rounded-xl px-4 py-3">
                    <Ionicons name="cash-outline" size={20} color="#a855f7" />
                    <TextInput
                      className="flex-1 text-base"
                      style={{ color: '#e5e5e5' }}
                      placeholder="PHP"
                      placeholderTextColor="#9ca3af"
                      value={currency}
                      onChangeText={setCurrency}
                      autoCapitalize="characters"
                      maxLength={3}
                    />
                  </View>
                </View>
              </View>

              {/* Min/Max Stock Row */}
              <View className="flex-row gap-3 mb-4">
                <View className="flex-1">
                  <Text className="text-vendora-text text-sm mb-2">Min Stock (optional)</Text>
                  <View className="flex-row items-center gap-3 bg-vendora-input rounded-xl px-4 py-3">
                    <Ionicons name="alert-circle-outline" size={20} color="#a855f7" />
                    <TextInput
                      className="flex-1 text-base"
                      style={{ color: '#e5e5e5' }}
                      placeholder="0"
                      placeholderTextColor="#9ca3af"
                      value={minStock}
                      onChangeText={setMinStock}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
                <View className="flex-1">
                  <Text className="text-vendora-text text-sm mb-2">Max Stock (optional)</Text>
                  <View className="flex-row items-center gap-3 bg-vendora-input rounded-xl px-4 py-3">
                    <Ionicons name="archive-outline" size={20} color="#a855f7" />
                    <TextInput
                      className="flex-1 text-base"
                      style={{ color: '#e5e5e5' }}
                      placeholder="0"
                      placeholderTextColor="#9ca3af"
                      value={maxStock}
                      onChangeText={setMaxStock}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              </View>

              {/* Unit and Category Row */}
              <View className="flex-row gap-3 mb-4">
                <View className="flex-1">
                  <Text className="text-vendora-text text-sm mb-2">Unit</Text>
                  <TouchableOpacity
                    className="flex-row items-center justify-between bg-vendora-input rounded-xl px-4 py-3"
                    onPress={() => setShowUnitPicker(true)}
                  >
                    <Text className="text-vendora-text text-base capitalize">{unit}</Text>
                    <Ionicons name="chevron-down" size={16} color="#9ca3af" />
                  </TouchableOpacity>
                </View>
                <View className="flex-1">
              <Text className="text-vendora-text text-sm mb-2">Category</Text>
              <TouchableOpacity
                className="flex-row items-center justify-between bg-vendora-input rounded-xl px-4 py-3"
                onPress={() => setShowCategoryPicker(true)}
              >
                <Text className="text-vendora-text text-base capitalize">
                  {categoryOptions.find((c) => c.value === category)?.label ||
                    (typeof category === 'object' ? (category?.name || category?.slug || 'General') : category)}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#9ca3af" />
              </TouchableOpacity>
            </View>
          </View>

              {/* Active Toggle */}
              <TouchableOpacity
                className={`flex-row items-center justify-between p-4 rounded-xl mb-4 ${
                  isActive ? 'bg-vendora-purple/20 border-2 border-vendora-purple' : 'bg-vendora-input'
                }`}
                onPress={() => setIsActive(!isActive)}
              >
                <View className="flex-row items-center gap-3">
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={24}
                    color={isActive ? '#a855f7' : '#9ca3af'}
                  />
                  <View>
                    <Text className={`font-medium ${isActive ? 'text-vendora-purple-light' : 'text-vendora-muted'}`}>
                      Active Product
                    </Text>
                    <Text style={{ color: '#9ca3af', fontSize: 12 }}>
                      Controls product availability
                    </Text>
                  </View>
                </View>
                <View className={`w-12 h-7 rounded-full ${isActive ? 'bg-vendora-purple' : 'bg-gray-600'} justify-center`}>
                  <View
                    className={`w-5 h-5 rounded-full bg-white ${
                      isActive ? 'ml-6' : 'ml-1'
                    }`}
                  />
                </View>
              </TouchableOpacity>

              {/* Add to E-Commerce Toggle */}
              <TouchableOpacity
                className={`flex-row items-center justify-between p-4 rounded-xl mb-4 ${
                  isEcommerce ? 'bg-vendora-purple/20 border-2 border-vendora-purple' : 'bg-vendora-input'
                }`}
                onPress={() => setIsEcommerce(!isEcommerce)}
              >
                <View className="flex-row items-center gap-3">
                  <Ionicons
                    name="storefront"
                    size={24}
                    color={isEcommerce ? '#a855f7' : '#9ca3af'}
                  />
                  <View>
                    <Text className={`font-medium ${isEcommerce ? 'text-vendora-purple-light' : 'text-vendora-muted'}`}>
                      Add to E-Commerce?
                    </Text>
                    <Text style={{ color: '#9ca3af', fontSize: 12 }}>
                      Show this product on the store page
                    </Text>
                  </View>
                </View>
                <View className={`w-12 h-7 rounded-full ${isEcommerce ? 'bg-vendora-purple' : 'bg-gray-600'} justify-center`}>
                  <View
                    className={`w-5 h-5 rounded-full bg-white ${
                      isEcommerce ? 'ml-6' : 'ml-1'
                    }`}
                  />
                </View>
              </TouchableOpacity>

              {/* Bulk Pricing Toggle */}
              <TouchableOpacity
                className={`flex-row items-center justify-between p-4 rounded-xl mb-4 ${
                  hasBulkPricing ? 'bg-vendora-purple/20 border-2 border-vendora-purple' : 'bg-vendora-input'
                }`}
                onPress={() => {
                  setHasBulkPricing(!hasBulkPricing);
                  if (!hasBulkPricing && bulkPricing.length === 0) {
                    setBulkPricing([{ minQty: '', price: '' }]);
                  }
                }}
              >
                <View className="flex-row items-center gap-3">
                  <Ionicons
                    name="pricetags"
                    size={24}
                    color={hasBulkPricing ? '#a855f7' : '#9ca3af'}
                  />
                  <View>
                    <Text className={`font-medium ${hasBulkPricing ? 'text-vendora-purple-light' : 'text-vendora-muted'}`}>
                      Bulk Pricing
                    </Text>
                    <Text style={{ color: '#9ca3af', fontSize: 12 }}>
                      Set different prices for quantities
                    </Text>
                  </View>
                </View>
                <View className={`w-12 h-7 rounded-full ${hasBulkPricing ? 'bg-vendora-purple' : 'bg-gray-600'} justify-center`}>
                  <View
                    className={`w-5 h-5 rounded-full bg-white ${
                      hasBulkPricing ? 'ml-6' : 'ml-1'
                    }`}
                  />
                </View>
              </TouchableOpacity>

              {/* Bulk Pricing Tiers */}
              {hasBulkPricing && (
                <View className="bg-vendora-input rounded-xl p-4 mb-6">
                  <Text style={{ color: '#e5e5e5', fontWeight: '600', marginBottom: 12 }}>
                    Pricing Tiers
                  </Text>

                  {bulkPricing.map((tier, index) => (
                    <View key={index} className="flex-row items-center gap-2 mb-3">
                      <View className="flex-1">
                        <Text style={{ color: '#9ca3af', fontSize: 11, marginBottom: 4 }}>Min Qty</Text>
                        <View className="bg-vendora-card rounded-lg px-3 py-2">
                          <TextInput
                            style={{ color: '#e5e5e5', fontSize: 14 }}
                            placeholder="e.g., 10"
                            placeholderTextColor="#6b7280"
                            value={tier.minQty?.toString() || ''}
                            onChangeText={(val) => updateBulkTier(index, 'minQty', val ? parseInt(val, 10) : '')}
                            keyboardType="numeric"
                          />
                        </View>
                      </View>
                      <View className="flex-1">
                        <Text style={{ color: '#9ca3af', fontSize: 11, marginBottom: 4 }}>Price (₱)</Text>
                        <View className="bg-vendora-card rounded-lg px-3 py-2">
                          <TextInput
                            style={{ color: '#e5e5e5', fontSize: 14 }}
                            placeholder="e.g., 45.00"
                            placeholderTextColor="#6b7280"
                            value={tier.price?.toString() || ''}
                            onChangeText={(val) => updateBulkTier(index, 'price', val ? parseFloat(val) : '')}
                            keyboardType="decimal-pad"
                          />
                        </View>
                      </View>
                      <TouchableOpacity
                        onPress={() => removeBulkTier(index)}
                        className="bg-red-500/20 p-2 rounded-lg mt-4"
                      >
                        <Ionicons name="trash-outline" size={18} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  ))}

                  <TouchableOpacity
                    onPress={addBulkTier}
                    className="flex-row items-center justify-center gap-2 bg-vendora-purple/20 py-3 rounded-xl mt-2"
                  >
                    <Ionicons name="add-circle-outline" size={20} color="#a855f7" />
                    <Text style={{ color: '#a855f7', fontWeight: '500' }}>Add Tier</Text>
                  </TouchableOpacity>

                  <Text style={{ color: '#9ca3af', fontSize: 11, marginTop: 8, textAlign: 'center' }}>
                    Example: Buy 10+ at ₱45/unit, Buy 50+ at ₱40/unit
                  </Text>
                </View>
              )}

              {/* Submit Button */}
              <TouchableOpacity
                className={`py-4 rounded-2xl flex-row items-center justify-center gap-2 border ${
                  isEditing
                    ? 'bg-blue-500/20 border-blue-500'
                    : 'bg-vendora-purple/20 border-vendora-purple'
                }`}
                onPress={handleSubmit}
                disabled={isSubmitting}
                style={
                  Platform.OS === 'web'
                    ? { boxShadow: isEditing
                        ? '0px 3px 10px rgba(59, 130, 246, 0.3)'
                        : '0px 3px 10px rgba(168, 85, 247, 0.3)'
                      }
                    : { elevation: 5 }
                }
              >
                <Ionicons
                  name={isSubmitting ? 'hourglass' : isEditing ? 'checkmark-circle' : 'add-circle'}
                  size={22}
                  color={isEditing ? '#3b82f6' : '#a855f7'}
                />
                <Text
                  style={{
                    color: isEditing ? '#3b82f6' : '#a855f7',
                    fontSize: 16,
                    fontWeight: '600',
                  }}
                >
                  {isSubmitting ? 'Saving...' : isEditing ? 'Update Product' : 'Add Product'}
                </Text>
              </TouchableOpacity>

              {/* Bottom spacing for scroll */}
              <View className="h-4" />
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>

        {/* Unit Picker Modal */}
        <Modal
          visible={showUnitPicker}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowUnitPicker(false)}
        >
          <TouchableOpacity
            className="flex-1 bg-black/70 items-center justify-center px-4"
            activeOpacity={1}
            onPress={() => setShowUnitPicker(false)}
          >
            <View className="bg-vendora-card rounded-2xl w-full max-w-xs overflow-hidden">
              <Text className="text-vendora-text font-semibold text-lg p-4 border-b border-vendora-border">
                Select Unit
              </Text>
              {UNITS.map((u) => (
                <TouchableOpacity
                  key={u}
                  className={`p-4 border-b border-vendora-border ${
                    unit === u ? 'bg-vendora-purple/20' : ''
                  }`}
                  onPress={() => {
                    setUnit(u);
                    setShowUnitPicker(false);
                  }}
                >
                  <Text
                    className={`text-base capitalize ${
                      unit === u ? 'text-vendora-purple-light font-semibold' : 'text-vendora-text'
                    }`}
                  >
                    {u}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Category Picker Modal */}
        <Modal
          visible={showCategoryPicker}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowCategoryPicker(false)}
        >
          <TouchableOpacity
            className="flex-1 bg-black/70 items-center justify-center px-4"
            activeOpacity={1}
          onPress={() => setShowCategoryPicker(false)}
        >
          <View className="bg-vendora-card rounded-2xl w-full max-w-xs overflow-hidden">
            <Text className="text-vendora-text font-semibold text-lg p-4 border-b border-vendora-border">
              Select Category
            </Text>
            {categoryOptions.map((c) => (
              <TouchableOpacity
                key={c.value}
                className={`p-4 border-b border-vendora-border ${
                  category === c.value ? 'bg-vendora-purple/20' : ''
                }`}
                  onPress={() => {
                    setCategory(c.value);
                    setShowCategoryPicker(false);
                  }}
                >
                  <Text
                    className={`text-base ${
                      category === c.value ? 'text-vendora-purple-light font-semibold' : 'text-vendora-text'
                    }`}
                  >
                    {c.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Barcode Scanner Modal */}
        <Modal
          visible={showBarcodeScanner}
          animationType="slide"
          onRequestClose={() => setShowBarcodeScanner(false)}
        >
          <View style={{ flex: 1, backgroundColor: '#000' }}>
            {/* Scanner Header */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 20,
              paddingTop: 50,
              paddingBottom: 20,
              backgroundColor: 'rgba(0,0,0,0.8)',
            }}>
              <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold' }}>
                Scan Barcode
              </Text>
              <TouchableOpacity
                onPress={() => setShowBarcodeScanner(false)}
                style={{
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  padding: 10,
                  borderRadius: 20,
                }}
              >
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Camera View */}
            <View style={{ flex: 1 }}>
              <CameraView
                style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                facing="back"
                barcodeScannerSettings={{
                  barcodeTypes: [
                    'ean13',
                    'ean8',
                    'upc_a',
                    'upc_e',
                    'code128',
                    'code39',
                    'code93',
                    'codabar',
                    'itf14',
                    'qr',
                  ],
                }}
                onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
              />
              {/* Scanner Overlay - positioned absolutely on top of camera */}
              <View style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                justifyContent: 'center',
                alignItems: 'center',
              }}>
                <View style={{
                  width: 280,
                  height: 180,
                  borderWidth: 3,
                  borderColor: '#a855f7',
                  borderRadius: 16,
                  backgroundColor: 'transparent',
                }}>
                  {/* Corner accents */}
                  <View style={{ position: 'absolute', top: -3, left: -3, width: 30, height: 30, borderTopWidth: 5, borderLeftWidth: 5, borderColor: '#a855f7', borderTopLeftRadius: 16 }} />
                  <View style={{ position: 'absolute', top: -3, right: -3, width: 30, height: 30, borderTopWidth: 5, borderRightWidth: 5, borderColor: '#a855f7', borderTopRightRadius: 16 }} />
                  <View style={{ position: 'absolute', bottom: -3, left: -3, width: 30, height: 30, borderBottomWidth: 5, borderLeftWidth: 5, borderColor: '#a855f7', borderBottomLeftRadius: 16 }} />
                  <View style={{ position: 'absolute', bottom: -3, right: -3, width: 30, height: 30, borderBottomWidth: 5, borderRightWidth: 5, borderColor: '#a855f7', borderBottomRightRadius: 16 }} />
                </View>
                <Text style={{
                  color: '#fff',
                  marginTop: 24,
                  fontSize: 16,
                  textAlign: 'center',
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  paddingHorizontal: 20,
                  paddingVertical: 10,
                  borderRadius: 20,
                }}>
                  Position barcode within the frame
                </Text>
              </View>
            </View>

            {/* Bottom Actions */}
            <View style={{
              backgroundColor: 'rgba(0,0,0,0.8)',
              paddingHorizontal: 20,
              paddingVertical: 30,
              alignItems: 'center',
            }}>
              {scanned && (
                <TouchableOpacity
                  onPress={() => setScanned(false)}
                  style={{
                    backgroundColor: '#9333ea',
                    paddingHorizontal: 30,
                    paddingVertical: 15,
                    borderRadius: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <Ionicons name="refresh" size={20} color="#fff" />
                  <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>
                    Scan Again
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </Modal>
  );
}
