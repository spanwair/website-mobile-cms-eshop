import React from "react";
import { View, Text } from "react-native";
import { useAuthStore } from "../../lib/store/auth";
import { useProfile } from "../../lib/query/hooks/useProfile";
import { useItems } from "../../lib/query/hooks/useItems";
import { ScreenContainer } from "../../components/layout/ScreenContainer";
import { Card } from "../../components/ui/Card";

export function HomeScreen() {
  const user = useAuthStore.use.user();
  const { data: profile } = useProfile(user?.id);
  const { data: items } = useItems();

  const displayName = profile?.display_name ?? user?.email?.split("@")[0] ?? "";

  const stats = [
    { label: "Items", value: String(items?.length ?? 0) },
    { label: "Active", value: String(items?.filter((i) => i.status === "active").length ?? 0) },
    { label: "Draft", value: String(items?.filter((i) => i.status === "draft").length ?? 0) },
  ];

  return (
    <ScreenContainer title="Home">
      <Card className="items-center mb-6 py-8">
        <Text className="text-5xl mb-3">👋</Text>
        <Text className="text-[22px] font-extrabold text-white mb-2">
          {displayName ? `Welcome, ${displayName}!` : "Welcome!"}
        </Text>
        <Text className="text-sm text-text-secondary-dark text-center leading-5">
          This is your template app. Replace this screen with your home content.
        </Text>
      </Card>

      <View className="flex-row gap-3">
        {stats.map(({ label, value }) => (
          <Card key={label} className="flex-1 items-center py-5">
            <Text className="text-[28px] font-black text-primary">{value}</Text>
            <Text className="text-xs text-text-muted-dark font-semibold mt-1 uppercase tracking-wide">
              {label}
            </Text>
          </Card>
        ))}
      </View>
    </ScreenContainer>
  );
}
