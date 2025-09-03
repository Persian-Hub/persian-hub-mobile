import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView, StyleSheet, Text, View } from "react-native";

export default function PrivacyPolicyScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f7f8fb" }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={styles.title}>Privacy Policy</Text>
        <View style={styles.card}>
          <Text style={styles.p}>
            Effective date: 17 August 2025{"\n\n"}
            This Privacy Policy explains how Persian Hub collects, uses, discloses, and protects personal information, in
            compliance with the Privacy Act 1988 (Cth) and APPs. If you are in the EEA/UK, additional GDPR rights apply.
          </Text>

          <Text style={styles.h}>1) Controller & Contact</Text>
          <Text style={styles.p}>
            Controller: Aussie Avatar Pty Ltd (ABN Aussie Avatar Pty Ltd){"\n"}
            Contact: info@persianhub.com.au
          </Text>

          <Text style={styles.h}>2) Information we collect</Text>
          <Text style={styles.p}>
            We collect account details, business details, user content, support comms; and automatically gather location
            (with consent), device/log data, and usage analytics. We may receive data from auth providers (Google/Apple).
          </Text>

          <Text style={styles.h}>3) How we use information</Text>
          <Text style={styles.p}>
            To provide/maintain the service; process submissions/approvals; show relevant results; communicate updates;
            improve safety; analyse usage; comply with laws.
          </Text>

          <Text style={styles.h}>4) GDPR legal bases</Text>
          <Text style={styles.p}>Contract, legitimate interests, consent (e.g., location), and legal obligations.</Text>

          <Text style={styles.h}>5) Sharing</Text>
          <Text style={styles.p}>
            With service providers (hosting, email/SMS, analytics), mapping providers, owners (public reviews), and authorities
            where required. We do not sell personal information.
          </Text>

          <Text style={styles.h}>6) International transfers</Text>
          <Text style={styles.p}>
            Data may be processed outside Australia; we take reasonable steps to protect it in line with APPs/GDPR.
          </Text>

          <Text style={styles.h}>7) Retention</Text>
          <Text style={styles.p}>
            We keep data while needed; backups/logs for defined periods (e.g., 24–36 months) then delete or de-identify.
          </Text>

          <Text style={styles.h}>8) Security</Text>
          <Text style={styles.p}>Encryption in transit, access controls, logging, least-privilege, and RLS on data.</Text>

          <Text style={styles.h}>9) Your choices & rights</Text>
          <Text style={styles.p}>
            Control location permissions; opt-out of non-essential emails; request access/correction/deletion (subject to legal
            needs). EEA/UK rights include object, restrict, portability. Contact: info@persianhub.com.au
          </Text>

          <Text style={styles.h}>10) Cookies & similar</Text>
          <Text style={styles.p}>We use local storage/tokens essential for app functionality.</Text>

          <Text style={styles.h}>11) Children</Text>
          <Text style={styles.p}>Not directed to children under 16; we delete data if discovered.</Text>

          <Text style={styles.h}>12) Data breaches</Text>
          <Text style={styles.p}>We assess and notify as required under Australia’s NDB scheme.</Text>

          <Text style={styles.h}>13) Third-party sites</Text>
          <Text style={styles.p}>Linked sites have their own privacy practices.</Text>

          <Text style={styles.h}>14) Changes</Text>
          <Text style={styles.p}>We may update this policy; material changes will be reasonably notified.</Text>
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
