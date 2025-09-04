import React from "react";
import { ScrollView, StyleSheet, Text, View, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { supabase } from "../../lib/supabase";
import { AdminStackParamList } from "../../navigation/types";

export default function AdminHome() {
  const navigation = useNavigation<NativeStackNavigationProp<AdminStackParamList>>();

  const [loading, setLoading] = React.useState(true);
  const [counts, setCounts] = React.useState({
    pendingBusinesses: 0,
    pendingReviews: 0,
    categoryRequests: 0,
    verificationRequests: 0,
    businessReports: 0,
    allBusinesses: 0,
    users: 0,
    allReviews: 0,
    categories: 0,
    promotions: 0,
  });

  React.useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const parallel = await Promise.all([
          supabase.from("businesses").select("id", { count: "exact", head: true }).eq("status", "pending"),
          supabase.from("reviews").select("id", { count: "exact", head: true }).eq("status", "pending"),
          supabase.from("category_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
          supabase.from("business_verification_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
          supabase.from("business_reports").select("id", { count: "exact", head: true }).eq("status", "pending"),

          supabase.from("businesses").select("id", { count: "exact", head: true }),
          supabase.from("profiles").select("id", { count: "exact", head: true }),
          supabase.from("reviews").select("id", { count: "exact", head: true }),
          supabase.from("categories").select("id", { count: "exact", head: true }),
          supabase.from("promotions").select("id", { count: "exact", head: true }),
        ]);

        setCounts({
          pendingBusinesses: parallel[0].count || 0,
          pendingReviews: parallel[1].count || 0,
          categoryRequests: parallel[2].count || 0,
          verificationRequests: parallel[3].count || 0,
          businessReports: parallel[4].count || 0,
          allBusinesses: parallel[5].count || 0,
          users: parallel[6].count || 0,
          allReviews: parallel[7].count || 0,
          categories: parallel[8].count || 0,
          promotions: parallel[9].count || 0,
        });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: "#f7f8fb" }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
        <Text style={styles.title}>Admin Panel</Text>
        <Text style={styles.sub}>Moderate content and manage the directory</Text>

        <Text style={styles.sectionTitle}>Content Review</Text>
        <View style={styles.grid}>
          <AdminCard icon="time-outline" title="Pending Businesses" count={counts.pendingBusinesses} onPress={() => navigation.navigate("PendingBusinesses")} />
          <AdminCard icon="chatbubbles-outline" title="Pending Reviews" count={counts.pendingReviews} onPress={() => navigation.navigate("PendingReviews")} />
        </View>
        <View style={styles.grid}>
          <AdminCard icon="pricetags-outline" title="Category Requests" count={counts.categoryRequests} onPress={() => navigation.navigate("CategoryRequests")} />
          <AdminCard icon="ribbon-outline" title="Verification Requests" count={counts.verificationRequests} onPress={() => navigation.navigate("VerificationRequests")} />
        </View>
        <View style={styles.grid}>
          <AdminCard icon="flag-outline" title="Business Reports" count={counts.businessReports} onPress={() => navigation.navigate("BusinessReports")} />
          <View style={{ flex: 1 }} />
        </View>

        <Text style={styles.sectionTitle}>Management</Text>
        <View style={styles.grid}>
          <AdminCard icon="storefront-outline" title="All Businesses" count={counts.allBusinesses} onPress={() => navigation.navigate("AllBusinesses")} />
          <AdminCard icon="people-outline" title="Users" count={counts.users} onPress={() => navigation.navigate("Users")} />
        </View>
        <View style={styles.grid}>
          <AdminCard icon="chatbubbles-outline" title="All Reviews" count={counts.allReviews} onPress={() => navigation.navigate("AllReviews")} />
          <AdminCard icon="pricetags-outline" title="Categories" count={counts.categories} onPress={() => navigation.navigate("Categories")} />
        </View>
        <View style={styles.grid}>
          <AdminCard icon="sparkles-outline" title="Promotions" count={counts.promotions} onPress={() => navigation.navigate("Promotions")} />
          <View style={{ flex: 1 }} />
        </View>

        {loading && (
          <View style={{ marginTop: 12 }}>
            <ActivityIndicator />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function AdminCard({
  icon,
  title,
  count,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  count: number;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={{ flex: 1 }}>
      <View style={styles.card}>
        <View style={[styles.iconWrap]}>
          <Ionicons name={icon} size={20} color="#2563eb" />
        </View>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.count}>{count}</Text>
      </View>
    </TouchableOpacity>
  );
}

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
    alignItems: "flex-start",
  },
  iconWrap: {
    borderWidth: 1,
    borderColor: "#c7d2fe",
    backgroundColor: "#eef2ff",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 8,
  },
  cardTitle: { color: "#111827", fontWeight: "900" },
  count: { marginTop: 6, color: "#2563eb", fontWeight: "900", fontSize: 18 },
});
