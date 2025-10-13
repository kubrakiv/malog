import React, { useEffect, useRef } from "react";
import { DELIVERY_CONSTANTS } from "../../constants/global";
const { START, LOADING, UNLOADING } = DELIVERY_CONSTANTS;
import "./style.scss";

const TruckRouteMapComponent = ({
  points,
  onRouteData,
  truckPosition,
  isOrderFinished,
  isOrderActualNow,
  ruptelaTrips = [],
}) => {
  const wrapperRef = useRef(null);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null); // keep map to resize on events

  const prevDataRef = useRef({
    points: null,
    truckPosition: null,
    isOrderFinished: null,
    isOrderActualNow: null,
    ruptelaTrips: null,
  });

  const pendingPoint = points.find(
    (point) =>
      (point.type === LOADING && !(point.end_date && point.end_time)) ||
      (point.type === UNLOADING && !(point.end_date && point.end_time))
  );

  // 👉 NEW: helpers for factual route
  const buildFactualCoordsFromRuptela = (trips) => {
    if (!Array.isArray(trips) || !trips.length) return [];

    // sort by start time to keep the path continuous
    const sorted = [...trips].sort(
      (a, b) =>
        new Date(a?.trip_start?.datetime) - new Date(b?.trip_start?.datetime)
    );

    // flatten start->end points into a chain
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
        // add start only if different from last added
        const last = coords[coords.length - 1];
        if (!last || last.lat !== sLat || last.lng !== sLng) {
          coords.push({ lat: sLat, lng: sLng });
        }
        coords.push({ lat: eLat, lng: eLng });
      }
    }

    // optional: remove micro‑jitter duplicates
    const deduped = [];
    const eps = 1e-5;
    for (const c of coords) {
      const last = deduped[deduped.length - 1];
      if (
        !last ||
        Math.abs(last.lat - c.lat) > eps ||
        Math.abs(last.lng - c.lng) > eps
      ) {
        deduped.push(c);
      }
    }
    return deduped;
  };

  const sumActualDistanceKm = (trips) => {
    // Ruptela mileage is usually in meters; guard against nulls
    const totalMeters = trips.reduce(
      (acc, t) => acc + (Number(t?.mileage) || 0),
      0
    );
    return (totalMeters / 1000).toFixed(0);
  };

  useEffect(() => {
    if (!points || points.length < 2) return;

    const samePoints =
      JSON.stringify(prevDataRef.current.points) === JSON.stringify(points);
    const sameTruck =
      JSON.stringify(prevDataRef.current.truckPosition) ===
      JSON.stringify(truckPosition);
    const sameFinished =
      prevDataRef.current.isOrderFinished === isOrderFinished;
    const sameActual =
      JSON.stringify(prevDataRef.current.isOrderActualNow) ===
      JSON.stringify(isOrderActualNow);
    const sameFactual =
      JSON.stringify(prevDataRef.current.ruptelaTrips) ===
      JSON.stringify(ruptelaTrips);

    if (samePoints && sameTruck && sameFinished && sameActual && sameFactual) {
      return;
    }

    // Store current values for next comparison
    prevDataRef.current = {
      points,
      truckPosition,
      isOrderFinished,
      ruptelaTrips,
    };

    const platform = new H.service.Platform({
      apikey: import.meta.env.REACT_APP_HERE_API_KEY,
    });

    const defaultLayers = platform.createDefaultLayers();

    const map = new H.Map(mapRef.current, defaultLayers.vector.normal.map, {
      pixelRatio: window.devicePixelRatio || 1,
    });
    mapInstanceRef.current = map;

    new H.mapevents.Behavior(new H.mapevents.MapEvents(map));

    const ui = H.ui.UI.createDefault(map, defaultLayers);

    const router = platform.getRoutingService(null, 8);

    const origin = `${points[0].lat},${points[0].lng}`;
    const destination = `${points[points.length - 1].lat},${
      points[points.length - 1].lng
    }`;
    const waypoints = points.slice(1, -1).map((p) => `${p.lat},${p.lng}`);

    const routingParams = {
      origin,
      destination,
      via: new H.service.Url.MultiValueQueryParameter(waypoints),
      transportMode: "truck",
      return: "polyline,summary,tolls",
      "vehicle[emissionType]": "euro_6",
      "vehicle[height]": "3800",
      "vehicle[width]": "2500",
      "vehicle[length]": "16500",
      "vehicle[weight]": "40000",
      "vehicle[axleCount]": "6",
      "exclude[countries]": "CHE",
    };

    // groups to fit bounds together
    const fitAllGroup = new H.map.Group();
    map.addObject(fitAllGroup);

    router.calculateRoute(
      routingParams,
      (result) => {
        if (!result.routes.length) return;
        const route = result.routes[0];

        let totalLength = 0,
          totalDuration = 0;
        let emptyDistance = 0;

        const markerGroup = new H.map.Group();

        route.sections.forEach((section, index) => {
          const poly = H.geo.LineString.fromFlexiblePolyline(section.polyline);
          const routeLine = new H.map.Polyline(poly, {
            style: { lineWidth: 5 },
          });
          map.addObject(routeLine);

          if (index === 0) {
            const firstLoading = points.find((p) => p.type === LOADING);
            const match =
              section.arrival?.place?.location &&
              Math.abs(section.arrival.place.location.lat - firstLoading.lat) <
                0.01 &&
              Math.abs(section.arrival.place.location.lng - firstLoading.lng) <
                0.01;

            if (match) emptyDistance = section.summary.length;
          }

          totalLength += section.summary.length;
          totalDuration += section.summary.duration;
        });

        // Add Markers
        points.forEach((point, index) => {
          const iconSvg = (point) => {
            switch (point.type) {
              case LOADING:
                return (
                  '<svg width="36" height="36" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">' +
                  '<path fill="#28a745" d="M12 2C8.13 2 5 5.13 5 9c0 4.97 7 13 7 13s7-8.03 7-13c0-3.87-3.13-7-7-7z"/>' +
                  '<circle cx="12" cy="9" r="4" fill="#FFFFFF"/></svg>'
                );
              case UNLOADING:
                return (
                  '<svg width="36" height="36" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">' +
                  '<path fill="#dc3545" d="M12 2C8.13 2 5 5.13 5 9c0 4.97 7 13 7 13s7-8.03 7-13c0-3.87-3.13-7-7-7z"/>' +
                  '<circle cx="12" cy="9" r="4" fill="#FFFFFF"/></svg>'
                );
              case START:
                return (
                  '<svg width="36" height="36" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">' +
                  '<path fill="#2D6AC4" d="M12 2C8.13 2 5 5.13 5 9c0 4.97 7 13 7 13s7-8.03 7-13c0-3.87-3.13-7-7-7z"/>' +
                  '<circle cx="12" cy="9" r="4" fill="#FFFFFF"/></svg>'
                );
              default:
                return (
                  '<svg width="36" height="36" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">' +
                  '<path fill="#6c757d" d="M12 2C8.13 2 5 5.13 5 9c0 4.97 7 13 7 13s7-8.03 7-13c0-3.87-3.13-7-7-7z"/>' +
                  '<circle cx="12" cy="9" r="4" fill="#FFFFFF"/></svg>'
                );
            }
          };

          const icon = new H.map.Icon(iconSvg(point));

          const marker = new H.map.Marker(
            { lat: point.lat, lng: point.lng },
            { icon }
          );

          marker.setData(point.label || `${index + 1}: ${point.type}`);
          marker.addEventListener("tap", (evt) => {
            const bubble = new H.ui.InfoBubble(evt.target.getGeometry(), {
              content: evt.target.getData(),
            });
            ui.addBubble(bubble);
          });

          markerGroup.addObject(marker);
        });

        map.addObject(markerGroup);
        map.getViewModel().setLookAtData({
          bounds: markerGroup.getBoundingBox(),
          padding: 150,
        });
        map.setZoom(5);

        const tolls = route.sections.flatMap((s) => s.tolls || []);
        const tollByCountry = {},
          totalByCurrency = {};

        tolls.forEach((toll) => {
          const country = toll.countryCode;
          toll.fares.forEach((fare) => {
            const { value = 0, currency = "EUR" } = fare.price || {};
            const converted = currency === "CZK" ? value / 25.185 : value;
            const finalCurrency = currency === "CZK" ? "EUR" : currency;

            tollByCountry[country] = tollByCountry[country] || {};
            tollByCountry[country][finalCurrency] =
              (tollByCountry[country][finalCurrency] || 0) + converted;

            totalByCurrency[finalCurrency] =
              (totalByCurrency[finalCurrency] || 0) + converted;
          });
        });

        // ---------- 👉 NEW: draw factual route from Ruptela ----------
        let factualKm = null;
        if (ruptelaTrips && ruptelaTrips.length) {
          const factualCoords = buildFactualCoordsFromRuptela(ruptelaTrips);
          if (factualCoords.length >= 2) {
            const ls = new H.geo.LineString();
            factualCoords.forEach((c) => ls.pushLatLngAlt(c.lat, c.lng, 0));

            const factualLine = new H.map.Polyline(ls, {
              style: {
                lineWidth: 4,
                strokeColor: "#DC3545", // red: factual path
              },
            });
            // make it draw above planned route but below the live "truck->next"
            factualLine.setZIndex(1);
            map.addObject(factualLine);
            fitAllGroup.addObject(factualLine);

            // optional: add pins for factual start/end
            const factualStart = factualCoords[0];
            const factualEnd = factualCoords[factualCoords.length - 1];
            const startPin = new H.map.Marker(factualStart, {
              icon: new H.map.Icon(
                '<svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="6" fill="#8E44AD"/></svg>'
              ),
            });
            const endPin = new H.map.Marker(factualEnd, {
              icon: new H.map.Icon(
                '<svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><rect x="6" y="6" width="12" height="12" fill="#8E44AD"/></svg>'
              ),
            });
            map.addObjects([startPin, endPin]);
            fitAllGroup.addObjects([startPin, endPin]);

            factualKm = sumActualDistanceKm(ruptelaTrips);
          }
        }

        const plannedKm = (totalLength / 1000).toFixed(0);
        const plannedHr = (totalDuration / 3600).toFixed(2);
        const emptyKm = (emptyDistance / 1000).toFixed(0);

        const payload = {
          distance: plannedKm,
          duration: plannedHr,
          emptyDistance: emptyKm,
          tollData: {
            byCountry: Object.entries(tollByCountry).flatMap(
              ([country, currencies]) =>
                Object.entries(currencies).map(([currency, value]) => ({
                  country,
                  currency,
                  value: value.toFixed(2),
                }))
            ),
            totalByCurrency: Object.entries(totalByCurrency).map(
              ([currency, value]) => ({
                currency,
                value: value.toFixed(2),
              })
            ),
          },
        };

        // add factual comparison if available
        if (factualKm !== null) {
          const deltaKm = (Number(factualKm) - Number(plannedKm)).toFixed(0);
          const pct =
            Number(plannedKm) > 0
              ? (
                  ((Number(factualKm) - Number(plannedKm)) /
                    Number(plannedKm)) *
                  100
                ).toFixed(1)
              : null;

          payload.factual = {
            distance: factualKm,
            deltaKm,
            deltaPct: pct,
          };
        }

        onRouteData(payload);
      },
      (error) => {
        console.error("Route error", error);
      }
    );

    if (truckPosition && pendingPoint && !isOrderFinished && isOrderActualNow) {
      console.log("TRUCKS ROUTE RENDERED");
      const truckRouterParams = {
        origin: `${truckPosition.lat},${truckPosition.lng}`,
        destination: `${pendingPoint.lat},${pendingPoint.lng}`,
        transportMode: "truck",
        return: "polyline,summary",
        "vehicle[emissionType]": "euro_6",
        "vehicle[height]": "3800",
        "vehicle[width]": "2500",
        "vehicle[length]": "16500",
        "vehicle[weight]": "40000",
        "vehicle[axleCount]": "6",
        "exclude[countries]": "CHE",
      };

      router.calculateRoute(
        truckRouterParams,
        (result) => {
          const section = result.routes?.[0]?.sections?.[0];
          if (section) {
            const truckLine = new H.map.Polyline(
              H.geo.LineString.fromFlexiblePolyline(section.polyline),
              {
                style: {
                  lineWidth: 4,
                  strokeColor: "#FDA000",
                },
              }
            );
            truckLine.setZIndex(1); // Set zIndex to ensure it's on top of the route
            map.addObject(truckLine);

            const truckDistance = (section.summary.length / 1000).toFixed(0);
            const truckDuration = (section.summary.duration / 60).toFixed(0); // in minutes

            console.log("Truck-to-next route data:", {
              distance: truckDistance,
              duration: truckDuration,
            });

            onRouteData({
              truckToNextPoint: {
                distance: truckDistance,
                duration: truckDuration,
              },
            });

            const truckIcon = new H.map.Icon(
              "https://img.icons8.com/?size=100&id=LKFOJdUZXTkd&format=png&color=C50000",
              {
                size: { w: 36, h: 36 },
                anchor: { x: 18, y: 18 },
              }
            );
            const truckMarker = new H.map.Marker(truckPosition, {
              icon: truckIcon,
            });
            truckMarker.setZIndex(2); // Set zIndex to ensure it's on top of the route
            map.addObject(truckMarker);
          }
        },
        (err) => console.error("Truck-to-next route error", err)
      );
    }

    // ---- Resize handling (window + fullscreen) ----
    const resize = () => map.getViewPort().resize();
    const onFsChange = () => setTimeout(resize, 0);
    window.addEventListener("resize", resize);
    document.addEventListener("fullscreenchange", onFsChange);
    document.addEventListener("webkitfullscreenchange", onFsChange); // Safari

    // Initial resize in case parent layout just mounted
    setTimeout(resize, 0);

    return () => {
      window.removeEventListener("resize", resize);
      document.removeEventListener("fullscreenchange", onFsChange);
      document.removeEventListener("webkitfullscreenchange", onFsChange);
      map.dispose();
      mapInstanceRef.current = null;
    };
  }, [points, truckPosition, isOrderFinished, ruptelaTrips]);

  // return <div ref={mapRef} style={{ width: "100%", height: "100%" }} />;

  const toggleFullscreen = () => {
    const el = wrapperRef.current;
    if (!el) return;
    if (!document.fullscreenElement) el.requestFullscreen?.();
    else document.exitFullscreen?.();
  };

  return (
    <div ref={wrapperRef} className="here-map-wrap">
      <button
        onClick={toggleFullscreen}
        style={{
          position: "absolute",
          zIndex: 10,
          right: 12,
          top: 12,
          padding: "8px 12px",
          borderRadius: 8,
          border: "1px solid #ddd",
          background: "#fff",
          cursor: "pointer",
        }}
        title="Toggle fullscreen"
      >
        ⛶ Fullscreen
      </button>
      <div ref={mapRef} className="here-map" />
    </div>
  );
};

export default React.memo(TruckRouteMapComponent);
