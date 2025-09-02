// src/screens/dashboard/ProfileSettings.tsx
import React, { useEffect, useState, useCallback } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../lib/supabase";

export default function ProfileSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPw, setChangingPw] = useState(false);

  // Profile fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState(""); // auth email + profiles.email
  const [phone, setPhone] = useState("");

  // Password fields
  const [currentPw, setCurrentPw] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");

  // Visibility toggles
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user;
      if (!user) {
        Alert.alert("Not signed in", "Please sign in first.");
        setLoading(false);
        return;
      }

      const { data: pData, error: pErr } = await supabase
        .from("profiles")
        .select("full_name, phone, email")
        .eq("id", user.id)
        .single();

      if (pErr) throw pErr;

      setFullName(pData?.full_name ?? "");
      setPhone(pData?.phone ?? "");
      setEmail(user.email ?? pData?.email ?? "");
    } catch (e: any) {
      Alert.alert("Failed to load profile", e?.message || "Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const validateEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());
  const validatePhone = (p: string) => {
    if (!p) return true; // optional
    return /^[+()\-\s0-9]{6,20}$/.test(p.trim());
  };

  const onSaveAccount = async () => {
    if (!fullName.trim()) {
      Alert.alert("Full name required", "Please enter your full name.");
      return;
    }
    if (!email.trim() || !validateEmail(email)) {
      Alert.alert("Invalid email", "Please enter a valid email address.");
      return;
    }
    if (!validatePhone(phone)) {
      Alert.alert(
        "Invalid phone",
        "Phone can include +, digits, spaces, dashes and parentheses."
      );
      return;
    }

    setSaving(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user;
      if (!user) throw new Error("You need to be signed in.");

      // Update auth email if changed
      if (email.trim() && email.trim() !== (user.email ?? "")) {
        const { error: e } = await supabase.auth.updateUser({ email: email.trim() });
        if (e) throw e;
      }

      // Update profile
      const { error: pe } = await supabase
        .from("profiles")
        .update({
          full_name: fullName.trim(),
          phone: phone.trim() || null,
          email: email.trim(),
        })
        .eq("id", user.id);
      if (pe) throw pe;

      Alert.alert("Saved", "Your profile has been updated.");
    } catch (e: any) {
      Alert.alert("Save failed", e?.message || "Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const onChangePassword = async () => {
    if (!currentPw.trim()) {
      Alert.alert("Missing current password", "Enter your current password.");
      return;
    }
    if (!newPassword.trim() || !confirmPw.trim()) {
      Alert.alert("Missing fields", "Enter and confirm your new password.");
      return;
    }
    if (newPassword !== confirmPw) {
      Alert.alert("Mismatch", "New password and confirmation do not match.");
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert("Too short", "Password must be at least 8 characters.");
      return;
    }

    setChangingPw(true);
    try {
      // Verify the current password first by re-authenticating
      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user;
      if (!user || !user.email) throw new Error("You need to be signed in.");

      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPw,
      });
      if (signInErr) {
        // Common case for OAuth-only accounts or wrong password
        throw new Error(
          "Current password is incorrect. If you signed up with Google/Apple, set a password via 'Forgot password' first."
        );
      }

      // If current password is valid, update to the new password
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      setCurrentPw("");
      setNewPassword("");
      setConfirmPw("");
      setShowCurrent(false);
      setShowNew(false);
      setShowConfirm(false);

      Alert.alert("Password updated", "Your password has been changed.");
    } catch (e: any) {
      Alert.alert("Update failed", e?.message || "Please try again.");
    } finally {
      setChangingPw(false);
    }
  };

  const onSignOut = async () => {
    try {
      await supabase.auth.signOut();
      Alert.alert("Signed out", "You have been signed out.");
    } catch (e: any) {
      Alert.alert("Sign out failed", e?.message || "Please try again.");
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f7f8fb" }} edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
          <Header />

          {loading ? (
            <View style={{ paddingTop: 40, alignItems: "center" }}>
              <ActivityIndicator />
            </View>
          ) : (
            <>
              {/* Account Info */}
              <Section title="Account info" subtitle="Update your personal details.">
                <Field label="Full name *">
                  <TextInput
                    style={styles.input}
                    value={fullName}
                    onChangeText={setFullName}
                    placeholder="Your full name"
                  />
                </Field>

                <Field label="Email *">
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    placeholder="you@example.com"
                  />
                  <Hint>
                    Changing your email may require confirmation, depending on the server settings.
                  </Hint>
                </Field>

                <Field label="Phone">
                  <TextInput
                    style={styles.input}
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="+61 4xx xxx xxx"
                    keyboardType="phone-pad"
                  />
                </Field>

                <PrimaryButton onPress={onSaveAccount} loading={saving} label="Save changes" />
              </Section>

              {/* Password */}
              <Section title="Password" subtitle="Verify your current password, then set a new one.">
                <Field label="Current password">
                  <View style={styles.pwRow}>
                    <TextInput
                      style={[styles.input, { flex: 1, paddingRight: 42 }]}
                      value={currentPw}
                      onChangeText={setCurrentPw}
                      placeholder="Current password"
                      secureTextEntry={!showCurrent}
                    />
                    <Pressable
                      style={styles.eyeBtn}
                      onPress={() => setShowCurrent((s) => !s)}
                      hitSlop={6}
                    >
                      <Ionicons
                        name={showCurrent ? "eye-off-outline" : "eye-outline"}
                        size={20}
                        color="#6b7280"
                      />
                    </Pressable>
                  </View>
                </Field>

                <Field label="New password">
                  <View style={styles.pwRow}>
                    <TextInput
                      style={[styles.input, { flex: 1, paddingRight: 42 }]}
                      value={newPassword}
                      onChangeText={setNewPassword}
                      placeholder="********"
                      secureTextEntry={!showNew}
                    />
                    <Pressable
                      style={styles.eyeBtn}
                      onPress={() => setShowNew((s) => !s)}
                      hitSlop={6}
                    >
                      <Ionicons
                        name={showNew ? "eye-off-outline" : "eye-outline"}
                        size={20}
                        color="#6b7280"
                      />
                    </Pressable>
                  </View>
                </Field>

                <Field label="Confirm password">
                  <View style={styles.pwRow}>
                    <TextInput
                      style={[styles.input, { flex: 1, paddingRight: 42 }]}
                      value={confirmPw}
                      onChangeText={setConfirmPw}
                      placeholder="********"
                      secureTextEntry={!showConfirm}
                    />
                    <Pressable
                      style={styles.eyeBtn}
                      onPress={() => setShowConfirm((s) => !s)}
                      hitSlop={6}
                    >
                      <Ionicons
                        name={showConfirm ? "eye-off-outline" : "eye-outline"}
                        size={20}
                        color="#6b7280"
                      />
                    </Pressable>
                  </View>
                </Field>

                <Pressable
                  onPress={onChangePassword}
                  disabled={changingPw}
                  style={[styles.ghostBtn, changingPw && { opacity: 0.7 }]}
                >
                  {changingPw ? (
                    <ActivityIndicator />
                  ) : (
                    <>
                      <Ionicons name="key" size={16} color="#111827" />
                      <Text style={styles.ghostBtnText}>Update password</Text>
                    </>
                  )}
                </Pressable>
                <Hint>
                  If you signed up using Google/Apple and never set a password, use “Forgot password”
                  from the sign-in screen to create one first.
                </Hint>
              </Section>

              {/* Session */}
              <Section title="Session" subtitle="Sign out from this device.">
                <Pressable onPress={onSignOut} style={styles.signOutBtn}>
                  <Ionicons name="log-out-outline" size={18} color="#b91c1c" />
                  <Text style={styles.signOutText}>Sign out</Text>
                </Pressable>
              </Section>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ---- UI Bits ---- */

function Header() {
  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 6 }}>
      <Text style={{ fontSize: 26, fontWeight: "900", color: "#0b0b0c", marginBottom: 4 }}>
        Profile & Settings
      </Text>
      <Text style={{ color: "#6b7280" }}>Manage your account details and password.</Text>
    </View>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle ? <Text style={styles.sectionSub}>{subtitle}</Text> : null}
      <View style={styles.card}>{children}</View>
    </View>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return <Text style={styles.hint}>{children}</Text>;
}

function PrimaryButton({
  onPress,
  label,
  loading,
}: {
  onPress: () => void;
  label: string;
  loading?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!!loading}
      style={[styles.saveBtn, loading && { opacity: 0.7 }]}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <>
          <Ionicons name="save-outline" size={18} color="#fff" />
          <Text style={styles.saveBtnText}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

/* ---- Styles ---- */

const styles = StyleSheet.create({
  sectionTitle: { fontSize: 16, fontWeight: "900", color: "#0b0b0c" },
  sectionSub: { color: "#6b7280", marginTop: 2, marginBottom: 10 },
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
  hint: { color: "#6b7280", marginTop: 6 },

  saveBtn: {
    marginTop: 4,
    backgroundColor: "#2563eb",
    height: 50,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  saveBtnText: { color: "#fff", fontSize: 15, fontWeight: "900" },

  ghostBtn: {
    alignSelf: "flex-start",
    backgroundColor: "#f3f4f6",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  ghostBtnText: { color: "#111827", fontWeight: "800" },

  signOutBtn: {
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fee2e2",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    alignSelf: "flex-start",
  },
  signOutText: { color: "#b91c1c", fontWeight: "900" },

  // Password visibility
  pwRow: { position: "relative" },
  eyeBtn: {
    position: "absolute",
    right: 10,
    top: 12,
    height: 28,
    width: 28,
    alignItems: "center",
    justifyContent: "center",
  },
});
