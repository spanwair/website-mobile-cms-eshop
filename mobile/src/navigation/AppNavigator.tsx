import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Home, List, User, Shield } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../../supabase/client";
import { colors } from "../../../shared/constants/theme";
import { LoginScreen } from "../screens/Auth/LoginScreen";
import { HomeScreen } from "../screens/Home/HomeScreen";
import { ItemsStack } from "../screens/Items/ItemsStack";
import { ProfileScreen } from "../screens/Profile/ProfileScreen";
import { AdminStack } from "../screens/Admin/AdminStack";
import type { RootStackParamList, MainTabParamList } from "./types";
import { LoadingScreen } from "../components/ui/LoadingScreen";

const Root = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: colors.tabBg, borderTopColor: colors.border },
        tabBarActiveTintColor: colors.tabActive,
        tabBarInactiveTintColor: colors.tabInactive,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarIcon: ({ color }) => <Home size={22} color={color} />, tabBarLabel: "Home" }}
      />
      <Tab.Screen
        name="Items"
        component={ItemsStack}
        options={{ tabBarIcon: ({ color }) => <List size={22} color={color} />, tabBarLabel: "Items" }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarIcon: ({ color }) => <User size={22} color={color} />, tabBarLabel: "Profile" }}
      />
      <Tab.Screen
        name="Admin"
        component={AdminStack}
        options={{ tabBarIcon: ({ color }) => <Shield size={22} color={color} />, tabBarLabel: "Admin" }}
      />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  if (loading) return <LoadingScreen />;

  return (
    <NavigationContainer>
      <Root.Navigator screenOptions={{ headerShown: false }}>
        {session ? (
          <Root.Screen name="Main" component={MainTabs} />
        ) : (
          <Root.Screen name="Auth" component={LoginScreen} />
        )}
      </Root.Navigator>
    </NavigationContainer>
  );
}
