import React from "react";
import { View, Text, TouchableOpacity, Switch, Alert } from "react-native";
import { ScreenContainer } from "../../components/layout/ScreenContainer";
import { useAuthStore } from "../../lib/store/auth";
import { useAppTheme } from "../../lib/theme";

function SettingsRow({
  label,
  right,
  onPress,
}: {
  label: string;
  right?: React.ReactNode;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      className="flex-row items-center justify-between py-4 border-b border-[#252538]"
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <Text className="text-base text-white">{label}</Text>
      {right ?? <Text className="text-[#808099] text-lg">›</Text>}
    </TouchableOpacity>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <Text className="text-xs font-bold text-[#808099] uppercase tracking-wider mt-6 mb-2">
      {title}
    </Text>
  );
}

export function SettingsScreen() {
  const signOut = useAuthStore.use.signOut();
  const { savedTheme, setTheme } = useAppTheme();

  function handleSignOut() {
    Alert.alert("Sign out", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign out", style: "destructive", onPress: signOut },
    ]);
  }

  return (
    <ScreenContainer title="Settings" scroll>
      <SectionTitle title="Appearance" />
      <SettingsRow
        label="Dark mode"
        right={
          <Switch
            value={savedTheme !== "light"}
            onValueChange={(v) => setTheme(v ? "dark" : "light")}
            trackColor={{ true: "#FF5E1A", false: "#252538" }}
            thumbColor="#fff"
          />
        }
      />

      <SectionTitle title="Account" />
      <SettingsRow label="Sign out" onPress={handleSignOut} />
    </ScreenContainer>
  );
}
