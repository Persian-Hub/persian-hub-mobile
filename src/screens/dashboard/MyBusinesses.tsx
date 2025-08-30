// src/screens/dashboard/MyBusinesses.tsx
import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../lib/supabase";

type OwnedBusiness = {
  id: string;
  name: string;
  address: string | null;
  status: "pending" | "approved" | "rejected";
  is_verified: boolean | null;
  is_sponsored: boolean | null;
  updated_at: string | null;
  category_id: string | null;
  subcategory_id: string | null;
};

export default function MyBusinesses({ navigation }: any) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState<OwnedBusiness[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: sess } = await supabase.auth.getSession();
    const uid = sess.session?.user?.id ?? null;
    setUserId(uid);

    if (!uid) {
      setItems([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("businesses")
      .select(
        "id,name,address,status,is_verified,is_sponsored,updated_at,category_id,subcategory_id"
      )
      .eq("owner_id", uid)
      .order("updated_at", { ascending: false });

    if (error) {
      Alert.alert("Error", error.message);
      setItems([]);
    } else {
      setItems((data || []) as OwnedBusiness[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const goAddBusiness = () => {
    Alert.alert("Coming soon", "Add Business screen will be wired next.");
  };

  const goEdit = (b: OwnedBusiness) => {
    Alert.alert("Coming soon", `Edit Business (${b.name}) is not wired yet.`);
  };

  const goPromote = (b: OwnedBusiness) => {
    Alert.alert("Coming soon", `Promotions for (${b.name}) are not wired yet.`);
  };

  // Jump to the PUBLIC page in Home tab → BusinessDetail
  const viewPublic = (b: OwnedBusiness) => {
    navigation.getParent()?.navigate("HomeTab", {
      screen: "BusinessDetail",
      params: { id: b.id },
    });
  };

  const renderItem = ({ item }: { item: OwnedBusiness }) => {
    return (
      <View style={styles.card}>
        <View style={styles.cardHead}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.name}
          </Text>
          <View style={styles.badgeRow}>
            <StatusBadge status={item.status} />
            {item.is_verified ? (
              <Pill text="Verified" color="#10b981" icon="shield-checkmark-outline" />
            ) : null}
            {item.is_sponsored ? (
              <Pill text="Sponsored" color="#f59e0b" icon="star-outline" subtle />
            ) : null}
          </View>
        </View>

        {item.address ? (
          <View style={styles.addrRow}>
            <Ionicons name="location-outline" size={16} color="#6B7280" />
            <Text style={styles.addrText} numberOfLines={1}>
              {item.address}
            </Text>
          </View>
        ) : null}

        <View style={styles.btnRow}>
          <ActionBtn label="View public" onPress={() => viewPublic(item)} />
          <GhostBtn label="Edit" onPress={() => goEdit(item)} />
          <GhostBtn label="Promote" onPress={() => goPromote(item)} />
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.loading}>
          <ActivityIndicator />
        </View>
      </SafeAreaView>
    );
  }

  if (!userId) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.container}>
          <Text style={styles.h1}>My Businesses</Text>
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>You’re not signed in</Text>
            <Text style={styles.emptySub}>
              Go to the Dashboard tab and sign in to manage your listings.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.h1}>My Businesses</Text>
          <TouchableOpacity
            onPress={goAddBusiness}
            activeOpacity={0.9}
            style={styles.addBtn}
          >
            <Ionicons name="add-circle-outline" size={18} color="#2563EB" />
            <Text style={styles.addBtnText}>Add</Text>
          </TouchableOpacity>
        </View>

        {items.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No listings yet</Text>
            <Text style={styles.emptySub}>
              Tap “Add” to create your first business.
            </Text>
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(it) => it.id}
            contentContainerStyle={{ paddingBottom: 24 }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            renderItem={renderItem}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

function StatusBadge({ status }: { status: OwnedBusiness["status"] }) {
  const map = {
    approved: { label: "Approved", color: "#16a34a" },
    pending: { label: "Pending", color: "#f59e0b" },
    rejected: { label: "Rejected", color: "#dc2626" },
  }[status];
  return <Pill text={map.label} color={map.color} />;
}

function Pill({
  text,
  color,
  icon,
  subtle,
}: {
  text: string;
  color: string;
  icon?: keyof typeof Ionicons.glyphMap;
  subtle?: boolean;
}) {
  return (
    <View
      style={[
        styles.pill,
        {
          backgroundColor: subtle ? "transparent" : `${hexToRGBA(color, 0.14)}`,
          borderColor: `${hexToRGBA(color, 0.4)}`,
        },
      ]}
    >
      {icon ? (
        <Ionicons
          name={icon}
          size={14}
          color={color}
          style={{ marginRight: 4 }}
        />
      ) : null}
      <Text style={[styles.pillText, { color }]}>{text}</Text>
    </View>
  );
}

function ActionBtn({
  label,
  onPress,
}: {
  label: string;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={styles.action}>
      <Text style={styles.actionText}>{label}</Text>
    </TouchableOpacity>
  );
}

function GhostBtn({
  label,
  onPress,
}: {
  label: string;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={styles.ghost}>
      <Text style={styles.ghostText}>{label}</Text>
    </TouchableOpacity>
  );
}

function hexToRGBA(hex: string, a: number) {
  if (!hex.startsWith("#")) return `rgba(17,17,17,${a})`;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f7f8fb" },
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 12 },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  h1: { fontSize: 24, fontWeight: "900", color: "#0b0b0c" },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  addBtn: {
    height: 40,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#DBEAFE",
    backgroundColor: "#EFF6FF",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  addBtnText: { color: "#2563EB", fontWeight: "800" },

  empty: { alignItems: "center", marginTop: 24 },
  emptyTitle: { fontWeight: "900", color: "#111827", fontSize: 16 },
  emptySub: { color: "#6b7280", marginTop: 4 },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#eef2f7",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  cardHead: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  cardTitle: { flex: 1, fontWeight: "900", fontSize: 16, color: "#111827" },
  badgeRow: { flexDirection: "row", gap: 8 },

  addrRow: { flexDirection: "row", alignItems: "center", marginTop: 6, gap: 6 },
  addrText: { color: "#374151", fontWeight: "600", flexShrink: 1 },

  btnRow: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  action: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
  },
  actionText: { color: "#fff", fontWeight: "900" },

  ghost: {
    height: 42,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
  },
  ghostText: { color: "#111827", fontWeight: "900" },

  pill: {
    height: 28,
    borderRadius: 999,
    paddingHorizontal: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  pillText: { fontWeight: "800", fontSize: 12 },
});
