import React from "react";
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from "react-native";
import { colors, radius } from "../../../../shared/constants/theme";

interface Props {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "ghost";
  loading?: boolean;
  disabled?: boolean;
}

export function Button({ label, onPress, variant = "primary", loading, disabled }: Props) {
  return (
    <TouchableOpacity
      style={[styles.base, styles[variant], (disabled || loading) && styles.disabled]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading
        ? <ActivityIndicator color={variant === "primary" ? "#fff" : colors.primary} size="small" />
        : <Text style={[styles.label, styles[`${variant}Label`]]}>{label}</Text>
      }
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  primary: { backgroundColor: colors.primary },
  secondary: { borderWidth: 1.5, borderColor: colors.primary, backgroundColor: "transparent" },
  ghost: { backgroundColor: "transparent" },
  disabled: { opacity: 0.5 },
  label: { fontSize: 16, fontWeight: "700" },
  primaryLabel: { color: "#fff" },
  secondaryLabel: { color: colors.primary },
  ghostLabel: { color: colors.textSecondary },
});
