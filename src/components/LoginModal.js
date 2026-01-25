import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

export default function LoginModal({ visible, onClose, onLogin }) {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const mapUserData = (user) => ({
    id: user?.id,
    name: user?.name || email.split('@')[0],
    email: user?.email || email,
    avatar: null,
    role: user?.role,
    ordersCount: 0,
    wishlistCount: 0,
    points: 0,
    membership: 'basic',
  });

  const handleSubmit = async () => {
    setErrorMessage('');

    const normalizedEmail = email.trim();
    const normalizedName = name.trim();

    if (!normalizedEmail || !password) {
      setErrorMessage('Email and password are required.');
      return;
    }

    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(normalizedEmail)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (!isLogin && !normalizedName) {
      setErrorMessage('Name is required.');
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    if (!isLogin && password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      let user;
      if (isLogin) {
        // Login only needs email and password
        user = await login(normalizedEmail, password);
      } else {
        // Registration for buyers: name, email, password
        const payload = {
          name: normalizedName,
          email: normalizedEmail,
          password,
          password_confirmation: confirmPassword,
        };
        user = await register(payload);
      }

      if (onLogin) {
        onLogin(mapUserData(user));
      }

      resetForm();
      onClose();
    } catch (error) {
      console.warn('Auth error:', error?.message);
      setErrorMessage(error?.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setErrorMessage('');
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    resetForm();
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
        style={{ flex: 1 }}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20,
        }}>
          <View style={{
            backgroundColor: '#2d1f3d',
            borderRadius: 20,
            padding: 24,
            width: '100%',
            maxWidth: 400,
            borderWidth: 1,
            borderColor: '#4a3660',
          }}>
            {/* Header */}
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 24,
            }}>
              <Text style={{
                color: '#e5e5e5',
                fontSize: 24,
                fontWeight: 'bold',
              }}>
                {isLogin ? 'Welcome Back' : 'Create Account'}
              </Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Name Field (Sign Up only) */}
              {!isLogin && (
                <View style={{ marginBottom: 16 }}>
                  <Text style={{
                    color: '#9ca3af',
                    fontSize: 14,
                    marginBottom: 8,
                  }}>
                    Full Name
                  </Text>
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: '#3d2a52',
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: '#4a3660',
                    paddingHorizontal: 12,
                  }}>
                    <Ionicons name="person-outline" size={20} color="#9ca3af" />
                    <TextInput
                      style={{
                        flex: 1,
                        color: '#e5e5e5',
                        fontSize: 16,
                        paddingVertical: 14,
                        paddingHorizontal: 12,
                      }}
                      placeholder="Enter your name"
                      placeholderTextColor="#6b7280"
                      value={name}
                      onChangeText={setName}
                      autoCapitalize="words"
                    />
                  </View>
                </View>
              )}

              {/* Email Field */}
              <View style={{ marginBottom: 16 }}>
                <Text style={{
                  color: '#9ca3af',
                  fontSize: 14,
                  marginBottom: 8,
                }}>
                  Email Address
                </Text>
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#3d2a52',
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: '#4a3660',
                  paddingHorizontal: 12,
                }}>
                  <Ionicons name="mail-outline" size={20} color="#9ca3af" />
                  <TextInput
                    style={{
                      flex: 1,
                      color: '#e5e5e5',
                      fontSize: 16,
                      paddingVertical: 14,
                      paddingHorizontal: 12,
                    }}
                    placeholder="Enter your email"
                    placeholderTextColor="#6b7280"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              {/* Password Field */}
              <View style={{ marginBottom: 16 }}>
                <Text style={{
                  color: '#9ca3af',
                  fontSize: 14,
                  marginBottom: 8,
                }}>
                  Password
                </Text>
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#3d2a52',
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: '#4a3660',
                  paddingHorizontal: 12,
                }}>
                  <Ionicons name="lock-closed-outline" size={20} color="#9ca3af" />
                  <TextInput
                    style={{
                      flex: 1,
                      color: '#e5e5e5',
                      fontSize: 16,
                      paddingVertical: 14,
                      paddingHorizontal: 12,
                    }}
                    placeholder="Enter your password"
                    placeholderTextColor="#6b7280"
                    value={password}
                    onChangeText={setPassword}
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
              </View>

              {/* Confirm Password Field (Sign Up only) */}
              {!isLogin && (
                <View style={{ marginBottom: 16 }}>
                  <Text style={{
                    color: '#9ca3af',
                    fontSize: 14,
                    marginBottom: 8,
                  }}>
                    Confirm Password
                  </Text>
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: '#3d2a52',
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: '#4a3660',
                    paddingHorizontal: 12,
                  }}>
                    <Ionicons name="lock-closed-outline" size={20} color="#9ca3af" />
                    <TextInput
                      style={{
                        flex: 1,
                        color: '#e5e5e5',
                        fontSize: 16,
                        paddingVertical: 14,
                        paddingHorizontal: 12,
                      }}
                      placeholder="Confirm your password"
                      placeholderTextColor="#6b7280"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry={!showPassword}
                    />
                  </View>
                </View>
              )}

              {errorMessage ? (
                <View style={{ marginBottom: 12 }}>
                  <Text style={{ color: '#ef4444', fontSize: 13 }}>
                    {errorMessage}
                  </Text>
                </View>
              ) : null}

              {/* Forgot Password (Login only) */}
              {isLogin && (
                <TouchableOpacity style={{ alignSelf: 'flex-end', marginBottom: 24 }}>
                  <Text style={{ color: '#a855f7', fontSize: 14 }}>
                    Forgot Password?
                  </Text>
                </TouchableOpacity>
              )}

              {/* Submit Button */}
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={isSubmitting}
                style={{
                  backgroundColor: '#9333ea',
                  borderRadius: 12,
                  paddingVertical: 16,
                  alignItems: 'center',
                  marginTop: isLogin ? 0 : 8,
                  opacity: isSubmitting ? 0.7 : 1,
                  ...(Platform.OS === 'web'
                    ? { boxShadow: '0px 4px 12px rgba(147, 51, 234, 0.35)' }
                    : { elevation: 4 }),
                }}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={{
                    color: '#fff',
                    fontSize: 16,
                    fontWeight: 'bold',
                  }}>
                    {isLogin ? 'Sign In' : 'Create Account'}
                  </Text>
                )}
              </TouchableOpacity>


              {/* Toggle Login/Sign Up */}
              <View style={{
                flexDirection: 'row',
                justifyContent: 'center',
                marginTop: 24,
              }}>
                <Text style={{ color: '#9ca3af', fontSize: 14 }}>
                  {isLogin ? "Don't have an account? " : 'Already have an account? '}
                </Text>
                <TouchableOpacity onPress={toggleMode}>
                  <Text style={{ color: '#a855f7', fontSize: 14, fontWeight: '600' }}>
                    {isLogin ? 'Sign Up' : 'Sign In'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
