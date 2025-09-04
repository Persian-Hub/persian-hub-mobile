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

type P = NativeStackScreenProps<AuthStackParamList, "Login">;

export default function LoginScreen({ navigation }: P) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [gLoading, setGLoading] = useState(false);
  const [keep, setKeep] = useState(true); // UI only; Supabase persists session by default

  const onLogin = async () => {
    if (!email.trim() || !pw) return;
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: pw,
      });
      if (error) throw error;
      // Success → Tab navigator will reflect auth state (if you listen globally)
    } catch (e: any) {
      alert(e.message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.container}>
          <Text style={styles.title}>Login</Text>
          <Text style={styles.subtitle}>Welcome back to the app</Text>

          <View style={styles.group}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              placeholder="hello@example.com"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              style={styles.input}
            />
          </View>

          <View style={styles.group}>
            <View style={styles.rowBetween}>
              <Text style={styles.label}>Password</Text>
               <TouchableOpacity onPress={() => navigation.navigate("VerifyEmail", { email: email.trim() || undefined })}>
                <Text style={styles.linkSm}>Forgot Password?</Text>
              </TouchableOpacity>

            </View>
            <View style={styles.passwordRow}>
              <TextInput
                placeholder="••••••••"
                autoCapitalize="none"
                secureTextEntry={!showPw}
                value={pw}
                onChangeText={setPw}
                style={[styles.input, { flex: 1 }]}
              />
              <TouchableOpacity onPress={() => setShowPw((v) => !v)} style={styles.eyeBtn}>
                <Text style={styles.eyeText}>{showPw ? "Hide" : "Show"}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => setKeep((k) => !k)}
            style={styles.keepRow}
            activeOpacity={0.8}
          >
            <View style={[styles.checkbox, keep && styles.checkboxOn]} />
            <Text style={styles.keepText}>Keep me signed in</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onLogin}
            activeOpacity={0.9}
            style={styles.primaryBtn}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Login</Text>}
          </TouchableOpacity>

          <View style={styles.hrRow}>
            <View style={styles.hr} />
            <Text style={styles.hrText}>or sign in with</Text>
            <View style={styles.hr} />
          </View>

          <GoogleButton onStart={() => setGLoading(true)} onDone={() => setGLoading(false)} loading={gLoading} />

          <TouchableOpacity onPress={() => navigation.replace("Register")}>
            <Text style={styles.bottomLink}>Create an account</Text>
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
  title: { fontSize: 28, fontWeight: "900", color: "#0B0B0C" },
  subtitle: { fontSize: 14, color: "#6B7280", marginTop: 4, marginBottom: 16 },

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

  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  linkSm: { color: "#2563EB", fontWeight: "700" },

  keepRow: { flexDirection: "row", alignItems: "center", marginTop: 8, marginBottom: 8 },
  checkbox: { width: 18, height: 18, borderRadius: 4, borderWidth: 1.5, borderColor: "#D1D5DB" },
  checkboxOn: { backgroundColor: "#2563EB", borderColor: "#2563EB" },
  keepText: { marginLeft: 8, color: "#111827", fontWeight: "600" },

  primaryBtn: {
    height: 48,
    borderRadius: R,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
  },
  primaryBtnText: { color: "#fff", fontSize: 16, fontWeight: "800" },

  hrRow: { flexDirection: "row", alignItems: "center", gap: 8, marginVertical: 16 },
  hr: { flex: 1, height: 1, backgroundColor: "#E5E7EB" },
  hrText: { color: "#9CA3AF", fontSize: 12 },

  bottomLink: { marginTop: 16, textAlign: "center", color: "#2563EB", fontWeight: "700" },
});
