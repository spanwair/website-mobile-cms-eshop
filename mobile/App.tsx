import "./src/global.css";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import React from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import FlashMessage from "react-native-flash-message";
import { ErrorBoundary } from "react-error-boundary";
import { View, Text, TouchableOpacity } from "react-native";
import { initI18n } from "../shared/i18n";
import { AppNavigator } from "./src/navigation/AppNavigator";
import { queryClient } from "./src/lib/query/client";

initI18n("en");

function ErrorFallback({ resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <View style={{ flex: 1, backgroundColor: "#0F0F1A", alignItems: "center", justifyContent: "center", padding: 32 }}>
      <Text style={{ fontSize: 48, marginBottom: 16 }}>💥</Text>
      <Text style={{ fontSize: 20, fontWeight: "800", color: "#fff", marginBottom: 8, textAlign: "center" }}>
        Something went wrong
      </Text>
      <TouchableOpacity
        onPress={resetErrorBoundary}
        style={{ marginTop: 16, backgroundColor: "#FF5E1A", paddingHorizontal: 32, paddingVertical: 14, borderRadius: 9999 }}
      >
        <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>Try again</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function App() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <AppNavigator />
          <FlashMessage position="top" />
        </GestureHandlerRootView>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
