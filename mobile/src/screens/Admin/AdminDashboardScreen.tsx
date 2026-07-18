import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { supabase } from "../../../supabase/client";
import { fetchItems } from "@shared/services/itemService";
import { fetchAllUsers } from "@shared/services/profileService";
import { colors, shadow } from "@shared/constants/theme";
import { ScreenContainer } from "../../components/layout/ScreenContainer";
import type { AdminStackParamList } from "../../navigation/types";

type Nav = NativeStackNavigationProp<AdminStackParamList, "AdminDashboard">;

export function AdminDashboardScreen() {
  const nav = useNavigation<Nav>();
  const { t } = useTranslation();
  const [counts, setCounts] = useState({ users: 0, total: 0, active: 0, inactive: 0 });

  useEffect(() => {
    Promise.all([
      fetchItems(supabase, 1, 1),
      fetchItems(supabase, 1, 1, "active"),
      fetchItems(supabase, 1, 1, "inactive"),
      fetchAllUsers(supabase),
    ]).then(([all, active, inactive, users]) => {
      setCounts({ users: users.length, total: all.total, active: active.total, inactive: inactive.total });
    });
  }, []);

  const stats = [
    { label: t("admin.kpiTotalUsers"), value: counts.users },
    { label: t("admin.totalItems"), value: counts.total },
    { label: t("admin.activeItems"), value: counts.active },
    { label: t("admin.inactiveItems"), value: counts.inactive },
  ];

  return (
    <ScreenContainer title={t("admin.dashboardTitle")} scroll={false}>
      <View style={styles.grid}>
        {stats.map(({ label, value }) => (
          <View key={label} style={[styles.statCard, shadow.sm]}>
            <Text style={styles.statNum}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>{t("admin.actionsSection")}</Text>
      <TouchableOpacity
        style={[styles.actionCard, shadow.sm]}
        onPress={() => nav.navigate("AdminItems")}
        activeOpacity={0.8}
      >
        <Text style={styles.actionTitle}>{t("admin.manageItems")}</Text>
        <Text style={styles.actionDesc}>{t("admin.manageItemsDesc")}</Text>
      </TouchableOpacity>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 28,
  },
  statCard: {
    width: "47%",
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "flex-start",
  },
  statNum: {
    fontSize: 32,
    fontWeight: "900",
    color: colors.accent,
    letterSpacing: -1,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: "500",
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 12,
  },
  actionCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  actionDesc: {
    fontSize: 13,
    color: colors.textMuted,
  },
});
