import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { supabase } from "../../lib/supabase";
import { uploadImageToStorage } from "../../utils/uploadToStorage";
import { placesAutocomplete, placeDetails, resetPlacesSession } from "../../utils/places";
import type { DashboardStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<DashboardStackParamList, "EditBusiness">;

type Category = { id: string; name: string; slug: string };
type Subcategory = { id: string; name: string; slug: string; category_id: string };

const DAY_KEYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
type DayKey = (typeof DAY_KEYS)[number];

type DayState = { open: boolean; start: string | null; end: string | null };
type HoursState = Record<DayKey, DayState>;

const emptyHours: HoursState = {
  Mon: { open: false, start: "09:00", end: "17:00" },
  Tue: { open: false, start: "09:00", end: "17:00" },
  Wed: { open: false, start: "09:00", end: "17:00" },
  Thu: { open: false, start: "09:00", end: "17:00" },
  Fri: { open: false, start: "09:00", end: "17:00" },
  Sat: { open: false, start: "09:00", end: "17:00" },
  Sun: { open: false, start: "09:00", end: "17:00" },
};

// DB json → UI state
function fromApiHours(json: any): HoursState {
  const get = (k: string) => (typeof json?.[k] === "string" ? (json[k] as string) : "Closed");
  const parse = (v: string): { open: boolean; start: string | null; end: string | null } => {
    if (!v || v.toLowerCase() === "closed") return { open: false, start: "09:00", end: "17:00" };
    const [s, e] = v.split("-").map((x) => x.trim());
    return { open: true, start: s || "09:00", end: e || "17:00" };
  };
  return {
    Mon: parse(get("mon")),
    Tue: parse(get("tue")),
    Wed: parse(get("wed")),
    Thu: parse(get("thu")),
    Fri: parse(get("fri")),
    Sat: parse(get("sat")),
    Sun: parse(get("sun")),
  };
}

function toApiHours(h: HoursState) {
  const map: Record<string, string> = {};
  const key: Record<DayKey, string> = { Mon: "mon", Tue: "tue", Wed: "wed", Thu: "thu", Fri: "fri", Sat: "sat", Sun: "sun" };
  DAY_KEYS.forEach((d) => {
    if (!h[d].open || !h[d].start || !h[d].end) map[key[d]] = "Closed";
    else map[key[d]] = `${h[d].start} - ${h[d].end}`;
  });
  return map;
}

const TIME_OPTIONS = Array.from({ length: 24 * 4 }, (_, i) => {
  const h = String(Math.floor(i / 4)).padStart(2, "0");
  const m = String((i % 4) * 15).padStart(2, "0");
  return `${h}:${m}`;
});

export default function EditBusiness({ route, navigation }: Props) {
  const { businessId } = route.params;
  const [initialLoading, setInitialLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Data refs
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [subcategoryId, setSubcategoryId] = useState<string | null>(null);

  // Address via Places
  const [address, setAddress] = useState("");
  const [addrQuery, setAddrQuery] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [addrLoading, setAddrLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Array<{ description: string; place_id: string }>>([]);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [coordsResolved, setCoordsResolved] = useState(false);
  const debouncer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Contact
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");

  // Hours
  const [hours, setHours] = useState<HoursState>(emptyHours);
  const [pickerVisible, setPickerVisible] = useState<{ day: DayKey | null; field: "start" | "end" | null; show: boolean }>(
    { day: null, field: null, show: false }
  );

  // Tags
  const [services, setServices] = useState<string[]>([]);
  const [serviceDraft, setServiceDraft] = useState("");
  const [ownerKeywords, setOwnerKeywords] = useState<string[]>([]);
  const [ownerKeyDraft, setOwnerKeyDraft] = useState("");

  // Images (existing + new local uris)
  const [images, setImages] = useState<string[]>([]); // final saved URLs
  const [localImages, setLocalImages] = useState<string[]>([]); // newly picked
  const MAX_PHOTOS = 6;

  // Modals
  const [catModal, setCatModal] = useState(false);
  const [subcatModal, setSubcatModal] = useState(false);

  /* ---------- load reference data ---------- */
  const loadRefs = useCallback(async () => {
    const [{ data: cats }, { data: subs }] = await Promise.all([
      supabase.from("categories").select("id,name,slug").order("name"),
      supabase.from("subcategories").select("id,name,slug,category_id").order("name"),
    ]);
    if (Array.isArray(cats)) setCategories(cats as Category[]);
    if (Array.isArray(subs)) setSubcategories(subs as any);
  }, []);

  /* ---------- load business ---------- */
  const loadBusiness = useCallback(async () => {
    try {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user;
      if (!user) throw new Error("Please sign in.");

      const { data, error } = await supabase
        .from("businesses")
        .select("id,owner_id,name,description,category_id,subcategory_id,address,latitude,longitude,phone,email,website,opening_hours,images,services,owner_keywords")
        .eq("id", businessId)
        .single();

      if (error) throw error;
      if (!data) throw new Error("Business not found.");
      if (data.owner_id !== user.id) throw new Error("You do not have permission to edit this business.");

      // hydrate form
      setName(data.name || "");
      setDescription(data.description || "");
      setCategoryId(data.category_id ?? null);
      setSubcategoryId(data.subcategory_id ?? null);
      setAddress(data.address || "");
      setAddrQuery(data.address || "");
      setLat(typeof data.latitude === "number" ? data.latitude : data.latitude ? Number(data.latitude) : null);
      setLng(typeof data.longitude === "number" ? data.longitude : data.longitude ? Number(data.longitude) : null);
      setCoordsResolved(Boolean(data.latitude && data.longitude));
      setPhone(data.phone || "");
      setEmail(data.email || "");
      setWebsite(data.website || "");
      setHours(fromApiHours(data.opening_hours || {}));
      setImages(Array.isArray(data.images) ? data.images : []);
      setServices(Array.isArray(data.services) ? data.services : []);
      setOwnerKeywords(Array.isArray(data.owner_keywords) ? data.owner_keywords : []);
    } catch (e: any) {
      Alert.alert("Load failed", e?.message || "Please try again.");
      navigation.goBack();
    } finally {
      setInitialLoading(false);
    }
  }, [businessId, navigation]);

  useEffect(() => {
    setInitialLoading(true);
    Promise.all([loadRefs(), loadBusiness()]).finally(() => setInitialLoading(false));
  }, [loadRefs, loadBusiness]);

  // filtered subcategories
  const filteredSubcats = useMemo(
    () => subcategories.filter((s) => s.category_id === categoryId),
    [subcategories, categoryId]
  );

  /* ---------- address autocomplete ---------- */
  useEffect(() => {
    if (debouncer.current) clearTimeout(debouncer.current);
    if (!addrQuery || addrQuery.trim().length < 3) {
      setSuggestions([]);
      setSuggestOpen(false);
      return;
    }
    debouncer.current = setTimeout(async () => {
      try {
        setAddrLoading(true);
        const results = await placesAutocomplete(addrQuery);
        setSuggestions(results);
        setSuggestOpen(true);
      } catch {
      } finally {
        setAddrLoading(false);
      }
    }, 300);
    return () => {
      if (debouncer.current) clearTimeout(debouncer.current);
    };
  }, [addrQuery]);

  const selectSuggestion = async (s: { description: string; place_id: string }) => {
    try {
      const d = await placeDetails(s.place_id);
      setAddress(d.formatted_address);
      setAddrQuery(d.formatted_address);
      setLat(d.lat);
      setLng(d.lng);
      setSuggestOpen(false);
      setSuggestions([]);
      resetPlacesSession();
      Keyboard.dismiss();
      setCoordsResolved(true);
    } catch (e: any) {
      Alert.alert("Failed to get place", e?.message || "Try another address.");
    }
  };

  /* ---------- form helpers ---------- */
  const openTimePicker = (day: DayKey, field: "start" | "end") =>
    setPickerVisible({ day, field, show: true });

  const setDayOpen = (day: DayKey, open: boolean) =>
    setHours((h) => ({ ...h, [day]: { ...h[day], open } }));

  const setDayTime = (day: DayKey, field: "start" | "end", value: string) =>
    setHours((h) => ({ ...h, [day]: { ...h[day], [field]: value } }));

  const addChip = (draft: string, setDraft: (v: string) => void, setList: (fn: (prev: string[]) => string[]) => void) => {
    const v = draft.trim();
    if (!v) return;
    setList((prev) => Array.from(new Set([...prev, v])));
    setDraft("");
  };
  const removeChip = (value: string, setList: (fn: (prev: string[]) => string[]) => void) =>
    setList((prev) => prev.filter((x) => x !== value));

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission needed", "Please allow access to your photos.");
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        allowsMultipleSelection: true,
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.9,
        selectionLimit: MAX_PHOTOS,
      });
      if (res.canceled) return;
      const uris = res.assets?.map((a) => a.uri) ?? [];
      setLocalImages((prev) => Array.from(new Set([...prev, ...uris])).slice(0, MAX_PHOTOS));
    } catch {}
  };

  const removeExistingImage = (url: string) => {
    setImages((prev) => prev.filter((u) => u !== url));
  };
  const removeLocalImage = (uri: string) => {
    setLocalImages((prev) => prev.filter((u) => u !== uri));
  };

  /* ---------- validation ---------- */
  const emailOk = (v: string) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const websiteOk = (v: string) => !v || /^(https?:\/\/)?([^\s.]+\.[^\s]{2,}|localhost)(\/\S*)?$/.test(v);
  const phoneOk = (v: string) => !v || /^[+()\-\d\s]{6,}$/.test(v);

  const validate = (): string | null => {
    if (!name.trim()) return "Business name is required.";
    if (!addrQuery.trim()) return "Please choose an address from suggestions.";
    if (lat == null || lng == null) return "Could not resolve coordinates for the selected address.";
    if (!emailOk(email)) return "Please enter a valid email address.";
    if (!websiteOk(website)) return "Please enter a valid website URL.";
    if (!phoneOk(phone)) return "Please enter a valid phone number.";
    return null;
  };

  /* ---------- save ---------- */
  const saveChanges = async () => {
    const err = validate();
    if (err) {
      Alert.alert("Fix and retry", err);
      return;
    }
    setSaving(true);
    try {
      // upload newly picked local images
      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user;
      if (!user) throw new Error("Please sign in.");

      const uploaded: string[] = [];
      for (const uri of localImages) {
        const ext = uri.split("?")[0].split("#")[0].split(".").pop() || "jpg";
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const objectPath = `user/${user.id}/${businessId}/${fileName}`;
        try {
          const url = await uploadImageToStorage({
            bucket: "business-images",
            objectPath,
            uri,
            upsert: false,
          });
          uploaded.push(url);
        } catch {}
      }

      const imagesFinal = [...images, ...uploaded].slice(0, MAX_PHOTOS);

      const payload = {
        name: name.trim(),
        description: description.trim() || null,
        category_id: categoryId,
        subcategory_id: subcategoryId,
        address: address.trim() || addrQuery.trim(),
        latitude: Number(lat),
        longitude: Number(lng),
        phone: phone.trim() || null,
        email: email.trim() || null,
        website: website.trim() || null,
        opening_hours: toApiHours(hours),
        images: imagesFinal,
        services: services.length ? services : null,
        owner_keywords: ownerKeywords.length ? ownerKeywords : [],
        status: "pending" as const, // edited listings go back to review
      };

      const { error } = await supabase.from("businesses").update(payload).eq("id", businessId);
      if (error) throw error;

      Alert.alert("Saved", "Your changes were submitted for review.");
      setLocalImages([]);
      navigation.goBack();
    } catch (e: any) {
      Alert.alert("Save failed", e?.message || "Please try again.");
    } finally {
      setSaving(false);
    }
  };

  /* ---------- UI ---------- */
  if (initialLoading) {
    return (
      <SafeAreaView style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f7f8fb" }} edges={["top"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
          <Header title="Edit business" subtitle="Update your listing details." />

          {/* Basic */}
          <Section title="Basic information">
            <Field label="Business name *">
              <TextInput value={name} onChangeText={setName} placeholder="e.g. Paradise Market" style={styles.input} />
            </Field>

            <Field label="Description">
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Short description about the business"
                style={[styles.input, { height: 100, textAlignVertical: "top", paddingTop: 12 }]}
                multiline
              />
            </Field>

            <Field label="Category">
              <TouchableOpacity style={styles.select} onPress={() => setCatModal(true)}>
                <Text style={styles.selectText}>
                  {categoryId ? categories.find((c) => c.id === categoryId)?.name : "Select a category"}
                </Text>
                <Text style={styles.chev}>▾</Text>
              </TouchableOpacity>
            </Field>

            <Field label="Subcategory">
              <TouchableOpacity
                style={[styles.select, !categoryId && { opacity: 0.6 }]}
                onPress={() => categoryId && setSubcatModal(true)}
                disabled={!categoryId}
              >
                <Text style={styles.selectText}>
                  {subcategoryId
                    ? filteredSubcats.find((s) => s.id === subcategoryId)?.name
                    : categoryId
                    ? "Select a subcategory"
                    : "Choose category first"}
                </Text>
                <Text style={styles.chev}>▾</Text>
              </TouchableOpacity>
            </Field>
          </Section>

          {/* Address */}
          <Section title="Contact & location">
            <Field label="Address *">
              <View style={{ position: "relative" }}>
                <TextInput
                  value={addrQuery}
                  onChangeText={(t) => {
                    setAddrQuery(t);
                    setCoordsResolved(false);
                  }}
                  placeholder="Search address (powered by Google)"
                  style={[styles.input, coordsResolved && styles.inputSuccess]}
                  onFocus={() => {
                    if (addrQuery.length >= 3 && suggestions.length > 0) setSuggestOpen(true);
                  }}
                />
                {coordsResolved && <Text style={styles.inputCheck}>✓</Text>}

                {suggestOpen && (
                  <View style={styles.suggestBox}>
                    {addrLoading ? (
                      <Text style={styles.suggestHint}>Searching…</Text>
                    ) : suggestions.length === 0 ? (
                      <Text style={styles.suggestHint}>No suggestions</Text>
                    ) : (
                      <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 220 }}>
                        {suggestions.map((s) => (
                          <TouchableOpacity
                            key={s.place_id}
                            style={styles.suggestItem}
                            onPress={() => selectSuggestion(s)}
                          >
                            <Text style={styles.suggestText}>{s.description}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    )}
                  </View>
                )}
              </View>

              {coordsResolved && lat != null && lng != null && (
                <View style={{ marginTop: 6 }}>
                  <Text style={styles.coordsHint}>✓ Location coordinates available</Text>
                  <View style={styles.coordsCard}>
                    <Text style={styles.coordsText}>✓ Coordinates: {lat}, {lng}</Text>
                  </View>
                </View>
              )}
            </Field>

            <Field label="Phone">
              <TextInput value={phone} onChangeText={setPhone} placeholder="+61..." style={styles.input} />
            </Field>

            <Field label="Email">
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="hello@example.com"
                style={styles.input}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </Field>

            <Field label="Website">
              <TextInput
                value={website}
                onChangeText={setWebsite}
                placeholder="example.com"
                style={styles.input}
                autoCapitalize="none"
              />
            </Field>
          </Section>

          {/* Hours */}
          <Section title="Opening hours" subtitle="Toggle days and pick times.">
            {DAY_KEYS.map((d) => (
              <View key={d} style={styles.dayRow}>
                <Pressable onPress={() => setDayOpen(d, !hours[d].open)} style={[styles.switcher, hours[d].open && styles.switcherOn]}>
                  <View style={[styles.switchDot, hours[d].open && styles.switchDotOn]} />
                </Pressable>
                <Text style={styles.dayLabel}>{d}</Text>
                {hours[d].open ? (
                  <View style={styles.timeWrap}>
                    <TouchableOpacity onPress={() => openTimePicker(d, "start")} style={styles.timeBtn}>
                      <Text style={styles.timeText}>{hours[d].start}</Text>
                    </TouchableOpacity>
                    <Text style={styles.timeDash}>—</Text>
                    <TouchableOpacity onPress={() => openTimePicker(d, "end")} style={styles.timeBtn}>
                      <Text style={styles.timeText}>{hours[d].end}</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <Text style={styles.closedTag}>Closed</Text>
                )}
              </View>
            ))}
          </Section>

          {/* Services */}
          <Section title="Services" subtitle="Public tags shown on your page.">
            <ChipEditor
              items={services}
              draft={serviceDraft}
              setDraft={setServiceDraft}
              onAdd={() => addChip(serviceDraft, setServiceDraft, setServices)}
              onRemove={(v) => removeChip(v, setServices)}
              placeholder="e.g. Free Delivery"
            />
          </Section>

          {/* Owner keywords */}
          <Section title="Owner keywords" subtitle="Private keywords to improve search (not visible publicly).">
            <ChipEditor
              items={ownerKeywords}
              draft={ownerKeyDraft}
              setDraft={setOwnerKeyDraft}
              onAdd={() => addChip(ownerKeyDraft, setOwnerKeyDraft, setOwnerKeywords)}
              onRemove={(v) => removeChip(v, setOwnerKeywords)}
              placeholder="e.g. Iranian grocery"
            />
          </Section>

          {/* Photos */}
          <Section title="Photos" subtitle={`Add up to ${MAX_PHOTOS} images. First one is used as cover.`}>
            <View style={styles.imagesRow}>
              {images.map((url) => (
                <View key={url} style={styles.thumbBox}>
                  <Image source={{ uri: url }} style={styles.thumb} />
                  <Pressable hitSlop={10} style={styles.removeThumb} onPress={() => removeExistingImage(url)}>
                    <Text style={{ color: "#fff", fontWeight: "800" }}>×</Text>
                  </Pressable>
                </View>
              ))}
              {localImages.map((uri) => (
                <View key={uri} style={styles.thumbBox}>
                  <Image source={{ uri }} style={styles.thumb} />
                  <Pressable hitSlop={10} style={styles.removeThumb} onPress={() => removeLocalImage(uri)}>
                    <Text style={{ color: "#fff", fontWeight: "800" }}>×</Text>
                  </Pressable>
                </View>
              ))}
              {(images.length + localImages.length) < MAX_PHOTOS && (
                <TouchableOpacity style={styles.addPhoto} onPress={pickImage}>
                  <Text style={styles.addPhotoPlus}>＋</Text>
                  <Text style={styles.addPhotoText}>Add</Text>
                </TouchableOpacity>
              )}
            </View>
          </Section>
        </ScrollView>

        {/* Sticky Save Bar */}
        <View style={styles.saveBar}>
          <TouchableOpacity onPress={saveChanges} disabled={saving} activeOpacity={0.9} style={[styles.saveBtn, saving && { opacity: 0.7 }]}>
            <Text style={styles.saveBtnText}>{saving ? "Saving..." : "Save changes"}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Category modal */}
      <PickerModal
        visible={catModal}
        title="Choose a category"
        data={categories}
        keyExtractor={(it) => it.id}
        labelExtractor={(it) => it.name}
        onClose={() => setCatModal(false)}
        onSelect={(c) => {
          setCategoryId(c.id);
          setSubcategoryId(null);
          setCatModal(false);
        }}
      />

      {/* Subcategory modal */}
      <PickerModal
        visible={subcatModal}
        title="Choose a subcategory"
        data={filteredSubcats}
        keyExtractor={(it) => it.id}
        labelExtractor={(it) => it.name}
        onClose={() => setSubcatModal(false)}
        onSelect={(sc) => {
          setSubcategoryId(sc.id);
          setSubcatModal(false);
        }}
      />

      {/* Time picker */}
      <TimePickerModal
        visible={pickerVisible.show}
        initial={pickerVisible.day && pickerVisible.field ? hours[pickerVisible.day][pickerVisible.field] || "09:00" : "09:00"}
        options={TIME_OPTIONS}
        onClose={() => setPickerVisible({ day: null, field: null, show: false })}
        onSelect={(value) => {
          if (pickerVisible.day && pickerVisible.field) setDayTime(pickerVisible.day, pickerVisible.field, value);
          setPickerVisible({ day: null, field: null, show: false });
        }}
      />
    </SafeAreaView>
  );
}

