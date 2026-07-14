import React, { useEffect, useState } from "react";
import { Text, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { supabase } from "../../../supabase/client";
import { fetchItems } from "../../../../shared/services/itemService";
import { fetchAllUsers } from "../../../../shared/services/profileService";
import { colors } from "../../../../shared/constants/theme";
import { ScreenContainer } from "../../components/layout/ScreenContainer";
import { Card } from "../../components/ui/Card";
import type { AdminStackParamList } from "../../navigation/types";

type Nav = NativeStackNavigationProp<AdminStackParamList, "AdminDashboard">;

export function AdminDashboardScreen() {
  const nav = useNavigation<Nav>();
  const [stats, setStats] = useState({ totalItems: 0, activeItems: 0, totalUsers: 0 });

  useEffect(() => {
    Promise.all([
      fetchItems(supabase, 1, 1),
      fetchItems(supabase, 1, 1, "active"),
      fetchAllUsers(supabase),
    ]).then(([all, active, users]) => {
      setStats({ totalItems: all.total, activeItems: active.total, totalUsers: users.length });
    });
  }, []);

  return (
    <ScreenContainer title="Admin Dashboard">
      <Card style={styles.statsCard}>
        {[
          { label: "Total Users", value: stats.totalUsers },
          { label: "Total Items", value: stats.totalItems },
          { label: "Active Items", value: stats.activeItems },
        ].map(({ label, value }) => (
          <Text key={label} style={styles.stat}>
            <Text style={styles.statNum}>{value} </Text>
            <Text style={styles.statLabel}>{label}</Text>
          </Text>
        ))}
      </Card>

      <TouchableOpacity style={styles.menuItem} onPress={() => nav.navigate("AdminItems")} activeOpacity={0.8}>
        <Card>
          <Text style={styles.menuTitle}>Manage Items</Text>
          <Text style={styles.menuDesc}>View, edit, and delete all items</Text>
        </Card>
      </TouchableOpacity>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  statsCard: { marginBottom: 24, gap: 12 },
  stat: { fontSize: 16 },
  statNum: { fontWeight: "900", color: colors.primary, fontSize: 22 },
  statLabel: { color: colors.textSecondary },
  menuItem: { marginBottom: 12 },
  menuTitle: { fontSize: 17, fontWeight: "700", color: colors.textPrimary, marginBottom: 4 },
  menuDesc: { fontSize: 13, color: colors.textSecondary },
});
