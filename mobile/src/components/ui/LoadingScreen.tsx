import React from "react";
import { View, ActivityIndicator } from "react-native";

export function LoadingScreen() {
  return (
    <View className="flex-1 bg-[#0F0F1A] dark:bg-[#0F0F1A] items-center justify-center">
      <ActivityIndicator size="large" color="#FF5E1A" />
    </View>
  );
}
