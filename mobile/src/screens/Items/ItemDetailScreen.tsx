import React, { useEffect, useState } from "react";
import { Text, ActivityIndicator, StyleSheet } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { supabase } from "../../../supabase/client";
import { fetchItem } from "../../../../shared/services/itemService";
import { formatDate } from "../../../../shared/utils/format";
import { colors } from "../../../../shared/constants/theme";
import { ScreenContainer } from "../../components/layout/ScreenContainer";
import { Card } from "../../components/ui/Card";
import type { Item } from "../../../../shared/types";
import type { ItemsStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<ItemsStackParamList, "ItemDetail">;

export function ItemDetailScreen({ route }: Props) {
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchItem(supabase, route.params.id).then((data) => {
      setItem(data);
      setLoading(false);
    });
  }, [route.params.id]);

  if (loading) return <ActivityIndicator style={styles.spinner} size="large" color={colors.primary} />;
  if (!item) return <Text style={styles.notFound}>Item not found</Text>;

  return (
    <ScreenContainer>
      <Text style={styles.title}>{item.title}</Text>
      {item.description ? <Text style={styles.desc}>{item.description}</Text> : null}
      <Card style={styles.meta}>
        <Text style={styles.metaRow}><Text style={styles.metaKey}>Status: </Text>{item.status}</Text>
        <Text style={styles.metaRow}><Text style={styles.metaKey}>Created: </Text>{formatDate(item.created_at)}</Text>
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  spinner: { flex: 1, backgroundColor: colors.bg },
  notFound: { flex: 1, textAlign: "center", color: colors.textMuted, paddingTop: 48 },
  title: { fontSize: 26, fontWeight: "800", color: colors.textPrimary, marginBottom: 12, letterSpacing: -0.4 },
  desc: { fontSize: 15, color: colors.textSecondary, lineHeight: 24, marginBottom: 20 },
  meta: { gap: 8 },
  metaRow: { fontSize: 14, color: colors.textSecondary },
  metaKey: { fontWeight: "700", color: colors.textMuted },
});
