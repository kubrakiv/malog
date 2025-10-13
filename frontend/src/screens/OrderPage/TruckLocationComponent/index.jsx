import { useMemo } from "react";
import { useSelector } from "react-redux";
import { buildPeriodFromOrderPoints } from "../../../services/buildPeriodFromOrderPoints";

import { DELIVERY_CONSTANTS } from "../../../constants/global";
const { LOADING, UNLOADING } = DELIVERY_CONSTANTS;

const TruckLocationComponent = ({ style }) => {
  const tasks =
    useSelector((state) => state.ordersInfo.orderDetails.data.tasks) || [];

  const remainingDistance = useSelector(
    (state) => state.map.truckToNextTask?.distance
  );
  const remainingDuration = useSelector(
    (state) => state.map.truckToNextTask?.duration
  );

  // Finished = all LOADING/UNLOADING have end_date+end_time
  const isOrderFinished = useMemo(
    () =>
      tasks
        ?.filter((t) => t.type === LOADING || t.type === UNLOADING)
        .every((t) => t.end_date && t.end_time),
    [JSON.stringify(tasks)]
  );

  // Same TZ map you use elsewhere
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

  // ✅ Only “actual” (already started) orders should show this widget
  const isOrderActualNow = useMemo(() => {
    const { fromIso } = buildPeriodFromOrderPoints(tasks, {
      inputTimesAreUtc: false,
      timeZoneResolver: (task) =>
        TZ_BY_CC[task.country_code] || "Europe/Prague",
    });
    if (!fromIso) return false;
    return new Date(fromIso) <= new Date();
  }, [JSON.stringify(tasks), TZ_BY_CC]);

  // Next pending task (for the label)
  const pendingTask = useMemo(
    () =>
      tasks?.find(
        (t) =>
          (t.type === LOADING && !(t.end_date && t.end_time)) ||
          (t.type === UNLOADING && !(t.end_date && t.end_time))
      ),
    [JSON.stringify(tasks)]
  );

  // Guard rendering for future orders or finished orders
  if (isOrderFinished || !isOrderActualNow) return null;

  const distanceText =
    Number.isFinite(Number(remainingDistance)) && pendingTask?.title
      ? `${remainingDistance} км до пункту ${pendingTask.title}`
      : "N/A";

  const durationText = Number.isFinite(Number(remainingDuration))
    ? (Number(remainingDuration) / 60).toFixed(1) + " годин"
    : "N/A";

  return (
    // <div className={`order-details__content-row ${style || ""}`}>
    <div className="order-details__content-row-block">
      <div className="order-details__route">
        <div className="order-details__route_title">Місцезнаходження авто</div>
        <div className="order-details__route_distance">
          <span>Відстань: {distanceText}</span>
          <br />
          <span>Час в дорозі: {durationText}</span>
        </div>
      </div>
    </div>
    // </div>
  );
};

export default TruckLocationComponent;
