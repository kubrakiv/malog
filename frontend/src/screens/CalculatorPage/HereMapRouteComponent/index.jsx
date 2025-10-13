import React, { useEffect, useRef } from "react";
import { DELIVERY_CONSTANTS } from "../../../constants/global";
const { START, LOADING, UNLOADING } = DELIVERY_CONSTANTS;

const HereMapRouteComponent = ({ points, onRouteData, routeInfo }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  const prevDataRef = useRef({
    points: null,
  });

  // Initialize map on component mount
  useEffect(() => {
    if (mapInstanceRef.current) return; // Map already initialized

    const platform = new H.service.Platform({
      apikey: import.meta.env.REACT_APP_HERE_API_KEY,
    });

    const defaultLayers = platform.createDefaultLayers();
    const map = new H.Map(mapRef.current, defaultLayers.vector.normal.map, {
      pixelRatio: window.devicePixelRatio || 1,
      center: { lat: 50.0755, lng: 14.4378 }, // Prague as default center
      zoom: 6, // Show Europe
    });

    new H.mapevents.Behavior(new H.mapevents.MapEvents(map));
    const ui = H.ui.UI.createDefault(map, defaultLayers);

    const handleResize = () => {
      map.getViewPort().resize();
    };
    window.addEventListener("resize", handleResize);

    mapInstanceRef.current = map;
    // Ensure initial sizing
    map.getViewPort().resize();
    setTimeout(() => map.getViewPort().resize(), 0);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.dispose();
        mapInstanceRef.current = null;
      }
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Function to visualize selected route without API calculation
  const visualizeSelectedRoute = (map, points, routeInfo) => {
    console.log("Visualizing selected route:", { points, routeInfo });

    // Add markers for all points with type-specific icons
    points.forEach((point, index) => {
      const iconSvg = (point) => {
        // Convert to lowercase to match backend values
        const pointType = point.type ? point.type.toLowerCase() : "unknown";

        switch (pointType) {
          case "loading":
            return (
              '<svg width="36" height="36" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">' +
              '<path fill="#28a745" d="M12 2C8.13 2 5 5.13 5 9c0 4.97 7 13 7 13s7-8.03 7-13c0-3.87-3.13-7-7-7z"/>' +
              '<circle cx="12" cy="9" r="4" fill="#FFFFFF"/></svg>'
            );
          case "unloading":
            return (
              '<svg width="36" height="36" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">' +
              '<path fill="#dc3545" d="M12 2C8.13 2 5 5.13 5 9c0 4.97 7 13 7 13s7-8.03 7-13c0-3.87-3.13-7-7-7z"/>' +
              '<circle cx="12" cy="9" r="4" fill="#FFFFFF"/></svg>'
            );
          case "start":
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

      // Create info bubble
      const bubble = new H.ui.InfoBubble(
        { lat: point.lat, lng: point.lng },
        {
          content: `<div style="padding: 8px;">
            <strong>${point.type} Point</strong><br/>
            ${point.label}<br/>
            <small>${point.lat.toFixed(4)}, ${point.lng.toFixed(4)}</small>
          </div>`,
        }
      );

      map.addObject(marker);
      map.addObject(bubble);
    });

    // Create a simple polyline connecting the points
    const routeLine = new H.map.Polyline(new H.geo.LineString(), {
      style: {
        lineWidth: 4,
        strokeColor: "#007bff",
      },
    });

    // Add points to the polyline
    points.forEach((point) => {
      routeLine.getGeometry().pushPoint({
        lat: point.lat,
        lng: point.lng,
      });
    });

    map.addObject(routeLine);

    // Fit map to show all points
    const group = new H.map.Group();
    points.forEach((point) => {
      group.addObject(
        new H.map.Marker({
          lat: point.lat,
          lng: point.lng,
        })
      );
    });

    map.getViewModel().setLookAtData({
      bounds: group.getBoundingBox(),
    });
  };

  // Handle route calculation when points change
  useEffect(() => {
    if (!points || points.length < 2 || !mapInstanceRef.current) return;

    const samePoints =
      JSON.stringify(prevDataRef.current.points) === JSON.stringify(points);

    if (samePoints) {
      return; // ✅ Avoid re-render logic
    }

    // Store current values for next comparison
    prevDataRef.current = { points };

    const map = mapInstanceRef.current;

    // Clear existing map objects
    map.removeObjects(map.getObjects());

    // If routeInfo is provided (selected route), visualize it directly without API call
    console.log("Route info check:", {
      routeInfo,
      hasDistance: routeInfo?.distance,
      distanceValue: routeInfo?.distance,
    });
    if (routeInfo && routeInfo.distance && routeInfo.distance !== "0") {
      console.log("Calling visualizeSelectedRoute");
      visualizeSelectedRoute(map, points, routeInfo);
      return;
    }

    const platform = new H.service.Platform({
      apikey: import.meta.env.REACT_APP_HERE_API_KEY,
    });

    const defaultLayers = platform.createDefaultLayers();
    const ui = H.ui.UI.createDefault(map, defaultLayers);

    const router = platform.getRoutingService(null, 8);

    // Determine origin and destination based on point types
    let origin, destination, waypoints;

    // Find start point if it exists
    const startPoint = points.find((p) => p.type === START);

    if (startPoint) {
      // If we have a start point, use it as origin
      origin = `${startPoint.lat},${startPoint.lng}`;

      // Find the last point (destination)
      const lastPoint = points[points.length - 1];
      destination = `${lastPoint.lat},${lastPoint.lng}`;

      // All other points are waypoints
      waypoints = points
        .filter((p) => p !== startPoint && p !== lastPoint)
        .map((p) => `${p.lat},${p.lng}`);
    } else {
      // No start point - use first point as origin, last as destination
      origin = `${points[0].lat},${points[0].lng}`;
      destination = `${points[points.length - 1].lat},${
        points[points.length - 1].lng
      }`;
      waypoints = points.slice(1, -1).map((p) => `${p.lat},${p.lng}`);
    }

    const routingParams = {
      origin,
      destination,
      transportMode: "truck",
      spans: "countryCode,length",
      currency: "EUR",
      return: "polyline,summary,tolls",
      "vehicle[emissionType]": "euro_6",
      "vehicle[height]": "3800",
      "vehicle[width]": "2500",
      "vehicle[length]": "16500",
      "vehicle[weight]": "40000",
      "vehicle[axleCount]": "6",
      "exclude[countries]": "CHE",
    };

    if (waypoints.length > 0) {
      routingParams.via = new H.service.Url.MultiValueQueryParameter(waypoints);
    }

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

          // Calculate empty distance (from start to first loading point)
          if (index === 0) {
            const startPoint = points.find((p) => p.type === START);
            const firstLoading = points.find((p) => p.type === LOADING);

            // If we have a start point, calculate empty distance to first loading
            if (startPoint && firstLoading) {
              const match =
                section.arrival?.place?.location &&
                Math.abs(
                  section.arrival.place.location.lat - firstLoading.lat
                ) < 0.01 &&
                Math.abs(
                  section.arrival.place.location.lng - firstLoading.lng
                ) < 0.01;

              if (match) emptyDistance = section.summary.length;
            }
            // If no start point, empty distance is 0 (route starts at loading point)
          }

          totalLength += section.summary.length;
          totalDuration += section.summary.duration;
        });

        // Add Markers
        points.forEach((point, index) => {
          const iconSvg = (point) => {
            // Convert to lowercase to match backend values
            const pointType = point.type ? point.type.toLowerCase() : "unknown";

            switch (pointType) {
              case "loading":
                return (
                  '<svg width="36" height="36" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">' +
                  '<path fill="#28a745" d="M12 2C8.13 2 5 5.13 5 9c0 4.97 7 13 7 13s7-8.03 7-13c0-3.87-3.13-7-7-7z"/>' +
                  '<circle cx="12" cy="9" r="4" fill="#FFFFFF"/></svg>'
                );
              case "unloading":
                return (
                  '<svg width="36" height="36" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">' +
                  '<path fill="#dc3545" d="M12 2C8.13 2 5 5.13 5 9c0 4.97 7 13 7 13s7-8.03 7-13c0-3.87-3.13-7-7-7z"/>' +
                  '<circle cx="12" cy="9" r="4" fill="#FFFFFF"/></svg>'
                );
              case "start":
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
          padding: 50,
        });
        map.setZoom(5);

        const distanceByCountryM = {}; // meters per ISO-3 country

        route.sections.forEach((section) => {
          (section.spans || []).forEach((span) => {
            const cc = span.countryCode; // e.g., CZE, DEU, AUT, ITA
            const len = Number(span.length) || 0; // meters
            if (!cc) return;
            distanceByCountryM[cc] = (distanceByCountryM[cc] || 0) + len;
          });
        });

        // transform to [{ country:'CZE', km:'123.4' }, ...]
        const distanceByCountry = Object.entries(distanceByCountryM)
          .map(([country, meters]) => ({
            country,
            km: (meters / 1000).toFixed(1),
          }))
          .sort((a, b) => Number(b.km) - Number(a.km));

        // Process tolls data - DEBUG: Check if HERE API actually returns EUR
        const tolls = route.sections.flatMap((s) => s.tolls || []);

        // DEBUG: Log raw HERE API tolls response
        console.log("=== RAW HERE API TOLLS RESPONSE ===");
        console.log("Raw tolls array:", tolls);
        tolls.forEach((toll, index) => {
          console.log(`Toll ${index}:`, {
            countryCode: toll.countryCode,
            fares: toll.fares?.map((fare) => ({
              price: fare.price,
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

        // Create unified routeInfo object with country mapping
        const routeInfo = {
          distance: (totalLength / 1000).toFixed(0),
          duration: (totalDuration / 3600).toFixed(2),
          emptyDistance: (emptyDistance / 1000).toFixed(0),
          distanceByCountry, // [{ country: 'DEU', km: '523.4' }, ...]
          tollData: {
            byCountry: Object.entries(tollByCountry).map(
              ([country, value]) => ({
                country,
                value: value.toFixed(2),
              })
            ),
            totalEUR: totalTollEUR.toFixed(2),
          },
          // Combined country data for easy access
          countryData: distanceByCountry.map(({ country, km }) => ({
            country,
            distance: km,
            toll: tollByCountry[country]
              ? tollByCountry[country].toFixed(2)
              : "0.00",
          })),
        };

        // DEBUG: Log final routeInfo object
        console.log("=== FINAL ROUTE INFO OBJECT ===");
        console.log("Complete routeInfo:", routeInfo);
        console.log("TollData:", routeInfo.tollData);
        console.log("CountryData:", routeInfo.countryData);

        onRouteData(routeInfo);
      },
      (error) => {
        console.error("Route error", error);
      }
    );
  }, [points, onRouteData, routeInfo]);

  return <div ref={mapRef} style={{ width: "100%", height: "100%" }} />;
};

export default React.memo(HereMapRouteComponent);
