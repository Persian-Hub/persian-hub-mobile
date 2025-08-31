// src/screens/dashboard/AddBusiness.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
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
import * as ImagePicker from "expo-image-picker";
import { supabase } from "../../lib/supabase";
import { uploadImageToStorage } from "../../utils/uploadToStorage";
import {
  placesAutocomplete,
  placeDetails,
  resetPlacesSession,
} from "../../utils/places";

/* ---------------- Types ---------------- */

type Category = { id: string; name: string; slug: string };
type Subcategory = { id: string; name: string; slug: string; category_id: string };

const DAY_KEYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
type DayKey = (typeof DAY_KEYS)[number];

type DayState = { open: boolean; start: string | null; end: string | null };
type HoursState = Record<DayKey, DayState>;

/* ---------------- Helpers / constants ---------------- */

const emptyHours: HoursState = {
  Mon: { open: false, start: "09:00", end: "17:00" },
  Tue: { open: false, start: "09:00", end: "17:00" },
  Wed: { open: false, start: "09:00", end: "17:00" },
  Thu: { open: false, start: "09:00", end: "17:00" },
  Fri: { open: false, start: "09:00", end: "17:00" },
  Sat: { open: false, start: "09:00", end: "17:00" },
  Sun: { open: false, start: "09:00", end: "17:00" },
};

function toApiHours(h: HoursState) {
  const map: Record<string, string> = {};
  const mapKey: Record<DayKey, string> = { Mon: "mon", Tue: "tue", Wed: "wed", Thu: "thu", Fri: "fri", Sat: "sat", Sun: "sun" };
  DAY_KEYS.forEach((d) => {
    if (!h[d].open || !h[d].start || !h[d].end) map[mapKey[d]] = "Closed";
    else map[mapKey[d]] = `${h[d].start} - ${h[d].end}`;
  });
  return map;
}

// 15-minute steps
const TIME_OPTIONS = Array.from({ length: 24 * 4 }, (_, i) => {
  const h = String(Math.floor(i / 4)).padStart(2, "0");
  const m = String((i % 4) * 15).padStart(2, "0");
  return `${h}:${m}`;
});

/** Country code list (trim/expand as you like) */
const COUNTRY_CODES = [
  { code: "+61", label: "Australia (+61)" },
  { code: "+1", label: "USA / Canada (+1)" },
  { code: "+44", label: "United Kingdom (+44)" },
  { code: "+64", label: "New Zealand (+64)" },
  { code: "+49", label: "Germany (+49)" },
  { code: "+33", label: "France (+33)" },
  { code: "+98", label: "Iran (+98)" },
];

