import React, { useEffect, useState } from "react";
import { Text, View, TouchableOpacity, Alert, StyleSheet, Image, TextInput } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "../../../supabase/client";
import { fetchProfile, updateProfile } from "../../../../shared/services/profileService";
import { signOut } from "../../../../shared/services/authService";
import { colors, radius } from "../../../../shared/constants/theme";
import { ScreenContainer } from "../../components/layout/ScreenContainer";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import type { User } from "../../../../shared/types";

export function ProfileScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const profile = await fetchProfile(supabase, data.user.id, data.user.email ?? "");
      if (profile) { setUser(profile); setDisplayName(profile.display_name ?? ""); }
    });
  }, []);

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    const { error } = await updateProfile(supabase, user.id, { display_name: displayName });
    if (!error) { setUser({ ...user, display_name: displayName }); setEditing(false); }
    setSaving(false);
  }

  async function handleSignOut() {
    Alert.alert("Sign out", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign out", style: "destructive", onPress: () => signOut(supabase) },
    ]);
  }

  async function handlePickAvatar() {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: "images", quality: 0.7 });
    if (result.canceled || !result.assets[0]) return;
    // Upload avatar logic: upload to Supabase Storage, then updateProfile({ avatar_url })
    // Left as integration point for your project
  }

  return (
    <ScreenContainer title="Profile">
      <View style={styles.avatarRow}>
        <TouchableOpacity onPress={handlePickAvatar} activeOpacity={0.8}>
          {user?.avatar_url
            ? <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
            : <View style={styles.avatarPlaceholder}><Text style={styles.avatarInitial}>{(user?.display_name ?? user?.email ?? "?")[0].toUpperCase()}</Text></View>
          }
        </TouchableOpacity>
        <View style={styles.avatarInfo}>
          <Text style={styles.name}>{user?.display_name ?? "Unknown"}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          <Text style={styles.role}>{user?.role === "admin" ? "Admin" : "User"}</Text>
        </View>
      </View>

      <Card style={styles.section}>
        {editing ? (
          <>
            <Text style={styles.fieldLabel}>Display name</Text>
            <TextInput
              style={styles.input}
              value={displayName}
              onChangeText={setDisplayName}
              placeholderTextColor={colors.textMuted}
              autoFocus
            />
            <View style={styles.editBtns}>
              <Button label="Save" onPress={handleSave} loading={saving} />
              <Button label="Cancel" onPress={() => setEditing(false)} variant="ghost" />
            </View>
          </>
        ) : (
          <>
            <Text style={styles.fieldLabel}>Display name</Text>
            <Text style={styles.fieldValue}>{user?.display_name ?? "Not set"}</Text>
            <TouchableOpacity onPress={() => setEditing(true)} activeOpacity={0.8}>
              <Text style={styles.editLink}>Edit profile →</Text>
            </TouchableOpacity>
          </>
        )}
      </Card>

      <View style={styles.bottom}>
        <Button label="Sign out" onPress={handleSignOut} variant="secondary" />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  avatarRow: { flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 24 },
  avatar: { width: 80, height: 80, borderRadius: 40 },
  avatarPlaceholder: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  avatarInitial: { fontSize: 32, fontWeight: "900", color: "#fff" },
  avatarInfo: { flex: 1, gap: 4 },
  name: { fontSize: 20, fontWeight: "800", color: colors.textPrimary },
  email: { fontSize: 13, color: colors.textSecondary },
  role: { fontSize: 12, fontWeight: "700", color: colors.primary, textTransform: "uppercase", letterSpacing: 0.5 },
  section: { marginBottom: 20 },
  fieldLabel: { fontSize: 12, fontWeight: "700", color: colors.textMuted, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 6 },
  fieldValue: { fontSize: 16, color: colors.textPrimary, marginBottom: 12 },
  editLink: { fontSize: 14, color: colors.primary, fontWeight: "600" },
  input: { backgroundColor: colors.bgInput, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, padding: 12, fontSize: 16, color: colors.textPrimary, marginBottom: 12 },
  editBtns: { flexDirection: "row", gap: 12 },
  bottom: { marginTop: "auto", paddingTop: 24 },
});
