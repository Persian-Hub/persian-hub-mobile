// src/screens/BusinessDetail.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { supabase } from "../lib/supabase";
import { HomeStackParamList } from "../navigation/types";

// ---- Local fallbacks (light) ----
type Business = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  images: string[] | null;
  opening_hours: any | null;
  is_verified: boolean | null;
  is_sponsored: boolean | null;
  category_id: string | null;
  subcategory_id: string | null;
  services?: string[] | null;
};
type Category = { id: string; name: string; slug: string };
type Props = NativeStackScreenProps<HomeStackParamList, "BusinessDetail">;

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// --- helpers (opening hours / formatting) ---
function to24h(s?: string | null) {
  if (!s) return null;
  const m = s.match(/(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)?/);
  if (!m) return null;
  let hh = parseInt(m[1], 10);
  const mm = m[2];
  const ampm = m[3]?.toLowerCase();
  if (ampm === "pm" && hh < 12) hh += 12;
  if (ampm === "am" && hh === 12) hh = 0;
  return `${String(hh).padStart(2, "0")}:${mm}`;
}
type DayRange = { open: string | null; close: string | null };
type HoursMap = Record<string, DayRange>;
function normalizeOpeningHours(raw: any): HoursMap {
  const map: HoursMap = {};
  const keyMap: Record<string, string> = {
    mon: "Mon",
    tue: "Tue",
    wed: "Wed",
    thu: "Thu",
    fri: "Fri",
    sat: "Sat",
    sun: "Sun",
  };
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    for (const k of Object.keys(raw)) {
      const std = keyMap[k.toLowerCase()] || k;
      const v = raw[k];
      if (DAYS.includes(std)) {
        if (typeof v === "string") {
          const [o, c] = v.split("-").map((x: string) => to24h(x.trim()));
          map[std] = { open: o ?? null, close: c ?? null };
        } else {
          map[std] = {
            open: to24h(v?.open) ?? null,
            close: to24h(v?.close) ?? null,
          };
        }
      }
    }
  } else if (Array.isArray(raw)) {
    for (const it of raw) {
      const d = (it?.day || "").slice(0, 3);
      if (DAYS.includes(d)) {
        map[d] = { open: to24h(it.open) ?? null, close: to24h(it.close) ?? null };
      }
    }
  }
  for (const d of DAYS) if (!map[d]) map[d] = { open: null, close: null };
  return map;
}
function minutesOf(dayIdx: number, timeHHmm: string) {
  const [h, m] = timeHHmm.split(":").map(Number);
  return dayIdx * 1440 + h * 60 + m;
}
function getNowMinutes() {
  const now = new Date();
  let dayIdx = now.getDay(); // 0=Sun..6=Sat
  dayIdx = dayIdx === 0 ? 6 : dayIdx - 1; // Mon=0
  const min = now.getHours() * 60 + now.getMinutes();
  return { min: dayIdx * 1440 + min, dayIdx };
}
function isOpenNow(opening_hours: any) {
  const map = normalizeOpeningHours(opening_hours);
  const { min } = getNowMinutes();
  const windows: Array<{ start: number; end: number }> = [];
  DAYS.forEach((d, i) => {
    const o = map[d].open,
      c = map[d].close;
    if (o && c) {
      let start = minutesOf(i, o);
      let end = minutesOf(i, c);
      if (end <= start) end += 1440; // overnight
      windows.push({ start, end });
    }
  });
  const WEEK = 7 * 1440;
  const all = windows.concat(windows.map((w) => ({ start: w.start + WEEK, end: w.end + WEEK })));
  const open = all.some((w) => min >= w.start && min < w.end);
  return { open };
}
function nextOpenToday(opening_hours: any): string | null {
  const map = normalizeOpeningHours(opening_hours);
  const { min, dayIdx } = getNowMinutes();
  const today = DAYS[dayIdx];
  const o = map[today].open,
    c = map[today].close;
  if (!o || !c) return null;
  let start = minutesOf(dayIdx, o);
  let end = minutesOf(dayIdx, c);
  if (end <= start) end += 1440;
  if (min < start) return o;
  return null;
}
function openRangeText(opening_hours: any, day: string) {
  const r = normalizeOpeningHours(opening_hours)[day];
  if (!r || !r.open || !r.close) return "Closed";
  return `${r.open} - ${r.close}`;
}
function formatCategory(cat?: Category | null, sub?: { name: string } | null) {
  if (!cat && !sub) return "—";
  if (cat && sub) return `${cat.name}  ›  ${sub.name}`;
  if (cat) return cat.name;
  return sub?.name ?? "—";
}
function mapsLink(lat?: number | null, lng?: number | null, address?: string | null) {
  if (lat && lng) {
    if (Platform.OS === "ios") return `http://maps.apple.com/?daddr=${lat},${lng}`;
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  }
  if (address) return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  return null;
}
function hexToRGBA(hex: string, a: number) {
  if (!hex.startsWith("#")) return `rgba(17,17,17,${a})`;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}

