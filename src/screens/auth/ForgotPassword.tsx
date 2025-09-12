// src/screens/auth/ForgotPassword.tsx
import React from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../lib/supabase";

export default function ForgotPassword() {
  const [email, setEmail] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [sent, setSent] = React.useState(false);

  const validEmail = (v: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

  const onSubmit = async () => {
    const e = email.trim();
    if (!validEmail(e)) {
      Alert.alert("Invalid email", "Please enter a valid email address.");
      return;
    }
    setLoading(true);
    try {
      // Optional: if you’ve configured a universal/deep link, pass it here
      // const redirectTo = Linking.createURL("/auth/callback"); // requires your app scheme
      const { error } = await supabase.auth.resetPasswordForEmail(e /*, { redirectTo }*/);
      if (error) throw error;
      setSent(true);
    } catch (err: any) {
      Alert.alert("Couldn’t send email", err?.message ?? "Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const openMail = () => {
    // Best effort: prompt to open the default mail app
    Linking.openURL("message:");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f7f8fb" }} edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <View style={{ padding: 16 }}>
          <Text style={styles.title}>Forgot password</Text>
          <Text style={styles.sub}>
            Enter the email you used to create your account. We’ll send you a link to reset your password.
          </Text>

          <View style={styles.card}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="you@example.com"
              style={[styles.input, !!email && !validEmail(email) && styles.inputError]}
              editable={!loading && !sent}
            />

            {!sent ? (
              <TouchableOpacity
                onPress={onSubmit}
                activeOpacity={0.9}
                style={[styles.cta, loading && { opacity: 0.7 }]}
                disabled={loading}
              >
                <Text style={styles.ctaText}>{loading ? "Sending…" : "Send reset link"}</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.successBox}>
                <Text style={styles.successTitle}>Email sent ✅</Text>
                <Text style={styles.successText}>
                  Check <Text style={{ fontWeight: "900" }}>{email}</Text> for a password reset link.
                </Text>
                <TouchableOpacity onPress={openMail} style={[styles.cta, { backgroundColor: "#16a34a" }]}>
                  <Text style={styles.ctaText}>Open Mail App</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 26, fontWeight: "900", color: "#0b0b0c" },
  sub: { color: "#6b7280", marginTop: 6, marginBottom: 12 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#eef2f7",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  label: { fontWeight: "800", color: "#111827", marginBottom: 6 },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e6eaf0",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: "#111827",
  },
  inputError: { borderColor: "#ef4444" },
  cta: {
    marginTop: 12,
    backgroundColor: "#2563eb",
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaText: { color: "#fff", fontWeight: "900" },
  successBox: { marginTop: 12, gap: 6 },
  successTitle: { fontWeight: "900", color: "#065f46" },
  successText: { color: "#065f46" },
});
