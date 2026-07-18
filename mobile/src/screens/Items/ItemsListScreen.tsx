import React from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, RefreshControl } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useItems } from "../../lib/query/hooks/useItems";
import { formatRelative } from "@shared/utils/format";
import { Card } from "../../components/ui/Card";
import type { Item } from "@shared/types";
import type { ItemsStackParamList } from "../../navigation/types";

type Nav = NativeStackNavigationProp<ItemsStackParamList, "ItemsList">;

const STATUS_COLOR: Record<Item["status"], string> = {
  active: "#00E6A0",
  draft: "#FFB800",
  inactive: "#808099",
};

export function ItemsListScreen() {
  const nav = useNavigation<Nav>();
  const { data: items = [], isLoading, refetch, isRefetching } = useItems();

  if (isLoading) {
    return (
      <View className="flex-1 bg-bg-dark items-center justify-center">
        <ActivityIndicator size="large" color="#FF5E1A" />
      </View>
    );
  }

  return (
    <FlashList
      data={items}
      keyExtractor={(item) => item.id}
      estimatedItemSize={100}
      contentContainerStyle={{ padding: 16 }}
      ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#FF5E1A" />
      }
      ListEmptyComponent={
        <Text className="text-center text-text-muted-dark mt-12 text-[15px]">No items yet</Text>
      }
      renderItem={({ item }) => (
        <TouchableOpacity
          onPress={() => nav.navigate("ItemDetail", { id: item.id })}
          activeOpacity={0.8}
        >
          <Card className="gap-2">
            <Text className="text-base font-bold text-white">{item.title}</Text>
            {item.description ? (
              <Text className="text-sm text-text-secondary-dark leading-5" numberOfLines={2}>
                {item.description}
              </Text>
            ) : null}
            <Text
              className="text-[11px] font-bold tracking-wide"
              style={{ color: STATUS_COLOR[item.status] }}
            >
              {item.status.toUpperCase()} · {formatRelative(item.created_at)}
            </Text>
          </Card>
        </TouchableOpacity>
      )}
    />
  );
}
