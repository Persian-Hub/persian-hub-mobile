// src/components/Select.tsx
import React, { useMemo, useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export type SelectItem = { label: string; value: string };

export default function Select({
  value,
  items,
  placeholder = "Select…",
  onChange,
  searchable = true,
  disabled,
}: {
  value: string | null;
  items: SelectItem[];
  placeholder?: string;
  onChange: (v: string | null) => void;
  searchable?: boolean;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const label = useMemo(() => {
    const found = items.find((i) => i.value === value);
    return found?.label || placeholder;
  }, [items, value, placeholder]);

  const filtered = useMemo(() => {
    if (!q.trim()) return items;
    const s = q.trim().toLowerCase();
    return items.filter((i) => i.label.toLowerCase().includes(s));
  }, [items, q]);

  return (
    <>
      <TouchableOpacity
        disabled={disabled}
        onPress={() => setOpen(true)}
        activeOpacity={0.8}
        style={[styles.input, disabled && { opacity: 0.6 }]}
      >
        <Text style={[styles.value, !value && { color: "#9aa3af" }]} numberOfLines={1}>
          {label}
        </Text>
        <Ionicons name="chevron-down" size={16} color="#6b7280" />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <View style={styles.sheetHead}>
              <Text style={styles.sheetTitle}>{placeholder}</Text>
              <TouchableOpacity onPress={() => setOpen(false)} style={styles.closeBtn}>
                <Text style={styles.closeTxt}>✕</Text>
              </TouchableOpacity>
            </View>

            {searchable ? (
              <View style={styles.searchWrap}>
                <Ionicons name="search" size={16} color="#6b7280" />
                <TextInput
                  placeholder="Search…"
                  placeholderTextColor="#9aa3af"
                  value={q}
                  onChangeText={setQ}
                  style={styles.search}
                  autoCorrect={false}
                  autoCapitalize="none"
                />
              </View>
            ) : null}

            <FlatList
              data={filtered}
              keyExtractor={(it) => it.value}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => {
                const selected = value === item.value;
                return (
                  <TouchableOpacity
                    onPress={() => {
                      onChange(item.value);
                      setOpen(false);
                    }}
                    style={[styles.option, selected && styles.optionActive]}
                  >
                    <Text style={[styles.optionText, selected && styles.optionTextActive]}>
                      {item.label}
                    </Text>
                    {selected ? <Ionicons name="checkmark" size={16} color="#2563eb" /> : null}
                  </TouchableOpacity>
                );
              }}
              ListHeaderComponent={
                <TouchableOpacity
                  onPress={() => {
                    onChange(null);
                    setOpen(false);
                  }}
                  style={styles.option}
                >
                  <Text style={styles.optionText}>— None —</Text>
                </TouchableOpacity>
              }
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  input: {
    minHeight: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#eef2f7",
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  value: { color: "#111827", fontSize: 15, fontWeight: "700", flex: 1, marginRight: 8 },

  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.18)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  sheet: {
    width: "100%",
    maxHeight: "80%",
    borderRadius: 16,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#eef2f7",
    paddingBottom: Platform.OS === "ios" ? 10 : 0,
  },
  sheetHead: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  sheetTitle: { fontWeight: "900", color: "#0b0b0c", fontSize: 16, flex: 1 },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
  closeTxt: { fontSize: 14, fontWeight: "900", color: "#111827" },
  searchWrap: {
    marginHorizontal: 14,
    marginBottom: 8,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
    paddingHorizontal: 10,
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  search: { flex: 1, color: "#111827", paddingVertical: 6 },
  option: {
    paddingHorizontal: 14,
    height: 46,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  optionActive: { backgroundColor: "#f8fafc" },
  optionText: { color: "#111827", fontWeight: "700", fontSize: 15 },
  optionTextActive: { color: "#2563eb" },
});
