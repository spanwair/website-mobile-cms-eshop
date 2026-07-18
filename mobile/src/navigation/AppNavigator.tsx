import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Home, List, User, Shield, Settings } from "lucide-react-native";
import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "../../supabase/client";
import { useAuthStore } from "../lib/store/auth";
import { getItem } from "../lib/storage";
import { LoginScreen } from "../screens/Auth/LoginScreen";
import { HomeScreen } from "../screens/Home/HomeScreen";
import { ItemsStack } from "../screens/Items/ItemsStack";
import { ProfileScreen } from "../screens/Profile/ProfileScreen";
import { AdminStack } from "../screens/Admin/AdminStack";
import { OnboardingScreen } from "../screens/Onboarding/OnboardingScreen";
import { SettingsScreen } from "../screens/Settings/SettingsScreen";
import type { RootStackParamList, MainTabParamList } from "./types";
import { LoadingScreen } from "../components/ui/LoadingScreen";
import { colors } from "@shared/constants/theme";

const Root = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.border,
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarIcon: ({ color }) => <Home size={22} color={color} />, tabBarLabel: t("nav.home") }}
      />
      <Tab.Screen
        name="Items"
        component={ItemsStack}
        options={{ tabBarIcon: ({ color }) => <List size={22} color={color} />, tabBarLabel: t("nav.items") }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarIcon: ({ color }) => <User size={22} color={color} />, tabBarLabel: t("nav.profile") }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ tabBarIcon: ({ color }) => <Settings size={22} color={color} />, tabBarLabel: t("nav.settings") }}
      />
      <Tab.Screen
        name="Admin"
        component={AdminStack}
        options={{ tabBarIcon: ({ color }) => <Shield size={22} color={color} />, tabBarLabel: t("nav.admin") }}
      />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  const status = useAuthStore.use.status();
  const setSession = useAuthStore.use.setSession();
  const onboardingDone = getItem<boolean>("onboarding_done") === true;

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => listener.subscription.unsubscribe();
  }, [setSession]);

  if (status === "loading") return <LoadingScreen />;

  return (
    <NavigationContainer>
      <Root.Navigator screenOptions={{ headerShown: false }}>
        {status === "authenticated" ? (
          <Root.Screen name="Main" component={MainTabs} />
        ) : !onboardingDone ? (
          <Root.Screen name="Onboarding">
            {({ navigation }) => (
              <OnboardingScreen onDone={() => navigation.replace("Auth")} />
            )}
          </Root.Screen>
        ) : (
          <Root.Screen name="Auth" component={LoginScreen} />
        )}
      </Root.Navigator>
    </NavigationContainer>
  );
}
