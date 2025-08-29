import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import type { Business } from "../types/db";

interface Props {
  item: Business & { km?: number };
  categoryName?: string | null;
  ratingAvg?: number | null;     // e.g., 4.5
  ratingCount?: number | null;   // e.g., 57
  description?: string | null;
  services?: string[] | null;
  isOpen?: boolean | null;
  nextOpen?: string | null;      // e.g., "9:00 AM"
  onPressDetails?: () => void;
  onPressCall?: () => void;
  onPressDirections?: () => void;
}

export default function BusinessCard({
  item,
  categoryName,
  ratingAvg,
  ratingCount,
  description,
  services,
  isOpen,
  nextOpen,
  onPressDetails,
  onPressCall,
  onPressDirections,
}: Props) {
  const cover = item.images?.[0];

  const Stars = ({ value = 0 }: { value?: number | null }) => {
    const val = Math.max(0, Math.min(5, value || 0));
    // Build 5 slots with unicode stars
    const slots = [0,1,2,3,4].map(i => {
      const filled = i + 1 <= Math.floor(val);
      const half = !filled && i + 0.5 <= val;
      return (
        <Text key={i} style={[styles.star, filled && styles.starFilled, half && styles.starHalf]}>
          {filled ? "★" : half ? "★" : "☆"}
        </Text>
      );
    });
    return <View style={{ flexDirection: "row" }}>{slots}</View>;
  };

  const openPill =
    typeof isOpen === "boolean" ? (
      <Text style={[styles.pill, isOpen ? styles.pillOpen : styles.pillClosed]}>
        {isOpen ? "Open now" : "Closed"}
      </Text>
    ) : null;

  return (
    <View style={styles.card}>
      {/* Header: title + category pill */}
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={1}>
          {item.name}
        </Text>
        {!!categoryName && (
          <Text style={styles.categoryPill} numberOfLines={1}>
            {categoryName}
          </Text>
        )}
      </View>

      {/* Rating row */}
      <View style={styles.ratingRow}>
        <Stars value={ratingAvg ?? 0} />
        <Text style={styles.ratingText}>
          {ratingAvg?.toFixed(1) ?? "0.0"}{" "}
          <Text style={{ color: "#6b7280" }}>
            ({ratingCount ?? 0} reviews)
          </Text>
        </Text>
      </View>

      {/* Description */}
      {!!description && (
        <Text style={styles.description} numberOfLines={2}>
          {description}
        </Text>
      )}

      {/* Image */}
      {cover ? (
        <Image source={{ uri: cover }} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]} />
      )}

      {/* Address + distance */}
      {!!item.address && (
        <View style={styles.addrRow}>
          <Text style={styles.addrText} numberOfLines={2}>
            {item.address}
          </Text>
          {typeof item.km === "number" && (
            <Text style={styles.distanceText}>{item.km.toFixed(1)} km away</Text>
          )}
        </View>
      )}

      {/* Open / Closed */}
      <View style={styles.openRow}>
        {openPill}
        {!isOpen && nextOpen ? (
          <Text style={styles.opensAt}>• Opens at {nextOpen}</Text>
        ) : null}
      </View>

      {/* Services chips */}
      {!!services?.length && (
        <View style={styles.servicesWrap}>
          {services.slice(0, 4).map((s, i) => (
            <Text key={`${s}-${i}`} style={styles.serviceChip}>
              {s}
            </Text>
          ))}
        </View>
      )}

      {/* Phone */}
      {!!item.phone && <Text style={styles.phone}>{item.phone}</Text>}

      {/* Big primary + two actions */}
      <View style={styles.actionsCol}>
        <TouchableOpacity
          onPress={onPressDetails}
          style={styles.primaryBtn}
          activeOpacity={0.9}
        >
          <Text style={styles.primaryBtnText}>View Details</Text>
        </TouchableOpacity>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            onPress={onPressCall}
            style={styles.outlineBtn}
            activeOpacity={0.9}
          >
            <Text style={styles.outlineBtnText}>Call Now</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onPressDirections}
            style={styles.outlineBtn}
            activeOpacity={0.9}
          >
            <Text style={styles.outlineBtnText}>Direction</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const R = 16;

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 14,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10 as any,
    marginBottom: 6,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: "800",
    color: "#0b0b0c",
  },
  categoryPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontSize: 12,
    color: "#0369a1",
    backgroundColor: "#e0f2fe",
    borderRadius: 999,
    overflow: "hidden",
  },

  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8 as any,
    marginBottom: 6,
  },
  star: { fontSize: 14, color: "#d1d5db" },
  starFilled: { color: "#f59e0b" },
  starHalf: { color: "#fbbf24" },
  ratingText: { fontSize: 13, color: "#111827" },

  description: { fontSize: 14, color: "#374151", marginBottom: 8 },

  image: {
    width: "100%",
    height: 170,
    borderRadius: 12,
    marginBottom: 10,
  },
  imagePlaceholder: { backgroundColor: "#eef1f5" },

  addrRow: {
    marginBottom: 6,
  },
  addrText: { color: "#4b5563", fontSize: 13 },
  distanceText: { color: "#2563eb", fontSize: 13, marginTop: 4 },

  openRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8 as any,
    marginBottom: 6,
  },
  pill: {
    fontSize: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  pillOpen: { backgroundColor: "#e9fbef", color: "#067647" },
  pillClosed: { backgroundColor: "#fff0f0", color: "#b42318" },
  opensAt: { color: "#6b7280", fontSize: 12 },

  servicesWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8 as any,
    marginTop: 2,
    marginBottom: 6,
  },
  serviceChip: {
    fontSize: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#f3f4f6",
    color: "#1f2937",
  },

  phone: {
    color: "#374151",
    fontSize: 13,
    marginTop: 2,
    marginBottom: 10,
  },

  actionsCol: { gap: 10 as any },
  primaryBtn: {
    height: 46,
    borderRadius: R,
    backgroundColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },

  actionsRow: { flexDirection: "row", gap: 10 as any },
  outlineBtn: {
    flex: 1,
    height: 46,
    borderRadius: R,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  outlineBtnText: { color: "#111827", fontSize: 15, fontWeight: "600" },
});
