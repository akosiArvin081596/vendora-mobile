import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen({ onLoginSuccess }) {
  const { login, isLoading, error, clearError } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleLogin = async () => {
    // Clear previous errors
    setLocalError('');
    clearError();

    // Validate inputs
    if (!email.trim()) {
      setLocalError('Email is required');
      return;
    }
    if (!password) {
      setLocalError('Password is required');
      return;
    }

    try {
      // Staff login: default to admin role for permission-gated areas
      const userType = 'admin';
      const user = await login(email.trim(), password, userType);
      if (onLoginSuccess) {
        onLoginSuccess(user);
      }
    } catch (err) {
      // Error is already set in AuthContext
    }
  };

  const displayError = localError || error;

  return (
    <SafeAreaView className="flex-1 bg-vendora-bg">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
          keyboardShouldPersistTaps="handled"
          className="px-6"
        >
          {/* Logo/Header */}
          <View className="items-center mb-10">
            <View
              className="w-20 h-20 bg-vendora-purple rounded-2xl items-center justify-center mb-4"
              style={
                Platform.OS === 'web'
                  ? { boxShadow: '0px 4px 12px rgba(147, 51, 234, 0.35)' }
                  : { elevation: 8 }
              }
            >
              <Ionicons name="cart" size={40} color="#fff" />
            </View>
            <Text className="text-vendora-text text-3xl font-bold">Vendora POS</Text>
            <Text className="text-vendora-text-muted text-base mt-1">
              Sign in to continue
            </Text>
          </View>

          {/* Error Message */}
          {displayError ? (
            <View className="bg-red-500/20 border border-red-500/50 rounded-xl px-4 py-3 mb-4 flex-row items-center gap-2">
              <Ionicons name="alert-circle" size={20} color="#ef4444" />
              <Text className="text-red-400 text-sm flex-1">{displayError}</Text>
              <TouchableOpacity onPress={() => { setLocalError(''); clearError(); }}>
                <Ionicons name="close" size={20} color="#ef4444" />
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Email Input */}
          <View className="mb-4">
            <Text className="text-vendora-text-muted text-sm mb-2 ml-1">Email</Text>
            <View className="flex-row items-center bg-vendora-input rounded-2xl px-4 py-3.5">
              <Ionicons name="mail-outline" size={20} color="#a855f7" />
              <TextInput
                className="flex-1 text-vendora-text text-base ml-3"
                placeholder="Enter your email"
                placeholderTextColor="#9ca3af"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                editable={!isLoading}
              />
            </View>
          </View>

          {/* Password Input */}
          <View className="mb-6">
            <Text className="text-vendora-text-muted text-sm mb-2 ml-1">Password</Text>
            <View className="flex-row items-center bg-vendora-input rounded-2xl px-4 py-3.5">
              <Ionicons name="lock-closed-outline" size={20} color="#a855f7" />
              <TextInput
                className="flex-1 text-vendora-text text-base ml-3"
                placeholder="Enter your password"
                placeholderTextColor="#9ca3af"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                editable={!isLoading}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#9ca3af"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Login Button */}
          <TouchableOpacity
            className={`py-4 rounded-2xl flex-row items-center justify-center ${
              isLoading ? 'bg-vendora-purple/50' : 'bg-vendora-purple'
            }`}
            onPress={handleLogin}
            disabled={isLoading}
            style={
              Platform.OS === 'web'
                ? { boxShadow: '0px 4px 12px rgba(147, 51, 234, 0.35)' }
                : { elevation: 8 }
            }
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="log-in-outline" size={20} color="#fff" />
                <Text className="text-white font-semibold text-lg ml-2">Sign In</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Footer */}
          <View className="mt-8 items-center">
            <Text className="text-vendora-text-muted text-sm">
              Point of Sale System
            </Text>
            <Text className="text-vendora-text-muted text-xs mt-1">
              v1.0.0
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
