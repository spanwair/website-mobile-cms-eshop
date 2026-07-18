import React from "react";
import { Text as RNText, StyleSheet, type TextProps } from "react-native";
import { colors } from "@shared/constants/theme";

interface Props extends TextProps {
  variant?: "display" | "heading" | "title" | "body" | "caption" | "micro";
  className?: string;
}

export function Text({ variant = "body", style, children, ...props }: Props) {
  return (
    <RNText style={[VARIANTS[variant], style]} {...props}>
      {children}
    </RNText>
  );
}

const VARIANTS = StyleSheet.create({
  display: { fontSize: 32, fontWeight: '800', letterSpacing: -0.8, color: colors.text },
  heading: { fontSize: 24, fontWeight: '700', letterSpacing: -0.4, color: colors.text },
  title:   { fontSize: 20, fontWeight: '700', letterSpacing: -0.2, color: colors.text },
  body:    { fontSize: 15, fontWeight: '400', lineHeight: 22, color: colors.textMuted },
  caption: { fontSize: 13, fontWeight: '500', color: colors.textMuted },
  micro:   { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', color: colors.textMuted },
});
