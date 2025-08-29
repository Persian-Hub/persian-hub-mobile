import React, { useEffect, useMemo, useState, useCallback, ReactNode } from "react";
import {
  View, Text, StyleSheet, ActivityIndicator, FlatList, Image,
  TouchableOpacity, Linking, Alert, ScrollView, Modal, Pressable, Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../lib/supabase";
import type { Business, Category } from "../types/db";
import { isOpenNow, nextOpenToday } from "../utils/hours";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { HomeStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<HomeStackParamList, "BusinessDetail">;

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

/* ---------- Opening hours helpers ---------- */
type DayKey =
  | "sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat"
  | "sunday" | "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday";

const SHORT: readonly DayKey[] = ["sun","mon","tue","wed","thu","fri","sat"];
const LONG:  readonly DayKey[] = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];

function parseRangeStr(s: string) {
  const m = s.match(/^(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const [, h1, m1, h2, m2] = m;
  const startMin = parseInt(h1, 10) * 60 + parseInt(m1, 10);
  const endMin = parseInt(h2, 10) * 60 + parseInt(m2, 10);
  return { startMin, endMin };
}
function fmt(min: number) {
  let h = Math.floor(min / 60);
  const mm = min % 60;
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  const mmStr = mm < 10 ? `0${mm}` : `${mm}`;
  return `${h}:${mmStr} ${ampm}`;
}
function normalizeDayCell(cell: any): { startMin: number; endMin: number } | null {
  if (!cell) return null;
  if (typeof cell === "string") {
    if (/closed/i.test(cell)) return null;
    return parseRangeStr(cell.trim());
  }
  if (typeof cell === "object") {
    if (cell.closed === true || cell.open === false) return null;
    if (typeof cell.start === "string" && typeof cell.end === "string") {
      return parseRangeStr(`${cell.start}-${cell.end}`);
    }
    if (typeof cell.open === "string" && typeof cell.close === "string") {
      return parseRangeStr(`${cell.open}-${cell.close}`);
    }
  }
  return null;
}
function weeklySchedule(opening_hours: any) {
  const todayIdx = new Date().getDay(); // 0=Sun..6=Sat
  return SHORT.map((shortKey, idx) => {
    const longKey = LONG[idx] as Extract<DayKey, `${string}day`>;
    const cell = opening_hours?.[shortKey] ?? opening_hours?.[longKey] ?? null;
    const range = normalizeDayCell(cell);
    let value = "Closed";
    if (range) {
      if (range.endMin < range.startMin) value = `${fmt(range.startMin)} – ${fmt(range.endMin)}*`;
      else value = `${fmt(range.startMin)} – ${fmt(range.endMin)}`;
    }
    const label = LONG[idx].slice(0,1).toUpperCase() + LONG[idx].slice(1);
    return { label, value, isToday: idx === todayIdx };
  });
}
/* ------------------------------------------- */

function Section({ title, icon, children }: { title: string; icon?: string; children: ReactNode; }) {
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        {icon ? <Text style={styles.sectionIcon}>{icon}</Text> : null}
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <View style={styles.sectionDivider} />
      {children}
    </View>
  );
}

// Simple star row
function Stars({ value }: { value: number }) {
  const v = Math.max(0, Math.min(5, value || 0));
  const full = Math.floor(v);
  const half = v - full >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return (
    <View style={{ flexDirection: "row" }}>
      {Array.from({ length: full }).map((_, i) => <Text key={`f${i}`} style={styles.starFilled}>★</Text>)}
      {half === 1 && <Text style={styles.starHalf}>★</Text>}
      {Array.from({ length: empty }).map((_, i) => <Text key={`e${i}`} style={styles.starEmpty}>☆</Text>)}
    </View>
  );
}

export default function BusinessDetail({ route, navigation }: Props) {
  const { id } = route.params;
  const [biz, setBiz] = useState<(Business & { services?: string[]; subcategory_id?: string | null }) | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [subcategory, setSubcategory] = useState<{ id: string; name: string; slug: string } | null>(null);
  const [loading, setLoading] = useState(true);

  // Reviews
  const [reviews, setReviews] = useState<
    { id: string; rating: number; title: string | null; comment: string | null; created_at: string; reviewer_name: string | null }[]
  >([]);
  const [avgRating, setAvgRating] = useState<number | null>(null);

  // Image viewer
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const openViewer = useCallback((i: number) => { setViewerIndex(i); setViewerOpen(true); }, []);
  const closeViewer = useCallback(() => setViewerOpen(false), []);

  useEffect(() => {
    (async () => {
      const { data: b } = await supabase
        .from("businesses")
        .select(
          "id,name,slug,description,address,latitude,longitude,phone,email,website,images,opening_hours,is_verified,is_sponsored,category_id,subcategory_id,services"
        )
        .eq("id", id)
        .limit(1)
        .maybeSingle();

      if (!b) {
        Alert.alert("Not found", "This business could not be loaded.");
        navigation.goBack();
        return;
      }
      setBiz(b as any);

      if (b.category_id) {
        const { data: c } = await supabase
          .from("categories")
          .select("id,name,slug")
          .eq("id", b.category_id)
          .limit(1)
          .maybeSingle();
        if (c) setCategory(c);
      }
      if (b.subcategory_id) {
        const { data: sc } = await supabase
          .from("subcategories")
          .select("id,name,slug")
          .eq("id", b.subcategory_id)
          .limit(1)
          .maybeSingle();
        if (sc) setSubcategory(sc as any);
      }

      // Reviews (approved)
      const { data: rData } = await supabase
        .from("reviews")
        .select("id,rating,title,comment,created_at,reviewer_id,profiles:reviewer_id(full_name)")
        .eq("business_id", id)
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

      setLoading(false);
      navigation.setOptions({ title: b.name ?? "Business" });
    })();
  }, [id, navigation]);

  const status = useMemo(() => {
    if (!biz) return { open: false, next: null as string | null };
    const open = isOpenNow((biz as any).opening_hours).open;
    const next = open ? null : nextOpenToday((biz as any).opening_hours);
    return { open, next };
  }, [biz]);

  const openDirections = () => {
    if (!biz) return;
    const url =
      biz.latitude != null && biz.longitude != null
        ? `https://www.google.com/maps/dir/?api=1&destination=${biz.latitude},${biz.longitude}`
        : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(biz.address || biz.name)}`;
    Linking.openURL(url);
  };
  const callBusiness = () => {
    if (!biz?.phone) { Alert.alert("No phone number", "This business has no phone listed."); return; }
    Linking.openURL(`tel:${biz.phone}`);
  };
  const openWebsite = () => {
    if (!biz?.website) { Alert.alert("No website", "This business has no website listed."); return; }
    let url = biz.website; if (!/^https?:\/\//i.test(url)) url = `https://${url}`; Linking.openURL(url);
  };
  const emailBusiness = () => {
    if (!biz?.email) { Alert.alert("No email", "This business has no email listed."); return; }
    const subject = encodeURIComponent(`Inquiry about ${biz.name}`);
    const body = encodeURIComponent("Hi,\n\nI'm interested in your services.\n");
    Linking.openURL(`mailto:${biz.email}?subject=${subject}&body=${body}`);
  };

  if (loading || !biz) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}><ActivityIndicator /></View>
      </SafeAreaView>
    );
  }

  const images = (biz.images || []) as string[];
  const services = (biz.services || []) as string[];
  const schedule = weeklySchedule((biz as any).opening_hours);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* Fullscreen Image Viewer */}
      <Modal visible={viewerOpen} transparent animationType="fade" onRequestClose={closeViewer}>
        <View style={styles.viewerBackdrop}>
          <FlatList
            data={images}
            keyExtractor={(u, i) => `${u}-${i}`}
            horizontal pagingEnabled initialScrollIndex={viewerIndex}
            getItemLayout={(_, index) => ({ length: SCREEN_W, offset: SCREEN_W * index, index })}
            renderItem={({ item }) => (
              <Pressable style={styles.viewerPage} onPress={closeViewer}>
                <Image source={{ uri: item }} style={styles.viewerImage} resizeMode="contain" />
              </Pressable>
            )}
            showsHorizontalScrollIndicator={false}
          />
          <TouchableOpacity onPress={closeViewer} style={styles.viewerClose}>
            <Text style={styles.viewerCloseText}>✕</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        {/* HEADER GALLERY */}
        {images.length > 0 ? (
          <FlatList
            data={images}
            keyExtractor={(u, i) => `${u}-${i}`}
            renderItem={({ item, index }) => (
              <TouchableOpacity activeOpacity={0.9} onPress={() => openViewer(index)}>
                <Image source={{ uri: item }} resizeMode="cover" style={styles.hero} />
              </TouchableOpacity>
            )}
            horizontal pagingEnabled showsHorizontalScrollIndicator={false}
            style={{ backgroundColor: "#000" }}
          />
        ) : (
          <View style={[styles.hero, { backgroundColor: "#eef1f5" }]} />
        )}

        {/* NAME */}
        <View style={styles.headerBlock}>
          <Text style={styles.title}>{biz.name}</Text>
        </View>

        {/* CATEGORY > SUBCATEGORY */}
        {(category || subcategory) && (
          <View style={[styles.headerBlock, { paddingTop: 0 }]}>
            <View style={styles.catRow}>
              {!!category?.name && <Text style={styles.category}>{category.name}</Text>}
              {!!subcategory?.name && (<><Text style={styles.catSep}>›</Text><Text style={styles.subcategory}>{subcategory.name}</Text></>)}
            </View>
          </View>
        )}

        {/* LOCATION */}
        <Section title="Location" icon="📍">
          {!!biz.address && (
            <View style={styles.addrRow}>
              <Text style={styles.addrText} numberOfLines={3}>{biz.address}</Text>
            </View>
          )}
        </Section>

        {/* STATUS (inline) */}
        <Section title="Status" icon="⏱️">
          <View style={styles.statusInlineRow}>
            <Text style={[styles.pill, status.open ? styles.pillOpen : styles.pillClosed]}>
              {status.open ? "Open now" : "Closed"}
            </Text>
            {!status.open && status.next ? <Text style={styles.opensAt}>Opens at {status.next}</Text> : null}
            {biz.is_verified ? (<Text style={[styles.badge, styles.badgeVerified]}>Verified</Text>) : null}
            {biz.is_sponsored ? (<Text style={[styles.badge, styles.badgeSponsored]}>Sponsored</Text>) : null}
          </View>
        </Section>

        {/* ABOUT */}
        {!!biz.description && (
          <Section title="About" icon="📝">
            <Text style={styles.bodyText}>{biz.description}</Text>
          </Section>
        )}

        {/* CONTACT */}
        <Section title="Contact" icon="☎️">
          {!!biz.phone && <Text style={styles.bodyText}>{biz.phone}</Text>}
          {!!biz.website && <Text style={styles.link}>{biz.website}</Text>}
          {!!biz.email && (
            <TouchableOpacity onPress={emailBusiness} activeOpacity={0.7}>
              <Text style={[styles.link, { marginTop: 6 }]}>{biz.email}</Text>
            </TouchableOpacity>
          )}
        </Section>

        {/* OPENING HOURS */}
        <Section title="Opening Hours" icon="📅">
          <View style={styles.hoursCard}>
            {schedule.map((d, i) => (
              <View key={i} style={styles.hoursRow}>
                <Text style={[styles.hoursDay, d.isToday && styles.hoursToday]}>{d.label}</Text>
                <Text style={[styles.hoursVal, d.isToday && styles.hoursToday]}>{d.value}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.hoursFootnote}>* crosses midnight</Text>
        </Section>

        {/* BUTTONS */}
        <View style={styles.actionsCol}>
          <View style={styles.actionsRow}>
            <TouchableOpacity onPress={openDirections} style={styles.primaryBtnGreen} activeOpacity={0.9}>
              <Text style={styles.primaryBtnText}>Directions</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={callBusiness} style={styles.primaryBtnBlue} activeOpacity={0.9}>
              <Text style={styles.primaryBtnText}>Call</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={openWebsite} style={styles.outlineBtn} activeOpacity={0.9}>
            <Text style={styles.outlineBtnText}>Website</Text>
          </TouchableOpacity>
        </View>

        {/* REVIEWS & RATINGS */}
        <Section title="Reviews & Ratings" icon="⭐">
          <View style={styles.ratingSummary}>
            <View style={{ alignItems: "center" }}>
              <Text style={styles.ratingBig}>{avgRating ? avgRating.toFixed(1) : "0.0"}</Text>
              <Stars value={avgRating || 0} />
              <Text style={styles.ratingCount}>
                {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
              </Text>
            </View>
          </View>

          {reviews.length === 0 ? (
            <Text style={{ color: "#6b7280", marginTop: 8 }}>No reviews yet.</Text>
          ) : (
            <View style={{ marginTop: 12, gap: 10 as any }}>
              {reviews.map((r) => (
                <View key={r.id} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <Stars value={r.rating} />
                    <Text style={styles.reviewMeta}>
                      {r.reviewer_name ? r.reviewer_name : "Anonymous"} • {new Date(r.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                  {!!r.title && <Text style={styles.reviewTitle}>{r.title}</Text>}
                  {!!r.comment && <Text style={styles.reviewBody}>{r.comment}</Text>}
                </View>
              ))}
            </View>
          )}
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

const R = 16;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f7f8fb" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  hero: { width: SCREEN_W, height: 260 },

  headerBlock: { paddingHorizontal: 16, paddingTop: 12, gap: 8 as any },
  title: { fontSize: 22, fontWeight: "800", color: "#0b0b0c" },

  catRow: { flexDirection: "row", alignItems: "center", gap: 6 as any },
  category: { fontSize: 13, color: "#0369a1", backgroundColor: "#e0f2fe", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  catSep: { color: "#6b7280", fontSize: 14 },
  subcategory: { fontSize: 13, color: "#1f2937", backgroundColor: "#f3f4f6", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },

  // Status inline row
  statusInlineRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8 as any },

  // Badges
  badge: { fontSize: 11, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  badgeVerified: { backgroundColor: "#e8f8ef", color: "#0a7d45" },
  badgeSponsored: { backgroundColor: "#fff4e6", color: "#a45300" },

  // Section cards
  sectionCard: {
    backgroundColor: "#fff", marginHorizontal: 16, marginTop: 12, borderRadius: 14,
    borderWidth: 1, borderColor: "#eaeef3", padding: 14,
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
  },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8 as any, marginBottom: 8 },
  sectionIcon: { fontSize: 16 },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: "#0b0b0c" },
  sectionDivider: { height: 1, backgroundColor: "#eef1f5", marginBottom: 8 },

  row: { flexDirection: "row", gap: 8 as any },

  addrRow: { flexDirection: "row", alignItems: "flex-start" },
  addrText: { color: "#374151", fontSize: 14, flex: 1 },

  pill: { fontSize: 12, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  pillOpen: { backgroundColor: "#e9fbef", color: "#067647" },
  pillClosed: { backgroundColor: "#fff0f0", color: "#b42318" },
  opensAt: { color: "#6b7280", fontSize: 12 },

  // Opening hours
  hoursCard: { backgroundColor: "#fff", borderRadius: 10, borderWidth: 1, borderColor: "#eef0f3", paddingVertical: 6 },
  hoursRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: "#f2f4f7" },
  hoursDay: { fontSize: 14, color: "#1f2937" },
  hoursVal: { fontSize: 14, color: "#374151" },
  hoursToday: { fontWeight: "800", color: "#111827" },
  hoursFootnote: { color: "#9ca3af", fontSize: 12, marginTop: 6 },

  bodyText: { color: "#374151", fontSize: 14, lineHeight: 20 },
  link: { color: "#2563eb", fontSize: 14 },

  // Reviews
  ratingSummary: { alignItems: "center", paddingVertical: 8 },
  ratingBig: { fontSize: 36, fontWeight: "800", color: "#111827", lineHeight: 40, marginBottom: 4 },
  ratingCount: { color: "#6b7280", marginTop: 4 },
  reviewCard: { backgroundColor: "#fff", borderRadius: 10, borderWidth: 1, borderColor: "#eef0f3", padding: 12 },
  reviewHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 },
  reviewMeta: { color: "#6b7280", fontSize: 12, marginLeft: 8 },
  reviewTitle: { fontSize: 15, fontWeight: "700", color: "#111827", marginBottom: 4 },
  reviewBody: { fontSize: 14, color: "#374151", lineHeight: 20 },

  // Stars
  starFilled: { fontSize: 16, color: "#f59e0b" },
  starHalf: { fontSize: 16, color: "#fbbf24" },
  starEmpty: { fontSize: 16, color: "#d1d5db" },

  // Actions
  actionsCol: { paddingHorizontal: 16, paddingTop: 16, gap: 10 as any },
  actionsRow: { flexDirection: "row", gap: 10 as any },
  primaryBtnGreen: { flex: 1, height: 46, borderRadius: R, backgroundColor: "#16a34a", alignItems: "center", justifyContent: "center" },
  primaryBtnBlue: { flex: 1, height: 46, borderRadius: R, backgroundColor: "#2563eb", alignItems: "center", justifyContent: "center" },
  primaryBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  outlineBtn: { height: 46, borderRadius: R, borderWidth: 1, borderColor: "#e5e7eb", alignItems: "center", justifyContent: "center", backgroundColor: "#fff" },
  outlineBtnText: { color: "#111827", fontSize: 15, fontWeight: "600" },

  // Fullscreen viewer
  viewerBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.96)", justifyContent: "center", alignItems: "center" },
  viewerPage: { width: SCREEN_W, height: SCREEN_H, justifyContent: "center", alignItems: "center" },
  viewerImage: { width: SCREEN_W, height: SCREEN_H * 0.9 },
  viewerClose: { position: "absolute", top: 40, right: 20, backgroundColor: "rgba(255,255,255,0.15)", width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  viewerCloseText: { color: "#fff", fontSize: 20, fontWeight: "700" },
});
