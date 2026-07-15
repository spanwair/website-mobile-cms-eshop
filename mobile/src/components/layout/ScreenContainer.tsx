import React from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  type ViewStyle,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useAuthStore } from "../../lib/store/auth";
import { useProfile } from "../../lib/query/hooks/useProfile";

interface Props {
  title?: string;
  children: React.ReactNode;
  scroll?: boolean;
  style?: ViewStyle;
  className?: string;
}

export function ScreenContainer({
  title,
  children,
  scroll = true,
  style,
  className = "",
}: Props) {
  const navigation = useNavigation();
  const user = useAuthStore.use.user();
  const { data: profile } = useProfile(user?.id);

  const initial = (profile?.display_name ?? user?.email ?? "?")[0]?.toUpperCase() ?? "?";

  const header = (
    <View className="flex-row items-center justify-between px-5 pt-2 pb-2 border-b border-[#252538]">
      <Text className="text-lg font-black text-primary tracking-tight">Template</Text>
      <TouchableOpacity
        onPress={() => navigation.navigate("Profile" as never)}
        activeOpacity={0.75}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <View className="w-9 h-9 rounded-full bg-primary items-center justify-center">
          <Text className="text-sm font-black text-white">{initial}</Text>
        </View>
      </TouchableOpacity>
    </View>
  );

  const inner = (
    <View className={`flex-1 px-5 pt-5 pb-8 ${className}`} style={style}>
      {title ? (
        <Text className="text-[28px] font-extrabold text-white mb-5 -tracking-[0.5px]">
          {title}
        </Text>
      ) : null}
      {children}
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-[#0F0F1A] dark:bg-[#0F0F1A]">
      {header}
      {scroll ? (
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          {inner}
        </ScrollView>
      ) : (
        inner
      )}
    </SafeAreaView>
  );
}
