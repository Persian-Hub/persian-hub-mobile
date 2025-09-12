// src/screens/auth/ResetPassword.tsx
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../lib/supabase";

export default function ResetPassword() {
  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  // If the app opened from the magic link, Supabase will put you in PASSWORD_RECOVERY
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (mounted) setReady(!!data.session); // session should exist in recovery
    })();
    return () => { mounted = false; };
  }, []);

  const onSave = async () => {
    if (!ready) {
      Alert.alert("Not ready", "Open this screen from the reset link we emailed you.");
      return;
    }
    if (pw1.length < 8) {
      Alert.alert("Weak password", "Password must be at least 8 characters.");
      return;
    }
    if (pw1 !== pw2) {
      Alert.alert("Passwords do not match", "Please retype your new password.");
      return;
    }
    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({ password: pw1 });
      if (error) throw error;
      Alert.alert("Password updated", "You can now sign in with your new password.");
    } catch (e: any) {
      Alert.alert("Update failed", e?.message || "Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={st.safe} edges={["top"]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={st.container}>
          <Text style={st.title}>Set a new password</Text>
          <Text style={st.sub}>
            Enter and confirm your new password. Make sure it’s at least 8 characters.
          </Text>

          <Text style={st.label}>New password</Text>
          <View style={st.row}>
            <TextInput
              style={[st.input, { flex: 1 }]}
              placeholder="••••••••"
              secureTextEntry={!show}
              autoCapitalize="none"
              value={pw1}
              onChangeText={setPw1}
            />
            <TouchableOpacity onPress={() => setShow((v) => !v)} style={st.toggle}>
              <Text style={st.toggleText}>{show ? "Hide" : "Show"}</Text>
            </TouchableOpacity>
          </View>

          <Text style={st.label}>Confirm password</Text>
          <TextInput
            style={st.input}
            placeholder="••••••••"
            secureTextEntry={!show}
            autoCapitalize="none"
            value={pw2}
            onChangeText={setPw2}
          />

          <TouchableOpacity style={st.primaryBtn} onPress={onSave} disabled={loading} activeOpacity={0.9}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={st.primaryBtnText}>Update password</Text>}
          </TouchableOpacity>

          {!ready && (
            <Text style={st.info}>
              Tip: open the reset email on this device and tap the link. It will send you here with a recovery session.
            </Text>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const R = 14;
const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 16 },
  title: { fontSize: 22, fontWeight: "900", color: "#0b0b0c" },
  sub: { color: "#6b7280", marginTop: 6, marginBottom: 16 },
  label: { color: "#111827", fontWeight: "700", marginBottom: 6 },
  input: {
    backgroundColor: "#fff", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: R,
    paddingHorizontal: 12, height: 48, fontSize: 15, color: "#111827", marginBottom: 12,
  },
  row: { flexDirection: "row", alignItems: "center" },
  toggle: {
    marginLeft: 8, paddingHorizontal: 12, height: 44, borderRadius: R,
    alignItems: "center", justifyContent: "center", backgroundColor: "#F3F4F6", borderWidth: 1, borderColor: "#E5E7EB",
  },
  toggleText: { fontWeight: "700", color: "#111827" },
  primaryBtn: {
    height: 48, borderRadius: R, backgroundColor: "#2563EB",
    alignItems: "center", justifyContent: "center", marginTop: 6,
  },
  primaryBtnText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  info: { color: "#9CA3AF", fontSize: 12, marginTop: 12 },
});
