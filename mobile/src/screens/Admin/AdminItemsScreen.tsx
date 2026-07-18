import React, { useCallback, useState } from "react";
import { FlatList, Text, TouchableOpacity, Alert, StyleSheet, RefreshControl } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { supabase } from "../../../supabase/client";
import { fetchItems, updateItem, deleteItem } from "@shared/services/itemService";
import { formatRelative } from "@shared/utils/format";
import { colors } from "@shared/constants/theme";
import { Card } from "../../components/ui/Card";
import type { Item } from "@shared/types";

export function AdminItemsScreen() {
  const { t } = useTranslation();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const result = await fetchItems(supabase);
    setItems(result.data);
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  function confirmDelete(item: Item) {
    Alert.alert(
      t("admin.deleteItemTitle"),
      t("admin.deleteItemMessage", { title: item.title }),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: async () => {
            await deleteItem(supabase, item.id);
            setItems((prev) => prev.filter((i) => i.id !== item.id));
          },
        },
      ],
    );
  }

  async function toggleStatus(item: Item) {
    const next: Item["status"] = item.status === "active" ? "inactive" : "active";
    await updateItem(supabase, item.id, { status: next });
    setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, status: next } : i));
  }

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={styles.content}
      data={items}
      keyExtractor={(item) => item.id}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.primary} />}
      ListEmptyComponent={<Text style={styles.empty}>{t("items.noItems")}</Text>}
      renderItem={({ item }) => (
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardMeta}>{item.status.toUpperCase()} · {formatRelative(item.created_at)}</Text>
          <TouchableOpacity onPress={() => toggleStatus(item)} activeOpacity={0.8}>
            <Text style={styles.action}>
              {item.status === "active" ? t("admin.deactivate") : t("admin.activate")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => confirmDelete(item)} activeOpacity={0.8}>
            <Text style={styles.danger}>{t("common.delete")}</Text>
          </TouchableOpacity>
        </Card>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, gap: 12, flexGrow: 1 },
  empty: { textAlign: "center", color: colors.textMuted, marginTop: 48 },
  card: { gap: 10 },
  cardTitle: { fontSize: 16, fontWeight: "700", color: colors.textPrimary },
  cardMeta: { fontSize: 12, color: colors.textMuted, fontWeight: "600" },
  action: { fontSize: 14, color: colors.primary, fontWeight: "600" },
  danger: { fontSize: 14, color: colors.danger, fontWeight: "600" },
});
