// src/screens/dashboard/MyBusinesses.tsx
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { supabase } from "../../lib/supabase";
import type { DashboardStackParamList } from "../../navigation/types";

type Nav = NativeStackNavigationProp<DashboardStackParamList, "MyBusinesses">;

type Biz = {
  id: string;
  name: string;
  description: string | null;
  images: string[] | null;
  status: "pending" | "approved" | "rejected";
  is_verified: boolean;
};

export default function MyBusinesses() {
  const navigation = useNavigation<Nav>();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Biz[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user;
      if (!user) {
        Alert.alert("Sign in required", "Please sign in to view your businesses.");
        return;
      }

      const { data, error } = await supabase
        .from("businesses")
        .select("id,name,description,images,status,is_verified")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setItems((data || []) as Biz[]);
    } catch (e: any) {
      Alert.alert("Load failed", e?.message || "Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsub = navigation.addListener("focus", load);
    return unsub;
  }, [navigation, load]);

  const renderItem = ({ item }: { item: Biz }) => {
    const cover = item.images && item.images.length ? item.images[0] : undefined;
    return (
      <View style={styles.card}>
        <View style={{ flexDirection: "row", gap: 12 }}>
          <View style={styles.coverBox}>
            {cover ? (
              <Image source={{ uri: cover }} style={styles.cover} />
            ) : (
              <View style={styles.coverPlaceholder}>
                <Ionicons name="image" size={20} color="#9ca3af" />
              </View>
            )}
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.name} numberOfLines={1}>{item.name}</Text>

            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 }}>
              <StatusPill status={item.status} />
              {item.is_verified && (
                <View style={styles.verifiedPill}>
                  <Ionicons name="checkmark-circle" size={14} color="#16a34a" />
                  <Text style={styles.verifiedText}>Verified</Text>
                </View>
              )}
            </View>

            {item.description ? (
              <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>
            ) : null}

            <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
              <Pressable
                onPress={() => navigation.navigate("EditBusiness", { businessId: item.id })} // <-- FIXED
                style={styles.editBtn}
              >
                <Ionicons name="create-outline" size={16} color="#fff" />
                <Text style={styles.editBtnText}>Edit</Text>
              </Pressable>

              <Pressable
                onPress={() =>
                  navigation.navigate("RequestVerification", { preselectBusinessId: item.id })
                }
                style={styles.verifyBtn}
              >
                <Ionicons name="shield-checkmark" size={16} color="#2563eb" />
                <Text style={styles.verifyBtnText}>
                  {item.is_verified ? "Verified" : "Request verification"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f7f8fb" }} edges={["top"]}>
      <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 6 }}>
        <Text style={{ fontSize: 26, fontWeight: "900", color: "#0b0b0c", marginBottom: 4 }}>
          My businesses
        </Text>
        <Text style={{ color: "#6b7280" }}>Manage and edit your listings.</Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator />
        </View>
      ) : (
        <FlatList
          contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
          data={items}
          keyExtractor={(b) => b.id}
          renderItem={renderItem}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="briefcase-outline" size={22} color="#9ca3af" />
              <Text style={styles.emptyText}>You haven’t added any businesses yet.</Text>
              <Pressable
                onPress={() => navigation.navigate("AddBusiness")}
                style={styles.addBtn}
              >
                <Ionicons name="add" size={18} color="#fff" />
                <Text style={styles.addBtnText}>Add business</Text>
              </Pressable>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

function StatusPill({ status }: { status: Biz["status"] }) {
  const map: Record<Biz["status"], { bg: string; fg: string; label: string }> = {
    pending: { bg: "#fef3c7", fg: "#92400e", label: "Pending" },
    approved: { bg: "#dcfce7", fg: "#166534", label: "Approved" },
    rejected: { bg: "#fee2e2", fg: "#991b1b", label: "Rejected" },
  };
  const s = map[status];
  return (
    <View style={{ backgroundColor: s.bg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 }}>
      <Text style={{ color: s.fg, fontWeight: "800", fontSize: 12 }}>{s.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#eef2f7",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  coverBox: {
    width: 84,
    height: 84,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  cover: { width: "100%", height: "100%" },
  coverPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  name: { fontSize: 16, fontWeight: "900", color: "#0b0b0c" },
  desc: { color: "#6b7280", marginTop: 4 },

  verifiedPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ecfdf5",
    borderWidth: 1,
    borderColor: "#a7f3d0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  verifiedText: { marginLeft: 4, color: "#065f46", fontWeight: "800", fontSize: 12 },

  editBtn: {
    backgroundColor: "#111827",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  editBtnText: { color: "#fff", fontWeight: "900" },

  verifyBtn: {
    backgroundColor: "#eff6ff",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "#dbeafe",
  },
  verifyBtnText: { color: "#2563eb", fontWeight: "900" },

  emptyBox: {
    marginTop: 40,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#eef2f7",
    alignItems: "center",
    gap: 12,
  },
  emptyText: { color: "#6b7280" },
  addBtn: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  addBtnText: { color: "#fff", fontWeight: "900" },
});
