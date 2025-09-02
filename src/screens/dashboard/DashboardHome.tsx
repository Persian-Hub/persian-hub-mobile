// src/screens/dashboard/DashboardHome.tsx
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { supabase } from "../../lib/supabase";
import { Ionicons } from "@expo/vector-icons";

type CardProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress?: () => void;
};

function DashCard({ icon, title, subtitle, onPress }: CardProps) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={styles.card}>
      <View style={styles.cardIconWrap}>
        <Ionicons name={icon} size={24} color="#2563EB" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardTitle}>{title}</Text>
        {subtitle ? <Text style={styles.cardSub}>{subtitle}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
    </TouchableOpacity>
  );
}

export default function DashboardHome({ navigation }: any) {
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) Alert.alert("Sign out failed", error.message);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.container}>
        <Text style={styles.h1}>Your Dashboard</Text>

        <View style={{ gap: 12 }}>
          <DashCard
            icon="briefcase-outline"
            title="My Businesses"
            subtitle="Manage your listings"
            onPress={() => navigation.navigate("MyBusinesses")}
          />
          <DashCard
            icon="add-circle-outline"
            title="Add a Business"
            subtitle="Create a new listing"
            onPress={() => navigation.navigate("AddBusiness")}
          />
          <DashCard
            icon="pricetag-outline"
            title="Promotions"
            subtitle="Boost your visibility"
            onPress={() => Alert.alert("TODO", "Hook up Promotions screen")}
          />
          <DashCard
            icon="shield-checkmark-outline"
            title="Verification"
            subtitle="Request or track verification"
            onPress={() => navigation.navigate("RequestVerificationList")}
          />
          <DashCard
            icon="settings-outline"
            title="Settings"
            subtitle="Profile & preferences"
            onPress={() => navigation.navigate("ProfileSettings")}
          />
        </View>

        <TouchableOpacity
          onPress={signOut}
          activeOpacity={0.9}
          style={styles.signOutBtn}
        >
          <Ionicons name="log-out-outline" size={18} color="#DC2626" />
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f7f8fb" },
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 12 },
  h1: { fontSize: 24, fontWeight: "900", color: "#0b0b0c", marginBottom: 12 },

  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#eef2f7",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  cardIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: { color: "#111827", fontWeight: "800", fontSize: 15 },
  cardSub: { color: "#6B7280", marginTop: 2 },

  signOutBtn: {
    marginTop: 20,
    alignSelf: "flex-start",
    backgroundColor: "#FEF2F2",
    borderColor: "#FEE2E2",
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  signOutText: { color: "#DC2626", fontWeight: "800" },
});
