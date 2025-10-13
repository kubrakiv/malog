// services/getRuptelaTripsForPeriod.js
export const getRuptelaTripsForPeriod = async (truck, fromIso, toIso) => {
  if (!truck || !truck.gps_id) return { trips: [] };

  const qs = new URLSearchParams({
    from_datetime: fromIso,
    to_datetime: toIso,
  });

  const res = await fetch(
    `/api/ruptela/objects/${encodeURIComponent(truck.gps_id)}/trips?${qs}`
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json(); // { trips: [...] }
};
