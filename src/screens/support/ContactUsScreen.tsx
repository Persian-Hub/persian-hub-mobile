import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const openMail = () => Linking.openURL("mailto:support@persianhub.com.au?subject=Support%20Request");
const call = () => Linking.openURL("tel:+61433531131");

export default function ContactUsScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f7f8fb" }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={styles.title}>Get in Touch</Text>
        <View style={styles.card}>
          <Text style={styles.h}>Email</Text>
          <TouchableOpacity onPress={openMail} activeOpacity={0.8}>
            <Text style={styles.link}>support@persianhub.com.au</Text>
          </TouchableOpacity>
          <Text style={styles.sub}>We'll respond within 24 hours</Text>

          <Text style={styles.h}>Phone</Text>
          <TouchableOpacity onPress={call} activeOpacity={0.8}>
            <Text style={styles.link}>+61 433 531 131</Text>
          </TouchableOpacity>
          <Text style={styles.sub}>Mon–Fri, 9:00–18:00 AEST</Text>

          <Text style={styles.h}>Address</Text>
          <Text style={styles.p}>15 Llyod Street{"\n"}Alderley 4051, QLD{"\n"}Australia</Text>

          <Text style={styles.h}>Business Hours</Text>
          <Text style={styles.p}>Mon–Fri: 9:00–18:00{"\n"}Sat: 10:00–16:00{"\n"}Sun: Closed</Text>
        </View>

        <Text style={[styles.title, { marginTop: 18 }]}>FAQ</Text>
        <View style={styles.card}>
          <Text style={styles.h}>How do I add my business?</Text>
          <Text style={styles.p}>Create an account and go to Dashboard → Add Business. Listings are reviewed before going live.</Text>
          <View style={styles.sep} />
          <Text style={styles.h}>Is listing my business free?</Text>
          <Text style={styles.p}>Yes. Premium visibility features may be offered in future.</Text>
          <View style={styles.sep} />
          <Text style={styles.h}>How long does approval take?</Text>
          <Text style={styles.p}>Most listings are reviewed within 24–48 business hours.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: "900", color: "#0b0b0c", marginBottom: 10 },
  card: { backgroundColor: "#fff", borderRadius: 16, borderWidth: 1, borderColor: "#eef2f7", padding: 14 },
  h: { fontWeight: "900", color: "#111827", marginBottom: 6 },
  p: { color: "#374151", lineHeight: 20 },
  sub: { color: "#6b7280", marginBottom: 12 },
  link: { color: "#2563eb", fontWeight: "900", marginBottom: 6 },
  sep: { height: 1, backgroundColor: "#f1f5f9", marginVertical: 12 },
});
