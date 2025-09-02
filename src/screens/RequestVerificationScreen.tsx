// src/screens/RequestVerificationScreen.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../lib/supabase";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { DashboardStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<
  DashboardStackParamList,
  "RequestVerification"
>;

type Biz = {
  id: string;
  name: string;
  is_verified: boolean;
};

export default function RequestVerificationScreen({ navigation, route }: Props) {
  const preselectBusinessId = route.params?.preselectBusinessId ?? null;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [bizList, setBizList] = useState<Biz[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(preselectBusinessId);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user) {
        Alert.alert("Sign in required", "Please log in to request verification.");
        navigation.goBack();
        return;
      }

      // Only your businesses; include verified flag so we can restrict
      const { data: rows, error } = await supabase
        .from("businesses")
        .select("id,name,is_verified")
        .eq("owner_id", user.id)
        .order("name", { ascending: true });

      if (error) throw error;

      const list = (rows || []) as Biz[];
      setBizList(list);

      // If we were passed a preselected business id, pick it (if available)
      if (preselectBusinessId && list.some((b) => b.id === preselectBusinessId)) {
        setSelectedId(preselectBusinessId);
      } else if (!preselectBusinessId && list.length) {
        // Default to first unverified if any
        const firstUnverified = list.find((b) => !b.is_verified);
        setSelectedId(firstUnverified?.id ?? list[0].id);
      }
    } catch (e: any) {
      Alert.alert("Couldn't load businesses", e?.message || "Please try again.");
    } finally {
      setLoading(false);
    }
  }, [navigation, preselectBusinessId]);

  useEffect(() => {
    load();
  }, [load]);

  const selectedBiz = useMemo(
    () => bizList.find((b) => b.id === selectedId) || null,
    [bizList, selectedId]
  );

  async function submit() {
    if (!selectedId) {
      Alert.alert("Select a business", "Please choose which business to verify.");
      return;
    }

    const chosen = bizList.find((b) => b.id === selectedId);
    if (!chosen) return;
    if (chosen.is_verified) {
      Alert.alert("Already verified", "This business already has a verified badge.");
      return;
    }
    if (!message.trim()) {
      Alert.alert("Add a short note", "Tell us briefly why this business should be verified.");
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user) throw new Error("Sign in required.");

      // Prevent duplicate pending request
      const { data: existing } = await supabase
        .from("business_verification_requests")
        .select("id,status")
        .eq("business_id", selectedId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existing && existing.status === "pending") {
        Alert.alert(
          "Already pending",
          "You already have a pending verification request for this business."
        );
        setSubmitting(false);
        return;
      }

      const payload = {
        business_id: selectedId,
        requested_by: user.id,
        status: "pending" as const,
        request_message: message.trim(),
      };

      const { error } = await supabase
        .from("business_verification_requests")
        .insert(payload);

      if (error) throw error;

      Alert.alert(
        "Request submitted",
        "Thanks! We’ll review your request and notify you when it’s processed."
      );
      navigation.goBack();
    } catch (e: any) {
      Alert.alert("Submit failed", e?.message || "Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f7f8fb" }} edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
          {/* Header */}
          <View style={{ paddingHorizontal: 16, paddingTop: 10 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Ionicons name="shield-checkmark" size={22} color="#1f2a5a" />
              <Text style={{ fontSize: 20, fontWeight: "900", color: "#0b0b0c" }}>
                Request Business Verification
              </Text>
            </View>
            <Text style={{ color: "#6b7280", marginTop: 6 }}>
              Tell us why your business should be verified. This helps us process your request
              faster.
            </Text>
          </View>

          {/* Why Verification Matters */}
          <View style={{ paddingHorizontal: 16, marginTop: 14 }}>
            <View style={styles.infoCard}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <Ionicons name="information-circle" size={18} color="#1e3a8a" />
                <Text style={styles.infoTitle}>Why Verification Matters</Text>
              </View>
              <Text style={styles.infoItem}>• Builds trust with potential customers</Text>
              <Text style={styles.infoItem}>• Required for business promotion</Text>
              <Text style={styles.infoItem}>• Improves search visibility</Text>
              <Text style={styles.infoItem}>• Shows your business is legitimate</Text>
            </View>
          </View>

          {/* Business picker */}
          <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
            <Text style={styles.label}>Select your business</Text>
            <View style={styles.selectWrap}>
              {loading ? (
                <Text style={{ color: "#6b7280" }}>Loading…</Text>
              ) : bizList.length === 0 ? (
                <Text style={{ color: "#6b7280" }}>
                  You don’t have any businesses yet.
                </Text>
              ) : (
                bizList.map((b) => {
                  const isActive = b.id === selectedId;
                  return (
                    <TouchableOpacity
                      key={b.id}
                      onPress={() => setSelectedId(b.id)}
                      style={[
                        styles.optionRow,
                        isActive && { borderColor: "#2563eb", backgroundColor: "#eff6ff" },
                      ]}
                      activeOpacity={0.9}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.optionText, { fontWeight: "900" }]}>{b.name}</Text>
                        {b.is_verified ? (
                          <Text style={{ color: "#059669", fontWeight: "700" }}>Verified</Text>
                        ) : (
                          <Text style={{ color: "#991b1b", fontWeight: "700" }}>Not verified</Text>
                        )}
                      </View>
                      {isActive ? (
                        <Ionicons name="radio-button-on" size={20} color="#2563eb" />
                      ) : (
                        <Ionicons name="radio-button-off" size={20} color="#9ca3af" />
                      )}
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          </View>

          {/* Message */}
          <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
            <Text style={styles.label}>Why should your business be verified?</Text>
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder="Please explain why your business should be verified. Include details about your business legitimacy, customer service, certifications, or any other relevant information…"
              multiline
              style={[styles.input, { height: 140, textAlignVertical: "top", paddingTop: 12 }]}
            />
          </View>

          {/* Action Bar */}
          <View style={{ paddingHorizontal: 16, marginTop: 16, gap: 10, flexDirection: "row" }}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backBtn}
              activeOpacity={0.9}
              disabled={submitting}
            >
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={submit}
              disabled={submitting}
              activeOpacity={0.9}
              style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
            >
              <Ionicons name="shield-checkmark" size={18} color="#fff" />
              <Text style={styles.submitText}>
                {submitting ? "Submitting…" : "Submit Verification Request"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ---------- styles ---------- */

const styles = StyleSheet.create({
  label: { fontWeight: "800", color: "#111827", marginBottom: 8 },
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

  infoCard: {
    backgroundColor: "#eef4ff",
    borderWidth: 1,
    borderColor: "#dbe7ff",
    borderRadius: 14,
    padding: 12,
  },
  infoTitle: { fontWeight: "900", color: "#1e3a8a" },
  infoItem: { color: "#1e3a8a", marginTop: 6 },

  selectWrap: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e6eaf0",
    borderRadius: 12,
    padding: 6,
  },
  optionRow: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "transparent",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginVertical: 4,
  },
  optionText: { color: "#0b0b0c" },

  backBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#f8fafc",
    alignItems: "center",
    justifyContent: "center",
  },
  backText: { color: "#111827", fontWeight: "800" },

  submitBtn: {
    flex: 2,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  submitText: { color: "#fff", fontWeight: "900" },
});