/* ---------- small UI atoms reused ---------- */

function Header({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 6 }}>
      <Text style={{ fontSize: 26, fontWeight: "900", color: "#0b0b0c", marginBottom: 4 }}>{title}</Text>
      {subtitle ? <Text style={{ color: "#6b7280" }}>{subtitle}</Text> : null}
    </View>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle ? <Text style={styles.sectionSub}>{subtitle}</Text> : null}
      <View style={styles.card}>{children}</View>
    </View>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

function ChipEditor({
  items,
  draft,
  setDraft,
  onAdd,
  onRemove,
  placeholder,
}: {
  items: string[];
  draft: string;
  setDraft: (v: string) => void;
  onAdd: () => void;
  onRemove: (v: string) => void;
  placeholder: string;
}) {
  return (
    <View>
      <View style={styles.chipsRow}>
        {items.map((t) => (
          <View key={t} style={styles.chip}>
            <Text style={styles.chipText}>{t}</Text>
            <Pressable onPress={() => onRemove(t)} hitSlop={8}>
              <Text style={styles.chipX}>×</Text>
            </Pressable>
          </View>
        ))}
      </View>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder={placeholder}
          style={[styles.input, { flex: 1 }]}
          onSubmitEditing={onAdd}
          returnKeyType="done"
        />
        <TouchableOpacity style={styles.addBtn} onPress={onAdd} activeOpacity={0.9}>
          <Text style={styles.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function PickerModal<T>({
  visible,
  title,
  data,
  keyExtractor,
  labelExtractor,
  onSelect,
  onClose,
}: {
  visible: boolean;
  title: string;
  data: T[];
  keyExtractor: (it: T) => string;
  labelExtractor: (it: T) => string;
  onSelect: (item: T) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose} />
      <View style={styles.modalSheet}>
        <Text style={styles.modalTitle}>{title}</Text>
        <ScrollView style={{ maxHeight: 320 }}>
          {data.map((item) => (
            <TouchableOpacity key={keyExtractor(item)} onPress={() => onSelect(item)} style={styles.modalItem}>
              <Text style={styles.modalItemText}>{labelExtractor(item)}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <TouchableOpacity onPress={onClose} style={styles.modalClose}>
          <Text style={styles.modalCloseText}>Close</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

function TimePickerModal({
  visible,
  initial,
  options,
  onSelect,
  onClose,
}: {
  visible: boolean;
  initial: string;
  options: string[];
  onSelect: (value: string) => void;
  onClose: () => void;
}) {
  const initialIndex = Math.max(0, options.findIndex((x) => x === initial));
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose} />
      <View style={styles.modalSheet}>
        <Text style={styles.modalTitle}>Choose time</Text>
        <ScrollView style={{ maxHeight: 360 }}>
          {options.map((opt, idx) => (
            <TouchableOpacity
              key={opt}
              onPress={() => onSelect(opt)}
              style={[styles.modalItem, idx === initialIndex && { backgroundColor: "#f8fafc" }]}
            >
              <Text style={styles.modalItemText}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <TouchableOpacity onPress={onClose} style={styles.modalClose}>
          <Text style={styles.modalCloseText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

/* ---------- styles ---------- */

const styles = StyleSheet.create({
  sectionTitle: { fontSize: 16, fontWeight: "900", color: "#0b0b0c" },
  sectionSub: { color: "#6b7280", marginTop: 2, marginBottom: 10 },
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

  label: { fontWeight: "800", color: "#111827", marginBottom: 6 },
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
  inputSuccess: { borderColor: "#16a34a" },
  inputCheck: { position: "absolute", right: 12, top: 14, color: "#16a34a", fontSize: 16 },

  select: {
    borderWidth: 1,
    borderColor: "#e6eaf0",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 14,
    backgroundColor: "#fff",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  selectText: { color: "#111827" },
  chev: { color: "#9ca3af", fontSize: 16 },

  // suggestions
  suggestBox: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e6eaf0",
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    zIndex: 10,
  },
  suggestItem: { paddingHorizontal: 12, paddingVertical: 12 },
  suggestText: { color: "#111827" },
  suggestHint: { color: "#6b7280", paddingHorizontal: 12, paddingVertical: 12 },

  // chips
  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 10 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    borderRadius: 999,
    paddingHorizontal: 12,
    height: 34,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  chipText: { fontWeight: "700", color: "#111827" },
  chipX: { marginLeft: 8, color: "#6b7280", fontWeight: "900" },
  addBtn: { backgroundColor: "#111827", borderRadius: 12, paddingHorizontal: 16, justifyContent: "center" },
  addBtnText: { color: "#fff", fontWeight: "800" },

  // hours
  dayRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  switcher: { width: 46, height: 28, borderRadius: 999, backgroundColor: "#e5e7eb", justifyContent: "center", paddingHorizontal: 3, marginRight: 10 },
  switcherOn: { backgroundColor: "#22c55e55" },
  switchDot: { width: 22, height: 22, borderRadius: 999, backgroundColor: "#fff" },
  switchDotOn: { alignSelf: "flex-end" },
  dayLabel: { width: 40, fontWeight: "800", color: "#111827" },
  timeWrap: { flexDirection: "row", alignItems: "center", marginLeft: 8 },
  timeBtn: { borderWidth: 1, borderColor: "#e6eaf0", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, backgroundColor: "#fff" },
  timeText: { fontWeight: "800", color: "#111827" },
  timeDash: { marginHorizontal: 8, color: "#9ca3af" },
  closedTag: { marginLeft: 8, color: "#9ca3af", fontWeight: "700" },

  // images
  imagesRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  thumbBox: { width: 90, height: 90, borderRadius: 12, overflow: "hidden" },
  thumb: { width: "100%", height: "100%" },
  removeThumb: { position: "absolute", top: 4, right: 4, backgroundColor: "rgba(0,0,0,0.65)", width: 20, height: 20, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  addPhoto: { width: 90, height: 90, borderRadius: 12, backgroundColor: "#f3f4f6", borderWidth: 1, borderColor: "#e5e7eb", alignItems: "center", justifyContent: "center" },
  addPhotoPlus: { fontSize: 22, fontWeight: "900", color: "#111827", lineHeight: 22 },
  addPhotoText: { fontWeight: "800", color: "#111827", marginTop: 4 },

  // save bar
  saveBar: { position: "absolute", left: 0, right: 0, bottom: 0, padding: 12, backgroundColor: "#ffffffEE", borderTopWidth: 1, borderTopColor: "#eef2f7" },
  saveBtn: { backgroundColor: "#2563eb", height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center", shadowColor: "#2563eb", shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 6 }, elevation: 2 },
  saveBtnText: { color: "#fff", fontSize: 16, fontWeight: "900" },

  // modal
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.3)" },
  modalSheet: { marginTop: "auto", backgroundColor: "#fff", padding: 14, borderTopLeftRadius: 18, borderTopRightRadius: 18, borderWidth: 1, borderColor: "#eef2f7" },
  modalTitle: { fontSize: 16, fontWeight: "900", color: "#0b0b0c", marginBottom: 8 },
  modalItem: { paddingVertical: 12 },
  modalItemText: { fontSize: 16, color: "#111827", fontWeight: "700" },
  modalClose: { alignSelf: "center", marginTop: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999, backgroundColor: "#f3f4f6", borderWidth: 1, borderColor: "#e5e7eb" },
  modalCloseText: { color: "#111827", fontWeight: "800" },

  // coords confirmation
  coordsHint: { color: "#059669", fontWeight: "700" },
  coordsCard: { marginTop: 6, paddingVertical: 10, paddingHorizontal: 12, backgroundColor: "#ecfdf5", borderWidth: 1, borderColor: "#a7f3d0", borderRadius: 10 },
  coordsText: { color: "#065f46", fontWeight: "800" },
});
