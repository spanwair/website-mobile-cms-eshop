import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { colors } from "@shared/constants/theme";
import React from "react";
import { useTranslation } from "react-i18next";

import { ItemDetailScreen } from "./ItemDetailScreen";
import { ItemsListScreen } from "./ItemsListScreen";
import type { ItemsStackParamList } from "../../navigation/types";

const Stack = createNativeStackNavigator<ItemsStackParamList>();

export function ItemsStack() {
  const { t } = useTranslation();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: { fontWeight: "700" },
      }}
    >
      <Stack.Screen
        name="ItemsList"
        component={ItemsListScreen}
        options={{ title: t("items.title") }}
      />
      <Stack.Screen
        name="ItemDetail"
        component={ItemDetailScreen}
        options={{ title: t("items.itemDetail") }}
      />
    </Stack.Navigator>
  );
}
