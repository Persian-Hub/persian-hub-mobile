// Haversine distance (km)
export function haversineKm(
  a: { lat: number; lon: number },
  b: { lat: number; lon: number }
) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const sLat1 = Math.sin(dLat / 2);
  const sLon1 = Math.sin(dLon / 2);
  const t =
    sLat1 * sLat1 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      sLon1 *
      sLon1;
  const c = 2 * Math.atan2(Math.sqrt(t), Math.sqrt(1 - t));
  return R * c;
}
