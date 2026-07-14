import React, { useState, useRef } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { supabase } from "../../../supabase/client";
import { signInWithMagicLink, signInWithGoogle } from "../../../../shared/services/authService";
import { isValidEmail } from "../../../../shared/utils/validation";
import { colors, radius, space } from "../../../../shared/constants/theme";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";

export function LoginScreen() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [termsChecked, setTermsChecked] = useState(false);
  const [privacyChecked, setPrivacyChecked] = useState(false);
  const [legalError, setLegalError] = useState(false);
  const inFlight = useRef(false);

  async function handleMagicLink() {
    if (inFlight.current) return;
    if (!termsChecked || !privacyChecked) { setLegalError(true); return; }
    if (!isValidEmail(email)) { setError("Please enter a valid email address"); return; }

    inFlight.current = true;
    setLoading(true);
    setError(null);
    try {
      const { error: err } = await signInWithMagicLink(supabase, email.trim(), "mobile");
      if (err) setError(err.message);
      else setSent(true);
    } finally {
      setLoading(false);
      inFlight.current = false;
    }
  }

  async function handleGoogle() {
    if (!termsChecked || !privacyChecked) { setLegalError(true); return; }
    setGoogleLoading(true);
    setError(null);
    try {
      const { error: err } = await signInWithGoogle(supabase);
      if (err) setError(err.message);
    } finally {
      setGoogleLoading(false);
    }
  }

  if (sent) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.sentIcon}>📬</Text>
        <Text style={styles.sentTitle}>Check your inbox!</Text>
        <Text style={styles.sentBody}>We sent a magic link to{"\n"}<Text style={styles.highlight}>{email}</Text></Text>
        <TouchableOpacity style={styles.ghostBtn} onPress={() => setSent(false)} activeOpacity={0.7}>
          <Text style={styles.ghostBtnText}>Use a different email</Text>
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

        <Text style={styles.sectionTitle}>Sign in</Text>

        {/* Legal checkboxes */}
        <View style={styles.legalWrap}>
          {[
            { checked: termsChecked, onToggle: () => { setTermsChecked(v => !v); setLegalError(false); }, label: "I agree to the Terms of Service" },
            { checked: privacyChecked, onToggle: () => { setPrivacyChecked(v => !v); setLegalError(false); }, label: "I agree to the Privacy Policy" },
          ].map(({ checked, onToggle, label }) => (
            <TouchableOpacity key={label} style={styles.legalRow} onPress={onToggle} activeOpacity={0.7}>
              <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                {checked && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.legalText}>{label}</Text>
            </TouchableOpacity>
          ))}
          {legalError && <Text style={styles.legalError}>Please agree to continue</Text>}
        </View>

        {/* Google */}
        <TouchableOpacity
          style={[styles.socialBtn, googleLoading && styles.opaque]}
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
          <View style={styles.dividerLine} /><Text style={styles.dividerText}>or</Text><View style={styles.dividerLine} />
        </View>

        <Input
          label="Your email"
          placeholder="you@example.com"
          value={email}
          onChangeText={v => { setEmail(v); setError(null); }}
          keyboardType="email-address"
          autoCapitalize="none"
          returnKeyType="send"
          onSubmitEditing={handleMagicLink}
          error={error}
        />

        <Button label="Send magic link" onPress={handleMagicLink} loading={loading} disabled={googleLoading} />
        <Text style={styles.hint}>One-time link — no password needed.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  container: { flexGrow: 1, backgroundColor: colors.bg, paddingHorizontal: 24, paddingTop: 80, paddingBottom: 40 },
  center: { justifyContent: "center", alignItems: "center" },
  brand: { alignItems: "center", marginBottom: 40 },
  brandName: { fontSize: 36, fontWeight: "900", color: colors.primary, letterSpacing: -1 },
  tagline: { fontSize: 14, color: colors.textMuted, marginTop: 4, fontStyle: "italic" },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: colors.primary, letterSpacing: -0.3, marginBottom: 16, textAlign: "center" },
  legalWrap: { marginBottom: 20, gap: 12 },
  legalRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: colors.border, alignItems: "center", justifyContent: "center", marginTop: 1 },
  checkboxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkmark: { color: "#fff", fontSize: 13, fontWeight: "800" },
  legalText: { flex: 1, fontSize: 13, color: colors.textSecondary, lineHeight: 20 },
  legalError: { fontSize: 12, color: colors.danger, fontWeight: "500" },
  socialBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, borderRadius: radius.full, paddingVertical: 16, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.bgCard, marginBottom: 20 },
  socialIcon: { fontSize: 17, fontWeight: "800", color: colors.textPrimary },
  socialLabel: { fontSize: 15, fontWeight: "700", color: colors.textPrimary },
  opaque: { opacity: 0.5 },
  error: { color: colors.danger, fontSize: 13, textAlign: "center", marginBottom: 12 },
  divider: { flexDirection: "row", alignItems: "center", marginBottom: 20, gap: 8 },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { fontSize: 12, color: colors.textMuted, textTransform: "uppercase", letterSpacing: 0.5 },
  hint: { fontSize: 12, color: colors.textMuted, textAlign: "center", marginTop: 8 },
  sentIcon: { fontSize: 56, marginBottom: 20 },
  sentTitle: { fontSize: 28, fontWeight: "800", color: colors.textPrimary, marginBottom: 12 },
  sentBody: { fontSize: 16, color: colors.textSecondary, textAlign: "center", lineHeight: 26, marginBottom: 24 },
  highlight: { color: colors.primary, fontWeight: "700" },
  ghostBtn: { paddingVertical: 14, paddingHorizontal: 32, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border },
  ghostBtnText: { color: colors.textSecondary, fontSize: 14, fontWeight: "600" },
});
