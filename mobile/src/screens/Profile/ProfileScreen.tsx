import React, { useState } from "react";
import { View, Text, TouchableOpacity, Alert, Image, TextInput } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useAuthStore } from "../../lib/store/auth";
import { useProfile, useUpdateProfile } from "../../lib/query/hooks/useProfile";
import { toast } from "../../lib/toast";
import { ScreenContainer } from "../../components/layout/ScreenContainer";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";

export function ProfileScreen() {
  const user = useAuthStore.use.user();
  const signOut = useAuthStore.use.signOut();
  const { data: profile } = useProfile(user?.id);
  const updateProfile = useUpdateProfile();

  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");

  async function handleSave() {
    if (!user) return;
    const { error } = await updateProfile.mutateAsync({
      userId: user.id,
      data: { display_name: displayName },
    });
    if (!error) {
      setEditing(false);
      toast.success("Profile updated");
    } else {
      toast.error("Failed to update profile");
    }
  }

  function handleSignOut() {
    Alert.alert("Sign out", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign out", style: "destructive", onPress: signOut },
    ]);
  }

  async function handlePickAvatar() {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: "images", quality: 0.7 });
    if (result.canceled || !result.assets[0]) return;
    toast.info("Avatar upload coming soon");
  }

  const initial = (profile?.display_name ?? user?.email ?? "?")[0].toUpperCase();

  return (
    <ScreenContainer title="Profile">
      <View className="flex-row items-center gap-4 mb-6">
        <TouchableOpacity onPress={handlePickAvatar} activeOpacity={0.8}>
          {profile?.avatar_url ? (
            <Image
              source={{ uri: profile.avatar_url }}
              style={{ width: 80, height: 80, borderRadius: 40 }}
            />
          ) : (
            <View className="w-20 h-20 rounded-full bg-primary items-center justify-center">
              <Text className="text-[32px] font-black text-white">{initial}</Text>
            </View>
          )}
        </TouchableOpacity>
        <View className="flex-1 gap-1">
          <Text className="text-xl font-extrabold text-white">
            {profile?.display_name ?? "Unknown"}
          </Text>
          <Text className="text-[13px] text-text-secondary-dark">{user?.email}</Text>
          <Text className="text-xs font-bold text-primary uppercase tracking-wide">
            {profile?.role === "admin" ? "Admin" : "User"}
          </Text>
        </View>
      </View>

      <Card className="mb-5">
        {editing ? (
          <>
            <Text className="text-xs font-bold text-text-muted-dark uppercase tracking-wider mb-1.5">
              Display name
            </Text>
            <TextInput
              className="bg-bg-input-dark border-[1.5px] border-border-dark rounded-2xl p-3 text-base text-white mb-3"
              value={displayName}
              onChangeText={setDisplayName}
              placeholderTextColor="#808099"
              autoFocus
            />
            <View className="flex-row gap-3">
              <Button label="Save" onPress={handleSave} loading={updateProfile.isPending} className="flex-1" />
              <Button label="Cancel" onPress={() => setEditing(false)} variant="ghost" className="flex-1" />
            </View>
          </>
        ) : (
          <>
            <Text className="text-xs font-bold text-text-muted-dark uppercase tracking-wider mb-1.5">
              Display name
            </Text>
            <Text className="text-base text-white mb-3">{profile?.display_name ?? "Not set"}</Text>
            <TouchableOpacity onPress={() => { setDisplayName(profile?.display_name ?? ""); setEditing(true); }} activeOpacity={0.8}>
              <Text className="text-sm text-primary font-semibold">Edit profile →</Text>
            </TouchableOpacity>
          </>
        )}
      </Card>

      <View className="mt-auto pt-6">
        <Button label="Sign out" onPress={handleSignOut} variant="secondary" />
      </View>
    </ScreenContainer>
  );
}
