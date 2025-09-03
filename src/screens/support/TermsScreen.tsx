import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView, StyleSheet, Text, View } from "react-native";

export default function TermsScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f7f8fb" }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={styles.title}>Terms & Conditions</Text>
        <View style={styles.card}>
          <Text style={styles.p}>
            1) Who we are{"\n"}
            Persian Hub is an online directory (web and mobile apps) that helps people discover Persian-owned businesses.
            The service is operated by Aussie Avatar Pty Ltd (ABN [ABN]) ("Persian Hub", "we", "us", "our").
            {"\n\n"}Contact: [contact email] • [postal address]
          </Text>

          <Text style={styles.h}>2) Agreement to these Terms</Text>
          <Text style={styles.p}>
            By accessing or using Persian Hub, you agree to these Terms & Conditions ("Terms"). If you do not agree, do not use the service.
          </Text>

          <Text style={styles.h}>3) Eligibility & accounts</Text>
          <Text style={styles.p}>
            • You must be at least 16 years old (or the age of digital consent in your region) to use the service.{"\n"}
            • You're responsible for your account and keeping your login credentials secure.{"\n"}
            • Business owners warrant they have authority to represent and submit information for their business.
          </Text>

          <Text style={styles.h}>4) Our service (what we do—and don't)</Text>
          <Text style={styles.p}>
            We provide a directory and discovery platform with location features, search, maps, and an admin review process. We do not
            endorse or guarantee any listed business. Information may be provided by third parties and may change. Distances and map pins
            are estimates and may be imprecise. "Verified" is limited checks; not a guarantee. "Sponsored" indicates promotional placement.
          </Text>

          <Text style={styles.h}>5) Your content & licence</Text>
          <Text style={styles.p}>
            You warrant you own or have rights to the content you submit and grant Persian Hub a worldwide, non-exclusive, royalty-free
            licence to host, store, reproduce, adapt, publish, translate, and display for operating, marketing, and improving the service.
            You retain ownership; backups/caches may persist briefly.
          </Text>

          <Text style={styles.h}>6) Business owner responsibilities</Text>
          <Text style={styles.p}>
            Keep details accurate and up-to-date, only upload images you have rights to, comply with consumer law and industry rules, and
            honor advertised promotions.
          </Text>

          <Text style={styles.h}>7) Reviews & community guidelines</Text>
          <Text style={styles.p}>
            Reviews must be genuine. Prohibited: fake/incentivised reviews, hate/harassment, doxxing, illegal content, malware, scraping.
            We may moderate at our discretion.
          </Text>

          <Text style={styles.h}>8) Approval & moderation</Text>
          <Text style={styles.p}>New and edited listings are reviewed. We can approve/reject/remove or suspend content and accounts.</Text>

          <Text style={styles.h}>9) Third-party services</Text>
          <Text style={styles.p}>
            We use third parties (maps, hosting, auth). Your use of map features is also subject to those providers' terms.
          </Text>

          <Text style={styles.h}>10) Intellectual property</Text>
          <Text style={styles.p}>
            Persian Hub platform, trademarks, design, and code are our IP or used under licence. No copying, reverse engineering, or
            exploitation beyond what is permitted.
          </Text>

          <Text style={styles.h}>11) Acceptable use</Text>
          <Text style={styles.p}>
            Do not misuse the service, interfere with security, scrape, spam, submit fraudulent or illegal content, or use it for
            high-risk/emergency communications.
          </Text>

          <Text style={styles.h}>12) Fees</Text>
          <Text style={styles.p}>Core directory is free; paid features may be added later with separate terms.</Text>

          <Text style={styles.h}>13) Availability & changes</Text>
          <Text style={styles.p}>
            We aim for high availability but do not guarantee uptime. We may change or discontinue features, or update these Terms. Material
            changes will be reasonably notified.
          </Text>

          <Text style={styles.h}>14) Australian Consumer Law</Text>
          <Text style={styles.p}>
            Nothing excludes non-excludable ACL guarantees. Where permitted, the service is provided "as is"; our aggregate liability is
            limited as allowed by law.
          </Text>

          <Text style={styles.h}>15) Indemnity</Text>
          <Text style={styles.p}>
            You indemnify us from claims arising from your use, your content, or your breach of these Terms or the law.
          </Text>

          <Text style={styles.h}>16) Termination</Text>
          <Text style={styles.p}>
            We may suspend or terminate access. Clauses intended to survive termination do so.
          </Text>

          <Text style={styles.h}>17) Governing law & disputes</Text>
          <Text style={styles.p}>
            These Terms are governed by the laws of Queensland, Australia.
          </Text>
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
