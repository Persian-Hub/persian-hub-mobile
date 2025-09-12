// src/screens/auth/VerifyEmail.tsx
import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Linking from "expo-linking";
import { supabase } from "../../lib/supabase";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AuthStackParamList } from "../../navigation/AuthStackNavigator";

type P = NativeStackScreenProps<AuthStackParamList, "VerifyEmail">;

export default function VerifyEmail({ route }: P) {
  const [email, setEmail] = useState(route.params?.email ?? "");
  const [loading, setLoading] = useState(false);
  const redirect = Linking.createURL("reset"); // -> persianhub://reset

  const onSend = async () => {
    const addr = email.trim();
    if (!addr || !/^\S+@\S+\.\S+$/.test(addr)) {
      Alert.alert("Invalid email", "Please enter a valid email address.");
      return;
    }
    try {
      setLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(addr, {
        redirectTo: redirect,
      });
      if (error) throw error;
      Alert.alert(
        "Check your inbox",
        "We sent a password reset link to your email. Tap the link on this device to open the app and set a new password."
      );
    } catch (e: any) {
      Alert.alert("Could not send email", e?.message || "Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={s.container}>
          <Text style={s.title}>Forgot your password?</Text>
          <Text style={s.sub}>Enter your account email and we’ll send you a reset link.</Text>

          <Text style={s.label}>Email</Text>
          <TextInput
            style={s.input}
            placeholder="your@email.com"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />

          <TouchableOpacity style={s.primaryBtn} onPress={onSend} disabled={loading} activeOpacity={0.9}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryBtnText}>Send reset link</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => Linking.openURL("https://persianhub.com.au/data-deletion")}>
            <Text style={s.smallHelp}>Having trouble? Open the reset link in Safari/Chrome on this device.</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const R = 14;
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 16 },
  title: { fontSize: 22, fontWeight: "900", color: "#0b0b0c" },
  sub: { color: "#6b7280", marginTop: 6, marginBottom: 16 },
  label: { color: "#111827", fontWeight: "700", marginBottom: 6 },
  input: {
    backgroundColor: "#fff", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: R,
    paddingHorizontal: 12, height: 48, fontSize: 15, color: "#111827", marginBottom: 12,
  },
  primaryBtn: {
    height: 48, borderRadius: R, backgroundColor: "#2563EB",
    alignItems: "center", justifyContent: "center", marginTop: 6,
  },
  primaryBtnText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  smallHelp: { color: "#6b7280", fontSize: 12, marginTop: 12, textAlign: "center" },
});
