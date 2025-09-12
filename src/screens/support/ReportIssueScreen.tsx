import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Alert, Linking, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { DashboardStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<DashboardStackParamList, "ReportIssue">;

export default function ReportIssueScreen({ route }: Props) {
  const [subject, setSubject] = useState(route.params?.prefillSubject ?? "");
  const [message, setMessage] = useState("");

  const send = () => {
    const s = (subject || "Support: App Issue").trim();
    const b = message.trim();
    if (!b) {
      Alert.alert("Add details", "Please describe the issue so we can help.");
      return;
    }
    const mailto = `mailto:support@persianhub.com.au?subject=${encodeURIComponent(s)}&body=${encodeURIComponent(b)}`;
    Linking.openURL(mailto);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f7f8fb" }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={styles.title}>Report an Issue</Text>
        <View style={styles.card}>
          <Text style={styles.label}>Subject</Text>
          <TextInput
            style={styles.input}
            placeholder="Short summary"
            value={subject}
            onChangeText={setSubject}
          />

          <Text style={styles.label}>Describe the problem *</Text>
          <TextInput
            style={[styles.input, { height: 140, textAlignVertical: "top", paddingTop: 10 }]}
            placeholder="Tell us what went wrong, what you were doing, and screenshots if possible."
            multiline
            value={message}
            onChangeText={setMessage}
          />

          <TouchableOpacity onPress={send} activeOpacity={0.9} style={styles.cta}>
            <Text style={styles.ctaText}>Send</Text>
          </TouchableOpacity>

          <Text style={styles.hint}>
            We’ll open your email app to submit this report to support@persianhub.com.au
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: "900", color: "#0b0b0c", marginBottom: 10 },
  card: { backgroundColor: "#fff", borderRadius: 16, borderWidth: 1, borderColor: "#eef2f7", padding: 14 },
  label: { fontWeight: "800", color: "#111827", marginBottom: 6, marginTop: 8 },
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
  cta: {
    marginTop: 12,
    backgroundColor: "#2563eb",
    borderRadius: 12,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaText: { color: "#fff", fontWeight: "900" },
  hint: { color: "#6b7280", marginTop: 10 },
});
