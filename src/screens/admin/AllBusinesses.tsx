// src/screens/admin/AllBusinesses.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AdminStackParamList } from "../../navigation/types";
import { supabase } from "../../lib/supabase";

type Props = NativeStackScreenProps<AdminStackParamList, "AllBusinesses">;

type Biz = {
  id: string;
  name: string;
  address: string;
  phone: string | null;
  website: string | null;
  status: "pending" | "approved" | "rejected" | null;
  is_verified: boolean | null;
  category_id: string | null;
  subcategory_id: string | null;
  created_at: string | null;
};

export default function AllBusinesses({ navigation }: Props) {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<Biz[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("businesses")
        .select("id,name,address,phone,website,status,is_verified,category_id,subcategory_id,created_at")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      setRows((data || []) as Biz[]);
    } catch (e: any) {
      Alert.alert("Load failed", e?.message || "Could not load businesses.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAll();
    setRefreshing(false);
  }, [fetchAll]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter(
      (b) =>
        b.name.toLowerCase().includes(term) ||
        (b.address || "").toLowerCase().includes(term) ||
        (b.phone || "").toLowerCase().includes(term)
    );
  }, [q, rows]);

  const confirm = (title: string, msg: string, onYes: () => void) => {
    Alert.alert(title, msg, [
      { text: "Cancel", style: "cancel" },
      { text: "Yes", style: "destructive", onPress: onYes },
    ]);
  };

  const setVerified = async (id: string, next: boolean) => {
    setBusy(id);
    try {
      const { error } = await supabase.from("businesses").update({ is_verified: next }).eq("id", id);
      if (error) throw error;
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, is_verified: next } : r)));
    } catch (e: any) {
      Alert.alert("Update failed", e?.message || "Could not update verification.");
    } finally {
      setBusy(null);
    }
  };

  const approve = async (id: string) => {
    setBusy(id);
    try {
      const { error } = await supabase.from("businesses").update({ status: "approved" }).eq("id", id);
      if (error) throw error;
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status: "approved" } : r)));
    } catch (e: any) {
      Alert.alert("Approve failed", e?.message || "Could not approve.");
    } finally {
      setBusy(null);
    }
  };

  const del = async (id: string) => {
    setBusy(id);
    try {
      const { error } = await supabase.from("businesses").delete().eq("id", id);
      if (error) throw error;
      setRows((prev) => prev.filter((r) => r.id !== id));
    } catch (e: any) {
      Alert.alert("Delete failed", e?.message || "Could not delete business.");
    } finally {
      setBusy(null);
    }
  };

  const openDetailPublic = (id: string) => {
    // Cross to the Home tab to show the public BusinessDetail
    const parent = navigation.getParent(); // DashboardTab (BottomTabs)
    if (!parent) return;
    // The typing for nested navigate is a union with overloads; cast to 'any' to avoid the never/tuple error.
    (parent as any).navigate("HomeTab", { screen: "BusinessDetail", params: { id } });
  };

  const goEdit = (id: string) => {
    navigation.navigate("EditBusiness", { businessId: id, adminOverride: true });
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#f7f8fb" }}>
      <Header onBack={() => navigation.goBack()} />
      <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
        <Text style={styles.title}>All Businesses</Text>
        <Text style={styles.sub}>Search, approve, verify, edit or delete listings.</Text>

        <TextInput
          placeholder="Search by name, address or phone…"
          value={q}
          onChangeText={setQ}
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator />
          <Text style={{ color: "#6b7280", marginTop: 8 }}>Loading…</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          refreshing={refreshing}
          onRefresh={onRefresh}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={styles.addr} numberOfLines={2}>{item.address}</Text>
                  <View style={{ flexDirection: "row", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
                    <Badge color={item.status === "approved" ? "#16a34a" : "#f59e0b"} text={item.status ?? "—"} />
                    {item.is_verified ? <Badge color="#06b6d4" text="Verified" /> : <Badge color="#9ca3af" text="Unverified" />}
                  </View>
                </View>
              </View>

              {/* quick actions */}
              <View style={styles.row}>
                <SmallBtn label="View" onPress={() => openDetailPublic(item.id)} />
                <SmallBtn label="Edit" onPress={() => goEdit(item.id)} />
                {item.status !== "approved" ? (
                  <SmallBtn
                    label={busy === item.id ? "…" : "Approve"}
                    color="#16a34a"
                    onPress={() => approve(item.id)}
                    disabled={busy === item.id}
                  />
                ) : (
                  <SmallBtn
                    label={item.is_verified ? "Unverify" : "Verify"}
                    color={item.is_verified ? "#ef4444" : "#06b6d4"}
                    onPress={() =>
                      confirm(
                        item.is_verified ? "Unverify business?" : "Verify business?",
                        item.is_verified
                          ? "This will remove the verified badge."
                          : "This will grant the verified badge.",
                        () => setVerified(item.id, !item.is_verified)
                      )
                    }
                  />
                )}
                <SmallBtn
                  label="Delete"
                  color="#ef4444"
                  onPress={() =>
                    confirm(
                      "Delete business?",
                      "This action cannot be undone.",
                      () => del(item.id)
                    )
                  }
                />
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={{ color: "#6b7280" }}>No businesses found.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

/* ---------- UI bits ---------- */

function Header({ onBack }: { onBack: () => void }) {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onBack} style={styles.backBtn}>
        <Text style={{ color: "#111827", fontSize: 18 }}>‹</Text>
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Admin</Text>
      <View style={{ width: 36 }} />
    </View>
  );
}

function Badge({ color, text }: { color: string; text: string }) {
  return (
    <View style={[styles.badge, { borderColor: color, backgroundColor: `${color}14` }]}>
      <Text style={[styles.badgeText, { color }]}>{text}</Text>
    </View>
  );
}

function SmallBtn({
  label,
  onPress,
  color = "#111827",
  disabled,
}: {
  label: string;
  onPress: () => void;
  color?: string;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.smallBtn,
        { backgroundColor: color },
        disabled && { opacity: 0.5 },
      ]}
      activeOpacity={0.9}
    >
      <Text style={styles.smallBtnText}>{label}</Text>
    </TouchableOpacity>
  );
}

/* ---------- styles ---------- */

const styles = StyleSheet.create({
  header: {
    paddingTop: Platform.select({ ios: 8, android: 8 }),
    paddingHorizontal: 12,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  headerTitle: { flex: 1, textAlign: "center", fontWeight: "900", color: "#111827" },

  title: { fontSize: 22, fontWeight: "900", color: "#0b0b0c", marginTop: 10 },
  sub: { color: "#6b7280", marginTop: 4, marginBottom: 10 },

  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e6eaf0",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: "#111827",
  },

  center: { alignItems: "center", justifyContent: "center", padding: 30 },

  card: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#eef2f7",
    borderRadius: 14,
    padding: 12,
    marginTop: 12,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
  },
  name: { fontWeight: "900", color: "#111827", fontSize: 16 },
  addr: { color: "#475569", marginTop: 4 },

  row: { flexDirection: "row", gap: 8, marginTop: 10, flexWrap: "wrap" },
  smallBtn: {
    flexGrow: 1,
    minWidth: 90,
    height: 42,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  smallBtnText: { color: "#fff", fontWeight: "900" },

  badge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1 },
  badgeText: { fontWeight: "900" },
});