export default function BusinessDetail({ route, navigation }: Props) {
  const businessId = route.params.id; // ✅ read `id`
  const [biz, setBiz] = useState<Business | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [subcategory, setSubcategory] = useState<{ id: string; name: string; slug: string } | null>(null);
  const [reviews, setReviews] = useState<
    { id: string; rating: number; title: string | null; comment: string | null; created_at: string; reviewer_name: string | null }[]
  >([]);
  const [avgRating, setAvgRating] = useState<number | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const { width } = useWindowDimensions();

  const openViewer = useCallback((i: number) => {
    setViewerIndex(i);
    setViewerOpen(true);
  }, []);
  const closeViewer = useCallback(() => setViewerOpen(false), []);

  useEffect(() => {
    (async () => {
      const { data: b, error: be } = await supabase
        .from("businesses")
        .select(
          "id,name,slug,description,address,latitude,longitude,phone,email,website,images,opening_hours,is_verified,is_sponsored,category_id,subcategory_id,services"
        )
        .eq("id", businessId)
        .limit(1)
        .maybeSingle();

      if (be || !b) {
        Alert.alert("Not found", "This business could not be loaded.");
        navigation.goBack();
        return;
      }

      setBiz(b as Business);

      if (b.category_id) {
        const { data: c } = await supabase
          .from("categories")
          .select("id,name,slug")
          .eq("id", b.category_id)
          .maybeSingle();
        if (c) setCategory(c as Category);
      }
      if (b.subcategory_id) {
        const { data: sc } = await supabase
          .from("subcategories")
          .select("id,name,slug")
          .eq("id", b.subcategory_id)
          .maybeSingle();
        if (sc) setSubcategory(sc as any);
      }

      const { data: rData } = await supabase
        .from("reviews")
        .select("id,rating,title,comment,created_at,reviewer_id,profiles:reviewer_id(full_name)")
        .eq("business_id", businessId)
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(20);

      if (Array.isArray(rData)) {
        const normalized = rData.map((r: any) => ({
          id: r.id,
          rating: Number(r.rating) || 0,
          title: r.title ?? null,
          comment: r.comment ?? null,
          created_at: r.created_at,
          reviewer_name: r.profiles?.full_name ?? null,
        }));
        setReviews(normalized);
        setAvgRating(normalized.length ? normalized.reduce((a, x) => a + x.rating, 0) / normalized.length : null);
      }

      navigation.setOptions({ title: b.name ?? "Business" });
    })();
  }, [businessId, navigation]);

  const status = useMemo(() => {
    if (!biz) return { open: false, next: null as string | null };
    const map = normalizeOpeningHours(biz.opening_hours);
    const open = isOpenNow(biz.opening_hours).open;
    const next = open ? null : nextOpenToday(map);
    return { open, next };
  }, [biz]);

  const heroImages: string[] = (biz?.images ?? []).filter(Boolean) as string[];

  const onOpenMaps = () => {
    const url = mapsLink(biz?.latitude ?? null, biz?.longitude ?? null, biz?.address ?? null);
    if (url) Linking.openURL(url);
  };
  const onCall = () => biz?.phone && Linking.openURL(`tel:${biz.phone}`);
  const onEmail = () => {
    if (biz?.email) {
      const subject = encodeURIComponent(`Inquiry about ${biz.name}`);
      Linking.openURL(`mailto:${biz.email}?subject=${subject}`);
    }
  };
  const onWebsite = () => {
    if (biz?.website) {
      const w = biz.website.startsWith("http") ? biz.website : `https://${biz.website}`;
      Linking.openURL(w);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={{ width: "100%", backgroundColor: "#f3f4f6" }}>
          {heroImages.length > 0 ? (
            <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
              {heroImages.map((uri, i) => (
                <Pressable onPress={() => openViewer(i)} key={uri + i} style={{ width, height: 220 }}>
                  <Image source={{ uri }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                </Pressable>
              ))}
            </ScrollView>
          ) : (
            <View style={{ width: "100%", height: 220, alignItems: "center", justifyContent: "center" }}>
              <Text style={{ color: "#9ca3af" }}>No images</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.title}>{biz?.name ?? "Business"}</Text>
        </View>

        <Section title="Category">
          <Text style={styles.catText}>
            {category && subcategory
              ? `${category.name}  ›  ${subcategory.name}`
              : category?.name || subcategory?.name || "—"}
          </Text>
        </Section>

        <Section title="Location">
          <TouchableOpacity onPress={onOpenMaps} activeOpacity={0.8} style={styles.rowCenter}>
            <Text style={styles.pin}>📍</Text>
            <Text style={styles.addrText}>{biz?.address ?? "—"}</Text>
            <Text style={styles.openMapLink}>  (Open map)</Text>
          </TouchableOpacity>
        </Section>

        <Section title="Status">
          <View style={[styles.rowCenter, { gap: 10 }]}>
            <Badge color={status.open ? "#16a34a" : "#dc2626"} text={status.open ? "Open now" : "Closed"} />
            {status.next && !status.open ? <Badge color="#2563eb" text={`Opens at ${status.next}`} subtle /> : null}
            {biz?.is_verified ? <Badge color="#10b981" text="Verified" icon="✅" /> : null}
            {biz?.is_sponsored ? <Badge color="#f59e0b" text="Sponsored" icon="★" subtle /> : null}
          </View>
        </Section>

        <Section title="About">
          <Text style={styles.bodyText}>{biz?.description || "No description provided."}</Text>
        </Section>

        <Section title="Contact">
          <View style={{ gap: 8 }}>
            <Row label="Phone" value={biz?.phone ?? "—"} onPress={biz?.phone ? onCall : undefined} />
            <Row label="Email" value={biz?.email ?? "—"} onPress={biz?.email ? onEmail : undefined} />
            <Row label="Website" value={biz?.website ?? "—"} onPress={biz?.website ? onWebsite : undefined} />
          </View>
        </Section>

        <Section title="Opening Hours">
          <View style={{ gap: 8 }}>
            {DAYS.map((d) => (
              <View key={d} style={styles.hoursRow}>
                <Text style={styles.hoursDay}>{d}</Text>
                <Text style={styles.hoursTime}>{openRangeText(biz?.opening_hours, d)}</Text>
              </View>
            ))}
          </View>
        </Section>

        <View style={[styles.section, { marginTop: 8 }]}>
          <View style={styles.btnRow}>
            <ActionBtn label="Directions" onPress={onOpenMaps} color="#16a34a" />
            <ActionBtn label="Call" onPress={onCall} color="#2563eb" />
            <ActionBtn label="Website" onPress={onWebsite} color="#111827" light />
          </View>
        </View>

        <Section title="Reviews & Ratings">
          {avgRating != null ? (
            <View style={styles.ratingHeader}>
              <Text style={styles.ratingBig}>{avgRating.toFixed(1)}</Text>
              <Text style={styles.ratingSub}>out of 5</Text>
            </View>
          ) : (
            <Text style={styles.muted}>No ratings yet</Text>
          )}
          <View style={{ marginTop: 10, gap: 12 }}>
            {reviews.length === 0 ? (
              <Text style={styles.muted}>No reviews yet.</Text>
            ) : (
              reviews.map((r) => (
                <View key={r.id} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <Text style={styles.reviewName}>{r.reviewer_name ?? "Anonymous"}</Text>
                    <Text style={styles.reviewStars}>
                      {"★".repeat(r.rating)}
                      {"☆".repeat(5 - r.rating)}
                    </Text>
                  </View>
                  {r.title ? <Text style={styles.reviewTitle}>{r.title}</Text> : null}
                  {r.comment ? <Text style={styles.reviewBody}>{r.comment}</Text> : null}
                  <Text style={styles.reviewDate}>{new Date(r.created_at).toLocaleDateString()}</Text>
                </View>
              ))
            )}
          </View>
        </Section>
      </ScrollView>

      <Modal visible={viewerOpen} transparent animationType="fade" onRequestClose={closeViewer}>
        <View style={styles.viewerBackdrop}>
          <Pressable style={styles.viewerClose} onPress={closeViewer}>
            <Text style={{ color: "#fff", fontWeight: "900", fontSize: 16 }}>✕</Text>
          </Pressable>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            contentOffset={{ x: viewerIndex * width, y: 0 }}
          >
            {(heroImages.length ? heroImages : [""]).map((uri, i) => (
              <View key={uri + i} style={{ width, justifyContent: "center", alignItems: "center" }}>
                {uri ? (
                  <Image source={{ uri }} style={{ width: width, height: width }} resizeMode="contain" />
                ) : (
                  <Text style={{ color: "#fff" }}>No image</Text>
                )}
              </View>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ——— UI helpers ———
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}
function Badge({ color, text, icon, subtle }: { color: string; text: string; icon?: string; subtle?: boolean }) {
  const bg = subtle ? `${hexToRGBA(color, 0.08)}` : `${hexToRGBA(color, 0.16)}`;
  const border = `${hexToRGBA(color, 0.35)}`;
  return (
    <View style={[styles.badge, { backgroundColor: bg, borderColor: border }]}>
      {icon ? <Text style={{ marginRight: 4 }}>{icon}</Text> : null}
      <Text style={[styles.badgeText, { color }]}>{text}</Text>
    </View>
  );
}
function Row({ label, value, onPress }: { label: string; value: string; onPress?: () => void }) {
  return (
    <TouchableOpacity disabled={!onPress} onPress={onPress} activeOpacity={0.8} style={styles.rowBetween}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, onPress && { color: "#2563eb" }]} numberOfLines={1}>
        {value}
      </Text>
    </TouchableOpacity>
  );
}
function ActionBtn({ label, onPress, color, light }: { label: string; onPress?: () => void; color: string; light?: boolean }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={[styles.actionBtn, { backgroundColor: light ? "#f3f4f6" : color }]}>
      <Text style={[styles.actionBtnText, { color: light ? "#111827" : "#fff" }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  section: { paddingHorizontal: 16, paddingTop: 14 },
  title: { fontSize: 24, fontWeight: "900", color: "#0b0b0c" },

  sectionTitle: { fontSize: 14, fontWeight: "900", color: "#6b7280", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.6 },
  sectionCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#eef2f7",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },

  rowCenter: { flexDirection: "row", alignItems: "center" },
  pin: { fontSize: 16 },
  addrText: { flexShrink: 1, color: "#111827", fontWeight: "700" },
  openMapLink: { color: "#2563eb", fontWeight: "700" },

  catText: { color: "#111827", fontSize: 16, fontWeight: "700" },
  bodyText: { color: "#374151", lineHeight: 20, fontSize: 15 },

  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    height: 28,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  badgeText: { fontWeight: "800", fontSize: 12 },

  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  rowLabel: { color: "#6b7280", fontWeight: "800" },
  rowValue: { color: "#111827", fontWeight: "700", maxWidth: "70%" },

  hoursRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  hoursDay: { color: "#6b7280", fontWeight: "800" },
  hoursTime: { color: "#111827", fontWeight: "700" },

  btnRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  actionBtn: { flex: 1, height: 46, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  actionBtnText: { fontSize: 15, fontWeight: "900" },

  ratingHeader: { flexDirection: "row", alignItems: "baseline", gap: 6 },
  ratingBig: { fontSize: 32, fontWeight: "900", color: "#111827" },
  ratingSub: { color: "#6b7280", fontWeight: "700" },
  muted: { color: "#9ca3af", fontWeight: "700" },

  reviewCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#eef2f7",
  },
  reviewHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  reviewName: { fontWeight: "900", color: "#0b0b0c" },
  reviewStars: { color: "#fbbf24", fontWeight: "900" },
  reviewTitle: { marginTop: 4, fontWeight: "800", color: "#111827" },
  reviewBody: { marginTop: 2, color: "#374151" },
  reviewDate: { marginTop: 6, color: "#9ca3af", fontSize: 12, fontWeight: "700" },

  viewerBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.9)" },
  viewerClose: { position: "absolute", right: 14, top: 14, zIndex: 10, padding: 8 },
});
