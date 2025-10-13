import { useCallback, useMemo, useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useJsApiLoader, DirectionsService } from "@react-google-maps/api";
import { selectShowTruckOnMapModal } from "../../../features/planner/plannerSelectors";
import cn from "classnames";

import Map from "../../../components/Map";

import { DELIVERY_CONSTANTS } from "../../../constants/global";
const { LOADING, UNLOADING } = DELIVERY_CONSTANTS;

const { REACT_APP_API_KEY: API_KEY } = import.meta.env;

const OrderMapComponent = () => {
  const map = useSelector((state) => state.map);
  const truck = useSelector((state) => state.map.truck);
  const tasks = useSelector(
    (state) => state.ordersInfo.orderDetails.data.tasks
  );
  const defaultCenter = useSelector((state) => state.map.defaultCenter);
  const truckLocation = useSelector((state) => state.map.truckLocation);
  const showTruckOnMapModal = useSelector(selectShowTruckOnMapModal);

  const [center, setCenter] = useState(null);
  const [directionsResponse, setDirectionsResponse] = useState(null);
  const [truckDirectionsResponse, setTruckDirectionsResponse] = useState(null);

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: API_KEY,
    libraries: map.libraries,
  });

  useEffect(() => {
    if (defaultCenter) {
      setCenter(defaultCenter);
    }
  }, [defaultCenter]);

  // Determine if the order is finished
  const isOrderFinished = tasks?.every(
    (task) =>
      (task.type === LOADING || task.type === UNLOADING) &&
      task.end_date &&
      task.end_time
  );

  console.log("Is order finished:", isOrderFinished);

  const directionsServiceOptions = useMemo(() => {
    if (!tasks || tasks.length === 0) {
      return null;
    }

    const originLat = parseFloat(tasks[0].point_details.gps_latitude);
    const originLng = parseFloat(tasks[0].point_details.gps_longitude);
    const destinationLat = parseFloat(
      tasks[tasks.length - 1].point_details.gps_latitude
    );
    const destinationLng = parseFloat(
      tasks[tasks.length - 1].point_details.gps_longitude
    );

    if (
      isNaN(originLat) ||
      isNaN(originLng) ||
      isNaN(destinationLat) ||
      isNaN(destinationLng)
    ) {
      console.error("Invalid origin or destination coordinates.");
      return null;
    }

    const origin = {
      lat: originLat,
      lng: originLng,
    };
    const destination = {
      lat: destinationLat,
      lng: destinationLng,
    };

    const waypoints =
      tasks &&
      tasks
        .slice(1, -1)
        .map((task) => {
          const waypointLat = parseFloat(task.point_details.gps_latitude);
          const waypointLng = parseFloat(task.point_details.gps_longitude);

          if (isNaN(waypointLat) || isNaN(waypointLng)) {
            console.warn("Invalid waypoint coordinates for task:", task);
            return null;
          }

          return {
            location: { lat: waypointLat, lng: waypointLng },
            stopover: true,
          };
        })
        .filter((waypoint) => waypoint !== null); // Filter out invalid waypoints

    return {
      origin,
      destination,
      travelMode: "DRIVING",
      waypoints,
    };
  }, [tasks]);

  // Truck route options
  const truckDirectionsServiceOptions = useMemo(() => {
    if (isOrderFinished || !truckLocation || !tasks || tasks.length === 0) {
      return null;
    }

    console.log("Truck coordinates:", truckLocation);

    const originLat = parseFloat(truckLocation.lat);
    const originLng = parseFloat(truckLocation.lng);

    if (isNaN(originLat) || isNaN(originLng)) {
      console.error("Invalid truck origin coordinates.");
      return null;
    }

    const pendingTask = tasks.find(
      (task) =>
        (task.type === LOADING && !(task.end_date && task.end_time)) ||
        (task.type === UNLOADING && !(task.end_date && task.end_time))
    );

    // If there is no pending task, return null
    if (!pendingTask) {
      console.log("No pending tasks found.");
      return null;
    }

    if (
      !pendingTask?.point_details?.gps_latitude ||
      !pendingTask?.point_details?.gps_longitude
    ) {
      console.error("Invalid pending task coordinates.");
      return null;
    }

    const destinationLat = parseFloat(pendingTask.point_details.gps_latitude);
    const destinationLng = parseFloat(pendingTask.point_details.gps_longitude);

    if (isNaN(destinationLat) || isNaN(destinationLng)) {
      console.error("Invalid destination coordinates for pending task.");
      return null;
    }

    const origin = {
      lat: originLat,
      lng: originLng,
    };
    const destination = {
      lat: destinationLat,
      lng: destinationLng,
    };

    return {
      origin,
      destination,
      travelMode: "DRIVING",
    };
  }, [truckLocation, tasks, isOrderFinished]);

  const directionsCallback = useCallback(
    (response) => {
      if (response !== null) {
        if (response.status === "OK") {
          setDirectionsResponse(response);
        } else {
          console.log("response: ", response);
        }
      }
    },
    [setDirectionsResponse]
  );

  const truckDirectionsCallback = useCallback(
    (response) => {
      if (response !== null && response.status === "OK") {
        setTruckDirectionsResponse(response);
      }
    },
    [setTruckDirectionsResponse]
  );

  return (
    <div className="order-details__content-row">
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
        {isLoaded && directionsServiceOptions ? (
          <>
            {directionsServiceOptions && (
              <DirectionsService
                options={directionsServiceOptions}
                callback={directionsCallback}
              />
            )}

            {/* DirectionsService for Truck Route (conditionally rendered) */}
            {!isOrderFinished && truckDirectionsServiceOptions && (
              <DirectionsService
                options={truckDirectionsServiceOptions}
                callback={truckDirectionsCallback}
              />
            )}
            <Map
              tasks={tasks}
              center={center}
              directionsResponse={directionsResponse}
              truckDirectionsResponse={
                !isOrderFinished && truckLocation
                  ? truckDirectionsResponse
                  : null
              }
              truck={!isOrderFinished ? truck : null}
            />
          </>
        ) : (
          <h2>Loading...</h2>
        )}
      </div>
    </div>
  );
};

export default OrderMapComponent;
