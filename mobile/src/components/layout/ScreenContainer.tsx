import React from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  type ViewStyle,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useAuthStore } from "../../lib/store/auth";
import { useProfile } from "../../lib/query/hooks/useProfile";
import { colors } from "@shared/constants/theme";

interface Props {
  title?: string;
  children: React.ReactNode;
  scroll?: boolean;
  style?: ViewStyle;
}

export function ScreenContainer({ title, children, scroll = true, style }: Props) {
  const navigation = useNavigation();
  const user = useAuthStore.use.user();
  const { data: profile } = useProfile(user?.id);

  const initial = (profile?.display_name ?? user?.email ?? "?")[0]?.toUpperCase() ?? "?";

  const header = (
    <View style={styles.header}>
      <Text style={styles.brand}>Template</Text>
      <TouchableOpacity
        onPress={() => navigation.navigate("Profile" as never)}
        activeOpacity={0.75}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
      </TouchableOpacity>
    </View>
  );

  const inner = (
    <View style={[styles.inner, style]}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {children}
    </View>
  );

  return (
    <SafeAreaView style={styles.root}>
      {header}
      {scroll ? (
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          {inner}
        </ScrollView>
      ) : (
        inner
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.white,
  },
  brand: { fontSize: 18, fontWeight: '900', color: colors.accent, letterSpacing: -0.5 },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 14, fontWeight: '900', color: colors.white },
  inner: { flex: 1, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 32 },
  title: { fontSize: 28, fontWeight: '800', color: colors.text, marginBottom: 20, letterSpacing: -0.5 },
});
