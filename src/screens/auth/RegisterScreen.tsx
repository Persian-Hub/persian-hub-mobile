// src/screens/auth/RegisterScreen.tsx
import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AuthStackParamList } from "../../navigation/AuthStackNavigator";
import { supabase } from "../../lib/supabase";
import GoogleButton from "../../components/GoogleButton";

/** Adjust / add countries to fit your audience */
const COUNTRIES = [
  { code: "AU", name: "Australia", dial: "+61" },
  { code: "US", name: "United States", dial: "+1" },
  { code: "GB", name: "United Kingdom", dial: "+44" },
  { code: "CA", name: "Canada", dial: "+1" },
  { code: "IR", name: "Iran", nameFa: "ایران", dial: "+98" },
  { code: "DE", name: "Germany", dial: "+49" },
  { code: "FR", name: "France", dial: "+33" },
];

type P = NativeStackScreenProps<AuthStackParamList, "Register">;

export default function RegisterScreen({ navigation }: P) {
  // form state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);

  const [cc, setCc] = useState(COUNTRIES[0]); // default AU
  const [phone, setPhone] = useState("");

  // ui state
  const [loading, setLoading] = useState(false);
  const [gLoading, setGLoading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  // validation
  const validEmail = useMemo(
    () => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()),
    [email]
  );

  // allow digits, spaces, dashes, parentheses
  const cleanedPhone = useMemo(
    () => phone.replace(/[^\d]/g, ""),
    [phone]
  );
  // E.164-ish: +country + 6..15 digits overall
  const e164 = useMemo(() => {
    const num = cleanedPhone;
    const dialDigits = cc.dial.replace(/\D/g, "");
    const total = `${dialDigits}${num}`;
    if (num.length < 6 || num.length > 15) return null;
    return `+${total}`;
  }, [cc.dial, cleanedPhone]);

  const emailError =
    email.length > 0 && !validEmail ? "Enter a valid email" : "";
  const pwLenOk = pw.length >= 6;
  const pwMatch = pw2 === pw && pw.length > 0;
  const pwError =
    pw.length > 0 && !pwLenOk ? "At least 6 characters" : "";
  const pw2Error =
    pw2.length > 0 && !pwMatch ? "Passwords do not match" : "";
  const phoneError =
    phone.length > 0 && !e164 ? "Enter a valid phone number" : "";

  const canSubmit =
    fullName.trim().length > 1 &&
    validEmail &&
    pwLenOk &&
    pwMatch &&
    !!e164;

  const onRegister = async () => {
    if (!canSubmit) return;
    try {
      setLoading(true);
      // 1) create auth user
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: pw,
      });
      if (error) throw error;

      // 2) create / upsert profile
      const userId = data.user?.id;
      if (userId) {
        await supabase.from("profiles").upsert(
          {
            id: userId,
            full_name: fullName.trim(),
            email: email.trim(),
            phone: e164, // <-- save E.164
            role: "user",
            is_business_owner: false,
          },
          { onConflict: "id" }
        );
      }

      // 3) forward to verify email screen
      navigation.replace("VerifyEmail", { email });
    } catch (e: any) {
      alert(e.message ?? "Sign up failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.container}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>‹</Text>
          </TouchableOpacity>

          <Text style={styles.title}>Create an account</Text>

          {/* Full name */}
          <FormGroup label="Name">
            <TextInput
              placeholder="John Doe"
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
              style={styles.input}
            />
          </FormGroup>

          {/* Email */}
          <FormGroup label="Email Address" error={emailError}>
            <TextInput
              placeholder="hello@example.com"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              style={[
                styles.input,
                !!emailError && styles.inputError,
              ]}
            />
          </FormGroup>

          {/* Phone with country picker */}
          <FormGroup label="Mobile Number" error={phoneError}>
            <View style={styles.phoneRow}>
              <TouchableOpacity
                style={styles.ccBtn}
                onPress={() => setPickerOpen(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.ccText}>{cc.dial}</Text>
              </TouchableOpacity>
              <TextInput
                placeholder="412 345 678"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
                style={[styles.input, { flex: 1 }]}
              />
            </View>
          </FormGroup>

          {/* Password */}
          <FormGroup label="Password" error={pwError}>
            <View style={styles.passwordRow}>
              <TextInput
                placeholder="••••••••"
                value={pw}
                onChangeText={setPw}
                autoCapitalize="none"
                secureTextEntry={!showPw}
                style={[
                  styles.input,
                  { flex: 1 },
                  !!pwError && styles.inputError,
                ]}
              />
              <TouchableOpacity
                onPress={() => setShowPw((v) => !v)}
                style={styles.eyeBtn}
              >
                <Text style={styles.eyeText}>{showPw ? "Hide" : "Show"}</Text>
              </TouchableOpacity>
            </View>
          </FormGroup>

          {/* Confirm password */}
          <FormGroup label="Confirm Password" error={pw2Error}>
            <View style={styles.passwordRow}>
              <TextInput
                placeholder="••••••••"
                value={pw2}
                onChangeText={setPw2}
                autoCapitalize="none"
                secureTextEntry={!showPw2}
                style={[
                  styles.input,
                  { flex: 1 },
                  !!pw2Error && styles.inputError,
                ]}
              />
              <TouchableOpacity
                onPress={() => setShowPw2((v) => !v)}
                style={styles.eyeBtn}
              >
                <Text style={styles.eyeText}>{showPw2 ? "Hide" : "Show"}</Text>
              </TouchableOpacity>
            </View>
          </FormGroup>

          <Text style={styles.terms}>
            By continuing, you agree to our{" "}
            <Text style={styles.link}>terms of service</Text>.
          </Text>

          <TouchableOpacity
            onPress={onRegister}
            activeOpacity={0.9}
            style={[styles.primaryBtn, !canSubmit && { opacity: 0.6 }]}
            disabled={loading || !canSubmit}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryBtnText}>Sign up</Text>
            )}
          </TouchableOpacity>

          <View style={styles.orRow}>
            <View style={styles.hr} />
            <Text style={styles.hrText}>or</Text>
            <View style={styles.hr} />
          </View>

          <GoogleButton
            onStart={() => setGLoading(true)}
            onDone={() => setGLoading(false)}
            loading={gLoading}
          />

          <TouchableOpacity onPress={() => navigation.replace("Login")}>
            <Text style={styles.bottomLink}>
              Already have an account?{" "}
              <Text style={{ color: "#2563EB", fontWeight: "800" }}>
                Sign in here
              </Text>
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Country code picker modal */}
      <Modal
        visible={pickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerOpen(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={styles.backdrop}
          onPress={() => setPickerOpen(false)}
        />
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>Select country</Text>
          <ScrollView style={{ maxHeight: 360 }}>
            {COUNTRIES.map((c) => (
              <TouchableOpacity
                key={c.code}
                style={styles.countryRow}
                onPress={() => {
                  setCc(c);
                  setPickerOpen(false);
                }}
              >
                <Text style={styles.countryName}>
                  {c.nameFa ? `${c.name} (${c.nameFa})` : c.name}
                </Text>
                <Text style={styles.countryDial}>{c.dial}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity
            style={styles.sheetClose}
            onPress={() => setPickerOpen(false)}
          >
            <Text style={styles.sheetCloseText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/* ---------- Small UI bits ---------- */

function FormGroup({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.label}>{label}</Text>
      {children}
      {!!error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

/* ---------- Styles ---------- */

const R = 14;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 },

  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  backText: { fontSize: 20, fontWeight: "900" },
  title: { fontSize: 28, fontWeight: "900", color: "#0B0B0C", marginBottom: 12 },

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
  inputError: { borderColor: "#ef4444" },

  // phone
  phoneRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  ccBtn: {
    height: 48,
    paddingHorizontal: 12,
    borderRadius: R,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  ccText: { fontWeight: "800", color: "#111827" },

  // password
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

  // modal
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  sheet: {
    marginTop: "auto",
    backgroundColor: "#fff",
    padding: 14,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderWidth: 1,
    borderColor: "#eef2f7",
  },
  sheetTitle: { fontSize: 16, fontWeight: "900", color: "#0b0b0c", marginBottom: 8 },
  countryRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  countryName: { color: "#111827", fontWeight: "700" },
  countryDial: { color: "#2563EB", fontWeight: "900" },
  sheetClose: {
    alignSelf: "center",
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  sheetCloseText: { color: "#111827", fontWeight: "800" },

  errorText: { color: "#ef4444", marginTop: 6, fontSize: 12, fontWeight: "700" },
});
