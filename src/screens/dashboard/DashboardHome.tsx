import React from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { DashboardStackParamList } from "../../navigation/types";
import { supabase } from "../../lib/supabase";

type Props = NativeStackScreenProps<DashboardStackParamList, "DashboardHome">;

export default function DashboardHome({ navigation }: Props) {
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [fullName, setFullName] = React.useState<string | null>(null);

  React.useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) return;

      const { data: prof } = await supabase
        .from("profiles")
        .select("role, full_name")
        .eq("id", user.id)
        .maybeSingle();

      setIsAdmin(prof?.role === "admin");
      setFullName(prof?.full_name ?? null);
    })();
  }, []);

  const goAdmin = () => {
    // If Admin stack is mounted inside this navigator:
    try {
      navigation.navigate("AdminHome" as never);
      return;
    } catch {
      // If Admin stack is mounted at a parent/root level:
      const parent = navigation.getParent();
      if (parent) {
        parent.navigate("AdminHome");
      } else {
        Alert.alert(
          "Admin",
          "Admin panel route is not mounted. Please add AdminStackNavigator to your app router."
        );
      }
    }
  };

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: "#f7f8fb" }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
        <Text style={styles.title}>Dashboard</Text>
        <Text style={styles.sub}>
          {fullName ? `Welcome, ${fullName}` : "Manage your businesses and profile"}
        </Text>

        {/* My area */}
        <Text style={styles.sectionTitle}>My tools</Text>
        <View style={styles.grid}>
          <DashCard
            icon="storefront-outline"
            title="My Businesses"
            subtitle="View & manage"
            onPress={() => navigation.navigate("MyBusinesses")}
          />
          <DashCard
            icon="add-circle-outline"
            title="Add Business"
            subtitle="Create a listing"
            onPress={() => navigation.navigate("AddBusiness")}
          />
        </View>

        <View style={styles.grid}>
          <DashCard
            icon="ribbon-outline"
            title="Request Verification"
            subtitle="Verify a listing"
            onPress={() => navigation.navigate("RequestVerificationList")}
          />
          <DashCard
            icon="settings-outline"
            title="Settings"
            subtitle="Profile & preferences"
            onPress={() => navigation.navigate("ProfileSettings")}
          />
        </View>

        <View style={styles.grid}>
          <DashCard
            icon="help-circle-outline"
            title="Support & Legal"
            subtitle="Contact & policies"
            onPress={() => navigation.navigate("SupportLegalHome")}
          />
          <View style={{ flex: 1 }} />
        </View>

        {/* Admin area (only visible to admins) */}
        {isAdmin && (
          <>
            <Text style={styles.sectionTitle}>Admin</Text>
            <View style={styles.grid}>
              <DashCard
                icon="speedometer-outline"
                title="Admin Panel"
                subtitle="Moderation & management"
                highlight
                onPress={() => navigation.navigate("AdminStack", { screen: "AdminHome" })}              />
              <View style={{ flex: 1 }} />
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/* ------------ Local card component (compact, friendly) ------------ */

function DashCard({
  icon,
  title,
  subtitle,
  onPress,
  highlight,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  highlight?: boolean;
}) {
  const color = highlight ? "#2563eb" : "#111827";
  const tintBg = `${color}12` as any;
  const tintBorder = `${color}33` as any;

  const body = (
    <View style={styles.card}>
      <View style={[styles.iconWrap, { backgroundColor: tintBg, borderColor: tintBorder }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={styles.cardTitle}>{title}</Text>
      {subtitle ? <Text style={styles.cardSub}>{subtitle}</Text> : null}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={{ flex: 1 }}>
        {body}
      </TouchableOpacity>
    );
  }
  return <View style={{ flex: 1 }}>{body}</View>;
}

/* ------------------------------- Styles ------------------------------- */

const styles = StyleSheet.create({
  title: { fontSize: 26, fontWeight: "900", color: "#0b0b0c" },
  sub: { color: "#6b7280", marginTop: 6, marginBottom: 12 },

  sectionTitle: { fontSize: 16, fontWeight: "900", color: "#0b0b0c", marginTop: 16, marginBottom: 10 },

  grid: { flexDirection: "row", gap: 12, marginBottom: 12 },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#eef2f7",
    padding: 14,
  },
  iconWrap: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 8,
  },
  cardTitle: { color: "#111827", fontWeight: "900" },
  cardSub: { color: "#6b7280", marginTop: 4 },
});
