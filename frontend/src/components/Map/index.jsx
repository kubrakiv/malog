import React, { useCallback, useRef, useEffect } from "react";
import { GoogleMap, Marker, DirectionsRenderer } from "@react-google-maps/api";
import { useSelector } from "react-redux";

import { DELIVERY_CONSTANTS } from "../../constants/global";
const { LOADING, UNLOADING } = DELIVERY_CONSTANTS;

// import { defaultTheme } from "./Theme";
// import { CurrentLocationMarker } from "../CurrentLocationMarker";

const containerStyle = {
  width: "100%",
  height: "100%",
  minHeight: "220px",
};

const defaultOptions = {
  streetViewControl: false,
  // mapTypeControl: false,
  disableDoubleClickZoom: true,
  rotateControl: false,
  keyboardShortcuts: false,
  //   styles: defaultTheme,
};

const isValidCoordinates = (value) => {
  if (!value) return false;

  const lat = Number(value.lat);
  const lng = Number(value.lng);

  return Number.isFinite(lat) && Number.isFinite(lng);
};

const toCoordinates = (value) => ({
  lat: Number(value.lat),
  lng: Number(value.lng),
});

const resolveCenter = (propCenter, currentLocation, defaultCenter) => {
  if (isValidCoordinates(propCenter)) return toCoordinates(propCenter);
  if (isValidCoordinates(currentLocation))
    return toCoordinates(currentLocation);
  if (isValidCoordinates(defaultCenter)) return toCoordinates(defaultCenter);
  return null;
};

const Map = ({
  tasks,
  directionsResponse,
  truckDirectionsResponse,
  truck,
  center: propCenter,
}) => {
  console.log("Truck", truck);
  const mapRef = useRef(undefined);
  const currentLocation = useSelector((state) => state.map.currentLocation);
  const defaultCenter = useSelector((state) => state.map.defaultCenter);
  const truckLocation = useSelector((state) => state.map.truckLocation);
  const center = resolveCenter(propCenter, currentLocation, defaultCenter);

  const loadingIcon = "http://maps.google.com/mapfiles/ms/icons/green-dot.png"; // Green icon for loading
  const unloadingIcon = "http://maps.google.com/mapfiles/ms/icons/red-dot.png"; // Red icon for unloading
  // const truckIcon = "http://maps.google.com/mapfiles/ms/icons/truck.png"; // Icon for truck marker
  const truckIcon = "https://maps.gstatic.com/mapfiles/ms2/micons/truck.png"; // Icon for truck marker

  const onLoad = useCallback(
    function callback(map) {
      mapRef.current = map;
      if (center) {
        map.panTo(center);
      }
    },
    [center],
  );

  const onUnmount = useCallback(function callback(map) {
    mapRef.current = undefined;
  }, []);

  useEffect(() => {
    if (mapRef.current && center) {
      mapRef.current.panTo(center);
    }
  }, [center]);

  if (!center) {
    return null;
  }

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={15}
      onLoad={onLoad}
      onUnmount={onUnmount}
      options={defaultOptions}
    >
      {tasks ? (
        tasks.map((task) => {
          const position = {
            lat: parseFloat(task.point_details.gps_latitude),
            lng: parseFloat(task.point_details.gps_longitude),
          };

          const icon =
            task.type === LOADING
              ? loadingIcon
              : task.type === UNLOADING
                ? unloadingIcon
                : loadingIcon;

          const title =
            (task && task.point_details.company_name + ": " + task.title) ||
            (tasks &&
              task.point_details.company_name +
                ": " +
                task.point_details.country_short +
                "-" +
                task.point_details.postal_code +
                " " +
                task.point_details.city);

          return (
            <Marker
              key={task.id}
              position={position}
              icon={icon}
              title={title}
            />
          );
        })
      ) : center ? (
        <Marker position={center} />
      ) : null}
      {/* Add truck marker */}
      {truckLocation && (
        <Marker
          position={{
            lat: parseFloat(truckLocation.lat),
            lng: parseFloat(truckLocation.lng),
          }}
          icon={truckIcon}
          title={`Truck ${truck?.plates}`}
        />
      )}
      {/* Directions for order */}
      {directionsResponse && (
        <DirectionsRenderer
          directions={directionsResponse}
          options={{ suppressMarkers: true }}
        />
      )}
      {/* Directions for truck route with green polyline */}
      {truckDirectionsResponse && (
        <DirectionsRenderer
          directions={truckDirectionsResponse}
          options={{
            polylineOptions: {
              strokeColor: "green",
              strokeWeight: 5,
            },
            suppressMarkers: true,
          }}
        />
      )}
    </GoogleMap>
  );
};

export default React.memo(Map);
