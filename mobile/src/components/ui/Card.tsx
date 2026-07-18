import React from "react";
import { View, StyleSheet, type ViewStyle } from "react-native";
import { colors, shadow } from "@shared/constants/theme";

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
  className?: string;
}

export function Card({ children, style, className }: Props) {
  return (
    <View style={[styles.card, shadow.sm, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
