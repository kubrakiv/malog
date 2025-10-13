import { useMemo, useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { getTruckLocation } from "../../../services/truckLocationService";
import { generatePointsFromTasks } from "../../../utils/generatePointsFromTasks";
import { buildPeriodFromOrderPoints } from "../../../services/buildPeriodFromOrderPoints";
import { getRuptelaTripsForPeriod } from "../../../services/getRuptelaTripsForPeriod";
import cn from "classnames";

import TruckRouteMapComponent from "../../../components/TruckRouteMapComponent";
import {
  setTruckDetails,
  setTruckToNextTask,
} from "../../../actions/mapActions";
import { updateOrder } from "../../../features/orders/ordersOperations";
import { selectShowTruckOnMapModal } from "../../../features/planner/plannerSelectors";

import { DELIVERY_CONSTANTS } from "../../../constants/global";
import { setOrderFactData } from "../../../features/orders/ordersSlicers";
const { LOADING, UNLOADING } = DELIVERY_CONSTANTS;

const OrderHereMapComponent = ({ enableFactual, readOnly = false }) => {
  const [truckLocationLoaded, setTruckLocationLoaded] = useState(false); // Track if truck location is loaded
  const dispatch = useDispatch();
  const truck = useSelector((state) => state.map.truck);
  const trucks = useSelector((state) => state.trucksInfo.trucks.data);
  const order = useSelector((state) => state.ordersInfo.orderDetails.data);
  const truckData = order.truck_info;

  const tasks = order.tasks || [];
  const truckLocation = useSelector((state) => state.map.truckLocation);

  const showTruckOnMapModal = useSelector(selectShowTruckOnMapModal);

  const [ruptelaTrips, setRuptelaTrips] = useState([]);

  const TZ_BY_CC = useMemo(
    () => ({
      CZ: "Europe/Prague",
      AT: "Europe/Vienna",
      DE: "Europe/Berlin",
      IT: "Europe/Rome",
      ES: "Europe/Madrid",
      UA: "Europe/Kiev",
      BE: "Europe/Brussels",
      NL: "Europe/Amsterdam",
      FR: "Europe/Paris",
      PL: "Europe/Warsaw",
      SL: "Europe/Ljubljana",
      SK: "Europe/Bratislava",
      HU: "Europe/Budapest",
    }),
    []
  );

  // ✅ Single source of truth: has the order actually started?
  const isOrderActualNow = useMemo(() => {
    const { fromIso } = buildPeriodFromOrderPoints(tasks, {
      inputTimesAreUtc: false,
      timeZoneResolver: (task) =>
        TZ_BY_CC[task.country_code] || "Europe/Prague",
    });
    if (!fromIso) return false;
    return new Date(fromIso) <= new Date();
  }, [JSON.stringify(tasks), TZ_BY_CC]);

  const isOrderFinished = useMemo(() => {
    return tasks
      ?.filter((task) => task.type === LOADING || task.type === UNLOADING)
      .every((task) => task.end_date && task.end_time);
  }, [JSON.stringify(tasks)]);

  // const points = useMemo(() => generatePointsFromTasks(tasks), [tasks]);
  // Memoize points based on tasks
  const memoizedPoints = useMemo(() => {
    return generatePointsFromTasks(tasks);
  }, [JSON.stringify(tasks)]); // JSON.stringify ensures deep equality

  // ❗Do NOT expose a live position to the child if the order isn't actual yet
  const memoizedTruckPosition = useMemo(() => {
    if (!isOrderActualNow) return null;
    return truckLocation ? { ...truckLocation } : null;
  }, [isOrderActualNow, truckLocation?.lat, truckLocation?.lng]);

  const [routeInfo, setRouteInfo] = useState({});
  const [tollData, setTollData] = useState({
    byCountry: [],
    totalByCurrency: [],
  });

  const hasUpdatedRef = useRef(false); // tracks if update was dispatched
  // cache latest planned & factual so we can compute deltas in any arrival order
  const plannedRef = useRef({
    distance: null,
    emptyDistance: null,
  });
  const factualRef = useRef({ distance: null });

  useEffect(() => {
    console.log("=== ORDER UPDATE EFFECT TRIGGERED ===");
    console.log("Current state:", {
      readOnly,
      routeInfo,
      tollData,
      orderData: {
        distance: order.distance,
        empty_distance: order.empty_distance,
        tolls: order.tolls,
        id: order.id,
      },
      hasUpdatedRef: hasUpdatedRef.current,
    });

    // Allow updates for missing essential data even in readOnly mode
    const orderMissingEssentialData =
      !order.distance ||
      order.empty_distance === null ||
      order.empty_distance === undefined ||
      order.tolls === null ||
      order.tolls === undefined;

    if (readOnly && !orderMissingEssentialData) {
      console.log(
        "📖 ReadOnly mode: Order has all essential data, skipping update"
      );
      return;
    }

    // Check if we have received toll data (even if the value is 0)
    const hasTollData =
      tollData?.totalEUR !== undefined ||
      (Array.isArray(tollData?.totalByCurrency) &&
        tollData.totalByCurrency.length > 0);

    const shouldUpdate =
      !hasUpdatedRef.current &&
      !!routeInfo.distance &&
      routeInfo.emptyDistance !== undefined &&
      routeInfo.emptyDistance !== null &&
      hasTollData &&
      orderMissingEssentialData;

    if (!shouldUpdate) {
      console.log("❌ Update conditions not met:", {
        hasUpdatedRef: hasUpdatedRef.current,
        hasDistance: !!routeInfo.distance,
        hasEmptyDistance:
          routeInfo.emptyDistance !== undefined &&
          routeInfo.emptyDistance !== null,
        emptyDistanceValue: routeInfo.emptyDistance,
        hasTollData,
        orderMissingEssentialData,
        readOnlyMode: readOnly,
        reason:
          readOnly && !orderMissingEssentialData
            ? "ReadOnly mode with complete data"
            : "Other conditions not met",
      });
      return;
    }

    console.log("✅ All update conditions met, proceeding with order update");

    const distance = parseFloat(String(routeInfo.distance));
    const emptyDistance = parseFloat(String(routeInfo.emptyDistance));

    // Use new totalEUR field first, fallback to legacy format
    const tolls =
      tollData?.totalEUR !== undefined
        ? Number(tollData.totalEUR)
        : Number(tollData.totalByCurrency?.[0]?.value) || 0;

    const dataToUpdate = {
      distance,
      empty_distance: emptyDistance,
      tolls,
    };

    console.log("=== ORDER UPDATE DATA ===");
    console.log("Distance:", distance, "km");
    console.log("Empty Distance:", emptyDistance, "km");
    console.log("Tolls:", tolls, "EUR");
    console.log("TollData source:", tollData);
    console.log("Current order values:", {
      orderDistance: order.distance,
      orderEmptyDistance: order.empty_distance,
      orderTolls: order.tolls,
    });
    console.log("Should update conditions:", {
      hasUpdatedRef: hasUpdatedRef.current,
      hasDistance: !!routeInfo.distance,
      hasEmptyDistance: !!routeInfo.emptyDistance,
      hasTollData,
      needsUpdate:
        !order.distance ||
        !order.empty_distance ||
        order.tolls === null ||
        order.tolls === undefined,
    });

    dispatch(updateOrder({ dataToUpdate, orderId: order.id }))
      .unwrap()
      .then(() => {
        hasUpdatedRef.current = true;
        console.log("✅ Order updated successfully with toll data");
      })
      .catch((err) => console.error("Update failed:", err));
  }, [
    readOnly,
    routeInfo.distance,
    routeInfo.emptyDistance,
    tollData?.totalEUR,
    tollData?.totalByCurrency,
    dispatch,
    order.id,
    order.distance,
    order.empty_distance,
    order.tolls,
  ]);

  // Handle route data from the map component
  const handleRouteData = (data) => {
    console.log("=== HANDLE ROUTE DATA CALLED ===");
    console.log("Received data:", data);

    // A) Planned summary arrives
    if (data && data.distance != null && data.emptyDistance != null) {
      const plannedDistance = Number(data.distance);
      const emptyDistance = Number(data.emptyDistance);

      plannedRef.current = { distance: plannedDistance, emptyDistance };

      // Try to compute factual deltas now (from cache or from this payload)
      let computedFactual;
      if (data.factual && data.factual.distance != null) {
        const f = Number(data.factual.distance);
        factualRef.current.distance = f;
        computedFactual = {
          distance: f,
          deltaKm: (f - plannedDistance).toFixed(0),
          deltaPct:
            plannedDistance > 0
              ? (((f - plannedDistance) / plannedDistance) * 100).toFixed(1)
              : null,
        };
      } else if (factualRef.current.distance != null) {
        const f = Number(factualRef.current.distance);
        computedFactual = {
          distance: f,
          deltaKm: (f - plannedDistance).toFixed(0),
          deltaPct:
            plannedDistance > 0
              ? (((f - plannedDistance) / plannedDistance) * 100).toFixed(1)
              : null,
        };
      }

      // Persist + update UI
      dispatch(
        setOrderFactData({
          distance: plannedDistance,
          emptyDistance,
          factual: computedFactual || {},
        })
      );

      setRouteInfo((prev) => ({
        ...prev,
        distance: plannedDistance,
        duration: data.duration,
        emptyDistance,
        distanceByCountry: data.distanceByCountry,
        factual: computedFactual ?? prev?.factual,
      }));

      // Handle toll data - CRITICAL: Set toll data in the same block as route info
      if (data.tollData) {
        console.log("=== SETTING TOLL DATA ===");
        console.log("Toll data received:", data.tollData);
        setTollData(data.tollData);
      } else {
        console.log("❌ No toll data in response");
      }

      console.log("ROUTE INFO after update", {
        distance: plannedDistance,
        emptyDistance,
        tollDataReceived: !!data.tollData,
      });
    }

    // B) Factual-only update arrives
    if (data?.factual?.distance != null) {
      const factDistance = Number(data.factual.distance);
      factualRef.current.distance = factDistance;

      const plannedDistance = plannedRef.current.distance;
      let factualPayload = { distance: factDistance };

      if (plannedDistance != null) {
        factualPayload = {
          distance: factDistance,
          deltaKm: (factDistance - plannedDistance).toFixed(0),
          deltaPct:
            plannedDistance > 0
              ? (
                  ((factDistance - plannedDistance) / plannedDistance) *
                  100
                ).toFixed(1)
              : null,
        };

        // now both sides known → persist full fact data too
        dispatch(
          setOrderFactData({
            distance: plannedRef.current.distance,
            emptyDistance: plannedRef.current.emptyDistance,
            factual: factualPayload,
          })
        );
      }

      setRouteInfo((prev) => ({
        ...prev,
        factual: factualPayload,
      }));
    }
    console.log("ROUTE INFO", routeInfo);

    // C) Live leg (independent)
    if (data?.truckToNextPoint) {
      dispatch(setTruckToNextTask(data.truckToNextPoint));
    }
  };

  // Fetch truck location if truck is assigned to the order
  useEffect(() => {
    if (isOrderFinished || !isOrderActualNow) {
      console.log(
        "Order is finished or not actual, not fetching truck location."
      );
      return;
    }

    if (order?.truck) {
      const truck = trucks.find((t) => t.plates === order.truck);
      dispatch(setTruckDetails(truck));
      if (truck) {
        if (truck.gps_id) {
          // Only attempt to fetch truck location if gps_id is present
          getTruckLocation(truck, dispatch)
            .then(() => {
              setTruckLocationLoaded(true);
            })
            .catch((error) => {
              console.error("Failed to fetch truck location:", error);
              setTruckLocationLoaded(false); // Set false if location fetch fails
            });
        } else {
          // No gps_id, set truck location as not loaded
          setTruckLocationLoaded(false);
          console.log("Truck found, but no gps_id available");
        }
      } else {
        // Truck not found in the list
        setTruckLocationLoaded(false);
        console.log("Truck not found in the list");
      }
    } else {
      // No truck assigned to the order
      setTruckLocationLoaded(false);
      console.log("No truck assigned to the order");
    }
  }, [order, trucks, dispatch, isOrderActualNow, isOrderFinished]);

  // --- FETCH Ruptela trips only when enabled ---
  useEffect(() => {
    if (!enableFactual) return;

    let aborted = false;

    const loadTrips = async () => {
      const { fromIso, toIso: finishedTo } = buildPeriodFromOrderPoints(tasks, {
        inputTimesAreUtc: false,
        timeZoneResolver: (task, when) =>
          TZ_BY_CC[task.country_code] || "Europe/Prague",
      });
      const gpsId = truckData?.gps_id;
      if (!fromIso || !gpsId) return;

      const now = new Date();
      const start = new Date(fromIso);

      // 🚫 Order not started yet → don't call Ruptela
      if (start > now) {
        console.log(
          "[Ruptela] Order starts in the future; skipping factual fetch."
        );
        if (!aborted) setRuptelaTrips([]); // keep map happy (planned route still renders)
        return;
      }

      // snapshot: if order is not finished, fetch up to "now"
      const toIso = isOrderFinished ? finishedTo : new Date().toISOString();

      try {
        const resp = await getRuptelaTripsForPeriod(
          { gps_id: gpsId },
          fromIso,
          toIso
        );
        if (aborted) return;
        setRuptelaTrips(resp?.trips || []);
      } catch (e) {
        if (aborted) return;
        console.error("[Ruptela] fetch error:", e);
        setRuptelaTrips([]);
      }
    };

    loadTrips();

    return () => {
      aborted = true;
    };
  }, [
    enableFactual,
    truckData?.gps_id,
    isOrderFinished,
    JSON.stringify(tasks),
  ]);

  return (
    // <div className="order-details__content-row">
    <div
      className={cn(
        "order-details__content-row-block",
        { "order-details__content-row-block-map": !showTruckOnMapModal },
        {
          "order-details__content-row-block-map_truck-modal":
            showTruckOnMapModal,
        }
      )}
    >
      <TruckRouteMapComponent
        points={memoizedPoints}
        onRouteData={handleRouteData}
        truckPosition={memoizedTruckPosition}
        isOrderFinished={isOrderFinished}
        isOrderActualNow={isOrderActualNow}
        ruptelaTrips={ruptelaTrips}
      />
    </div>
    // </div>
  );
};

export default OrderHereMapComponent;
