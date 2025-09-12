import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function DataDeletionScreen() {
  const openEmail = () => Linking.openURL("mailto:security@persianhub.com.au?subject=Delete%20My%20Account%20%E2%80%93%20Persian%20Hub");

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f7f8fb" }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={styles.title}>Data Deletion Instructions</Text>
        <View style={styles.card}>
          <Text style={styles.p}>Developer: Persian Hub (Aussie Avatar Pty Ltd)</Text>
          <Text style={styles.p}>Contact: security@persianhub.com.au</Text>

          <Text style={styles.h}>How to request data deletion</Text>
          <Text style={styles.p}>
            • Email us from the address linked to your account{"\n"}
            • Subject: "Delete My Account – Persian Hub"{"\n"}
            • Include your full name and account email (optionally, a reason){"\n"}
            We’ll verify your identity and confirm deletion.
          </Text>

          <Text style={styles.h}>What will be deleted</Text>
          <Text style={styles.p}>
            Account details, your business listings, your reviews/ratings/comments, uploaded media, and support requests.
          </Text>

          <Text style={styles.h}>Temporary retention</Text>
          <Text style={styles.p}>
            Audit logs up to 36 months; encrypted backups up to 30 days (then overwritten). After these, data is erased.
          </Text>

          <Text style={styles.h}>Confirmation</Text>
          <Text style={styles.p}>You’ll receive a confirmation email when deletion is completed.</Text>

          <TouchableOpacity onPress={openEmail} activeOpacity={0.9} style={styles.cta}>
            <Text style={styles.ctaText}>Email security@persianhub.com.au</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: "900", color: "#0b0b0c", marginBottom: 10 },
  card: { backgroundColor: "#fff", borderRadius: 16, borderWidth: 1, borderColor: "#eef2f7", padding: 14 },
  h: { fontWeight: "900", color: "#111827", marginTop: 12, marginBottom: 6 },
  p: { color: "#374151", lineHeight: 20 },
  cta: {
    marginTop: 12,
    backgroundColor: "#111827",
    borderRadius: 12,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaText: { color: "#fff", fontWeight: "900" },
});
