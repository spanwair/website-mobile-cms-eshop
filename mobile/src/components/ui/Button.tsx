import React from "react";
import { TouchableOpacity, Text, ActivityIndicator, View, StyleSheet } from "react-native";
import { colors } from "@shared/constants/theme";

interface Props {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}

export function Button({
  label,
  onPress,
  variant = "primary",
  loading,
  disabled,
  className = "",
}: Props) {
  const s = STYLES[variant];
  return (
    <TouchableOpacity
      style={[styles.base, s.btn, (disabled || loading) && styles.dim]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={s.spinnerColor} size="small" />
      ) : (
        <Text style={[styles.label, s.text]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

const STYLES = {
  primary: {
    btn: { backgroundColor: colors.accent },
    text: { color: colors.white },
    spinnerColor: colors.white,
  },
  secondary: {
    btn: { backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.accent },
    text: { color: colors.accent },
    spinnerColor: colors.accent,
  },
  danger: {
    btn: { backgroundColor: colors.error },
    text: { color: colors.white },
    spinnerColor: colors.white,
  },
  ghost: {
    btn: { backgroundColor: 'transparent' },
    text: { color: colors.textMuted },
    spinnerColor: colors.textMuted,
  },
};

const styles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
  },
  dim: { opacity: 0.5 },
});
