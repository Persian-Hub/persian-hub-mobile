// src/screens/dashboard/RequestVerificationList.tsx
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../lib/supabase";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { DashboardStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<
  DashboardStackParamList,
  "RequestVerificationList"
>;

type Biz = {
  id: string;
  name: string;
  is_verified: boolean;
  status?: "pending" | "approved" | "rejected";
};

export default function RequestVerificationList({ navigation }: Props) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [list, setList] = useState<Biz[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user) {
        Alert.alert("Sign in required", "Please log in to request verification.");
        navigation.goBack();
        return;
      }

      // Your businesses
      const { data: rows, error } = await supabase
        .from("businesses")
        .select("id,name,is_verified,status")
        .eq("owner_id", user.id)
        .order("name", { ascending: true });

      if (error) throw error;
      setList((rows || []) as Biz[]);
    } catch (e: any) {
      Alert.alert("Load failed", e?.message || "Please try again.");
    } finally {
      setLoading(false);
    }
  }, [navigation]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const goRequest = (bizId: string) => {
    // ✅ Typed against DashboardStackParamList, no union/overload errors
    navigation.navigate("RequestVerification", { preselectBusinessId: bizId });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f7f8fb" }} edges={["top"]}>
      <View style={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 6 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Ionicons name="shield-checkmark" size={22} color="#1f2a5a" />
          <Text style={{ fontSize: 20, fontWeight: "900", color: "#0b0b0c" }}>
            Request Verification
          </Text>
        </View>
        <Text style={{ color: "#6b7280", marginTop: 6 }}>
          Choose a business below to submit a verification request.
        </Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {list.length === 0 ? (
            <EmptyCard />
          ) : (
            list.map((b) => (
              <BusinessRow key={b.id} b={b} onRequest={() => goRequest(b.id)} />
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

/* ---------- UI bits ---------- */

function EmptyCard() {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>No businesses yet</Text>
      <Text style={styles.sub}>
        Add a business first, then you can request verification.
      </Text>
    </View>
  );
}

function BusinessRow({
  b,
  onRequest,
}: {
  b: Biz;
  onRequest: () => void;
}) {
  return (
    <View style={[styles.card, { marginBottom: 12 }]}>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Text style={[styles.title, { flex: 1 }]}>{b.name}</Text>
        {b.is_verified ? (
          <Badge color="#059669" bg="#ecfdf5" icon="shield-checkmark">
            Verified
          </Badge>
        ) : (
          <Badge color="#991b1b" bg="#fef2f2" icon="shield-outline">
            Not verified
          </Badge>
        )}
      </View>

      {!!b.status && (
        <Text style={{ color: "#6b7280", marginTop: 4 }}>
          Status: <Text style={{ fontWeight: "700", color: "#111827" }}>{b.status}</Text>
        </Text>
      )}

      <View style={{ marginTop: 12, flexDirection: "row", gap: 10 }}>
        <TouchableOpacity
          disabled={b.is_verified}
          onPress={onRequest}
          activeOpacity={0.9}
          style={[
            styles.primaryBtn,
            b.is_verified && { opacity: 0.5 },
          ]}
        >
          <Ionicons name="shield-checkmark" size={16} color="#fff" />
          <Text style={styles.primaryText}>Request verification</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function Badge({
  children,
  color,
  bg,
  icon,
}: {
  children: React.ReactNode;
  color: string;
  bg: string;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: bg,
      }}
    >
      <Ionicons name={icon} size={14} color={color} />
      <Text style={{ color, fontWeight: "800" }}>{children}</Text>
    </View>
  );
}

/* ---------- styles ---------- */

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#eef2f7",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  title: { fontSize: 16, fontWeight: "900", color: "#0b0b0c" },
  sub: { color: "#6b7280", marginTop: 4 },

  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#2563eb",
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
    justifyContent: "center",
  },
  primaryText: { color: "#fff", fontWeight: "900" },
});
