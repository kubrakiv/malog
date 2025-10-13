// services/DistanceCalculationService.js
import { DELIVERY_CONSTANTS } from "../constants/global";
const { START, LOADING, UNLOADING } = DELIVERY_CONSTANTS;

export const calculateRouteDistance = async (origin, destination) => {
  try {
    // eslint-disable-next-line no-undef
    const directionsService = new google.maps.DirectionsService();
    const results = await directionsService.route({
      origin: origin,
      destination: destination,
      // eslint-disable-next-line no-undef
      travelMode: google.maps.TravelMode.DRIVING,
    });
    return results.routes[0].legs[0].distance.value; // distance in meters
  } catch (error) {
    console.error("Error calculating route: ", error);
    return 0;
  }
};

export async function calculateTotalDistance(points, router) {
  if (!router) {
    throw new Error("Router is not available");
  }

  const valid = (p) =>
    p && typeof p.lat === "number" && typeof p.lng === "number";
  const pts = (points || []).filter(valid);
  if (pts.length < 2) return 0;

  console.log("Calculating total distance for points:", pts);

  // Find first loading and last unloading points
  const firstLoading = pts.find((p) => p.type === LOADING);
  const lastUnloading = pts.findLast((p) => p.type === UNLOADING);

  console.log("First loading point:", firstLoading);
  console.log("Last unloading point:", lastUnloading);

  if (!firstLoading || !lastUnloading) {
    console.warn("First loading or last unloading point not found");
    return 0;
  }

  // Calculate route from first loading to last unloading
  const origin = `${firstLoading.lat},${firstLoading.lng}`;
  const destination = `${lastUnloading.lat},${lastUnloading.lng}`;

  // Find all points between first loading and last unloading (including intermediate stops)
  const loadingIndex = pts.findIndex((p) => p.type === LOADING);
  const unloadingIndex = pts.findLastIndex((p) => p.type === UNLOADING);

  // Get via points (all points between first loading and last unloading, excluding the endpoints)
  const viaList = pts
    .slice(loadingIndex + 1, unloadingIndex)
    .map((p) => `${p.lat},${p.lng}`);

  console.log("Origin:", origin);
  console.log("Destination:", destination);
  console.log("Via points:", viaList);
  console.log("Total route points:", [origin, ...viaList, destination]);

  const params = {
    origin,
    destination,
    transportMode: "truck",
    return: "summary",
    "vehicle[emissionType]": "euro_6",
    "vehicle[height]": "3800",
    "vehicle[width]": "2500",
    "vehicle[length]": "16500",
    "vehicle[weight]": "40000",
    "vehicle[axleCount]": "6",
    "exclude[countries]": "CHE",
  };

  if (viaList.length > 0) {
    params.via = new H.service.Url.MultiValueQueryParameter(viaList);
  }

  console.log("Routing params:", params);

  try {
    const result = await new Promise((resolve, reject) => {
      router.calculateRoute(params, resolve, reject);
    });

    console.log("Route calculation result:", result);

    const route = result?.routes?.[0];
    if (!route?.sections?.length) return 0;

    let totalLength = 0; // meters

    route.sections.forEach((section, index) => {
      const sectionLength = section?.summary?.length || 0;
      totalLength += sectionLength;
      console.log(`Section ${index + 1} length:`, sectionLength, "meters");
    });

    const distanceKm = (totalLength / 1000).toFixed(0);
    console.log("Total distance calculated:", distanceKm, "km");
    return distanceKm;
  } catch (error) {
    console.error("Error in calculateTotalDistance:", error);
    throw error;
  }
}

export const calculateEmptyDistance = ({ start, firstLoading }, callback) => {
  const platform = new H.service.Platform({
    apikey: import.meta.env.REACT_APP_HERE_API_KEY,
  });

  const router = platform.getRoutingService(null, 8);

  const routingParams = {
    origin: `${start.lat},${start.lng}`,
    destination: `${firstLoading.lat},${firstLoading.lng}`,
    transportMode: "truck",
    return: "summary",
    "vehicle[emissionType]": "euro_6",
    "vehicle[height]": "3800",
    "vehicle[width]": "2500",
    "vehicle[length]": "16500",
    "vehicle[weight]": "40000",
    "vehicle[axleCount]": "6",
    "exclude[countries]": "CHE",
  };

  router.calculateRoute(
    routingParams,
    (result) => {
      const section = result.routes?.[0]?.sections?.[0];
      if (section) {
        const distanceKm = (section.summary.length / 1000).toFixed(0);
        callback(distanceKm);
      } else {
        callback(null);
      }
    },
    (error) => {
      console.error("Empty distance error", error);
      callback(null);
    }
  );
};
