import React from "react";
import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

export default function SettingsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-vendora-bg">
      <View className="flex-1 items-center justify-center px-6">
        <View className="bg-vendora-card p-6 rounded-2xl items-center">
          <Ionicons name="settings-outline" size={64} color="#a855f7" />
          <Text className="text-vendora-text text-2xl font-bold mt-4">
            Settings
          </Text>
          <Text className="text-vendora-muted text-center mt-2">
            Configure app preferences and user profile
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
