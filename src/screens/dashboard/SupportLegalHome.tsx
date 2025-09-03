import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { StyleSheet, Text, TouchableOpacity, View, ScrollView } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { DashboardStackParamList } from "../../navigation/types";
import { Ionicons } from "@expo/vector-icons";

type Props = NativeStackScreenProps<DashboardStackParamList, "SupportLegalHome">;

const Row = ({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.row}>
    <View style={styles.rowLeft}>
      <Ionicons name={icon} size={22} color="#111827" />
      <Text style={styles.rowText}>{label}</Text>
    </View>
    <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
  </TouchableOpacity>
);

export default function SupportLegalHome({ navigation }: Props) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f7f8fb" }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={styles.title}>Support & Legal</Text>
        <Text style={styles.sub}>Find help, read our policies, or contact us.</Text>

        <View style={styles.card}>
          <Row icon="mail-open-outline" label="Contact Us" onPress={() => navigation.navigate("ContactUs")} />
          <View style={styles.sep} />
          <Row icon="document-text-outline" label="Terms & Conditions" onPress={() => navigation.navigate("Terms")} />
          <View style={styles.sep} />
          <Row icon="lock-closed-outline" label="Privacy Policy" onPress={() => navigation.navigate("Privacy")} />
          <View style={styles.sep} />
          <Row icon="trash-outline" label="Data Deletion Instructions" onPress={() => navigation.navigate("DataDeletion")} />
          <View style={styles.sep} />
          <Row icon="shield-outline" label="Child Safety Standards" onPress={() => navigation.navigate("ChildSafety")} />
          <View style={styles.sep} />
          <Row icon="bug-outline" label="Report an Issue" onPress={() => navigation.navigate("ReportIssue")} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: "900", color: "#0b0b0c" },
  sub: { color: "#6b7280", marginTop: 6, marginBottom: 12 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#eef2f7",
    overflow: "hidden",
  },
  row: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rowLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  rowText: { color: "#111827", fontWeight: "800" },
  sep: { height: 1, backgroundColor: "#f1f5f9" },
});
