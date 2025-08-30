import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AuthStackParamList } from "../../navigation/AuthStackNavigator";
import { supabase } from "../../lib/supabase";
import GoogleButton from "../../components/GoogleButton";

type P = NativeStackScreenProps<AuthStackParamList, "Register">;

export default function RegisterScreen({ navigation }: P) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [gLoading, setGLoading] = useState(false);

  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const onRegister = async () => {
    if (!fullName.trim() || !validEmail || pw.length < 6) return;
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: pw,
      });
      if (error) throw error;

      const userId = data.user?.id;
      if (userId) {
        await supabase.from("profiles").upsert(
          {
            id: userId,
            full_name: fullName.trim(),
            email: email.trim(),
            role: "user",
            is_business_owner: false,
          },
          { onConflict: "id" }
        );
      }

      navigation.replace("VerifyEmail", { email });
    } catch (e: any) {
      alert(e.message ?? "Sign up failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.container}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>‹</Text>
          </TouchableOpacity>

          <Text style={styles.title}>Create an account</Text>

          <View style={styles.group}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              placeholder="John Doe"
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
              style={styles.input}
            />
          </View>

          <View style={styles.group}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              placeholder="hello@example.com"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.input}
            />
          </View>

          <View style={styles.group}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordRow}>
              <TextInput
                placeholder="••••••••"
                value={pw}
                onChangeText={setPw}
                autoCapitalize="none"
                secureTextEntry={!showPw}
                style={[styles.input, { flex: 1 }]}
              />
              <TouchableOpacity onPress={() => setShowPw((v) => !v)} style={styles.eyeBtn}>
                <Text style={styles.eyeText}>{showPw ? "Hide" : "Show"}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.terms}>
            By continuing, you agree to our <Text style={styles.link}>terms of service</Text>.
          </Text>

          <TouchableOpacity
            onPress={onRegister}
            activeOpacity={0.9}
            style={styles.primaryBtn}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Sign up</Text>}
          </TouchableOpacity>

          <View style={styles.orRow}>
            <View style={styles.hr} />
            <Text style={styles.hrText}>or</Text>
            <View style={styles.hr} />
          </View>

          <GoogleButton onStart={() => setGLoading(true)} onDone={() => setGLoading(false)} loading={gLoading} />

          <TouchableOpacity onPress={() => navigation.replace("Login")}>
            <Text style={styles.bottomLink}>Already have an account? <Text style={{ color: "#2563EB", fontWeight: "800" }}>Sign in here</Text></Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const R = 14;
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 },
  backBtn: {
    width: 40, height: 40, borderRadius: 10, borderWidth: 1, borderColor: "#E5E7EB",
    alignItems: "center", justifyContent: "center", marginBottom: 8,
  },
  backText: { fontSize: 20, fontWeight: "900" },
  title: { fontSize: 28, fontWeight: "900", color: "#0B0B0C", marginBottom: 12 },

  group: { marginBottom: 12 },
  label: { color: "#111827", fontWeight: "700", marginBottom: 6 },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: R,
    paddingHorizontal: 12,
    height: 48,
    fontSize: 15,
    color: "#111827",
  },

  passwordRow: { flexDirection: "row", alignItems: "center" },
  eyeBtn: {
    marginLeft: 8,
    paddingHorizontal: 12,
    height: 44,
    borderRadius: R,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  eyeText: { fontWeight: "700", color: "#111827" },

  terms: { fontSize: 12, color: "#6B7280", marginTop: 4, marginBottom: 10 },
  link: { color: "#2563EB", fontWeight: "800" },

  primaryBtn: {
    height: 48,
    borderRadius: R,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  primaryBtnText: { color: "#fff", fontSize: 16, fontWeight: "800" },

  orRow: { flexDirection: "row", alignItems: "center", gap: 8, marginVertical: 14 },
  hr: { flex: 1, height: 1, backgroundColor: "#E5E7EB" },
  hrText: { color: "#9CA3AF", fontSize: 12 },

  bottomLink: { marginTop: 16, textAlign: "center", color: "#111827", fontWeight: "600" },
});
