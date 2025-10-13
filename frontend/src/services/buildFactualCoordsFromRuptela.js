export const buildFactualCoordsFromRuptela = (trips) => {
  if (!Array.isArray(trips) || trips.length === 0) return [];
  const sorted = [...trips].sort(
    (a, b) =>
      new Date(a?.trip_start?.datetime) - new Date(b?.trip_start?.datetime)
  );
  const coords = [];
  for (const t of sorted) {
    const sLat = t?.trip_start?.latitude;
    const sLng = t?.trip_start?.longitude;
    const eLat = t?.trip_end?.latitude;
    const eLng = t?.trip_end?.longitude;
    if (
      typeof sLat === "number" &&
      typeof sLng === "number" &&
      typeof eLat === "number" &&
      typeof eLng === "number"
    ) {
      const last = coords[coords.length - 1];
      if (!last || last.lat !== sLat || last.lng !== sLng) {
        coords.push({ lat: sLat, lng: sLng });
      }
      coords.push({ lat: eLat, lng: eLng });
    }
  }
  // dedupe jitter
  const out = [];
  const eps = 1e-5;
  for (const c of coords) {
    const last = out[out.length - 1];
    if (
      !last ||
      Math.abs(last.lat - c.lat) > eps ||
      Math.abs(last.lng - c.lng) > eps
    ) {
      out.push(c);
    }
  }
  return out;
};
