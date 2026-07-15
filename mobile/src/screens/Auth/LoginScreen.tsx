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
import { supabase } from "../../../supabase/client";

WebBrowser.maybeCompleteAuthSession();
import {
  signInWithPassword,
  signUpWithPassword,
  signInWithGoogle,
} from "../../../../shared/services/authService";
import { isValidEmail, isStrongPassword } from "../../../../shared/utils/validation";
import { colors, radius } from "../../../../shared/constants/theme";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";

type Mode = "signin" | "signup";

export function LoginScreen() {
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
    if (!termsChecked || !privacyChecked) {
      setLegalError(true);
      return false;
    }
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
    if (!isValidEmail(email)) { setError("Enter a valid email address."); return; }
    if (!password) { setError("Enter your password."); return; }

    inFlight.current = true;
    setLoading(true);
    setError(null);
    try {
      const { error: err } = await signInWithPassword(supabase, email.trim(), password);
      if (err) setError(err.message);
    } finally {
      setLoading(false);
      inFlight.current = false;
    }
  }

  async function handleSignUp() {
    if (inFlight.current) return;
    if (!checkLegal()) return;
    if (displayName.trim().length < 2) { setError("Display name must be at least 2 characters."); return; }
    if (!isValidEmail(email)) { setError("Enter a valid email address."); return; }
    if (!isStrongPassword(password)) { setError("Password must be at least 8 characters."); return; }
    if (password !== confirmPassword) { setError("Passwords do not match."); return; }

    inFlight.current = true;
    setLoading(true);
    setError(null);
    try {
      const { error: err, needsConfirmation } = await signUpWithPassword(
        supabase,
        email.trim(),
        password,
        displayName.trim()
      );
      if (err) {
        const msg = err.message.toLowerCase().includes("already registered")
          ? "An account with this email already exists. Sign in instead."
          : err.message;
        setError(msg);
      } else if (needsConfirmation) {
        setAwaitingConfirmation(true);
      }
    } finally {
      setLoading(false);
      inFlight.current = false;
    }
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
    } finally {
      setGoogleLoading(false);
    }
  }

  if (awaitingConfirmation) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.sentIcon}>📬</Text>
        <Text style={styles.sentTitle}>Check your inbox!</Text>
        <Text style={styles.sentBody}>
          Check your email for a confirmation link.{"\n"}If you already have an account, sign in instead.
        </Text>
        <TouchableOpacity
          style={styles.ghostBtn}
          onPress={() => { setAwaitingConfirmation(false); switchMode("signin"); }}
          activeOpacity={0.7}
        >
          <Text style={styles.ghostBtnText}>Back to sign in</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.brand}>
          <Text style={styles.brandName}>Template</Text>
          <Text style={styles.tagline}>Your app tagline goes here</Text>
        </View>

        <Text style={styles.modeTitle}>{mode === "signin" ? "Sign in" : "Create account"}</Text>

        <View style={styles.legalWrap}>
          {([
            { checked: termsChecked, onToggle: () => { setTermsChecked(v => !v); setLegalError(false); }, label: "I agree to the Terms of Service" },
            { checked: privacyChecked, onToggle: () => { setPrivacyChecked(v => !v); setLegalError(false); }, label: "I agree to the Privacy Policy" },
          ] as const).map(({ checked, onToggle, label }) => (
            <TouchableOpacity key={label} style={styles.legalRow} onPress={onToggle} activeOpacity={0.7}>
              <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                {checked && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.legalText}>{label}</Text>
            </TouchableOpacity>
          ))}
          {legalError && <Text style={styles.legalError}>Please agree to continue</Text>}
        </View>

        <TouchableOpacity
          style={[styles.socialBtn, (googleLoading || loading) && styles.opaque]}
          onPress={handleGoogle}
          disabled={googleLoading || loading}
          activeOpacity={0.8}
        >
          {googleLoading
            ? <ActivityIndicator color={colors.textPrimary} size="small" />
            : <><Text style={styles.socialIcon}>G</Text><Text style={styles.socialLabel}>Continue with Google</Text></>
          }
        </TouchableOpacity>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        {mode === "signup" && (
          <Input
            label="Display name"
            placeholder="Your name"
            value={displayName}
            onChangeText={v => { setDisplayName(v); setError(null); }}
            autoCapitalize="words"
            returnKeyType="next"
          />
        )}

        <Input
          label="Email"
          placeholder="you@example.com"
          value={email}
          onChangeText={v => { setEmail(v); setError(null); }}
          keyboardType="email-address"
          autoCapitalize="none"
          returnKeyType="next"
        />

        <Input
          label="Password"
          placeholder={mode === "signup" ? "Min. 8 characters" : "••••••••"}
          value={password}
          onChangeText={v => { setPassword(v); setError(null); }}
          secureTextEntry
          returnKeyType={mode === "signup" ? "next" : "done"}
          onSubmitEditing={mode === "signin" ? handleSignIn : undefined}
        />

        {mode === "signup" && (
          <Input
            label="Confirm password"
            placeholder="Repeat password"
            value={confirmPassword}
            onChangeText={v => { setConfirmPassword(v); setError(null); }}
            secureTextEntry
            returnKeyType="done"
            onSubmitEditing={handleSignUp}
          />
        )}

        <Button
          label={mode === "signin" ? "Sign in" : "Create account"}
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
            {mode === "signin" ? "No account? " : "Already have an account? "}
            <Text style={styles.switchLink}>{mode === "signin" ? "Create one" : "Sign in"}</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  container: { flexGrow: 1, backgroundColor: colors.bg, paddingHorizontal: 24, paddingTop: 72, paddingBottom: 40 },
  center: { justifyContent: "center", alignItems: "center" },
  brand: { alignItems: "center", marginBottom: 36 },
  brandName: { fontSize: 36, fontWeight: "900", color: colors.primary, letterSpacing: -1 },
  tagline: { fontSize: 14, color: colors.textMuted, marginTop: 4, fontStyle: "italic" },
  modeTitle: { fontSize: 20, fontWeight: "800", color: colors.textPrimary, marginBottom: 20, textAlign: "center" },
  legalWrap: { marginBottom: 20, gap: 12 },
  legalRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: colors.border, alignItems: "center", justifyContent: "center", marginTop: 1 },
  checkboxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkmark: { color: "#fff", fontSize: 13, fontWeight: "800" },
  legalText: { flex: 1, fontSize: 13, color: colors.textSecondary, lineHeight: 20 },
  legalError: { fontSize: 12, color: colors.danger, fontWeight: "500" },
  socialBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, borderRadius: radius.full, paddingVertical: 16, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.bgCard, marginBottom: 16 },
  socialIcon: { fontSize: 17, fontWeight: "800", color: colors.textPrimary },
  socialLabel: { fontSize: 15, fontWeight: "700", color: colors.textPrimary },
  opaque: { opacity: 0.5 },
  error: { color: colors.danger, fontSize: 13, textAlign: "center", marginBottom: 8 },
  divider: { flexDirection: "row", alignItems: "center", marginBottom: 16, gap: 8 },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { fontSize: 12, color: colors.textMuted, textTransform: "uppercase", letterSpacing: 0.5 },
  switchRow: { marginTop: 20, alignItems: "center" },
  switchText: { fontSize: 13, color: colors.textMuted },
  switchLink: { color: colors.primary, fontWeight: "700" },
  sentIcon: { fontSize: 56, marginBottom: 20 },
  sentTitle: { fontSize: 28, fontWeight: "800", color: colors.textPrimary, marginBottom: 12 },
  sentBody: { fontSize: 16, color: colors.textSecondary, textAlign: "center", lineHeight: 26, marginBottom: 24 },
  highlight: { color: colors.primary, fontWeight: "700" },
  ghostBtn: { paddingVertical: 14, paddingHorizontal: 32, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border },
  ghostBtnText: { color: colors.textSecondary, fontSize: 14, fontWeight: "600" },
});
