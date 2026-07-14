import React, { useEffect, useState } from "react";
import { Text, View, StyleSheet } from "react-native";
import { supabase } from "../../../supabase/client";
import { fetchProfile } from "../../../../shared/services/profileService";
import { colors } from "../../../../shared/constants/theme";
import { ScreenContainer } from "../../components/layout/ScreenContainer";
import { Card } from "../../components/ui/Card";
import type { User } from "../../../../shared/types";

export function HomeScreen() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const profile = await fetchProfile(supabase, data.user.id, data.user.email ?? "");
      setUser(profile);
    });
  }, []);

  return (
    <ScreenContainer title="Home">
      <Card style={styles.welcomeCard}>
        <Text style={styles.welcomeEmoji}>👋</Text>
        <Text style={styles.welcomeTitle}>
          Welcome{user?.display_name ? `, ${user.display_name}` : ""}!
        </Text>
        <Text style={styles.welcomeBody}>
          This is your template app. Replace this screen with your home content.
        </Text>
      </Card>

      <View style={styles.statsRow}>
        {[
          { label: "Items", value: "0" },
          { label: "Users", value: "0" },
          { label: "Active", value: "0" },
        ].map(({ label, value }) => (
          <Card key={label} style={styles.statCard}>
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
          </Card>
        ))}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  welcomeCard: { alignItems: "center", marginBottom: 24, paddingVertical: 32 },
  welcomeEmoji: { fontSize: 48, marginBottom: 12 },
  welcomeTitle: { fontSize: 22, fontWeight: "800", color: colors.textPrimary, marginBottom: 8 },
  welcomeBody: { fontSize: 14, color: colors.textSecondary, textAlign: "center", lineHeight: 20 },
  statsRow: { flexDirection: "row", gap: 12 },
  statCard: { flex: 1, alignItems: "center", paddingVertical: 20 },
  statValue: { fontSize: 28, fontWeight: "900", color: colors.primary },
  statLabel: { fontSize: 12, color: colors.textMuted, fontWeight: "600", marginTop: 4 },
});
