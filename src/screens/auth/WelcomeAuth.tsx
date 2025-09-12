import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AuthStackParamList } from "../../navigation/AuthStackNavigator";

type P = NativeStackScreenProps<AuthStackParamList, "WelcomeAuth">;

export default function WelcomeAuth({ navigation }: P) {
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.container}>
        <View style={{ alignItems: "center", marginTop: 32 }}>
          {/* Replace with your own illustration asset if you want */}
          <Image
            source={require("../../../assets/logo.png")}
            style={{ width: 240, height: 160, resizeMode: "contain", opacity: 0.95 }}
          />
        </View>

        <Text style={styles.title}>Welcome to the Persian Hub</Text>
        <Text style={styles.subtitle}>
          A platform for Persian businesses and services around you. Find what you need, when you need it.
        </Text>

        {/* Dots (static) */}
        <View style={styles.dots}>
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
        </View>

        <TouchableOpacity
          onPress={() => navigation.navigate("Login")}
          activeOpacity={0.9}
          style={styles.primaryBtn}
        >
          <Text style={styles.primaryBtnText}>Login</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate("Register")}>
          <Text style={styles.link}>Create an account</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const R = 24;
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  container: { flex: 1, paddingHorizontal: 20, paddingBottom: 24 },
  title: { fontSize: 24, fontWeight: "800", color: "#0B0B0C", textAlign: "center", marginTop: 16 },
  subtitle: { fontSize: 14, color: "#6B7280", textAlign: "center", marginTop: 6 },
  dots: { flexDirection: "row", justifyContent: "center", marginTop: 14, gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 6, backgroundColor: "#E5E7EB" },
  dotActive: { backgroundColor: "#2563EB" },
  primaryBtn: {
    height: 56,
    borderRadius: R,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 22,
  },
  primaryBtnText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  link: { textAlign: "center", color: "#2563EB", marginTop: 16, fontWeight: "700" },
});
