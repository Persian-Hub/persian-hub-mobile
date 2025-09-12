import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AuthStackParamList } from "../../navigation/AuthStackNavigator";

type P = NativeStackScreenProps<AuthStackParamList, "VerifyEmail">;

export default function VerifyEmailScreen({ route, navigation }: P) {
  const email = route.params?.email;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.container}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>

        <View style={{ alignItems: "center", marginTop: 12 }}>
          {/* Replace with your own illustration */}
          <Image
            source={require("../../../assets/logo.png")}
            style={{ width: 240, height: 180, resizeMode: "contain" }}
          />
        </View>

        <Text style={styles.title}>Congratulations!</Text>
        <Text style={styles.subtitle}>
          We’ve sent you a verification email{email ? ` at ${email}` : ""}. Please check your inbox and
          follow the instructions to verify your account.
        </Text>

        <TouchableOpacity onPress={() => navigation.replace("Login")} style={{ marginTop: 10 }}>
          <Text style={styles.link}>Sign in here</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 },
  backBtn: {
    width: 40, height: 40, borderRadius: 10, borderWidth: 1, borderColor: "#E5E7EB",
    alignItems: "center", justifyContent: "center",
  },
  backText: { fontSize: 20, fontWeight: "900" },
  title: { fontSize: 28, fontWeight: "900", color: "#0B0B0C", textAlign: "center", marginTop: 8 },
  subtitle: { fontSize: 14, color: "#6B7280", textAlign: "center", marginTop: 6 },
  link: { textAlign: "center", color: "#2563EB", fontWeight: "800", fontSize: 16 },
});
