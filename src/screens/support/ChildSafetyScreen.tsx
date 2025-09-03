import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Linking, ScrollView, StyleSheet, Text, View } from "react-native";

export default function ChildSafetyScreen() {
  const email = () => Linking.openURL("mailto:security@persianhub.com.au");
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f7f8fb" }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={styles.title}>Child Safety Standards (CSAE)</Text>
        <View style={styles.card}>
          <Text style={styles.p}>Effective Date: 17 August 2025{"\n"}Last Updated: 17 August 2025</Text>

          <Text style={styles.h}>1) Zero-Tolerance Policy</Text>
          <Text style={styles.p}>
            Persian Hub strictly prohibits creation, storage, sharing, or promotion of child sexual abuse material (CSAM) or any content
            that exploits or endangers children. Accounts will be suspended and reported.
          </Text>

          <Text style={styles.h}>2) Detection and Reporting</Text>
          <Text style={styles.p}>
            We review suspicious content via automated and manual moderation. Confirmed cases are reported to relevant authorities (eSafety
            Commissioner, NCMEC where applicable).
          </Text>

          <Text style={styles.h}>3) User Responsibilities</Text>
          <Text style={styles.p}>
            Users must not upload/share CSAE content or use Persian Hub to groom/contact/exploit minors. Report via in-app report or email
            security@persianhub.com.au
          </Text>

          <Text style={styles.h}>4) Protections for Minors</Text>
          <Text style={styles.p}>The service is not directed at children under 16. We delete data if discovered.</Text>

          <Text style={styles.h}>5) Law Enforcement Cooperation</Text>
          <Text style={styles.p}>We cooperate with lawful investigations and may preserve/disclose account info as required.</Text>

          <Text style={styles.h}>6) Staff Training & Accountability</Text>
          <Text style={styles.p}>Team receives regular training and follows strict response guidelines.</Text>

          <Text style={styles.h}>7) Reporting CSAE</Text>
          <Text style={styles.p}>Use the in-app Report function or email security@persianhub.com.au</Text>

          <Text style={styles.h}>8) Continuous Improvement</Text>
          <Text style={styles.p}>We review standards against best practices and regulatory guidance regularly.</Text>
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
});