/** validators */
const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
const normalizeUrl = (v: string) => {
  if (!v) return "";
  if (/^https?:\/\//i.test(v)) return v;
  return `https://${v}`;
};
const isHttpUrl = (v: string) => {
  try {
    const u = new URL(normalizeUrl(v));
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
};
/** very light E.164-ish: + + 4..14 digits total after spaces removed */
const isValidE164 = (full: string) => /^\+\d{5,15}$/.test(full.replace(/\s+/g, ""));

/* ---------------- Component ---------------- */

export default function AddBusiness() {
  const [loading, setLoading] = useState(false);

  // Basic info
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [subcategoryId, setSubcategoryId] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);

  // Request new category/subcategory
  const [showCatRequest, setShowCatRequest] = useState(false);
  const [reqCategoryName, setReqCategoryName] = useState("");
  const [reqSubcategoryName, setReqSubcategoryName] = useState("");
  const [reqDescription, setReqDescription] = useState("");
  const [reqExamples, setReqExamples] = useState("");

  // Address (Google Places)
  const [address, setAddress] = useState(""); // final human address
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [addrQuery, setAddrQuery] = useState(""); // input text
  const [addrLoading, setAddrLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Array<{ description: string; place_id: string }>>([]);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [coordsResolved, setCoordsResolved] = useState(false); // confirmation UI
  const debouncer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Contact
  const [countryCode, setCountryCode] = useState(COUNTRY_CODES[0].code);
  const [phoneLocal, setPhoneLocal] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [errors, setErrors] = useState<{ phone?: string; email?: string; website?: string }>({});

  // Services / keywords
  const [services, setServices] = useState<string[]>([]);
  const [serviceDraft, setServiceDraft] = useState("");
  const [ownerKeywords, setOwnerKeywords] = useState<string[]>([]);
  const [ownerKeyDraft, setOwnerKeyDraft] = useState("");

  // Opening hours
  const [hours, setHours] = useState<HoursState>(emptyHours);
  const [pickerVisible, setPickerVisible] = useState<{ day: DayKey | null; field: "start" | "end" | null; show: boolean; }>(
    { day: null, field: null, show: false }
  );

  // Images
  const [images, setImages] = useState<string[]>([]);

  // Dropdown modals
  const [catModal, setCatModal] = useState(false);
  const [subcatModal, setSubcatModal] = useState(false);
  const [codeModal, setCodeModal] = useState(false);

  /* ---------------- Load options ---------------- */

  const loadCats = useCallback(async () => {
    const { data, error } = await supabase.from("categories").select("id,name,slug").order("name");
    if (error) {
      console.warn("Categories load error:", error.message);
      return;
    }
    if (Array.isArray(data)) setCategories(data as Category[]);
  }, []);

  const loadSubcats = useCallback(async () => {
    const { data, error } = await supabase.from("subcategories").select("id,name,slug,category_id").order("name");
    if (error) {
      console.warn("Subcategories load error:", error.message);
      return;
    }
    if (Array.isArray(data)) setSubcategories(data as any);
  }, []);

  useEffect(() => {
    loadCats();
    loadSubcats();
  }, [loadCats, loadSubcats]);

  // Reset subcategory when category changes
  useEffect(() => setSubcategoryId(null), [categoryId]);

  const filteredSubcats = useMemo(
    () => subcategories.filter((s) => s.category_id === categoryId),
    [subcategories, categoryId]
  );

  /* ---------------- Address autocomplete (debounced) ---------------- */

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
        const results = await placesAutocomplete(addrQuery /*, { country: "au" }*/);
        setSuggestions(results);
        setSuggestOpen(true);
      } catch (e: any) {
        console.warn("placesAutocomplete error:", e?.message);
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
      setLat(d.lat);
      setLng(d.lng);
      setAddrQuery(d.formatted_address);
      setSuggestOpen(false);
      setSuggestions([]);
      resetPlacesSession();
      Keyboard.dismiss();
      setCoordsResolved(true);
    } catch (e: any) {
      Alert.alert("Failed to get place", e?.message || "Try another address.");
    }
  };

  /* ---------------- Chip helpers ---------------- */

  const addChip = (draft: string, setDraft: (v: string) => void, setList: (fn: (prev: string[]) => string[]) => void) => {
    const v = draft.trim();
    if (!v) return;
    setList((prev) => Array.from(new Set([...prev, v])));
    setDraft("");
  };
  const removeChip = (value: string, setList: (fn: (prev: string[]) => string[]) => void) => {
    setList((prev) => prev.filter((x) => x !== value));
  };

  /* ---------------- Media picker ---------------- */

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Please allow access to your photos.");
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: true,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
      selectionLimit: 6,
    });
    if (res.canceled) return;
    const uris = res.assets?.map((a) => a.uri) ?? [];
    setImages((prev) => Array.from(new Set([...prev, ...uris])));
  };

  /* ---------------- Hours helpers ---------------- */

  const openTimePicker = (day: DayKey, field: "start" | "end") => setPickerVisible({ day, field, show: true });
  const setDayOpen = (day: DayKey, open: boolean) => setHours((h) => ({ ...h, [day]: { ...h[day], open } }));
  const setDayTime = (day: DayKey, field: "start" | "end", value: string) =>
    setHours((h) => ({ ...h, [day]: { ...h[day], [field]: value } }));

  /* ---------------- Live validation ---------------- */

  // phone: local only digits
  useEffect(() => {
    const local = phoneLocal.replace(/[^\d]/g, "");
    if (phoneLocal !== local) setPhoneLocal(local);

    const full = `${countryCode}${local}`;
    if (!local) setErrors((e) => ({ ...e, phone: "Phone number is required." }));
    else if (!isValidE164(full)) setErrors((e) => ({ ...e, phone: "Enter a valid phone number (numbers only)." }));
    else setErrors((e) => ({ ...e, phone: undefined }));
  }, [countryCode, phoneLocal]);

  useEffect(() => {
    if (!email) {
      setErrors((e) => ({ ...e, email: undefined })); // optional; make it required if you want
      return;
    }
    setErrors((e) => ({ ...e, email: isEmail(email) ? undefined : "Invalid email format." }));
  }, [email]);

  useEffect(() => {
    if (!website) {
      setErrors((e) => ({ ...e, website: undefined }));
      return;
    }
    setErrors((e) => ({ ...e, website: isHttpUrl(website) ? undefined : "Enter a valid URL (with or without https://)." }));
  }, [website]);

  /* ---------------- Submit-time validation ---------------- */

  const validate = (): string | null => {
    if (!name.trim()) return "Business name is required.";
    if (!addrQuery.trim()) return "Please choose an address from suggestions.";
    if (lat == null || lng == null) return "Could not resolve coordinates for the selected address.";

    // Phone mandatory
    const phoneFull = `${countryCode}${phoneLocal}`;
    if (!phoneLocal || !isValidE164(phoneFull)) return "Please enter a valid phone number.";

    if (email && !isEmail(email)) return "Email format looks invalid.";
    if (website && !isHttpUrl(website)) return "Website looks invalid.";

    if (!categoryId && !showCatRequest) return "Select a category or request a new one.";
    if (showCatRequest) {
      if (!reqCategoryName.trim()) return "Proposed category name is required.";
      if (!reqDescription.trim()) return "Please add a short description for your category request.";
      if (!reqExamples.trim()) return "Add at least one example business.";
    }
    return null;
  };

  /* ---------------- Save ---------------- */

  const onSave = async () => {
    const err = validate();
    if (err) {
      Alert.alert("Fix and retry", err);
      return;
    }
    setLoading(true);
    try {
      const userRes = await supabase.auth.getUser();
      const user = userRes.data.user;
      if (!user) throw new Error("You need to be logged in.");

      const phoneFull = `${countryCode}${phoneLocal}`;
      const websiteNormalized = website ? normalizeUrl(website) : null;

      // 1) Create business
      const payload = {
        owner_id: user.id,
        name: name.trim(),
        slug: name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Date.now().toString(36),
        description: description.trim() || null,
        category_id: showCatRequest ? null : categoryId,
        subcategory_id: showCatRequest ? null : subcategoryId,
        address: address.trim() || addrQuery.trim(),
        latitude: Number(lat),
        longitude: Number(lng),
        phone: phoneFull,
        email: email.trim() || null,
        website: websiteNormalized,
        opening_hours: toApiHours(hours),
        images: [],
        services: services.length ? services : null,
        owner_keywords: ownerKeywords.length ? ownerKeywords : [],
        status: "pending" as const,
        is_verified: false,
        is_sponsored: false,
      };

      const { data: created, error: ce } = await supabase.from("businesses").insert(payload).select("id").single();
      if (ce) throw ce;
      const bizId: string = created!.id;

      // 2) Optional category request
      if (showCatRequest) {
        const reqPayload = {
          proposed_category_name: reqCategoryName.trim(),
          proposed_subcategory_name: reqSubcategoryName.trim() || null,
          description: reqDescription.trim(),
          example_businesses: reqExamples.trim(),
          requested_by: user.id,
          business_id: bizId,
          status: "pending" as const,
        };
        const { error: re } = await supabase.from("category_requests").insert(reqPayload);
        if (re) console.warn("category_requests insert error:", re.message);
      }

      // 3) Upload images (best-effort)
      const uploaded: string[] = [];
      for (const uri of images) {
        const ext = uri.split("?")[0].split("#")[0].split(".").pop() || "jpg";
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const objectPath = `user/${user.id}/${bizId}/${fileName}`;
        try {
          const url = await uploadImageToStorage({
            bucket: "business-images",
            objectPath,
            uri,
            upsert: false,
          });
          uploaded.push(url);
        } catch (e: any) {
          console.warn("upload error:", e?.message);
        }
      }
      if (uploaded.length) {
        const { error: upd } = await supabase.from("businesses").update({ images: uploaded }).eq("id", bizId);
        if (upd) console.warn("update images error:", upd.message);
      }

      Alert.alert(
        "Submitted",
        showCatRequest
          ? "Your business and category request were submitted for review."
          : "Your business was submitted for review."
      );

      // Reset
      setName("");
      setDescription("");
      setCategoryId(null);
      setSubcategoryId(null);
      setShowCatRequest(false);
      setReqCategoryName("");
      setReqSubcategoryName("");
      setReqDescription("");
      setReqExamples("");
      setAddress("");
      setAddrQuery("");
      setLat(null);
      setLng(null);
      setCountryCode(COUNTRY_CODES[0].code);
      setPhoneLocal("");
      setEmail("");
      setWebsite("");
      setServices([]);
      setOwnerKeywords([]);
      setImages([]);
      setHours(emptyHours);
      setCoordsResolved(false);
      resetPlacesSession();
    } catch (e: any) {
      Alert.alert("Could not save", e?.message || "Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- UI ---------------- */

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f7f8fb" }} edges={["top"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
          <Header />

          {/* Basic Info */}
          <Section title="Basic information" subtitle="Start with the essentials.">
            <Field label="Business name *">
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="e.g. Paradise Market"
                style={styles.input}
              />
            </Field>

            <Field label="Description">
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Short description about the business"
                style={[styles.input, { height: 100, textAlignVertical: "top", paddingTop: 12 }]}
                multiline
              />
              <Hint>Tip: mention specialties, languages, and unique services.</Hint>
            </Field>

            {/* Category */}
            <Field label="Category *">
              <TouchableOpacity style={styles.select} onPress={() => setCatModal(true)}>
                <Text style={styles.selectText}>
                  {categoryId ? categories.find((c) => c.id === categoryId)?.name : "Select a category"}
                </Text>
                <Text style={styles.chev}>▾</Text>
              </TouchableOpacity>
            </Field>

            {/* Subcategory */}
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

            {/* Request Card */}
            {showCatRequest && (
              <View style={styles.requestCard}>
                <Text style={styles.requestTitle}>Request New Category</Text>
                <View style={{ gap: 10 }}>
                  <View>
                    <Text style={styles.reqLabel}>Proposed Category Name *</Text>
                    <TextInput
                      style={styles.reqInput}
                      placeholder="e.g., Pet Services"
                      value={reqCategoryName}
                      onChangeText={setReqCategoryName}
                    />
                  </View>

                  <View>
                    <Text style={styles.reqLabel}>Proposed Subcategory (Optional)</Text>
                    <TextInput
                      style={styles.reqInput}
                      placeholder="e.g., Dog Grooming"
                      value={reqSubcategoryName}
                      onChangeText={setReqSubcategoryName}
                    />
                  </View>

                  <View>
                    <Text style={styles.reqLabel}>Description *</Text>
                    <TextInput
                      style={[styles.reqInput, { height: 90, textAlignVertical: "top", paddingTop: 10 }]}
                      placeholder="Describe what types of businesses would fit in this category..."
                      multiline
                      value={reqDescription}
                      onChangeText={setReqDescription}
                    />
                  </View>

                  <View>
                    <Text style={styles.reqLabel}>Example Businesses *</Text>
                    <TextInput
                      style={styles.reqInput}
                      placeholder="e.g., PetSmart, Local Vet Clinic, Dog Walker"
                      value={reqExamples}
                      onChangeText={setReqExamples}
                    />
                  </View>

                  <Text style={styles.reqHint}>
                    Your request will be reviewed by an admin. You can still submit your business now.
                  </Text>
                </View>
              </View>
            )}
          </Section>

          {/* Contact & location */}
          <Section title="Contact & location" subtitle="How customers can reach you.">
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

                {/* Floating suggestions */}
                {suggestOpen && (
                  <View style={styles.suggestBox}>
                    {addrLoading ? (
                      <Text style={styles.suggestHint}>Searching…</Text>
                    ) : suggestions.length === 0 ? (
                      <Text style={styles.suggestHint}>No suggestions</Text>
                    ) : (
                      <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 220 }}>
                        {suggestions.map((item) => (
                          <TouchableOpacity
                            key={item.place_id}
                            style={styles.suggestItem}
                            onPress={() => selectSuggestion(item)}
                            activeOpacity={0.8}
                          >
                            <Text style={styles.suggestText}>{item.description}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    )}
                  </View>
                )}
              </View>

              {/* Confirmation strip */}
              {coordsResolved && lat != null && lng != null && (
                <View style={{ marginTop: 6 }}>
                  <Text style={styles.coordsHint}>✓ Location coordinates available</Text>
                  <View style={styles.coordsCard}>
                    <Text style={styles.coordsText}>✓ Coordinates: {lat}, {lng}</Text>
                  </View>
                </View>
              )}
            </Field>

            {/* PHONE (required) */}
            <Field label="Phone *">
              <View style={styles.phoneRow}>
                <TouchableOpacity style={styles.codeBtn} onPress={() => setCodeModal(true)} activeOpacity={0.9}>
                  <Text style={styles.codeText}>{countryCode}</Text>
                  <Text style={styles.chev}>▾</Text>
                </TouchableOpacity>
                <TextInput
                  value={phoneLocal}
                  onChangeText={setPhoneLocal}
                  placeholder="e.g. 433531131"
                  keyboardType="number-pad"
                  style={[styles.input, { flex: 1 }, errors.phone && styles.inputError]}
                />
              </View>
              {errors.phone ? <Text style={styles.errorText}>{errors.phone}</Text> : null}
            </Field>

            <Field label="Email">
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="hello@example.com"
                style={[styles.input, errors.email && styles.inputError]}
                autoCapitalize="none"
                keyboardType="email-address"
              />
              {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
            </Field>

            <Field label="Website">
              <TextInput
                value={website}
                onChangeText={setWebsite}
                placeholder="example.com or https://example.com"
                style={[styles.input, errors.website && styles.inputError]}
                autoCapitalize="none"
              />
              {errors.website ? <Text style={styles.errorText}>{errors.website}</Text> : null}
            </Field>
          </Section>

          {/* Opening Hours */}
          <Section title="Opening hours" subtitle="Toggle days and pick times.">
            {DAY_KEYS.map((d) => (
              <View key={d} style={styles.dayRow}>
                <Pressable
                  onPress={() => setDayOpen(d, !hours[d].open)}
                  style={[styles.switcher, hours[d].open && styles.switcherOn]}
                >
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

          {/* Owner Keywords */}
          <Section title="Owner keywords" subtitle="Private keywords to improve search (not visible publicly).">
            <ChipEditor
              items={ownerKeywords}
              draft={ownerKeyDraft}
              setDraft={setOwnerKeyDraft}
              onAdd={() => addChip(ownerKeyDraft, setOwnerKeyDraft, setOwnerKeywords)}
              onRemove={(v) => removeChip(v, setOwnerKeywords)}
              placeholder="e.g. Iranian grocery"
            />
            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>Search Optimization Tips:</Text>
              <Text style={styles.infoText}>
                Add keywords in both Persian and English that customers might use to find your business.
                This field is hidden from users and only used to improve search results. Include alternative
                spellings, brand names, and common terms related to your services.
              </Text>
            </View>
          </Section>

          {/* Photos */}
          <Section title="Photos" subtitle="Add up to 6 images. First one is used as cover.">
            <View style={styles.imagesRow}>
              {images.map((uri) => (
                <View key={uri} style={styles.thumbBox}>
                  <Image source={{ uri }} style={styles.thumb} />
                  <Pressable
                    hitSlop={10}
                    style={styles.removeThumb}
                    onPress={() => setImages((prev) => prev.filter((x) => x !== uri))}
                  >
                    <Text style={{ color: "#fff", fontWeight: "800" }}>×</Text>
                  </Pressable>
                </View>
              ))}
              <TouchableOpacity style={styles.addPhoto} onPress={pickImage}>
                <Text style={styles.addPhotoPlus}>＋</Text>
                <Text style={styles.addPhotoText}>Add</Text>
              </TouchableOpacity>
            </View>
            <Hint>Images are optimized on upload. Use bright, clear photos.</Hint>
          </Section>
        </ScrollView>

        {/* Sticky Save Bar */}
        <View style={styles.saveBar}>
          <TouchableOpacity
            onPress={onSave}
            disabled={loading}
            activeOpacity={0.9}
            style={[styles.saveBtn, loading && { opacity: 0.7 }]}
          >
            <Text style={styles.saveBtnText}>{loading ? "Saving..." : "Submit for review"}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Category modal (with "Can't find it?" option) */}
      <PickerModal
        visible={catModal}
        title="Choose a category"
        data={categories}
        keyExtractor={(it) => it.id}
        labelExtractor={(it) => it.name}
        onClose={() => setCatModal(false)}
        onSelect={(c) => {
          setCategoryId(c.id);
          setShowCatRequest(false);
          setCatModal(false);
        }}
        extraOptionLabel="Can't find it? Request new category →"
        onExtraOption={() => {
          setCategoryId(null);
          setSubcategoryId(null);
          setShowCatRequest(true);
        }}
      />

      {/* Subcategory modal (with "Can't find it?" option) */}
      <PickerModal
        visible={subcatModal}
        title="Choose a subcategory"
        data={filteredSubcats}
        keyExtractor={(it) => it.id}
        labelExtractor={(it) => it.name}
        onClose={() => setSubcatModal(false)}
        onSelect={(sc) => {
          setSubcategoryId(sc.id);
          setShowCatRequest(false);
          setSubcatModal(false);
        }}
        extraOptionLabel="Can't find it? Request new subcategory →"
        onExtraOption={() => {
          setShowCatRequest(true);
          setSubcatModal(false);
        }}
      />

      {/* Country code modal */}
      <PickerModal
        visible={codeModal}
        title="Select country code"
        data={COUNTRY_CODES}
        keyExtractor={(it) => it.code}
        labelExtractor={(it) => it.label}
        onClose={() => setCodeModal(false)}
        onSelect={(c) => {
          setCountryCode(c.code);
          setCodeModal(false);
        }}
      />

      {/* Time picker modal */}
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

/* ---------------- UI Bits ---------------- */

function Header() {
  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 6 }}>
      <Text style={{ fontSize: 26, fontWeight: "900", color: "#0b0b0c", marginBottom: 4 }}>
        Add a new business
      </Text>
      <Text style={{ color: "#6b7280" }}>
        Complete the details below. Your listing will be reviewed by an admin.
      </Text>
    </View>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
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

function Hint({ children }: { children: React.ReactNode }) {
  return <Text style={styles.hint}>{children}</Text>;
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

/** Picker modal with optional "Can't find it?" row */
function PickerModal<T>({
  visible,
  title,
  data,
  keyExtractor,
  labelExtractor,
  onSelect,
  onClose,
  extraOptionLabel,
  onExtraOption,
}: {
  visible: boolean;
  title: string;
  data: T[];
  keyExtractor: (it: T) => string;
  labelExtractor: (it: T) => string;
  onSelect: (item: T) => void;
  onClose: () => void;
  extraOptionLabel?: string;
  onExtraOption?: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose} />
      <View style={styles.modalSheet}>
        <Text style={styles.modalTitle}>{title}</Text>

        {extraOptionLabel && onExtraOption ? (
          <TouchableOpacity
            onPress={() => {
              onExtraOption();
              onClose();
            }}
            style={styles.extraRow}
            activeOpacity={0.9}
          >
            <Text style={styles.extraRowIcon}>＋</Text>
            <Text style={styles.extraRowText}>{extraOptionLabel}</Text>
          </TouchableOpacity>
        ) : null}

        {/* simple scroll to avoid nested VirtualizedList issues */}
        <ScrollView style={{ maxHeight: 320 }}>
          {data.map((item) => (
            <TouchableOpacity
              key={keyExtractor(item)}
              onPress={() => onSelect(item)}
              style={styles.modalItem}
            >
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
        {/* simple scroll */}
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

/* ---------------- Styles ---------------- */

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
  inputError: { borderColor: "#ef4444" },
  hint: { color: "#6b7280", marginTop: 6 },

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

  // Phone
  phoneRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  codeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e6eaf0",
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  codeText: { fontWeight: "800", color: "#111827" },
  errorText: { color: "#ef4444", marginTop: 6, fontWeight: "700" },

  requestCard: {
    marginTop: 12,
    backgroundColor: "#f3f6ff",
    borderWidth: 1,
    borderColor: "#e0e7ff",
    borderRadius: 14,
    padding: 12,
  },
  requestTitle: { fontSize: 16, fontWeight: "900", color: "#1f2a5a", marginBottom: 8 },
  reqLabel: { fontWeight: "800", color: "#111827", marginBottom: 6 },
  reqInput: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#dbe3ff",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: "#111827",
  },
  reqHint: { color: "#475569", marginTop: 6 },

  // Suggestions dropdown
  suggestBox: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 52, // under the input
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

  addBtn: {
    backgroundColor: "#111827",
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  addBtnText: { color: "#fff", fontWeight: "800" },

  dayRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  switcher: {
    width: 46,
    height: 28,
    borderRadius: 999,
    backgroundColor: "#e5e7eb",
    justifyContent: "center",
    paddingHorizontal: 3,
    marginRight: 10,
  },
  switcherOn: { backgroundColor: "#22c55e55" },
  switchDot: { width: 22, height: 22, borderRadius: 999, backgroundColor: "#fff" },
  switchDotOn: { alignSelf: "flex-end" },

  dayLabel: { width: 40, fontWeight: "800", color: "#111827" },
  timeWrap: { flexDirection: "row", alignItems: "center", marginLeft: 8 },
  timeBtn: {
    borderWidth: 1,
    borderColor: "#e6eaf0",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "#fff",
  },
  timeText: { fontWeight: "800", color: "#111827" },
  timeDash: { marginHorizontal: 8, color: "#9ca3af" },
  closedTag: { marginLeft: 8, color: "#9ca3af", fontWeight: "700" },

  imagesRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  thumbBox: { width: 90, height: 90, borderRadius: 12, overflow: "hidden" },
  thumb: { width: "100%", height: "100%" },
  removeThumb: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "rgba(0,0,0,0.65)",
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  addPhoto: {
    width: 90,
    height: 90,
    borderRadius: 12,
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
  },
  addPhotoPlus: { fontSize: 22, fontWeight: "900", color: "#111827", lineHeight: 22 },
  addPhotoText: { fontWeight: "800", color: "#111827", marginTop: 4 },

  saveBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 12,
    backgroundColor: "#ffffffEE",
    borderTopWidth: 1,
    borderTopColor: "#eef2f7",
  },
  saveBtn: {
    backgroundColor: "#2563eb",
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#2563eb",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  saveBtnText: { color: "#fff", fontSize: 16, fontWeight: "900" },

  // Modal
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.3)" },
  modalSheet: {
    marginTop: "auto",
    backgroundColor: "#fff",
    padding: 14,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderWidth: 1,
    borderColor: "#eef2f7",
  },
  modalTitle: { fontSize: 16, fontWeight: "900", color: "#0b0b0c", marginBottom: 8 },
  modalItem: { paddingVertical: 12 },
  modalItemText: { fontSize: 16, color: "#111827", fontWeight: "700" },
  modalClose: {
    alignSelf: "center",
    marginTop: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  modalCloseText: { color: "#111827", fontWeight: "800" },

  // Extra row inside picker for "Can't find it?"
  extraRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 10,
    marginBottom: 8,
    backgroundColor: "#eef2ff",
    borderWidth: 1,
    borderColor: "#dbe3ff",
    borderRadius: 10,
  },
  extraRowIcon: { color: "#2563eb", fontSize: 18, fontWeight: "900", marginRight: 8 },
  extraRowText: { color: "#2563eb", fontWeight: "800", fontSize: 15 },

  // Info card under Owner Keywords
  infoBox: {
    marginTop: 10,
    borderRadius: 12,
    padding: 12,
    backgroundColor: "#eef4ff",
    borderWidth: 1,
    borderColor: "#dbe7ff",
  },
  infoTitle: { fontWeight: "900", color: "#1e3a8a", marginBottom: 6 },
  infoText: { color: "#334155", lineHeight: 20 },

  // Coordinates confirmation styles
  coordsHint: { color: "#059669", fontWeight: "700" },
  coordsCard: {
    marginTop: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#ecfdf5",
    borderWidth: 1,
    borderColor: "#a7f3d0",
    borderRadius: 10,
  },
  coordsText: { color: "#065f46", fontWeight: "800" },
});
