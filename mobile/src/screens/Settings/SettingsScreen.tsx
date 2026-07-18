import React from "react";
import { View, Text, TouchableOpacity, Switch, Alert } from "react-native";
import { useTranslation } from "react-i18next";
import { ScreenContainer } from "../../components/layout/ScreenContainer";
import { useAuthStore } from "../../lib/store/auth";
import { useAppTheme } from "../../lib/theme";

function SettingsRow({
  label,
  right,
  onPress,
  destructive,
}: {
  label: string;
  right?: React.ReactNode;
  onPress?: () => void;
  destructive?: boolean;
}) {
  return (
    <TouchableOpacity
      className="flex-row items-center justify-between py-4 border-b border-[#252538]"
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <Text className={`text-base ${destructive ? "text-red-500" : "text-white"}`}>{label}</Text>
      {right ?? <Text className={`text-lg ${destructive ? "text-red-500" : "text-[#808099]"}`}>›</Text>}
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
  const { t } = useTranslation();
  const signOut = useAuthStore.use.signOut();
  const deleteAccount = useAuthStore.use.deleteAccount();
  const { savedTheme, setTheme } = useAppTheme();

  function handleSignOut() {
    Alert.alert(t("nav.signOut"), t("common.areYouSure"), [
      { text: t("common.cancel"), style: "cancel" },
      { text: t("nav.signOut"), style: "destructive", onPress: signOut },
    ]);
  }

  function handleDeleteAccount() {
    Alert.alert(t("profile.deleteAccount"), t("profile.deleteConfirm"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("profile.deleteAccount"),
        style: "destructive",
        onPress: async () => {
          const { error } = await deleteAccount();
          if (error) Alert.alert(t("common.error"), error);
        },
      },
    ]);
  }

  return (
    <ScreenContainer title={t("settings.title")} scroll>
      <SectionTitle title={t("settings.sectionAppearance")} />
      <SettingsRow
        label={t("settings.darkMode")}
        right={
          <Switch
            value={savedTheme !== "light"}
            onValueChange={(v) => setTheme(v ? "dark" : "light")}
            trackColor={{ true: "#FF5E1A", false: "#252538" }}
            thumbColor="#fff"
          />
        }
      />

      <SectionTitle title={t("settings.sectionAccount")} />
      <SettingsRow label={t("nav.signOut")} onPress={handleSignOut} />
      <SettingsRow
        label={t("profile.deleteAccount")}
        onPress={handleDeleteAccount}
        destructive
      />
    </ScreenContainer>
  );
}
