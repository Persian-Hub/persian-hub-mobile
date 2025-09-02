import React, { useMemo, useState } from "react";
import {
  Alert,
  Keyboard,
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
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../lib/supabase";
import { HomeStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<HomeStackParamList, "ReviewForm">;

const TITLE_MAX = 80;
const COMMENT_MAX = 800;

export default function ReviewForm({ route, navigation }: Props) {
  const { businessId, businessName } = route.params;

  const [rating, setRating] = useState<number>(0);
  const [hover, setHover] = useState<number>(0); // visual feedback while tapping (android) / pressing (ios)
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = useMemo(() => {
    return rating >= 1 && rating <= 5 && !submitting;
  }, [rating, submitting]);

  const onSubmit = async () => {
    Keyboard.dismiss();

    if (!canSubmit) {
      Alert.alert("Add a rating", "Please choose 1–5 stars before submitting.");
      return;
    }

    try {
      setSubmitting(true);

      // Require logged-in user
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user) {
        setSubmitting(false);
        Alert.alert("Sign in required", "Please log in to write a review.");
        return;
      }

      // Insert review as 'pending'
      const payload = {
        business_id: businessId,
        reviewer_id: user.id, // profiles(id) is same as auth.users.id in your schema
        rating,
        title: title.trim() || null,
        comment: comment.trim() || null,
        status: "pending" as const,
      };

      const { error } = await supabase.from("reviews").insert(payload);
      if (error) throw error;

      Alert.alert(
        "Thanks for your review!",
        "Your review was submitted and will appear once approved.",
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
    } catch (e: any) {
      Alert.alert("Could not submit", e?.message || "Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f7f8fb" }} edges={["top"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 32 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.headerWrap}>
            <Text style={styles.hEyebrow}>Write a review</Text>
            <Text style={styles.hTitle} numberOfLines={2}>
              {businessName}
            </Text>
            <Text style={styles.hSub}>Your feedback helps the community discover great places.</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            {/* Rating */}
            <Text style={styles.label}>Your rating *</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((n) => {
                const active = (hover || rating) >= n;
                return (
                  <TouchableOpacity
                    key={n}
                    onPress={() => setRating(n)}
                    onPressIn={() => setHover(n)}
                    onPressOut={() => setHover(0)}
                    activeOpacity={0.8}
                    style={styles.starHit}
                    accessibilityRole="button"
                    accessibilityLabel={`${n} star${n > 1 ? "s" : ""}`}
                  >
                    <Ionicons
                      name={active ? "star" : "star-outline"}
                      size={32}
                      color={active ? "#f59e0b" : "#d1d5db"}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Title */}
            <View style={{ marginTop: 14 }}>
              <Text style={styles.label}>Title (optional)</Text>
              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Friendly staff and fast service"
                  value={title}
                  onChangeText={(t) => {
                    if (t.length <= TITLE_MAX) setTitle(t);
                  }}
                  returnKeyType="next"
                />
                <Text style={styles.counter}>{title.length}/{TITLE_MAX}</Text>
              </View>
            </View>

            {/* Comment */}
            <View style={{ marginTop: 12 }}>
              <Text style={styles.label}>Your review (optional)</Text>
              <View style={styles.textareaWrap}>
                <TextInput
                  style={[styles.input, styles.textarea]}
                  placeholder="Share details about your experience…"
                  value={comment}
                  onChangeText={(t) => {
                    if (t.length <= COMMENT_MAX) setComment(t);
                  }}
                  multiline
                  textAlignVertical="top"
                />
                <Text style={styles.counter}>{comment.length}/{COMMENT_MAX}</Text>
              </View>
              <Text style={styles.hint}>
                Please keep it respectful. No spam, profanity, or personal information.
              </Text>
            </View>

            {/* Submit */}
            <TouchableOpacity
              style={[styles.submitBtn, !canSubmit && { opacity: 0.6 }]}
              onPress={onSubmit}
              disabled={!canSubmit}
              activeOpacity={0.9}
            >
              <Text style={styles.submitText}>{submitting ? "Submitting…" : "Submit review"}</Text>
            </TouchableOpacity>
          </View>

          {/* Info footer */}
          <View style={styles.infoBox}>
            <Ionicons name="shield-checkmark" size={18} color="#1e3a8a" />
            <Text style={styles.infoText}>
              Reviews are moderated to keep Persian Hub helpful and trustworthy.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ---------------- Styles ---------------- */

const styles = StyleSheet.create({
  headerWrap: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 6 },
  hEyebrow: { color: "#2563eb", fontWeight: "900", marginBottom: 2 },
  hTitle: { fontSize: 22, fontWeight: "900", color: "#0b0b0c" },
  hSub: { color: "#6b7280", marginTop: 6 },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    marginHorizontal: 16,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#eef2f7",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },

  label: { fontWeight: "900", color: "#111827", marginBottom: 8 },
  hint: { color: "#6b7280", marginTop: 8 },

  starsRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  starHit: { paddingHorizontal: 2, paddingVertical: 4 },

  inputWrap: { position: "relative" },
  textareaWrap: { position: "relative" },

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
  textarea: {
    minHeight: 120,
    paddingTop: 12,
  },
  counter: {
    position: "absolute",
    right: 10,
    bottom: 10,
    color: "#9ca3af",
    fontSize: 12,
  },

  submitBtn: {
    marginTop: 16,
    height: 50,
    borderRadius: 12,
    backgroundColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#2563eb",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  submitText: { color: "#fff", fontWeight: "900", fontSize: 16 },

  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 14,
    marginHorizontal: 16,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#eef4ff",
    borderWidth: 1,
    borderColor: "#dbe7ff",
  },
  infoText: { color: "#1e3a8a", fontWeight: "700", flex: 1 },
});
