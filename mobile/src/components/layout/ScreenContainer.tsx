import React from "react";
import { SafeAreaView, ScrollView, View, Text, StyleSheet, type ViewStyle } from "react-native";
import { colors } from "../../../../shared/constants/theme";

interface Props {
  title?: string;
  children: React.ReactNode;
  scroll?: boolean;
  style?: ViewStyle;
}

export function ScreenContainer({ title, children, scroll = true, style }: Props) {
  const content = (
    <View style={[styles.inner, style]}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {children}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      {scroll
        ? <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">{content}</ScrollView>
        : content
      }
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { flexGrow: 1 },
  inner: { flex: 1, paddingHorizontal: 20, paddingTop: 24, paddingBottom: 32 },
  title: { fontSize: 28, fontWeight: "800", color: colors.textPrimary, marginBottom: 20, letterSpacing: -0.5 },
});
