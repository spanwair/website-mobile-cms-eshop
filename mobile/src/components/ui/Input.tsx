import React from "react";
import { TextInput, View, Text, StyleSheet, type TextInputProps } from "react-native";
import { colors, radius } from "../../../../shared/constants/theme";

interface Props extends TextInputProps {
  label?: string;
  error?: string | null;
}

export function Input({ label, error, style, ...props }: Props) {
  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        style={[styles.input, error ? styles.inputError : null, style]}
        placeholderTextColor={colors.textMuted}
        {...props}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 12 },
  label: { fontSize: 12, fontWeight: "700", color: colors.textMuted, letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 6 },
  input: { backgroundColor: colors.bgInput, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, padding: 14, fontSize: 16, color: colors.textPrimary },
  inputError: { borderColor: colors.danger },
  error: { fontSize: 12, color: colors.danger, marginTop: 4 },
});
