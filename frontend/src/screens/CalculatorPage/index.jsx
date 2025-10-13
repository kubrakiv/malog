import { useState, useMemo, useEffect, useContext } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import RouteInfoComponent from "../../components/RouteInfoComponent";
import RouteCalculationsTable from "../../components/RouteCalculationsTable";
import RouteInputForm from "../../components/RouteInputForm";
import HereMapRouteComponent from "./HereMapRouteComponent";
import OpenContext from "../../components/OpenContext";
import "./style.scss";

import { DELIVERY_CONSTANTS } from "../../constants/global";
const { START, LOADING, UNLOADING } = DELIVERY_CONSTANTS;

const CalculatorPage = () => {
  const { isSidebarOpen } = useContext(OpenContext);
  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;
  const [startPoint, setStartPoint] = useState("");
  const [loadingPoints, setLoadingPoints] = useState([""]);
  const [unloadingPoints, setUnloadingPoints] = useState([""]);
  const [routePrice, setRoutePrice] = useState("");
  const [selectedTruckParams, setSelectedTruckParams] = useState(null);
  const [truckParameters, setTruckParameters] = useState([]);

  const [routeFromInputs, setRouteFromInputs] = useState([]);
  const [routeInfo, setRouteInfo] = useState({});
  const [truckToNext, setTruckToNext] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [savedRouteId, setSavedRouteId] = useState(null);
  const [savedRoutes, setSavedRoutes] = useState([]);
  const [isLoadingRoutes, setIsLoadingRoutes] = useState(false);
  const [tableOverlayHeight, setTableOverlayHeight] = useState(0); // Height of table overlay in pixels
  const [isDragging, setIsDragging] = useState(false);
  const [selectedRouteId, setSelectedRouteId] = useState(null); // Track which route is selected for visualization

  const handleRouteData = (data) => {
    if (!data) return;
    setRouteInfo(data);
  };

  const handleClearForm = () => {
    setStartPoint("");
    setLoadingPoints([""]);
    setUnloadingPoints([""]);
    setRoutePrice("");
    setRouteInfo({});
    setRouteFromInputs([]);
    setSelectedRouteId(null);
    setTruckToNext(null);
    toast.success("Form cleared - ready for new calculation");
  };

  const handleSelectRoute = (route) => {
    // If clicking on the same route, deselect it
    if (selectedRouteId === route.id) {
      setSelectedRouteId(null);
      setRouteInfo({});
      setRouteFromInputs([]);
      toast.success(`Route ${route.id} deselected`);
      return;
    }

    setSelectedRouteId(route.id);

    // Extract route points from the saved route
    const routePoints = route.points || [];

    // Convert route points to the format expected by the map component
    const pointsForMap = routePoints.map((point) => ({
      lat: parseFloat(point.lat),
      lng: parseFloat(point.lng),
      type: point.point_type.toUpperCase(),
      label: point.label || `${point.point_type} Point`,
    }));

    // Set the route info for visualization (without recalculating costs)
    const visualizationRouteInfo = {
      distance: route.total_distance_km?.toString() || "0",
      duration: route.total_duration_h?.toString() || "0",
      emptyDistance: route.empty_distance_km?.toString() || "0",
      loadedDistance: route.loaded_distance_km?.toString() || "0",
      tollData: {
        byCountry:
          route.tolls?.map((toll) => ({
            country: toll.country,
            value: toll.amount?.toString() || "0",
          })) || [],
        totalEUR: route.toll_cost?.toString() || "0",
      },
      countryData:
        route.tolls?.map((toll) => ({
          country: toll.country,
          distance: toll.distance_km?.toString() || "0",
          toll: toll.amount?.toString() || "0",
        })) || [],
    };

    // Update the route info for visualization
    setRouteInfo(visualizationRouteInfo);

    // Update the map component with the selected route points
    // We'll pass this to the HereMapRouteComponent
    setRouteFromInputs(pointsForMap);

    toast.success(`Route ${route.id} selected for visualization`);
  };

  // Drag handlers for resizing table
  const handleMouseDown = (e) => {
    setIsDragging(true);
    e.preventDefault();
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;

    const pageHeight = window.innerHeight;
    const newOverlayHeight = pageHeight - e.clientY;
    const minHeight = 0; // No overlay
    const maxHeight = pageHeight - 100; // Leave minimal space for main layout

    // Allow dragging down to reduce height
    if (newOverlayHeight >= minHeight && newOverlayHeight <= maxHeight) {
      setTableOverlayHeight(newOverlayHeight);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleDoubleClick = () => {
    // Toggle between no overlay and 50% screen height overlay
    if (tableOverlayHeight === 0) {
      setTableOverlayHeight(window.innerHeight * 0.5);
    } else {
      setTableOverlayHeight(0);
    }
  };

  // Add event listeners for mouse events
  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "ns-resize";
      document.body.style.userSelect = "none";
    } else {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isDragging]);

  // Fetch truck parameters on component mount
  useEffect(() => {
    const fetchTruckParameters = async () => {
      try {
        const response = await fetch("/api/route_calculator/truck-parameters/");
        if (response.ok) {
          const data = await response.json();
          setTruckParameters(data);
          // Set default truck parameters if available
          const defaultTruck = data.find((truck) => truck.is_default);
          if (defaultTruck) {
            setSelectedTruckParams(defaultTruck.id);
          }
        }
      } catch (error) {
        console.error("Error fetching truck parameters:", error);
      }
    };

    fetchTruckParameters();
  }, []);

  // Fetch saved routes
  useEffect(() => {
    const fetchSavedRoutes = async () => {
      setIsLoadingRoutes(true);
      try {
        const response = await fetch(
          "/api/route_calculator/calculations/list/"
        );
        if (response.ok) {
          const data = await response.json();
          setSavedRoutes(data.results || data);
        }
      } catch (error) {
        console.error("Error fetching saved routes:", error);
      } finally {
        setIsLoadingRoutes(false);
      }
    };

    fetchSavedRoutes();
  }, []);

  // format helpers
  const fmtKm = (v) =>
    Number(v).toLocaleString(undefined, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });

  const totalKm = useMemo(() => {
    const list = routeInfo?.distanceByCountry || [];
    return fmtKm(list.reduce((acc, r) => acc + Number(r.km || 0), 0));
  }, [routeInfo?.distanceByCountry]);

  const handleCalculateRoute = async () => {
    // Clear selected route when calculating new route
    setSelectedRouteId(null);
    setIsCalculating(true);

    try {
      const pointsText = [
        { label: startPoint, type: START },
        ...loadingPoints
          .filter((p) => p.trim() !== "")
          .map((p) => ({ label: p, type: LOADING })),
        ...unloadingPoints
          .filter((p) => p.trim() !== "")
          .map((p) => ({ label: p, type: UNLOADING })),
      ];

      // You'll need geocoding API to convert them to lat/lng
      const geocodedPoints = await geocodePoints(pointsText);
      const cleaned = geocodedPoints.filter(Boolean);

      if (cleaned.length < 2) {
        console.warn("Need at least two valid points to calculate a route.");
        alert("Please provide at least two valid points to calculate a route.");
        return;
      }

      setRouteFromInputs(cleaned);
      console.log("Geocoded Points:", cleaned);
    } catch (error) {
      console.error("Error calculating route:", error);
      alert("Error calculating route. Please try again.");
    } finally {
      setIsCalculating(false);
    }
  };

  const geocodePoints = async (pointsTextArray) => {
    const iso3ToIso2 = {
      CZE: "cz",
      DEU: "de",
      AUT: "at",
      ITA: "it",
      POL: "pl",
      SVK: "sk",
      UKR: "ua",
      FRA: "fr",
    };

    const detectCountryCode = (label) => {
      const tokens = label.replace(/[,]/g, " ").split(/\s+/).filter(Boolean);
      const last = tokens[tokens.length - 1];
      if (!last) return null;
      // 2-letter (PL, CZ, DE) or 3-letter (POL, CZE, DEU)
      if (/^[A-Z]{2}$/.test(last)) return last.toLowerCase();
      if (/^[A-Z]{3}$/.test(last) && iso3ToIso2[last]) return iso3ToIso2[last];
      return null;
    };

    const fetchCoords = async ({ label, type }) => {
      try {
        const cc = detectCountryCode(label);
        const params = new URLSearchParams({
          format: "json",
          limit: "1",
          addressdetails: "1",
          q: label,
        });
        if (cc) params.set("countrycodes", cc);

        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?${params.toString()}`
        );
        const data = await res.json();
        if (!data[0]) return null;

        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
          type,
          label,
        };
      } catch (e) {
        console.warn("Geocoding failed for:", label, e);
        return null;
      }
    };

    const results = await Promise.all(pointsTextArray.map(fetchCoords));
    return results.filter(Boolean);
  };

  const handleSaveRoute = async () => {
    if (!routeInfo.distance || !routeFromInputs.length) {
      alert("Please calculate a route first");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        carrier: "", // Can be added as input field later
        customer: "", // Can be added as input field later
        price: routePrice ? parseFloat(routePrice) : null,
        currency: "EUR",
        truck_parameters_id: selectedTruckParams,
        route_info: routeInfo,
        points_data: routeFromInputs,
        calculated_by: userInfo?.id || null, // Add user ID from Redux state
      };

      const response = await fetch(
        "/api/route_calculator/calculations/create-from-calculator/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            // Authorization: `Bearer ${localStorage.getItem("access_token")}`, // Removed for now
          },
          body: JSON.stringify(payload),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSavedRouteId(data.id);
        alert(`Route saved successfully! ID: ${data.id}`);

        // Refresh the saved routes list
        const refreshResponse = await fetch(
          "/api/route_calculator/calculations/list/"
        );
        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          setSavedRoutes(refreshData.results || refreshData);
        }
      } else {
        let errorMessage = "Unknown error";
        try {
          // Clone the response to avoid "body stream already read" error
          const responseClone = response.clone();
          const error = await responseClone.json();
          errorMessage = error.detail || error.message || JSON.stringify(error);
        } catch (e) {
          // If response is not JSON (like HTML error page), get text
          const text = await response.text();
          errorMessage = `Server error (${response.status}): ${text.substring(
            0,
            200
          )}...`;
        }
        alert(`Error saving route: ${errorMessage}`);
      }
    } catch (error) {
      console.error("Error saving route:", error);
      alert("Error saving route. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  console.log("Route Info:", routeInfo);

  return (
    <div className="calculator-page">
      <div className="tenders-container">
        <div className="calculator-header-block">
          <h2 className="table__name">Калькулятор маршрутів</h2>
        </div>

        <div className="main-layout">
          {/* Left panel: Inputs + Route Info */}
          <div className="left-panel">
            <RouteInputForm
              startPoint={startPoint}
              setStartPoint={setStartPoint}
              loadingPoints={loadingPoints}
              setLoadingPoints={setLoadingPoints}
              unloadingPoints={unloadingPoints}
              setUnloadingPoints={setUnloadingPoints}
              selectedTruckParams={selectedTruckParams}
              setSelectedTruckParams={setSelectedTruckParams}
              truckParameters={truckParameters}
              routePrice={routePrice}
              setRoutePrice={setRoutePrice}
              handleCalculateRoute={handleCalculateRoute}
              isCalculating={isCalculating}
              routeInfo={routeInfo}
              selectedRouteId={selectedRouteId}
              handleSaveRoute={handleSaveRoute}
              isSaving={isSaving}
              handleClearForm={handleClearForm}
            />
          </div>

          {/* Map Section */}
          <div className="map-section">
            <HereMapRouteComponent
              points={routeFromInputs}
              onRouteData={handleRouteData}
              routeInfo={routeInfo}
            />
          </div>
        </div>

        {/* Saved Routes Table - Overlay */}
        <div
          className={`saved-routes-section ${
            tableOverlayHeight > 0 ? "overlay" : ""
          }`}
          style={{
            height: tableOverlayHeight > 0 ? `${tableOverlayHeight}px` : "auto",
            position: tableOverlayHeight > 0 ? "fixed" : "relative",
            bottom: tableOverlayHeight > 0 ? "0" : "auto",
            left:
              tableOverlayHeight > 0
                ? isSidebarOpen
                  ? "250px"
                  : "50px"
                : "auto", // Dynamic sidebar width
            right: tableOverlayHeight > 0 ? "0" : "auto",
            zIndex: tableOverlayHeight > 0 ? "1000" : "auto",
            width:
              tableOverlayHeight > 0
                ? isSidebarOpen
                  ? "calc(100% - 250px)"
                  : "calc(100% - 50px)"
                : "auto", // Dynamic width
          }}
        >
          {/* Always visible drag handle */}
          <div
            className="overlay-drag-handle"
            onMouseDown={handleMouseDown}
            onDoubleClick={handleDoubleClick}
            style={{ cursor: "ns-resize" }}
            title="Drag to resize table overlay, double-click to toggle"
          >
            <div className="overlay-handle-content">
              <div className="overlay-handle-line"></div>
              <div className="overlay-handle-grip">
                <span>⋮</span>
              </div>
              <div className="overlay-handle-line"></div>
            </div>
          </div>
          <div className="routes-header">
            <h3>Попередні розрахунки</h3>
            <button
              onClick={() => {
                setIsLoadingRoutes(true);
                fetch("/api/route_calculator/calculations/list/")
                  .then((res) => res.json())
                  .then((data) => {
                    setSavedRoutes(data.results || data);
                    setIsLoadingRoutes(false);
                  })
                  .catch((err) => {
                    console.error("Error refreshing routes:", err);
                    setIsLoadingRoutes(false);
                  });
              }}
              className="refresh-button"
              disabled={isLoadingRoutes}
            >
              {isLoadingRoutes ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          {isLoadingRoutes ? (
            <div className="loading-message">Loading routes...</div>
          ) : savedRoutes.length === 0 ? (
            <div className="no-routes-message">
              No saved routes yet. Calculate and save a route to see it here.
            </div>
          ) : (
            <RouteCalculationsTable
              routes={savedRoutes}
              isLoading={isLoadingRoutes}
              onRefresh={() => {
                setIsLoadingRoutes(true);
                fetch("/api/route_calculator/calculations/list/")
                  .then((res) => res.json())
                  .then((data) => {
                    setSavedRoutes(data.results || data);
                    setIsLoadingRoutes(false);
                  })
                  .catch((err) => {
                    console.error("Error refreshing routes:", err);
                    setIsLoadingRoutes(false);
                  });
              }}
              onSelectRoute={handleSelectRoute}
              selectedRouteId={selectedRouteId}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default CalculatorPage;
