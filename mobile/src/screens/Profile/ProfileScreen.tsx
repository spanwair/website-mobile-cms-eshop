import React, { useState } from "react";
import { View, Text, TouchableOpacity, Alert, Image, TextInput, StyleSheet } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useAuthStore } from "../../lib/store/auth";
import { useProfile, useUpdateProfile } from "../../lib/query/hooks/useProfile";
import { toast } from "../../lib/toast";
import { ScreenContainer } from "../../components/layout/ScreenContainer";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { colors } from "@shared/constants/theme";
import { ROLE, ROLE_LABEL } from "@shared/constants/permissions";

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
      <View style={styles.avatarRow}>
        <TouchableOpacity onPress={handlePickAvatar} activeOpacity={0.8}>
          {profile?.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.avatarImg} />
          ) : (
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitial}>{initial}</Text>
            </View>
          )}
        </TouchableOpacity>
        <View style={styles.avatarMeta}>
          <Text style={styles.fullName}>{profile?.display_name ?? "Unknown"}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          <Text style={styles.role}>{ROLE_LABEL[profile?.role as keyof typeof ROLE_LABEL] ?? "user"}</Text>
        </View>
      </View>

      <Card style={styles.card}>
        {editing ? (
          <>
            <Text style={styles.fieldLabel}>Display name</Text>
            <TextInput
              style={styles.fieldInput}
              value={displayName}
              onChangeText={setDisplayName}
              placeholderTextColor={colors.textPlaceholder}
              autoFocus
            />
            <View style={styles.editRow}>
              <Button label="Save" onPress={handleSave} loading={updateProfile.isPending} className="flex-1" />
              <Button label="Cancel" onPress={() => setEditing(false)} variant="ghost" className="flex-1" />
            </View>
          </>
        ) : (
          <>
            <Text style={styles.fieldLabel}>Display name</Text>
            <Text style={styles.fieldValue}>{profile?.display_name ?? "Not set"}</Text>
            <TouchableOpacity
              onPress={() => { setDisplayName(profile?.display_name ?? ""); setEditing(true); }}
              activeOpacity={0.8}
            >
              <Text style={styles.editLink}>Edit profile →</Text>
            </TouchableOpacity>
          </>
        )}
      </Card>

      <View style={styles.signOutWrap}>
        <Button label="Sign out" onPress={handleSignOut} variant="secondary" />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 24 },
  avatarImg: { width: 80, height: 80, borderRadius: 40 },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { fontSize: 32, fontWeight: '900', color: colors.white },
  avatarMeta: { flex: 1, gap: 2 },
  fullName: { fontSize: 20, fontWeight: '800', color: colors.text },
  email: { fontSize: 13, color: colors.textMuted },
  role: { fontSize: 12, fontWeight: '700', color: colors.accent, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 },
  card: { marginBottom: 20 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 },
  fieldInput: {
    backgroundColor: colors.subtle,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
    marginBottom: 12,
  },
  fieldValue: { fontSize: 15, color: colors.text, marginBottom: 12 },
  editLink: { fontSize: 14, color: colors.accent, fontWeight: '600' },
  editRow: { flexDirection: 'row', gap: 12 },
  signOutWrap: { marginTop: 'auto', paddingTop: 24 },
});
