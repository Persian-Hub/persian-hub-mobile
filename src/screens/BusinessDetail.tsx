// src/screens/BusinessDetail.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { HomeStackParamList } from "../navigation/types";
import { supabase } from "../lib/supabase";

/* ----------------- Types ------------------ */

type Props = NativeStackScreenProps<HomeStackParamList, "BusinessDetail">;

type Business = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  address: string;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  images: string[] | null;
  opening_hours: Record<string, string> | null; // { mon: "09:00 - 17:00", ... }
  is_verified: boolean | null;
  is_sponsored: boolean | null;
  category_id: string | null;
  subcategory_id: string | null;
  services?: string[] | null;
};

type Category = { id: string; name: string; slug: string };
type Subcategory = { id: string; name: string; slug: string };

type ReviewRow = {
  id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  created_at: string;
  reviewer_name: string | null;
};

/* ----------------- Opening hours helpers ------------------ */

const dayOrder = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
const dayLabel: Record<(typeof dayOrder)[number], string> = {
  sun: "Sun",
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
};

function parseRange(s: string | undefined) {
  if (!s || s.toLowerCase() === "closed") return null;
  const parts = s.split("-").map((x) => x.trim());
  if (parts.length !== 2) return null;
  return { start: parts[0], end: parts[1] }; // "HH:MM"
}
function toMinutes(hhmm: string) {
  const [h, m] = hhmm.split(":").map((x) => parseInt(x, 10));
  return h * 60 + (m || 0);
}
function isNowWithin(startHHMM: string, endHHMM: string) {
  const now = new Date();
  const mins = now.getHours() * 60 + now.getMinutes();
  const a = toMinutes(startHHMM);
  const b = toMinutes(endHHMM);
  if (a === b) return false;
  if (a < b) return mins >= a && mins <= b;
  // overnight window (e.g. 20:00-02:00)
  return mins >= a || mins <= b;
}
function computeOpenState(opening: Record<string, string> | null) {
  if (!opening) return { open: false, today: null as string | null, next: null as string | null };
  const now = new Date();
  const idx = now.getDay(); // 0 sun .. 6 sat
  const todayKey = dayOrder[idx];
  const rng = parseRange(opening[todayKey]);
  const open =
    !!rng && rng.start && rng.end ? isNowWithin(rng.start, rng.end) : false;
  const today = rng ? `${rng.start} - ${rng.end}` : "Closed";
  let next: string | null = null;
  if (!open) {
    if (rng && rng.start) next = `Opens today ${rng.start}`;
    else {
      for (let k = 1; k <= 7; k++) {
        const key = dayOrder[(idx + k) % 7];
        const r = parseRange(opening[key]);
        if (r) {
          next = `Opens ${dayLabel[key]} ${r.start}`;
          break;
        }
      }
    }
  }
  return { open, today, next };
}

/* ----------------- Component ------------------ */

