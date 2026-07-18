import React, { useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { useTranslation } from "react-i18next";
import { supabase } from "../../../supabase/client";
WebBrowser.maybeCompleteAuthSession();
import { signInWithPassword, signUpWithPassword, signInWithGoogle } from "@shared/services/authService";
import { isValidEmail, isStrongPassword } from "@shared/utils/validation";
import { colors, radius } from "@shared/constants/theme";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { ConfirmationScreen } from "./ConfirmationScreen";

type Mode = "signin" | "signup";

export function LoginScreen() {
  const { t } = useTranslation();
  const [mode, setMode] = useState<Mode>("signin");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);
  const [termsChecked, setTermsChecked] = useState(false);
  const [privacyChecked, setPrivacyChecked] = useState(false);
  const [legalError, setLegalError] = useState(false);
  const inFlight = useRef(false);

  function checkLegal(): boolean {
    if (!termsChecked || !privacyChecked) { setLegalError(true); return false; }
    return true;
  }

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setDisplayName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
  }

  async function handleSignIn() {
    if (inFlight.current) return;
    if (!checkLegal()) return;
    if (!isValidEmail(email)) { setError(t("auth.enterValidEmail")); return; }
    if (!password) { setError(t("auth.enterPassword")); return; }
    inFlight.current = true;
    setLoading(true);
    setError(null);
    try {
      const { error: err } = await signInWithPassword(supabase, email.trim(), password);
      if (err) setError(err.message);
    } finally { setLoading(false); inFlight.current = false; }
  }

  async function handleSignUp() {
    if (inFlight.current) return;
    if (!checkLegal()) return;
    if (displayName.trim().length < 2) { setError(t("auth.errorNameTooShort")); return; }
    if (!isValidEmail(email)) { setError(t("auth.enterValidEmail")); return; }
    if (!isStrongPassword(password)) { setError(t("auth.errorPasswordTooShort")); return; }
    if (password !== confirmPassword) { setError(t("auth.errorPasswordMismatch")); return; }
    inFlight.current = true;
    setLoading(true);
    setError(null);
    try {
      const { error: err, needsConfirmation } = await signUpWithPassword(supabase, email.trim(), password, displayName.trim());
      if (err) {
        setError(err.message.toLowerCase().includes("already registered")
          ? t("auth.errorAlreadyRegistered")
          : err.message);
      } else if (needsConfirmation) {
        setAwaitingConfirmation(true);
      }
    } finally { setLoading(false); inFlight.current = false; }
  }

  async function handleGoogle() {
    if (!checkLegal()) return;
    setGoogleLoading(true);
    setError(null);
    try {
      const redirectUrl = Linking.createURL("/auth/callback");
      const { url, error: err } = await signInWithGoogle(supabase, redirectUrl);
      if (err) { setError(err.message); return; }
      if (url) await WebBrowser.openAuthSessionAsync(url, redirectUrl);
    } finally { setGoogleLoading(false); }
  }

  if (awaitingConfirmation) {
    return <ConfirmationScreen onBack={() => { setAwaitingConfirmation(false); switchMode("signin"); }} />;
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.brand}>
          <Text style={styles.brandName}>{t("auth.brandName")}</Text>
          <Text style={styles.tagline}>{t("auth.tagline")}</Text>
        </View>

        <Text style={styles.modeTitle}>
          {mode === "signin" ? t("auth.signIn") : t("auth.createAccount")}
        </Text>

        <View style={styles.legalWrap}>
          {([
            {
              checked: termsChecked,
              onToggle: () => { setTermsChecked(v => !v); setLegalError(false); },
              label: t("auth.agreeToTerms"),
            },
            {
              checked: privacyChecked,
              onToggle: () => { setPrivacyChecked(v => !v); setLegalError(false); },
              label: t("auth.agreeToPrivacy"),
            },
          ] as const).map(({ checked, onToggle, label }) => (
            <TouchableOpacity key={label} style={styles.legalRow} onPress={onToggle} activeOpacity={0.7}>
              <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                {checked && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.legalText}>{label}</Text>
            </TouchableOpacity>
          ))}
          {legalError && <Text style={styles.legalError}>{t("auth.mustAgreeFirst")}</Text>}
        </View>

        <TouchableOpacity
          style={[styles.socialBtn, (googleLoading || loading) && styles.opaque]}
          onPress={handleGoogle}
          disabled={googleLoading || loading}
          activeOpacity={0.8}
        >
          {googleLoading
            ? <ActivityIndicator color={colors.text} size="small" />
            : <><Text style={styles.socialIcon}>G</Text><Text style={styles.socialLabel}>{t("auth.continueWithGoogle")}</Text></>
          }
        </TouchableOpacity>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>{t("common.or")}</Text>
          <View style={styles.dividerLine} />
        </View>

        {mode === "signup" && (
          <Input
            label={t("auth.fullName")}
            placeholder={t("auth.fullNamePlaceholder")}
            value={displayName}
            onChangeText={v => { setDisplayName(v); setError(null); }}
            autoCapitalize="words"
            returnKeyType="next"
          />
        )}
        <Input
          label={t("auth.emailLabel")}
          placeholder={t("auth.emailPlaceholder")}
          value={email}
          onChangeText={v => { setEmail(v); setError(null); }}
          keyboardType="email-address"
          autoCapitalize="none"
          returnKeyType="next"
        />
        <Input
          label={t("auth.password")}
          placeholder={mode === "signup" ? t("auth.passwordHint") : "••••••••"}
          value={password}
          onChangeText={v => { setPassword(v); setError(null); }}
          secureTextEntry
          returnKeyType={mode === "signup" ? "next" : "done"}
          onSubmitEditing={mode === "signin" ? handleSignIn : undefined}
        />
        {mode === "signup" && (
          <Input
            label={t("auth.confirmPassword")}
            placeholder={t("auth.confirmPasswordPlaceholder")}
            value={confirmPassword}
            onChangeText={v => { setConfirmPassword(v); setError(null); }}
            secureTextEntry
            returnKeyType="done"
            onSubmitEditing={handleSignUp}
          />
        )}

        <Button
          label={mode === "signin" ? t("auth.signIn") : t("auth.createAccount")}
          onPress={mode === "signin" ? handleSignIn : handleSignUp}
          loading={loading}
          disabled={googleLoading}
        />

        <TouchableOpacity
          style={styles.switchRow}
          onPress={() => switchMode(mode === "signin" ? "signup" : "signin")}
          activeOpacity={0.7}
        >
          <Text style={styles.switchText}>
            {mode === "signin" ? t("auth.noAccount") : t("auth.haveAccount")}
            <Text style={styles.switchLink}>
              {mode === "signin" ? t("auth.noAccountLink") : t("auth.haveAccountLink")}
            </Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { flexGrow: 1, backgroundColor: colors.background, paddingHorizontal: 24, paddingTop: 72, paddingBottom: 40 },
  brand: { alignItems: "center", marginBottom: 36 },
  brandName: { fontSize: 36, fontWeight: "900", color: colors.accent, letterSpacing: -1 },
  tagline: { fontSize: 14, color: colors.textMuted, marginTop: 4, fontStyle: "italic" },
  modeTitle: { fontSize: 20, fontWeight: "800", color: colors.text, marginBottom: 20, textAlign: "center" },
  legalWrap: { marginBottom: 20, gap: 12 },
  legalRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: colors.border, alignItems: "center", justifyContent: "center", marginTop: 1 },
  checkboxChecked: { backgroundColor: colors.accent, borderColor: colors.accent },
  checkmark: { color: colors.white, fontSize: 13, fontWeight: "800" },
  legalText: { flex: 1, fontSize: 13, color: colors.textMuted, lineHeight: 20 },
  legalError: { fontSize: 12, color: colors.error, fontWeight: "500" },
  socialBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, borderRadius: radius.full, paddingVertical: 16, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.white, marginBottom: 16 },
  socialIcon: { fontSize: 17, fontWeight: "800", color: colors.text },
  socialLabel: { fontSize: 15, fontWeight: "700", color: colors.text },
  opaque: { opacity: 0.5 },
  error: { color: colors.error, fontSize: 13, textAlign: "center", marginBottom: 8 },
  divider: { flexDirection: "row", alignItems: "center", marginBottom: 16, gap: 8 },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { fontSize: 12, color: colors.textMuted, textTransform: "uppercase", letterSpacing: 0.5 },
  switchRow: { marginTop: 20, alignItems: "center" },
  switchText: { fontSize: 13, color: colors.textMuted },
  switchLink: { color: colors.accent, fontWeight: "700" },
});
