import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  TouchableOpacity,
  Linking,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Location from "expo-location";

import { supabase } from "../lib/supabase";
import type { Business, Category } from "../types/db";
import BusinessCard from "../components/BusinessCard";
import { haversineKm } from "../utils/geo";
import { isOpenNow, nextOpenToday } from "../utils/hours";

// Navigation (this screen is inside HomeStack)
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { HomeStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<HomeStackParamList, "Home">;

export default function HomeScreen({ navigation }: Props) {
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [businesses, setBusinesses] = useState<(Business & { km?: number })[]>(
    []
  );
  const [categories, setCategories] = useState<Category[]>([]);
  const [q, setQ] = useState<string>("");
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [pos, setPos] = useState<{ lat: number; lon: number } | null>(null);

  const radiusKm = 25;

  const requestLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      const cur = await Location.getCurrentPositionAsync({});
      setPos({ lat: cur.coords.latitude, lon: cur.coords.longitude });
    } catch {
      // ignore location errors, app still works
    }
  }, []);

  const loadCategories = useCallback(async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("id,name,slug")
      .order("name");
    if (!error && data) setCategories(data as Category[]);
  }, []);

  const loadBusinesses = useCallback(async () => {
    // Try RPC nearby if you implemented it
    if (pos) {
      try {
        const { data, error } = await supabase.rpc("nearby_businesses", {
          lat: pos.lat,
          lon: pos.lon,
          radius_km: radiusKm,
        });
        if (!error && Array.isArray(data)) {
          const items = (data as any[]).map((row: any) => ({
            ...(row as Business),
            km: typeof row.km === "number" ? row.km : undefined,
          }));
          setBusinesses(items);
          setLoading(false);
          return;
        }
      } catch {
        // fall back below
      }
    }

    // Fallback: fetch approved and compute distance client-side
    const { data } = await supabase
      .from("businesses")
      .select(
        "id,name,slug,address,latitude,longitude,images,is_verified,is_sponsored,status,category_id,opening_hours,phone,website,description,services"
      )
      .eq("status", "approved")
      .limit(200);

    let items: (Business & { km?: number })[] = (data || []).map((b: any) => {
      const km =
        pos && b.latitude != null && b.longitude != null
          ? haversineKm(pos, {
              lat: Number(b.latitude),
              lon: Number(b.longitude),
            })
          : undefined;
      return { ...(b as Business), km };
    });

    items.sort((a, b) => {
      const ak = a.km ?? Number.POSITIVE_INFINITY;
      const bk = b.km ?? Number.POSITIVE_INFINITY;
      if (ak === bk) return a.name.localeCompare(b.name);
      return ak - bk;
    });

    setBusinesses(items);
    setLoading(false);
  }, [pos]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadCategories(), loadBusinesses()]);
    setRefreshing(false);
  }, [loadBusinesses, loadCategories]);

  useEffect(() => {
    requestLocation();
    loadCategories();
  }, [requestLocation, loadCategories]);

  useEffect(() => {
    loadBusinesses();
  }, [pos, loadBusinesses]);

  const filtered = useMemo(() => {
    let rows = businesses;
    if (activeCat) rows = rows.filter((b) => b.category_id === activeCat);
    if (q.trim()) {
      const s = q.trim().toLowerCase();
      rows = rows.filter(
        (b) =>
          b.name.toLowerCase().includes(s) ||
          (b.address?.toLowerCase().includes(s) ?? false)
      );
    }
    return rows;
  }, [businesses, activeCat, q]);

  // Card actions
  const openDirections = (b: Business) => {
    const url =
      b.latitude != null && b.longitude != null
        ? `https://www.google.com/maps/dir/?api=1&destination=${b.latitude},${b.longitude}`
        : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
            b.address || b.name
          )}`;
    Linking.openURL(url);
  };

  const callBusiness = (b: Business) => {
    if (!b.phone) {
      Alert.alert("No phone number available");
      return;
    }
    Linking.openURL(`tel:${b.phone}`);
  };

  const showDetails = (b: Business) => {
    navigation.navigate("BusinessDetail", { id: b.id });
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.container}>
        <Text style={styles.h1}>Discover near you</Text>

        {/* Search */}
        <View style={styles.searchBox}>
          <TextInput
            placeholder="Search business or address"
            value={q}
            onChangeText={setQ}
            style={styles.searchInput}
            autoCapitalize="none"
            autoCorrect={false}
            clearButtonMode="while-editing"
          />
        </View>

        {/* Category chips */}
        <FlatList
          data={[{ id: "all", name: "All", slug: "all" } as any, ...categories]}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(it: Category | any) => String(it.id)}
          contentContainerStyle={styles.chipsWrap}
          renderItem={({ item }) => {
            const selected =
              (activeCat === null && item.id === "all") || activeCat === item.id;
            return (
              <TouchableOpacity
                onPress={() => setActiveCat(item.id === "all" ? null : item.id)}
                style={[styles.chip, selected && styles.chipActive]}
              >
                <Text style={[styles.chipText, selected && styles.chipTextActive]}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            );
          }}
          style={{ marginBottom: 8 }}
        />

        {/* List */}
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator />
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No businesses found</Text>
            <Text style={styles.emptySub}>
              Try expanding your search or changing filters.
            </Text>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(it) => String(it.id)}
            contentContainerStyle={{ paddingBottom: 24 }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            renderItem={({ item }) => {
              const open = isOpenNow((item as any).opening_hours).open;
              const nextOpen = open
                ? null
                : nextOpenToday((item as any).opening_hours);

              const categoryName =
                categories.find((c) => c.id === (item as any).category_id)
                  ?.name ?? null;

              const services = (item as any).services as string[] | null;

              // Ratings placeholder — wire real AVG/COUNT later from reviews
              const ratingAvg: number | null = null;
              const ratingCount: number | null = null;

              return (
                <BusinessCard
                  item={item}
                  categoryName={categoryName}
                  ratingAvg={ratingAvg}
                  ratingCount={ratingCount}
                  description={(item as any).description ?? null}
                  services={services}
                  isOpen={open}
                  nextOpen={nextOpen}
                  onPressDetails={() => showDetails(item)}
                  onPressCall={() => callBusiness(item)}
                  onPressDirections={() => openDirections(item)}
                />
              );
            }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f7f8fb" },
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 8 },
  h1: { fontSize: 24, fontWeight: "800", color: "#0b0b0c", marginBottom: 8 },

  searchBox: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#eceef2",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    marginBottom: 4,
  },
  searchInput: { fontSize: 15, color: "#141518" },

  chipsWrap: { paddingVertical: 8, gap: 8 as any },
  chip: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e7e9ee",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    alignSelf: "flex-start",
    height: 38,
    marginRight: 8,
  },
  chipActive: { backgroundColor: "#111827", borderColor: "#111827" },
  chipText: { color: "#111827", fontSize: 14, fontWeight: "600" },
  chipTextActive: { color: "#fff" },

  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#111" },
  emptySub: { fontSize: 14, color: "#555", marginTop: 6, textAlign: "center" },
});
