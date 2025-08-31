// src/utils/places.ts
// Ensure UUID support in RN/Expo
import "react-native-get-random-values";

const KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_REST_KEY as string;

// Use a session token for each autocomplete session
let sessionToken: string | null = null;

function newToken() {
  // crypto.randomUUID is available in RN when react-native-get-random-values is loaded
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  // Fallback (very unlikely needed)
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getSessionToken() {
  if (!sessionToken) sessionToken = newToken();
  return sessionToken!;
}

export function resetPlacesSession() {
  sessionToken = null;
}

/** Autocomplete suggestions */
export async function placesAutocomplete(
  input: string,
  opts?: { country?: string }
) {
  if (!KEY) throw new Error("Missing EXPO_PUBLIC_GOOGLE_PLACES_REST_KEY");

  const params = new URLSearchParams({
    input,
    key: KEY,
    sessiontoken: getSessionToken(),
    types: "address",
  });
  if (opts?.country) params.set("components", `country:${opts.country}`);

  const res = await fetch(
    `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params.toString()}`
  );
  const json = await res.json();
  if (json.status !== "OK" && json.status !== "ZERO_RESULTS") {
    throw new Error(json.error_message || json.status || "Places autocomplete failed");
  }
  return (json.predictions || []) as Array<{ description: string; place_id: string }>;
}

/** Place details to get geometry + formatted address */
export async function placeDetails(placeId: string) {
  if (!KEY) throw new Error("Missing EXPO_PUBLIC_GOOGLE_PLACES_REST_KEY");

  const params = new URLSearchParams({
    place_id: placeId,
    key: KEY,
    sessiontoken: getSessionToken(),
    fields: "formatted_address,geometry",
  });

  const res = await fetch(
    `https://maps.googleapis.com/maps/api/place/details/json?${params.toString()}`
  );
  const json = await res.json();
  if (json.status !== "OK") {
    throw new Error(json.error_message || json.status || "Place details failed");
  }

  const d = json.result;
  return {
    formatted_address: d.formatted_address as string,
    lat: d.geometry.location.lat as number,
    lng: d.geometry.location.lng as number,
  };
}

/** Reverse geocode lat/lng to a human address */
export async function reverseGeocode(lat: number, lng: number) {
  if (!KEY) throw new Error("Missing EXPO_PUBLIC_GOOGLE_PLACES_REST_KEY");

  const params = new URLSearchParams({
    latlng: `${lat},${lng}`,
    key: KEY,
  });

  const res = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`
  );
  const json = await res.json();
  if (json.status !== "OK") {
    throw new Error(json.error_message || json.status || "Reverse geocode failed");
  }
  const first = json.results?.[0];
  return (first?.formatted_address as string) ?? "";
}
