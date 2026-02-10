import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAdmin } from '../../context/AdminContext';
import { useAuth } from '../../context/AuthContext';
import { ROLES, getRoleDisplayName, canManageUser, PERMISSIONS } from '../../utils/permissions';

const AVAILABLE_ROLES = [
  { id: ROLES.ADMIN, label: 'Administrator' },
  { id: ROLES.VENDOR, label: 'Vendor' },
];

export default function UserFormModal({ visible, onClose, user }) {
  const { createUser, updateUser } = useAdmin();
  const { currentUser, checkPermission } = useAuth();
  const isEditing = !!user;

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    role: ROLES.CASHIER,
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Determine which roles the current user can assign
  const assignableRoles = AVAILABLE_ROLES.filter((role) => {
    if (currentUser?.role === ROLES.ADMIN) {
      return true; // Admin can assign any role
    }
    if (currentUser?.role === ROLES.MANAGER) {
      // Manager can only assign Cashier or Customer
      return [ROLES.CASHIER, ROLES.CUSTOMER].includes(role.id);
    }
    return false;
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        password: '',
        confirmPassword: '',
        phone: user.phone || '',
        role: user.role || ROLES.CASHIER,
      });
    } else {
      setFormData({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        role: ROLES.CASHIER,
      });
    }
    setErrors({});
  }, [user, visible]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!isEditing) {
      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (formData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
      }

      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    } else if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    } else if (formData.password && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      if (isEditing) {
        const updates = {
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone.trim(),
          role: formData.role,
        };
        if (formData.password) {
          updates.password = formData.password;
        }
        await updateUser(user.id, updates);
        Alert.alert('Success', 'User updated successfully');
      } else {
        await createUser({
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
          phone: formData.phone.trim(),
          role: formData.role,
        });
        Alert.alert('Success', 'User created successfully');
      }
      onClose();
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              {isEditing ? 'Edit User' : 'Create New User'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Name Field */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Full Name *</Text>
              <View style={[styles.inputContainer, errors.name && styles.inputError]}>
                <Ionicons name="person-outline" size={20} color="#9ca3af" />
                <TextInput
                  style={styles.input}
                  placeholder="Enter full name"
                  placeholderTextColor="#6b7280"
                  value={formData.name}
                  onChangeText={(text) => updateField('name', text)}
                />
              </View>
              {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
            </View>

            {/* Email Field */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Email Address *</Text>
              <View style={[styles.inputContainer, errors.email && styles.inputError]}>
                <Ionicons name="mail-outline" size={20} color="#9ca3af" />
                <TextInput
                  style={styles.input}
                  placeholder="Enter email address"
                  placeholderTextColor="#6b7280"
                  value={formData.email}
                  onChangeText={(text) => updateField('email', text)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            </View>

            {/* Phone Field */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="call-outline" size={20} color="#9ca3af" />
                <TextInput
                  style={styles.input}
                  placeholder="Enter phone number"
                  placeholderTextColor="#6b7280"
                  value={formData.phone}
                  onChangeText={(text) => updateField('phone', text)}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            {/* Role Selection */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Role *</Text>
              <View style={styles.rolesContainer}>
                {assignableRoles.map((role) => (
                  <TouchableOpacity
                    key={role.id}
                    style={[
                      styles.roleOption,
                      formData.role === role.id && styles.roleOptionActive,
                    ]}
                    onPress={() => updateField('role', role.id)}
                  >
                    <Ionicons
                      name={formData.role === role.id ? 'radio-button-on' : 'radio-button-off'}
                      size={20}
                      color={formData.role === role.id ? '#a855f7' : '#9ca3af'}
                    />
                    <Text
                      style={[
                        styles.roleLabel,
                        formData.role === role.id && styles.roleLabelActive,
                      ]}
                    >
                      {role.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Password Field */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                Password {isEditing ? '(leave blank to keep current)' : '*'}
              </Text>
              <View style={[styles.inputContainer, errors.password && styles.inputError]}>
                <Ionicons name="lock-closed-outline" size={20} color="#9ca3af" />
                <TextInput
                  style={styles.input}
                  placeholder={isEditing ? 'Enter new password' : 'Enter password'}
                  placeholderTextColor="#6b7280"
                  value={formData.password}
                  onChangeText={(text) => updateField('password', text)}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                    size={20}
                    color="#9ca3af"
                  />
                </TouchableOpacity>
              </View>
              {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
            </View>

            {/* Confirm Password Field */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Confirm Password</Text>
              <View style={[styles.inputContainer, errors.confirmPassword && styles.inputError]}>
                <Ionicons name="lock-closed-outline" size={20} color="#9ca3af" />
                <TextInput
                  style={styles.input}
                  placeholder="Confirm password"
                  placeholderTextColor="#6b7280"
                  value={formData.confirmPassword}
                  onChangeText={(text) => updateField('confirmPassword', text)}
                  secureTextEntry={!showPassword}
                />
              </View>
              {errors.confirmPassword && (
                <Text style={styles.errorText}>{errors.confirmPassword}</Text>
              )}
            </View>

            <View style={styles.spacer} />
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              disabled={isSubmitting}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              <Text style={styles.submitButtonText}>
                {isSubmitting ? 'Saving...' : isEditing ? 'Update User' : 'Create User'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#2d1f3d',
    borderRadius: 20,
    width: '90%',
    maxWidth: 450,
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: '#4a3660',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#4a3660',
  },
  headerTitle: {
    color: '#e5e5e5',
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    color: '#9ca3af',
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3d2a52',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#4a3660',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  input: {
    flex: 1,
    color: '#e5e5e5',
    fontSize: 16,
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
  },
  rolesContainer: {
    gap: 8,
  },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3d2a52',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4a3660',
    gap: 12,
  },
  roleOptionActive: {
    borderColor: '#a855f7',
    backgroundColor: '#3d2a52',
  },
  roleLabel: {
    color: '#9ca3af',
    fontSize: 15,
  },
  roleLabelActive: {
    color: '#e5e5e5',
    fontWeight: '500',
  },
  spacer: {
    height: 20,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#4a3660',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#3d2a52',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4a3660',
  },
  cancelButtonText: {
    color: '#9ca3af',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#9333ea',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
