import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { colors, radius } from "@shared/constants/theme";

interface Props {
  onBack: () => void;
}

export function ConfirmationScreen({ onBack }: Props) {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>📬</Text>
      <Text style={styles.title}>{t("auth.checkInbox")}</Text>
      <Text style={styles.body}>{t("auth.confirmationBody")}</Text>
      <TouchableOpacity style={styles.ghostBtn} onPress={onBack} activeOpacity={0.7}>
        <Text style={styles.ghostBtnText}>{t("auth.backToSignIn")}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, justifyContent: "center", alignItems: "center", padding: 24 },
  icon: { fontSize: 56, marginBottom: 20 },
  title: { fontSize: 28, fontWeight: "800", color: colors.text, marginBottom: 12 },
  body: { fontSize: 16, color: colors.textMuted, textAlign: "center", lineHeight: 26, marginBottom: 24 },
  ghostBtn: { paddingVertical: 14, paddingHorizontal: 32, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border },
  ghostBtnText: { color: colors.textMuted, fontSize: 14, fontWeight: "600" },
});
