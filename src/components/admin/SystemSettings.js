import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAdmin } from '../../context/AdminContext';

const SECTIONS = [
  {
    id: 'business',
    title: 'Business Information',
    icon: 'business',
    fields: [
      { key: 'name', label: 'Business Name', type: 'text' },
      { key: 'address', label: 'Address', type: 'text', multiline: true },
      { key: 'phone', label: 'Phone Number', type: 'phone' },
      { key: 'email', label: 'Email', type: 'email' },
      { key: 'tin', label: 'TIN/Tax ID', type: 'text' },
    ],
  },
  {
    id: 'tax',
    title: 'Tax Settings',
    icon: 'calculator',
    fields: [
      { key: 'enabled', label: 'Enable Tax', type: 'switch' },
      { key: 'rate', label: 'Tax Rate (%)', type: 'number' },
      { key: 'seniorDiscount', label: 'Senior Discount (%)', type: 'number' },
      { key: 'pwdDiscount', label: 'PWD Discount (%)', type: 'number' },
    ],
  },
  {
    id: 'payments',
    title: 'Payment Methods',
    icon: 'card',
    fields: [
      { key: 'cashEnabled', label: 'Cash Payments', type: 'switch' },
      { key: 'cardEnabled', label: 'Card Payments', type: 'switch' },
      { key: 'ewalletEnabled', label: 'E-Wallet Payments', type: 'switch' },
    ],
  },
  {
    id: 'pos',
    title: 'POS Settings',
    icon: 'cart',
    fields: [
      { key: 'requireCustomer', label: 'Require Customer for Sale', type: 'switch' },
      { key: 'lowStockThreshold', label: 'Low Stock Threshold', type: 'number' },
      { key: 'allowNegativeStock', label: 'Allow Negative Stock', type: 'switch' },
    ],
  },
];