export default function BusinessDetail({ route, navigation }: Props) {
  const { id } = route.params;

  const [biz, setBiz] = useState<Business | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [subcategory, setSubcategory] = useState<Subcategory | null>(null);
  const [loading, setLoading] = useState(true);

  // Reviews
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [avgRating, setAvgRating] = useState<number | null>(null);

  // Image viewer
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const openViewer = useCallback((i: number) => {
    setViewerIndex(i);
    setViewerOpen(true);
  }, []);
  const closeViewer = useCallback(() => setViewerOpen(false), []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const { data: b, error: be } = await supabase
        .from("businesses")
        .select(
          "id,name,slug,description,address,latitude,longitude,phone,email,website,images,opening_hours,is_verified,is_sponsored,category_id,subcategory_id,services"
        )
        .eq("id", id)
        .limit(1)
        .maybeSingle();
      if (be) throw be;
      if (!b) {
        Alert.alert("Not found", "This business could not be loaded.", [
          { text: "OK", onPress: () => navigation.goBack() },
        ]);
        return;
      }
      setBiz(b);

      if (b.category_id) {
        const { data: c } = await supabase
          .from("categories")
          .select("id,name,slug")
          .eq("id", b.category_id)
          .maybeSingle();
        if (c) setCategory(c);
      }
      if (b.subcategory_id) {
        const { data: sc } = await supabase
          .from("subcategories")
          .select("id,name,slug")
          .eq("id", b.subcategory_id)
          .maybeSingle();
        if (sc) setSubcategory(sc);
      }

      const { data: rData } = await supabase
        .from("reviews")
        .select("id,rating,title,comment,created_at,reviewer_id,profiles:reviewer_id(full_name)")
        .eq("business_id", id)
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(50);

      if (Array.isArray(rData)) {
        const normalized: ReviewRow[] = rData.map((r: any) => ({
          id: r.id,
          rating: Number(r.rating) || 0,
          title: r.title ?? null,
          comment: r.comment ?? null,
          created_at: r.created_at,
          reviewer_name: r.profiles?.full_name ?? null,
        }));
        setReviews(normalized);
        setAvgRating(
          normalized.length
            ? normalized.reduce((a, x) => a + x.rating, 0) / normalized.length
            : null
        );
      }

      navigation.setOptions({ title: b.name ?? "Business" });
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to load business.");
    } finally {
      setLoading(false);
    }
  }, [id, navigation]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const status = useMemo(() => computeOpenState(biz?.opening_hours ?? null), [biz?.opening_hours]);

  const onCall = () => {
    if (!biz?.phone) return;
    Linking.openURL(`tel:${biz.phone}`);
  };
  const onWebsite = () => {
    if (!biz?.website) return;
    const url = biz.website.startsWith("http") ? biz.website : `https://${biz.website}`;
    Linking.openURL(url);
  };
  const onDirections = () => {
    const lat = biz?.latitude;
    const lng = biz?.longitude;
    if (lat == null || lng == null) return;
    const label = encodeURIComponent(biz?.name || "Business");
    const url = Platform.select({
      ios: `http://maps.apple.com/?daddr=${lat},${lng}&q=${label}`,
      android: `geo:0,0?q=${lat},${lng}(${label})`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=`,
    }) as string;
    Linking.openURL(url);
  };
  const onEmail = () => {
    if (!biz?.email) return;
    Linking.openURL(`mailto:${biz.email}`);
  };

  // Cross-navigator: send user to Dashboard tab to log in
  const goToLoginTab = () => {
    const parent = navigation.getParent();
    if (parent) {
      // We intentionally cross to the bottom tab navigator here.
      parent.navigate("DashboardTab");
    } else {
      Alert.alert("Login", "Open the Dashboard tab to log in.");
    }
  };

  const onWriteReview = useCallback(async () => {
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    if (!user) {
      Alert.alert(
        "Sign in required",
        "Please log in to write a review.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Go to Login", onPress: goToLoginTab },
        ]
      );
      return;
    }
    // Properly typed navigate within Home stack:
    navigation.navigate("ReviewForm", {
      businessId: id,
      businessName: biz?.name ?? "Business",
    });
  }, [navigation, id, biz?.name]);

  if (loading) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "#6b7280" }}>Loading…</Text>
      </View>
    );
  }
  if (!biz) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "#ef4444", fontWeight: "800" }}>No business selected.</Text>
      </View>
    );
  }

  const images = Array.isArray(biz.images) ? biz.images : [];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#f7f8fb" }} contentContainerStyle={{ paddingBottom: 28 }}>
      {/* HEADER IMAGES */}
      {images.length > 0 ? (
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          style={{ width: "100%", height: 220, backgroundColor: "#000" }}
        >
          {images.map((uri, i) => (
            <TouchableOpacity key={uri} activeOpacity={0.9} onPress={() => openViewer(i)}>
              <Image source={{ uri }} style={{ width: Dimensions.get("window").width, height: 220 }} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : (
        <View style={{ width: "100%", height: 160, backgroundColor: "#e5e7eb", alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: "#6b7280" }}>No photos yet</Text>
        </View>
      )}

      {/* NAME + CATEGORIES */}
      <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
        <Text style={{ fontSize: 22, fontWeight: "900", color: "#111827" }}>{biz.name}</Text>
        {(category || subcategory) && (
          <Text style={{ marginTop: 4, color: "#6b7280", fontWeight: "700" }}>
            {category?.name ?? "—"}
            {subcategory ? `  ›  ${subcategory.name}` : ""}
          </Text>
        )}
      </View>

      {/* LOCATION */}
      <Section title="Location">
        <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
          <Text style={{ marginRight: 8 }}>📍</Text>
          <Text style={{ flex: 1, color: "#111827" }}>{biz.address}</Text>
        </View>
      </Section>

      {/* STATUS */}
      <Section title="Status">
        <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <Badge color={status.open ? "#16a34a" : "#ef4444"} text={status.open ? "Open now" : "Closed"} />
          {status.next ? <Badge color="#2563eb" text={status.next} /> : null}
          {biz.is_verified ? <Badge color="#06b6d4" text="Verified ✓" /> : null}
          {biz.is_sponsored ? <Badge color="#f59e0b" text="Sponsored" /> : null}
        </View>
      </Section>

      {/* ABOUT */}
      {biz.description ? (
        <Section title="About">
          <Text style={{ color: "#374151", lineHeight: 20 }}>{biz.description}</Text>
          {!!biz.services?.length && (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
              {biz.services!.map((s) => (
                <View key={s} style={styles.chip}>
                  <Text style={styles.chipText}>{s}</Text>
                </View>
              ))}
            </View>
          )}
        </Section>
      ) : null}

      {/* CONTACT */}
      <Section title="Contact">
        <Row label="Phone" value={biz.phone ?? "—"} onPress={biz.phone ? onCall : undefined} />
        <View style={styles.divider} />
        <Row label="Email" value={biz.email ?? "—"} onPress={biz.email ? onEmail : undefined} />
        <View style={styles.divider} />
        <Row label="Website" value={biz.website ?? "—"} onPress={biz.website ? onWebsite : undefined} />
      </Section>

      {/* OPENING HOURS */}
      <Section title="Opening hours">
        {dayOrder.map((k) => {
          const rng = parseRange(biz.opening_hours?.[k]);
          return (
            <View key={k} style={styles.hoursRow}>
              <Text style={styles.hoursDay}>{dayLabel[k]}</Text>
              <Text style={styles.hoursTime}>{rng ? `${rng.start} - ${rng.end}` : "Closed"}</Text>
            </View>
          );
        })}
      </Section>

      {/* ACTION BUTTONS */}
      <View style={{ paddingHorizontal: 16, marginTop: 8 }}>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <TouchableOpacity
            onPress={onDirections}
            activeOpacity={0.9}
            style={[styles.cta, { backgroundColor: "#16a34a" }]}
          >
            <Text style={styles.ctaText}>Directions</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onCall}
            activeOpacity={0.9}
            style={[styles.cta, { backgroundColor: "#2563eb" }]}
            disabled={!biz.phone}
          >
            <Text style={styles.ctaText}>Call</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onWebsite}
            activeOpacity={0.9}
            style={[styles.cta, { backgroundColor: "#111827" }]}
            disabled={!biz.website}
          >
            <Text style={styles.ctaText}>Website</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* REVIEWS */}
      <Section title="Ratings & reviews">
        {avgRating != null ? (
          <Text style={{ fontWeight: "900", color: "#111827", marginBottom: 6 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Text key={i} style={{ color: i < Math.round(avgRating) ? "#f59e0b" : "#e5e7eb" }}>
                ★
              </Text>
            ))}{" "}
            <Text style={{ color: "#6b7280", fontWeight: "700" }}>
              {avgRating.toFixed(1)} · {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
            </Text>
          </Text>
        ) : (
          <Text style={{ color: "#6b7280", marginBottom: 6 }}>No reviews yet</Text>
        )}

        {reviews.slice(0, 6).map((r) => (
          <View key={r.id} style={styles.reviewCard}>
            <Text style={{ marginBottom: 4 }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Text key={i} style={{ color: i < r.rating ? "#f59e0b" : "#e5e7eb" }}>
                  ★
                </Text>
              ))}
            </Text>
            {r.title ? <Text style={{ fontWeight: "800", color: "#111827" }}>{r.title}</Text> : null}
            {r.comment ? <Text style={{ color: "#374151", marginTop: 4 }}>{r.comment}</Text> : null}
            <Text style={{ color: "#9ca3af", marginTop: 6, fontSize: 12 }}>
              {r.reviewer_name ? r.reviewer_name : "Anonymous"} ·{" "}
              {new Date(r.created_at).toLocaleDateString()}
            </Text>
          </View>
        ))}

        <TouchableOpacity onPress={onWriteReview} style={styles.writeBtn} activeOpacity={0.9}>
          <Text style={styles.writeBtnText}>Write a review</Text>
        </TouchableOpacity>
      </Section>

      {/* IMAGE VIEWER MODAL */}
      <Modal visible={viewerOpen} transparent animationType="fade" onRequestClose={closeViewer}>
        <View style={styles.viewerBackdrop}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            contentOffset={{ x: viewerIndex * Dimensions.get("window").width, y: 0 }}
          >
            {images.map((uri) => (
              <Image key={uri} source={{ uri }} style={styles.viewerImage} resizeMode="contain" />
            ))}
          </ScrollView>
          <TouchableOpacity onPress={closeViewer} style={styles.viewerClose}>
            <Text style={{ color: "#fff", fontWeight: "900", fontSize: 16 }}>✕</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </ScrollView>
  );
}

/* ----------------- Small UI bits ------------------ */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ paddingHorizontal: 16, marginTop: 14 }}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

function Badge({ color, text }: { color: string; text: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: `${color}22`, borderColor: color }]}>
      <Text style={[styles.badgeText, { color }]}>{text}</Text>
    </View>
  );
}

function Row({
  label,
  value,
  onPress,
}: {
  label: string;
  value: string;
  onPress?: () => void;
}) {
  const tappable = !!onPress && value !== "—";
  return (
    <TouchableOpacity onPress={onPress} disabled={!tappable} activeOpacity={0.8}>
      <View style={styles.row}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={[styles.rowValue, tappable && { color: "#2563eb", fontWeight: "800" }]}>
          {value}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

/* ----------------- Styles ------------------ */

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#fff" },

  sectionTitle: { fontSize: 16, fontWeight: "900", color: "#0b0b0c", marginBottom: 8 },
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

  badge: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeText: { fontWeight: "900" },

  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8 },
  rowLabel: { color: "#6b7280", fontWeight: "800" },
  rowValue: { color: "#111827" },
  divider: { height: 1, backgroundColor: "#f1f5f9", marginVertical: 6 },

  hoursRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 },
  hoursDay: { fontWeight: "800", color: "#111827" },
  hoursTime: { color: "#374151" },

  chip: {
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 999,
    paddingHorizontal: 12,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  chipText: { fontWeight: "800", color: "#111827" },

  cta: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaText: { color: "#fff", fontWeight: "900" },

  reviewCard: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#eef2f7",
    borderRadius: 12,
    padding: 12,
    backgroundColor: "#fff",
  },

  writeBtn: {
    marginTop: 12,
    backgroundColor: "#2563eb",
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  writeBtnText: { color: "#fff", fontWeight: "900" },

  viewerBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.95)",
    alignItems: "center",
    justifyContent: "center",
  },
  viewerImage: {
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height * 0.8,
  },
  viewerClose: {
    position: "absolute",
    top: 40,
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
});
