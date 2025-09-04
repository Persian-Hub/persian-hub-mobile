import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AdminStackParamList } from "../../navigation/types";
import { supabase } from "../../lib/supabase";

type Props = NativeStackScreenProps<AdminStackParamList, "Users">;

type ProfileRow = {
  id: string;
  full_name: string | null;
  role: "user" | "admin" | null;
  phone?: string | null;
  suspended?: boolean | null;       // may not exist in DB yet
  created_at?: string | null;
};

export default function Users({ navigation }: Props) {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<ProfileRow[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      // Select optional columns with aliases to avoid errors if missing
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, role, phone, created_at, suspended")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;

      const normalized: ProfileRow[] = (data || []).map((r: any) => ({
        id: r.id,
        full_name: r.full_name ?? null,
        role: (r.role as any) ?? "user",
        phone: r.phone ?? null,
        suspended: typeof r.suspended === "boolean" ? r.suspended : false,
        created_at: r.created_at ?? null,
      }));

      setRows(normalized);
    } catch (e: any) {
      Alert.alert("Load failed", e?.message ?? "Could not load users.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchUsers();
    setRefreshing(false);
  }, [fetchUsers]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((u) =>
      [u.full_name ?? "", u.phone ?? "", u.role ?? ""].some((s) =>
        s.toLowerCase().includes(term)
      )
    );
  }, [q, rows]);

  // Actions
  const setSuspended = async (id: string, next: boolean) => {
    setBusy(id);
    try {
      const { error } = await supabase.from("profiles").update({ suspended: next }).eq("id", id);
      if (error) throw error;
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, suspended: next } : r)));
    } catch (e: any) {
      Alert.alert("Update failed", e?.message || "Could not update suspension.");
    } finally {
      setBusy(null);
    }
  };

  const setRole = async (id: string, next: "user" | "admin") => {
    setBusy(id);
    try {
      const { error } = await supabase.from("profiles").update({ role: next }).eq("id", id);
      if (error) throw error;
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, role: next } : r)));
    } catch (e: any) {
      Alert.alert("Update failed", e?.message || "Could not change role.");
    } finally {
      setBusy(null);
    }
  };

  // Note: deleting an auth user requires Supabase service role (server-side).
  // Here we only delete the profile row as a "soft remove" from app lists.
  const deleteProfile = async (id: string) => {
    setBusy(id);
    try {
      const { error } = await supabase.from("profiles").delete().eq("id", id);
      if (error) throw error;
      setRows((prev) => prev.filter((r) => r.id !== id));
    } catch (e: any) {
      Alert.alert("Delete failed", e?.message || "Could not remove profile.");
    } finally {
      setBusy(null);
    }
  };

  const confirm = (title: string, msg: string, onYes: () => void) => {
    Alert.alert(title, msg, [
      { text: "Cancel", style: "cancel" },
      { text: "Yes", style: "destructive", onPress: onYes },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#f7f8fb" }}>
      <Header onBack={() => navigation.goBack()} />

      <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
        <Text style={styles.title}>Users</Text>
        <Text style={styles.sub}>Search users, suspend/reactivate, or change roles.</Text>

        <TextInput
          placeholder="Search by name, phone, or role…"
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
              <Text style={styles.name}>{item.full_name || "Unnamed user"}</Text>
              <View style={{ flexDirection: "row", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
                <Badge color={item.role === "admin" ? "#06b6d4" : "#2563eb"} text={item.role || "user"} />
                {item.suspended ? (
                  <Badge color="#ef4444" text="Suspended" />
                ) : (
                  <Badge color="#16a34a" text="Active" />
                )}
              </View>

              <View style={styles.row}>
                {/* Suspend/Reactivate only if column exists */}
                <SmallBtn
                  label={item.suspended ? "Reactivate" : "Suspend"}
                  onPress={() =>
                    confirm(
                      item.suspended ? "Reactivate user?" : "Suspend user?",
                      item.suspended
                        ? "This will allow the user to sign in again."
                        : "This will restrict the user’s access.",
                      () => setSuspended(item.id, !item.suspended)
                    )
                  }
                />
                <SmallBtn
                  label={item.role === "admin" ? "Make User" : "Make Admin"}
                  color={item.role === "admin" ? "#374151" : "#06b6d4"}
                  onPress={() =>
                    confirm(
                      "Change role?",
                      item.role === "admin"
                        ? "Demote this admin to a normal user?"
                        : "Promote this user to admin?",
                      () => setRole(item.id, item.role === "admin" ? "user" : "admin")
                    )
                  }
                />
                <SmallBtn
                  label="Remove"
                  color="#ef4444"
                  onPress={() =>
                    confirm(
                      "Remove profile?",
                      "This deletes the profile row only. The auth account is not deleted.\n(Use server-side admin API to delete auth users.)",
                      () => deleteProfile(item.id)
                    )
                  }
                />
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={{ color: "#6b7280" }}>No users found.</Text>
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
}: {
  label: string;
  onPress: () => void;
  color?: string;
}) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.smallBtn, { backgroundColor: color }]} activeOpacity={0.9}>
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

  row: { flexDirection: "row", gap: 8, marginTop: 10 },

  smallBtn: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  smallBtnText: { color: "#fff", fontWeight: "900" },

  badge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, alignSelf: "flex-start" },
  badgeText: { fontWeight: "900" },
});