export default function SystemSettings() {
  const { settings, updateSettings, resetSettings } = useAdmin();
  const [expandedSections, setExpandedSections] = useState(['business']);
  const [editingField, setEditingField] = useState(null);
  const [tempValue, setTempValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const toggleSection = (sectionId) => {
    setExpandedSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const startEditing = (sectionId, fieldKey, currentValue) => {
    setEditingField(`${sectionId}.${fieldKey}`);
    setTempValue(String(currentValue ?? ''));
  };

  const cancelEditing = () => {
    setEditingField(null);
    setTempValue('');
  };

  const saveField = async (sectionId, fieldKey, value) => {
    setIsSaving(true);
    try {
      const field = SECTIONS.find((s) => s.id === sectionId)?.fields.find(
        (f) => f.key === fieldKey
      );

      let processedValue = value;
      if (field?.type === 'number') {
        processedValue = parseFloat(value) || 0;
      }

      await updateSettings(sectionId, { [fieldKey]: processedValue });
      setEditingField(null);
      setTempValue('');
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = async (sectionId, fieldKey, newValue) => {
    try {
      await updateSettings(sectionId, { [fieldKey]: newValue });
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handleResetSettings = () => {
    Alert.alert(
      'Reset Settings',
      'Are you sure you want to reset all settings to default values?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await resetSettings();
              Alert.alert('Success', 'Settings have been reset to defaults');
            } catch (error) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  const renderField = (section, field) => {
    const value = settings[section.id]?.[field.key];
    const isEditing = editingField === `${section.id}.${field.key}`;

    if (field.type === 'switch') {
      return (
        <View style={styles.fieldRow} key={field.key}>
          <Text style={styles.fieldLabel}>{field.label}</Text>
          <Switch
            value={!!value}
            onValueChange={(newValue) => handleToggle(section.id, field.key, newValue)}
            trackColor={{ false: '#4a3660', true: '#9333ea' }}
            thumbColor={value ? '#a855f7' : '#9ca3af'}
          />
        </View>
      );
    }

    if (isEditing) {
      return (
        <View style={styles.editingField} key={field.key}>
          <Text style={styles.fieldLabel}>{field.label}</Text>
          <View style={styles.editInputRow}>
            <TextInput
              style={[styles.editInput, field.multiline && styles.editInputMultiline]}
              value={tempValue}
              onChangeText={setTempValue}
              keyboardType={
                field.type === 'number'
                  ? 'numeric'
                  : field.type === 'phone'
                  ? 'phone-pad'
                  : field.type === 'email'
                  ? 'email-address'
                  : 'default'
              }
              multiline={field.multiline}
              autoFocus
              placeholder={`Enter ${field.label.toLowerCase()}`}
              placeholderTextColor="#6b7280"
            />
            <View style={styles.editActions}>
              <TouchableOpacity
                style={styles.editActionButton}
                onPress={cancelEditing}
              >
                <Ionicons name="close" size={20} color="#ef4444" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.editActionButton, styles.saveButton]}
                onPress={() => saveField(section.id, field.key, tempValue)}
                disabled={isSaving}
              >
                <Ionicons name="checkmark" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    }

    return (
      <TouchableOpacity
        style={styles.fieldRow}
        key={field.key}
        onPress={() => startEditing(section.id, field.key, value)}
      >
        <View style={styles.fieldContent}>
          <Text style={styles.fieldLabel}>{field.label}</Text>
          <Text style={styles.fieldValue}>
            {value || <Text style={styles.fieldPlaceholder}>Not set</Text>}
            {field.type === 'number' && value && field.key.includes('Discount')
              ? '%'
              : field.type === 'number' && field.key === 'rate'
              ? '%'
              : ''}
          </Text>
        </View>
        <Ionicons name="create-outline" size={18} color="#9ca3af" />
      </TouchableOpacity>
    );
  };

  const renderSection = (section) => {
    const isExpanded = expandedSections.includes(section.id);

    return (
      <View style={styles.section} key={section.id}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => toggleSection(section.id)}
          activeOpacity={0.7}
        >
          <View style={styles.sectionHeaderLeft}>
            <View style={styles.sectionIcon}>
              <Ionicons name={section.icon} size={20} color="#a855f7" />
            </View>
            <Text style={styles.sectionTitle}>{section.title}</Text>
          </View>
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color="#9ca3af"
          />
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.sectionContent}>
            {section.fields.map((field) => renderField(section, field))}
          </View>
        )}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>System Configuration</Text>
        <Text style={styles.headerSubtitle}>
          Manage your business settings, tax configuration, and POS preferences
        </Text>
      </View>

      {SECTIONS.map(renderSection)}

      {/* Reset Button */}
      <TouchableOpacity
        style={styles.resetButton}
        onPress={handleResetSettings}
      >
        <Ionicons name="refresh" size={20} color="#ef4444" />
        <Text style={styles.resetButtonText}>Reset to Default Settings</Text>
      </TouchableOpacity>

      <View style={styles.spacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1025',
  },
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    color: '#e5e5e5',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  headerSubtitle: {
    color: '#9ca3af',
    fontSize: 13,
    lineHeight: 18,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#2d1f3d',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#4a3660',
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#9333ea20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    color: '#e5e5e5',
    fontSize: 16,
    fontWeight: '600',
  },
  sectionContent: {
    borderTopWidth: 1,
    borderTopColor: '#4a3660',
  },
  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#4a3660',
  },
  fieldContent: {
    flex: 1,
  },
  fieldLabel: {
    color: '#9ca3af',
    fontSize: 13,
    marginBottom: 2,
  },
  fieldValue: {
    color: '#e5e5e5',
    fontSize: 15,
  },
  fieldPlaceholder: {
    color: '#6b7280',
    fontStyle: 'italic',
  },
  editingField: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#4a3660',
  },
  editInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  editInput: {
    flex: 1,
    backgroundColor: '#3d2a52',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#e5e5e5',
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#a855f7',
  },
  editInputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  editActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editActionButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#3d2a52',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4a3660',
  },
  saveButton: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  resetButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#ef444420',
    borderWidth: 1,
    borderColor: '#ef444440',
  },
  resetButtonText: {
    color: '#ef4444',
    fontSize: 15,
    fontWeight: '600',
  },
  spacer: {
    height: 100,
  },
});
