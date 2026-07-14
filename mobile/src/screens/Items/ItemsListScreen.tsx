import React, { useCallback, useState } from "react";
import { FlatList, Text, TouchableOpacity, ActivityIndicator, StyleSheet, RefreshControl } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { supabase } from "../../../supabase/client";
import { fetchItems } from "../../../../shared/services/itemService";
import { formatRelative } from "../../../../shared/utils/format";
import { colors, radius } from "../../../../shared/constants/theme";
import { Card } from "../../components/ui/Card";
import type { Item } from "../../../../shared/types";
import type { ItemsStackParamList } from "../../navigation/types";

type Nav = NativeStackNavigationProp<ItemsStackParamList, "ItemsList">;

const STATUS_COLOR: Record<Item["status"], string> = {
  active: colors.success,
  draft: colors.warning,
  inactive: colors.textMuted,
};

export function ItemsListScreen() {
  const nav = useNavigation<Nav>();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const result = await fetchItems(supabase);
    setItems(result.data);
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (loading && items.length === 0) {
    return (
      <ActivityIndicator style={styles.spinner} size="large" color={colors.primary} />
    );
  }

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={styles.content}
      data={items}
      keyExtractor={(item) => item.id}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.primary} />}
      ListEmptyComponent={<Text style={styles.empty}>No items yet</Text>}
      renderItem={({ item }) => (
        <TouchableOpacity onPress={() => nav.navigate("ItemDetail", { id: item.id })} activeOpacity={0.8}>
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            {item.description ? <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text> : null}
            <Text style={[styles.cardStatus, { color: STATUS_COLOR[item.status] }]}>
              {item.status.toUpperCase()} · {formatRelative(item.created_at)}
            </Text>
          </Card>
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, gap: 12, flexGrow: 1 },
  spinner: { flex: 1, backgroundColor: colors.bg },
  empty: { textAlign: "center", color: colors.textMuted, marginTop: 48, fontSize: 15 },
  card: { gap: 8 },
  cardTitle: { fontSize: 16, fontWeight: "700", color: colors.textPrimary },
  cardDesc: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
  cardStatus: { fontSize: 11, fontWeight: "700", letterSpacing: 0.6 },
});
