import React, { useEffect, useMemo, useRef, useState } from "react";
import { DELIVERY_CONSTANTS } from "../../constants/global";
import "./style.scss";

import { buildFactualCoordsFromRuptela } from "../../services/buildFactualCoordsFromRuptela";

const { START, LOADING, UNLOADING } = DELIVERY_CONSTANTS;

// Check if HERE Maps API is loaded
const isHereMapsLoaded = () => {
  return (
    typeof window !== "undefined" &&
    window.H &&
    window.H.map &&
    window.H.service &&
    window.H.mapevents
  );
};

const TruckRouteMapComponent = ({
  points = [],
  onRouteData,
  truckPosition,
  isOrderFinished,
  isOrderActualNow,
  ruptelaTrips = [],
}) => {
  console.log("RUPTELA TRIPS", ruptelaTrips);
  // Track if HERE Maps is loaded
  const [hereMapsReady, setHereMapsReady] = useState(isHereMapsLoaded());

  // ---- DOM refs
  const wrapperRef = useRef(null);
  const containerRef = useRef(null);

  // ---- HERE refs (init once)
  const mapRef = useRef(null);
  const uiRef = useRef(null);
  const routerRef = useRef(null);

  // ---- Layer groups (add once, update contents)
  const routeGroupRef = useRef(null);
  const markersGroupRef = useRef(null);
  const truckGroupRef = useRef(null);
  const factualGroupRef = useRef(null);

  // Initialize group refs after HERE Maps is loaded
  useEffect(() => {
    if (hereMapsReady && window.H) {
      if (!routeGroupRef.current)
        routeGroupRef.current = new window.H.map.Group();
      if (!markersGroupRef.current)
        markersGroupRef.current = new window.H.map.Group();
      if (!truckGroupRef.current)
        truckGroupRef.current = new window.H.map.Group();
      if (!factualGroupRef.current)
        factualGroupRef.current = new window.H.map.Group();
    }
  }, [hereMapsReady]);

  // -------- helpers ---------------------------------------------------------
  const pendingPoint = useMemo(
    () =>
      points.find(
        (p) =>
          (p.type === LOADING && !(p.end_date && p.end_time)) ||
          (p.type === UNLOADING && !(p.end_date && p.end_time))
      ),
    [JSON.stringify(points)]
  );

  const sumActualDistanceKm = (trips) => {
    const m = trips.reduce((acc, t) => acc + (Number(t?.mileage) || 0), 0);
    return (m / 1000).toFixed(0);
  };

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

  // --- Check if HERE Maps scripts are loaded, if not wait for them ---
  useEffect(() => {
    const checkHereMapsLoaded = () => {
      if (isHereMapsLoaded()) {
        setHereMapsReady(true);
        clearInterval(checkInterval);
      }
    };

    // If not loaded yet, set an interval to check
    if (!hereMapsReady) {
      const checkInterval = setInterval(checkHereMapsLoaded, 100);
      return () => clearInterval(checkInterval);
    }
  }, [hereMapsReady]);

  // --- ONE unified init effect (works for page AND modal) ---
  useEffect(() => {
    if (!containerRef.current || mapRef.current || !hereMapsReady || !window.H)
      return;

    const el = containerRef.current;

    const doInit = () => {
      if (mapRef.current) return;

      const apiKey =
        import.meta.env.VITE_HERE_API_KEY ||
        import.meta.env.REACT_APP_HERE_API_KEY;

      try {
        const platform = new window.H.service.Platform({ apikey: apiKey });
        const layers = platform.createDefaultLayers();
        const map = new window.H.Map(el, layers.vector.normal.map, {
          pixelRatio: window.devicePixelRatio || 1,
        });
        mapRef.current = map;

        new window.H.mapevents.Behavior(new window.H.mapevents.MapEvents(map));
        uiRef.current = window.H.ui.UI.createDefault(map, layers);
        routerRef.current = platform.getRoutingService(null, 8);
      } catch (error) {
        console.error("Error initializing HERE Maps:", error);
        return;
      }

      // Make sure all group refs are initialized before adding them to the map
      if (
        routeGroupRef.current &&
        markersGroupRef.current &&
        truckGroupRef.current &&
        factualGroupRef.current
      ) {
        map.addObjects([
          routeGroupRef.current,
          markersGroupRef.current,
          truckGroupRef.current,
          factualGroupRef.current,
        ]);
      }

      const resize = () => map.getViewPort().resize();
      window.addEventListener("resize", resize);

      // kick the renderer once the DOM paints
      requestAnimationFrame(() => {
        map.getViewPort().resize();
        // map.renderSync();
      });

      // keep a cleanup
      el.__cleanup__ = () => {
        window.removeEventListener("resize", resize);
        if (map) {
          map.dispose();
        }
        mapRef.current = null;
      };
    };

    // If we already have size (OrderPage), init right away
    const { width, height } = el.getBoundingClientRect();
    if (width > 0 && height > 0) {
      doInit();
    } else {
      // Otherwise wait until it becomes visible (Modal)
      const ro = new ResizeObserver((entries) => {
        const { width, height } = entries[0].contentRect;
        if (width > 0 && height > 0 && hereMapsReady) {
          ro.disconnect();
          doInit();
        }
        // When size changes after init (e.g., modal animation), ensure render + optional refit
        if (mapRef.current && width > 0 && height > 0) {
          mapRef.current.getViewPort().resize();
          // mapRef.current.renderSync();
          if (markersGroupRef.current) {
            const bounds = markersGroupRef.current.getBoundingBox();
            if (bounds) {
              mapRef.current
                .getViewModel()
                .setLookAtData({ bounds, padding: 150 });
            }
          }
        }
      });
      ro.observe(el);
      el.__ro__ = ro;
    }

    return () => {
      // cleanup both cases
      el.__ro__?.disconnect();
      el.__cleanup__?.();
    };
  }, []);

  // -------- planned route + markers -----------------------------------------
  useEffect(() => {
    const map = mapRef.current;
    const router = routerRef.current;
    if (!map || !router) return;
    if (!points || points.length < 2) {
      routeGroupRef.current.removeAll();
      markersGroupRef.current.removeAll();
      return;
    }

    // clear previous
    routeGroupRef.current.removeAll();
    markersGroupRef.current.removeAll();

    const origin = `${points[0].lat},${points[0].lng}`;
    const destination = `${points.at(-1).lat},${points.at(-1).lng}`;
    const via = points.slice(1, -1).map((p) => `${p.lat},${p.lng}`);

    const params = {
      origin,
      destination,
      transportMode: "truck",
      return: "polyline,summary,tolls",
      currency: "EUR",
      "vehicle[emissionType]": "euro_6",
      "vehicle[height]": "3800",
      "vehicle[width]": "2500",
      "vehicle[length]": "16500",
      "vehicle[weight]": "40000",
      "vehicle[axleCount]": "6",
      "exclude[countries]": "CHE",
    };
    if (via.length && window.H) {
      params.via = new window.H.service.Url.MultiValueQueryParameter(via);
    }

    router.calculateRoute(
      params,
      (result) => {
        if (!result?.routes?.length) return;
        const route = result.routes[0];

        let totalLength = 0;
        let totalDuration = 0;
        let emptyDistance = 0;

        route.sections.forEach((section, index) => {
          const line = window.H.geo.LineString.fromFlexiblePolyline(
            section.polyline
          );
          const poly = new window.H.map.Polyline(line, {
            style: { lineWidth: 5 },
          });
          routeGroupRef.current.addObject(poly);

          if (index === 0) {
            const firstLoading = points.find((p) => p.type === LOADING);
            const arriv = section.arrival?.place?.location;
            if (
              firstLoading &&
              arriv &&
              Math.abs(arriv.lat - firstLoading.lat) < 0.01 &&
              Math.abs(arriv.lng - firstLoading.lng) < 0.01
            ) {
              emptyDistance = section.summary.length;
            }
          }

          totalLength += section.summary.length;
          totalDuration += section.summary.duration;
        });

        // markers
        const ui = uiRef.current;
        points.forEach((point, idx) => {
          const icon = new window.H.map.Icon(iconSvg(point));
          const marker = new window.H.map.Marker(
            { lat: point.lat, lng: point.lng },
            { icon }
          );
          marker.setData(point.label || `${idx + 1}: ${point.type}`);
          marker.addEventListener("tap", (evt) => {
            const bubble = new window.H.ui.InfoBubble(
              evt.target.getGeometry(),
              {
                content: evt.target.getData(),
              }
            );
            ui.addBubble(bubble);
          });
          markersGroupRef.current.addObject(marker);
        });

        // fit bounds
        const bounds = markersGroupRef.current.getBoundingBox();
        if (bounds) {
          map.getViewModel().setLookAtData({ bounds, padding: 150 });
          map.setZoom(5);
        }

        // tolls aggregation - improved logic to handle currency conversion properly
        const tolls = route.sections.flatMap((s) => s.tolls || []);

        // DEBUG: Log raw HERE API tolls response
        console.log("=== RAW HERE API TOLLS RESPONSE ===");
        console.log("Raw tolls array:", tolls);
        tolls.forEach((toll, index) => {
          console.log(`Toll ${index}:`, {
            countryCode: toll.countryCode,
            fares: toll.fares?.map((fare) => ({
              price: fare.price,
              convertedPrice: fare.convertedPrice,
              currency: fare.price?.currency,
              value: fare.price?.value,
            })),
          });
        });

        const tollByCountry = {};
        let totalTollEUR = 0;

        tolls.forEach((toll) => {
          const country = toll.countryCode;
          toll.fares.forEach((fare) => {
            // Use convertedPrice in EUR if available, otherwise fall back to original price
            const price = fare.convertedPrice || fare.price || {};
            const { value = 0, currency = "UNKNOWN" } = price;

            // DEBUG: Log each fare processing
            console.log(
              `Processing fare: Country=${country}, Value=${value}, Currency=${currency}`
            );
            console.log(`Original price:`, fare.price);
            console.log(`Converted price:`, fare.convertedPrice);

            // Check if we're using EUR
            if (currency !== "EUR") {
              console.warn(
                `⚠️  WARNING: Expected EUR but got ${currency} for country ${country}!`
              );
            }

            tollByCountry[country] = (tollByCountry[country] || 0) + value;
            totalTollEUR += value;
          });
        });

        // DEBUG: Log processed tolls
        console.log("=== PROCESSED TOLLS ===");
        console.log("Toll by country:", tollByCountry);
        console.log("Total toll EUR:", totalTollEUR);

        const plannedKm = (totalLength / 1000).toFixed(0);
        const plannedHr = (totalDuration / 3600).toFixed(2);
        const emptyKm = (emptyDistance / 1000).toFixed(0);

        onRouteData?.({
          distance: plannedKm,
          duration: plannedHr,
          emptyDistance: emptyKm,
          tollData: {
            byCountry: Object.entries(tollByCountry).map(
              ([country, value]) => ({
                country,
                value: value.toFixed(2),
              })
            ),
            totalEUR: totalTollEUR.toFixed(2),
            // Keep legacy format for compatibility
            totalByCurrency: [
              { currency: "EUR", value: totalTollEUR.toFixed(2) },
            ],
          },
        });
      },
      (err) => console.error("Route error", err)
    );
  }, [JSON.stringify(points)]);

  // -------- truck -> next leg (live) ----------------------------------------
  useEffect(() => {
    const map = mapRef.current;
    const router = routerRef.current;
    if (!map || !router) return;

    truckGroupRef.current.removeAll();

    if (truckPosition && pendingPoint && !isOrderFinished && isOrderActualNow) {
      const params = {
        origin: `${truckPosition.lat},${truckPosition.lng}`,
        destination: `${pendingPoint.lat},${pendingPoint.lng}`,
        transportMode: "truck",
        return: "polyline,summary",
        currency: "EUR",
        "vehicle[emissionType]": "euro_6",
        "vehicle[height]": "3800",
        "vehicle[width]": "2500",
        "vehicle[length]": "16500",
        "vehicle[weight]": "40000",
        "vehicle[axleCount]": "6",
        "exclude[countries]": "CHE",
      };

      router.calculateRoute(
        params,
        (result) => {
          const section = result?.routes?.[0]?.sections?.[0];
          if (!section) return;

          const line = window.H.geo.LineString.fromFlexiblePolyline(
            section.polyline
          );
          const truckLine = new window.H.map.Polyline(line, {
            style: { lineWidth: 4, strokeColor: "#FDA000" },
          });
          truckLine.setZIndex(2);
          truckGroupRef.current.addObject(truckLine);

          const truckIcon = new window.H.map.Icon(
            "https://img.icons8.com/?size=100&id=LKFOJdUZXTkd&format=png&color=C50000",
            { size: { w: 36, h: 36 }, anchor: { x: 18, y: 18 } }
          );
          const truckMarker = new window.H.map.Marker(truckPosition, {
            icon: truckIcon,
          });
          truckMarker.setZIndex(3);
          truckGroupRef.current.addObject(truckMarker);

          onRouteData?.({
            truckToNextPoint: {
              distance: (section.summary.length / 1000).toFixed(0),
              duration: (section.summary.duration / 60).toFixed(0), // minutes
            },
          });
        },
        (err) => console.error("Truck-to-next route error", err)
      );
    }
  }, [
    truckPosition?.lat,
    truckPosition?.lng,
    pendingPoint?.lat,
    pendingPoint?.lng,
    isOrderFinished,
    isOrderActualNow,
  ]);

  // -------- factual path (ruptela) ------------------------------------------
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !window.H) return;

    if (!factualGroupRef.current) {
      factualGroupRef.current = new window.H.map.Group();
      map.addObject(factualGroupRef.current);
    }

    factualGroupRef.current.removeAll();

    if (!ruptelaTrips?.length) return;

    const coords = buildFactualCoordsFromRuptela(ruptelaTrips);
    if (coords.length < 2) return;

    const ls = new window.H.geo.LineString();
    coords.forEach((c) => ls.pushLatLngAlt(c.lat, c.lng, 0));

    const factualLine = new window.H.map.Polyline(ls, {
      style: { lineWidth: 4, strokeColor: "#DC3545" },
    });
    factualLine.setZIndex(1);
    factualGroupRef.current.addObject(factualLine);

    // start/end pins
    const startPin = new window.H.map.Marker(coords[0], {
      icon: new window.H.map.Icon(
        '<svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="6" fill="#8E44AD"/></svg>'
      ),
    });
    const endPin = new window.H.map.Marker(coords.at(-1), {
      icon: new window.H.map.Icon(
        '<svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><rect x="6" y="6" width="12" height="12" fill="#8E44AD"/></svg>'
      ),
    });
    factualGroupRef.current.addObjects([startPin, endPin]);

    // send factual metrics separately (parent merges)
    const factualKm = sumActualDistanceKm(ruptelaTrips);
    onRouteData?.({
      factual: {
        distance: factualKm,
        // delta will be computed in parent once planned distance arrives (optional)
      },
    });
  }, [JSON.stringify(ruptelaTrips)]);

  // -------- fullscreen toggle ------------------------------------------------
  const toggleFullscreen = () => {
    const el = wrapperRef.current;
    if (!el) return;
    if (!document.fullscreenElement) el.requestFullscreen?.();
    else document.exitFullscreen?.();
  };

  return (
    <div ref={wrapperRef} className="here-map-wrap">
      {hereMapsReady && (
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
      )}

      {!hereMapsReady && (
        <div
          className="here-map-loading"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            background: "#f5f5f5",
            fontSize: "16px",
            color: "#555",
          }}
        >
          <div>
            <div style={{ textAlign: "center", marginBottom: "10px" }}>
              Loading map resources...
            </div>
            <div style={{ textAlign: "center", fontSize: "14px" }}>
              Please ensure HERE Maps API is loaded.
            </div>
          </div>
        </div>
      )}

      <div ref={containerRef} className="here-map" />
    </div>
  );
};

export default React.memo(TruckRouteMapComponent);
