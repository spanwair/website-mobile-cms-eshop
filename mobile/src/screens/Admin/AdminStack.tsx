import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { colors } from "../../../../shared/constants/theme";
import { AdminDashboardScreen } from "./AdminDashboardScreen";
import { AdminItemsScreen } from "./AdminItemsScreen";
import type { AdminStackParamList } from "../../navigation/types";

const Stack = createNativeStackNavigator<AdminStackParamList>();

export function AdminStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: { fontWeight: "700" },
      }}
    >
      <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} options={{ title: "Admin" }} />
      <Stack.Screen name="AdminItems" component={AdminItemsScreen} options={{ title: "Manage Items" }} />
    </Stack.Navigator>
  );
}
