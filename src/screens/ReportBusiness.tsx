// src/screens/ReportBusiness.tsx
import React, { useCallback, useState } from "react";
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
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { HomeStackParamList } from "../navigation/types";
import { supabase } from "../lib/supabase";

type Props = NativeStackScreenProps<HomeStackParamList, "ReportBusiness">;

const CATEGORIES = [
  { key: "bullying_unwanted_contact", label: "Bullying or unwanted contact" },
  { key: "restricted_items", label: "Selling or promoting restricted items" },
  { key: "nudity_sexual_activity", label: "Nudity or sexual activity" },
  { key: "scam_fraud_spam", label: "Scam, fraud or spam" },
  { key: "false_information", label: "False information" },
  { key: "intellectual_property", label: "Intellectual property" },
  { key: "child_sexual_abuse", label: "Child sexual abuse and exploitation" },
] as const;

export default function ReportBusiness({ route, navigation }: Props) {
  const { businessId, businessName } = route.params;

  const [category, setCategory] = useState<(typeof CATEGORIES)[number]["key"] | null>(null);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const goToLoginTab = useCallback(() => {
    const parent = navigation.getParent();
    if (parent) parent.navigate("DashboardTab" as never);
    else Alert.alert("Login", "Open the Dashboard tab to log in.");
  }, [navigation]);

  const onSubmit = useCallback(async () => {
    if (!category) {
      Alert.alert("Select a reason", "Please choose a report reason.");
      return;
    }
    if (!description.trim()) {
      Alert.alert("Add details", "Please describe the problem so our team can review it.");
      return;
    }

    setSubmitting(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        Alert.alert(
          "Sign in required",
          "Please log in to submit a report.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Go to Login", onPress: goToLoginTab },
          ]
        );
        return;
      }

      const payload = {
        business_id: businessId,
        reporter_id: auth.user.id,
        report_category: category,
        description: description.trim(),
        status: "pending" as const,
      };

      const { error } = await supabase.from("business_reports").insert(payload);
      if (error) throw error;

      Alert.alert("Thanks", "Your report was submitted for review.");
      navigation.goBack();
    } catch (e: any) {
      Alert.alert("Could not submit", e?.message || "Please try again.");
    } finally {
      setSubmitting(false);
    }
  }, [category, description, businessId, goToLoginTab, navigation]);

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: "#f7f8fb" }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <Text style={styles.title}>Report {businessName ?? "this business"}</Text>
        <Text style={styles.subtitle}>
          Choose a reason and briefly describe the issue. Our admins will review it.
        </Text>

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Reason</Text>
          <View style={{ gap: 10 }}>
            {CATEGORIES.map((c) => {
              const selected = category === c.key;
              return (
                <TouchableOpacity
                  key={c.key}
                  onPress={() => setCategory(c.key)}
                  activeOpacity={0.9}
                  style={[styles.optionRow, selected && styles.optionRowSelected]}
                >
                  <View style={[styles.radio, selected && styles.radioOn]} />
                  <Text style={[styles.optionText, selected && styles.optionTextOn]}>{c.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={{ marginTop: 14 }}>
            <Text style={styles.sectionLabel}>Describe the problem</Text>
            <TextInput
              placeholder="Please provide details so our team can verify and take action."
              style={styles.textarea}
              value={description}
              onChangeText={setDescription}
              multiline
            />
          </View>
        </View>

        <TouchableOpacity
          onPress={onSubmit}
          activeOpacity={0.9}
          disabled={submitting}
          style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
        >
          <Text style={styles.submitText}>{submitting ? "Submitting…" : "Submit report"}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: "900", color: "#0b0b0c" },
  subtitle: { color: "#6b7280", marginTop: 4, marginBottom: 12 },

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

  sectionLabel: { fontWeight: "800", color: "#111827", marginBottom: 8 },

  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
  },
  optionRowSelected: {
    borderColor: "#2563eb",
    backgroundColor: "#eff6ff",
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: "#9ca3af",
    marginRight: 10,
  },
  radioOn: { borderColor: "#2563eb", backgroundColor: "#2563eb" },
  optionText: { color: "#111827", fontWeight: "700" },
  optionTextOn: { color: "#1e3a8a" },

  textarea: {
    minHeight: 120,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    textAlignVertical: "top",
    color: "#111827",
  },

  submitBtn: {
    marginTop: 14,
    height: 52,
    borderRadius: 14,
    backgroundColor: "#ef4444",
    alignItems: "center",
    justifyContent: "center",
  },
  submitText: { color: "#fff", fontWeight: "900", fontSize: 16 },
});
