import React from "react";
import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

export default function ReportsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-vendora-bg">
      <View className="flex-1 items-center justify-center px-6">
        <View className="bg-vendora-card p-6 rounded-2xl items-center">
          <Ionicons name="bar-chart-outline" size={64} color="#a855f7" />
          <Text className="text-vendora-text text-2xl font-bold mt-4">
            Reports
          </Text>
          <Text className="text-vendora-muted text-center mt-2">
            View sales analytics and business insights
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
