import React from "react";
import { View, StyleSheet, type ViewStyle } from "react-native";
import { colors, radius } from "../../../../shared/constants/theme";

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function Card({ children, style }: Props) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
