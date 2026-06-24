import React, { useState } from "react";
import "./style.scss";
import { FaPlus } from "react-icons/fa";
import { useConfirm } from "../../globalComponents/ConfirmModal/useConfirm";

const RouteCalculationsTable = ({
  routes,
  isLoading,
  onRefresh,
  onSelectRoute,
  selectedRouteId,
}) => {
  const confirm = useConfirm();
  const [editingRoute, setEditingRoute] = useState(null);
  const [editPrice, setEditPrice] = useState("");
  const [isDeleting, setIsDeleting] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedForRoundtrip, setSelectedForRoundtrip] = useState([]);
  const formatPoints = (points, type) => {
    if (!points || points.length === 0) return "N/A";

    const filteredPoints = points.filter((point) => point.point_type === type);
    if (filteredPoints.length === 0) return "N/A";

    return filteredPoints
      .map(
        (point) =>
          point.label || point.address || `${point.city}, ${point.country}`
      )
      .join(", ");
  };

  const getRoutePoints = (points) => {
    if (!points || points.length === 0) return "N/A";

    // Sort points by type: start -> loading -> unloading
    const sortedPoints = [...points].sort((a, b) => {
      const typeOrder = { start: 0, loading: 1, unloading: 2 };
      return typeOrder[a.point_type] - typeOrder[b.point_type];
    });

    return sortedPoints
      .map((point) => {
        const icon = getPointIcon(point.point_type);
        const label =
          point.label || point.address || `${point.city}, ${point.country}`;
        return `${icon} ${label}`;
      })
      .join(" → ");
  };

  const getPointIcon = (type) => {
    switch (type) {
      case "start":
        return "🚛"; // Truck icon for start point
      case "loading":
        return "📦"; // Package icon for loading
      case "unloading":
        return "🏁"; // Finish flag icon for unloading
      default:
        return "📍"; // Default pin icon
    }
  };

  // Keep these functions for backward compatibility if needed elsewhere
  const getStartPoint = (points) => {
    if (!points || points.length === 0) return "N/A";
    const startPoint = points.find((point) => point.point_type === "start");
    return startPoint
      ? startPoint.label ||
          startPoint.address ||
          `${startPoint.city}, ${startPoint.country}`
      : "N/A";
  };

  const getLoadingPoints = (points) => {
    return formatPoints(points, "loading");
  };

  const getUnloadingPoints = (points) => {
    return formatPoints(points, "unloading");
  };

  const getDistanceInfo = (route) => {
    const emptyDistance = Number(route.empty_distance_km || 0);
    const loadedDistance = Number(route.loaded_distance_km || 0);
    const totalDistance = emptyDistance + loadedDistance;

    return {
      empty: emptyDistance.toFixed(0),
      total: totalDistance.toFixed(0),
      loaded: loadedDistance.toFixed(0),
    };
  };

  const getPriceAndTargetInfo = (route) => {
    const price = Number(route.price || 0);
    const profit = Number(route.profit || 0);
    const profitPercentage = calculateProfitPercentage(route);
    const targetPrice = calculatePlannedPrice(route);
    const pricePerKm = calculatePricePerKm(route);

    return {
      price: price.toFixed(2),
      profit: profit.toFixed(2),
      profitPercentage: profitPercentage,
      target: targetPrice,
      pricePerKm: pricePerKm,
    };
  };

  const getTotalCostAndTollsInfo = (route) => {
    const totalCost = Number(route.total_cost || 0);
    const tolls = Number(route.toll_cost || 0);
    const costPerKm = calculateCostPerKm(route);

    return {
      totalCost: totalCost.toFixed(2),
      tolls: tolls.toFixed(2),
      costPerKm: costPerKm,
    };
  };

  const getCreatedAndUserInfo = (route) => {
    const createdDate = new Date(route.created_at).toLocaleDateString("uk-UA");
    const createdTime = new Date(route.created_at).toLocaleTimeString("uk-UA", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const userName = getUserName(route.calculated_by);

    return {
      created: createdDate,
      time: createdTime,
      user: userName,
    };
  };

  const getRouteAndDistanceInfo = (route) => {
    const routePoints = getRoutePoints(route.points);
    const distanceInfo = getDistanceInfo(route);

    return {
      route: routePoints,
      distance: distanceInfo,
    };
  };

  const getUserName = (calculatedBy) => {
    if (!calculatedBy) return "N/A";
    if (typeof calculatedBy === "string") return calculatedBy;

    // Prioritize full name (first_name + last_name)
    if (calculatedBy.first_name && calculatedBy.last_name) {
      return `${calculatedBy.first_name} ${calculatedBy.last_name}`;
    }

    // Fallback to username if full name not available
    if (calculatedBy.username) return calculatedBy.username;

    // Fallback to email if username not available
    if (calculatedBy.email) return calculatedBy.email;

    return "Unknown User";
  };

  const calculatePlannedPrice = (route) => {
    const totalCost = Number(route.total_cost || 0);
    if (totalCost === 0) return "N/A";

    // Add 7.5% margin on top of total cost for planned price
    const plannedPrice = totalCost * 1.075;
    return plannedPrice.toFixed(2);
  };

  const calculateCostPerKm = (route) => {
    const totalCost = Number(route.total_cost || 0);
    const totalDistance =
      Number(route.loaded_distance_km || 0) +
      Number(route.empty_distance_km || 0);

    if (totalDistance === 0) return "N/A";
    return (totalCost / totalDistance).toFixed(2);
  };

  const calculatePricePerKm = (route) => {
    const price = Number(route.price || 0);
    const totalDistance =
      Number(route.loaded_distance_km || 0) +
      Number(route.empty_distance_km || 0);

    if (totalDistance === 0 || price === 0) return "N/A";
    return (price / totalDistance).toFixed(2);
  };

  const calculateProfitPercentage = (route) => {
    const profit = Number(route.profit || 0);
    const totalCost = Number(route.total_cost || 0);

    if (totalCost === 0) return "N/A";

    const profitPercentage = (profit / totalCost) * 100;
    return profitPercentage.toFixed(1) + "%";
  };

  const getPriceStatus = (route) => {
    const initialPrice = Number(route.price || 0);
    const targetPrice = Number(calculatePlannedPrice(route));

    if (initialPrice === 0 || targetPrice === 0)
      return { icon: "❓", color: "#6c757d" };

    const percentageDiff = ((initialPrice - targetPrice) / targetPrice) * 100;

    if (percentageDiff < 0) {
      return { icon: "🔴", color: "#dc3545" }; // Red circle for low price
    } else if (percentageDiff >= -1 && percentageDiff <= 1) {
      return { icon: "🟡", color: "#ffc107" }; // Yellow circle for standard price
    } else if (percentageDiff > 2) {
      return { icon: "🟢", color: "#28a745" }; // Green circle for good price
    } else {
      return { icon: "🟡", color: "#ffc107" }; // Yellow circle for 1-2% range
    }
  };

  const handleDeleteRoute = async (routeId) => {
    if (!await confirm("Are you sure you want to delete this route?")) {
      return;
    }

    setIsDeleting(routeId);
    try {
      const response = await fetch(
        `/api/route_calculator/calculations/${routeId}/delete/`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        alert("Route deleted successfully!");
        onRefresh(); // Refresh the table
      } else {
        const error = await response.text();
        alert(`Error deleting route: ${error}`);
      }
    } catch (error) {
      console.error("Error deleting route:", error);
      alert("Error deleting route. Please try again.");
    } finally {
      setIsDeleting(null);
    }
  };

  const handleEditRoute = (route) => {
    setEditingRoute(route);
    setEditPrice(route.price ? route.price.toString() : "");
  };

  const handleSaveEdit = async () => {
    if (!editingRoute) return;

    const newPrice = parseFloat(editPrice);
    if (isNaN(newPrice) || newPrice < 0) {
      alert("Please enter a valid price");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(
        `/api/route_calculator/calculations/${editingRoute.id}/update-price/`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            price: newPrice,
          }),
        }
      );

      if (response.ok) {
        alert("Route updated successfully!");
        setEditingRoute(null);
        setEditPrice("");
        onRefresh(); // Refresh the table
      } else {
        const error = await response.text();
        alert(`Error updating route: ${error}`);
      }
    } catch (error) {
      console.error("Error updating route:", error);
      alert("Error updating route. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingRoute(null);
    setEditPrice("");
  };

  const handleRoundtripSelection = (route) => {
    const isSelected = selectedForRoundtrip.some((r) => r.id === route.id);
    if (isSelected) {
      // Remove from selection
      setSelectedForRoundtrip((prev) => prev.filter((r) => r.id !== route.id));
    } else {
      // Add to selection (max 2 routes)
      if (selectedForRoundtrip.length < 2) {
        setSelectedForRoundtrip((prev) => [...prev, route]);
      } else {
        alert("You can only select 2 routes for roundtrip calculation");
      }
    }
  };

  const extractCountryFromLabel = (label) => {
    if (!label) return "UNK";

    // Pattern 1: "IT-28047 Oleggio" or "DE-41199 Monchengladbach" (country at beginning)
    if (label.includes("-")) {
      const parts = label.split("-");
      if (parts.length > 0) {
        const potentialCode = parts[0].toUpperCase();
        if (potentialCode.length === 2) {
          // Convert 2-letter to 3-letter codes
          const countryMapping = {
            CZ: "CZE",
            DE: "DEU",
            AT: "AUT",
            IT: "ITA",
            PL: "POL",
            SK: "SVK",
            UA: "UKR",
            FR: "FRA",
            NL: "NLD",
            BE: "BEL",
            CH: "CHE",
            HU: "HUN",
            RO: "ROU",
            BG: "BGR",
            HR: "HRV",
            SI: "SVN",
            LT: "LTU",
            LV: "LVA",
            EE: "EST",
            FI: "FIN",
            SE: "SWE",
            NO: "NOR",
            DK: "DNK",
            IE: "IRL",
            GB: "GBR",
            ES: "ESP",
            PT: "PRT",
            GR: "GRC",
            CY: "CYP",
            MT: "MLT",
            LU: "LUX",
          };
          return countryMapping[potentialCode] || "UNK";
        }
      }
    }

    // Pattern 2: "Pilsen CZ", "Prague CZ", "Brno CZ" (country at end)
    const words = label.split(" ");
    if (words.length > 1) {
      const lastWord = words[words.length - 1].toUpperCase();
      if (lastWord.length === 2) {
        // Convert 2-letter to 3-letter codes
        const countryMapping = {
          CZ: "CZE",
          DE: "DEU",
          AT: "AUT",
          IT: "ITA",
          PL: "POL",
          SK: "SVK",
          UA: "UKR",
          FR: "FRA",
          NL: "NLD",
          BE: "BEL",
          CH: "CHE",
          HU: "HUN",
          RO: "ROU",
          BG: "BGR",
          HR: "HRV",
          SI: "SVN",
          LT: "LTU",
          LV: "LVA",
          EE: "EST",
          FI: "FIN",
          SE: "SWE",
          NO: "NOR",
          DK: "DNK",
          IE: "IRL",
          GB: "GBR",
          ES: "ESP",
          PT: "PRT",
          GR: "GRC",
          CY: "CYP",
          MT: "MLT",
          LU: "LUX",
        };
        return countryMapping[lastWord] || "UNK";
      }
    }

    return "UNK";
  };

  const getRouteCountryCodes = (route) => {
    if (!route.points || route.points.length === 0) return "N/A";

    // Find first loading point and last unloading point
    const loadingPoints = route.points.filter(
      (p) => p.point_type === "loading"
    );
    const unloadingPoints = route.points.filter(
      (p) => p.point_type === "unloading"
    );

    if (loadingPoints.length === 0 || unloadingPoints.length === 0)
      return "N/A";

    const firstLoadingPoint = loadingPoints[0]; // First loading point
    const lastUnloadingPoint = unloadingPoints[unloadingPoints.length - 1]; // Last unloading point

    // Extract country codes from labels instead of using country field
    const startCountry = extractCountryFromLabel(firstLoadingPoint.label);
    const endCountry = extractCountryFromLabel(lastUnloadingPoint.label);

    return `${startCountry}-${endCountry}`;
  };

  const getRoundtripProfitabilityStatus = () => {
    if (selectedForRoundtrip.length !== 2) return null;

    const roundtripMetrics = calculateRoundtripMetrics();
    if (!roundtripMetrics) return null;

    const profitPercentage = parseFloat(roundtripMetrics.profitPercentage);

    if (profitPercentage < 0) {
      return { icon: "🔴", text: "Збитковий", color: "#dc3545" };
    } else if (profitPercentage >= 0 && profitPercentage < 5) {
      return { icon: "🟡", text: "Низька", color: "#ffc107" };
    } else if (profitPercentage >= 5 && profitPercentage < 15) {
      return { icon: "🟢", text: "Хороша", color: "#28a745" };
    } else {
      return { icon: "💎", text: "Відмінна", color: "#6f42c1" };
    }
  };

  const calculateRoundtripMetrics = () => {
    if (selectedForRoundtrip.length !== 2) return null;

    const [route1, route2] = selectedForRoundtrip;

    const totalDistance =
      Number(route1.loaded_distance_km || 0) +
      Number(route1.empty_distance_km || 0) +
      (Number(route2.loaded_distance_km || 0) +
        Number(route2.empty_distance_km || 0));

    const totalCost =
      Number(route1.total_cost || 0) + Number(route2.total_cost || 0);
    const totalPrice = Number(route1.price || 0) + Number(route2.price || 0);
    const totalProfit = totalPrice - totalCost;
    const profitPercentage =
      totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;
    const costPerKm = totalDistance > 0 ? totalCost / totalDistance : 0;
    const pricePerKm = totalDistance > 0 ? totalPrice / totalDistance : 0;

    return {
      totalDistance: totalDistance.toFixed(0),
      totalCost: totalCost.toFixed(2),
      totalPrice: totalPrice.toFixed(2),
      totalProfit: totalProfit.toFixed(2),
      profitPercentage: profitPercentage.toFixed(1),
      costPerKm: costPerKm.toFixed(2),
      pricePerKm: pricePerKm.toFixed(2),
      route1Id: route1.id,
      route2Id: route2.id,
      route1Countries: getRouteCountryCodes(route1),
      route2Countries: getRouteCountryCodes(route2),
    };
  };

  if (isLoading) {
    return (
      <div className="routes-table-container">
        <div className="loading-message">Loading routes...</div>
      </div>
    );
  }

  if (!routes || routes.length === 0) {
    return (
      <div className="routes-table-container">
        <div className="no-routes-message">
          No saved routes yet. Calculate and save a route to see it here.
        </div>
      </div>
    );
  }

  const roundtripMetrics = calculateRoundtripMetrics();
  const profitabilityStatus = getRoundtripProfitabilityStatus();

  return (
    <div className="routes-table-container">
      {/* Routes Header with RT and Actions */}
      <div className="routes-header">
        <div className="header-section">
          <div className="header-actions">
            {/* Action Buttons - Always visible but disabled when no selection */}
            {editingRoute?.id === selectedRouteId ? (
              <>
                <button
                  onClick={() => handleSaveEdit()}
                  className="save-btn"
                  disabled={isSaving}
                >
                  {isSaving ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={() => handleCancelEdit()}
                  className="cancel-btn"
                  disabled={isSaving}
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    if (selectedRouteId) {
                      const route = routes.find(
                        (r) => r.id === selectedRouteId
                      );
                      if (route) handleEditRoute(route);
                    }
                  }}
                  className="edit-btn"
                  disabled={!selectedRouteId}
                  title={
                    !selectedRouteId
                      ? "Select a route first"
                      : "Edit route price"
                  }
                >
                  Edit
                </button>
                <button
                  onClick={() =>
                    selectedRouteId && handleDeleteRoute(selectedRouteId)
                  }
                  className="delete-btn"
                  disabled={!selectedRouteId || isDeleting === selectedRouteId}
                  title={
                    !selectedRouteId ? "Select a route first" : "Delete route"
                  }
                >
                  {isDeleting === selectedRouteId ? "Delete" : "Delete"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Roundtrip Calculation Section */}
      {selectedForRoundtrip.length > 0 && (
        <div className="roundtrip-section">
          <div className="roundtrip-header">
            <h3>
              Розрахунок кругового маршруту ({selectedForRoundtrip.length}/2
              маршрути вибрано)
            </h3>
            <button
              onClick={() => setSelectedForRoundtrip([])}
              className="roundtrip-clear-button"
            >
              Очистити вибір
            </button>
          </div>

          {selectedForRoundtrip.length === 2 && roundtripMetrics ? (
            <div className="roundtrip-content">
              <div className="roundtrip-route-info">
                <span className="route-label">Маршрут:</span>
                <span className="route-path">
                  {roundtripMetrics.route1Countries} →{" "}
                  {roundtripMetrics.route2Countries}
                </span>
                <span className="profitability-status">
                  Дохідність: {profitabilityStatus && profitabilityStatus.icon}
                </span>
              </div>

              <div className="roundtrip-metrics-cards">
                <div className="metric-card">
                  <span className="metric-label">Відстань</span>
                  <span className="metric-value">
                    {roundtripMetrics.totalDistance} km
                  </span>
                </div>
                <div className="metric-card">
                  <span className="metric-label">Витрати</span>
                  <span className="metric-value">
                    {roundtripMetrics.totalCost} EUR
                  </span>
                </div>
                <div className="metric-card">
                  <span className="metric-label">Тариф</span>
                  <span className="metric-value">
                    {roundtripMetrics.totalPrice} EUR
                  </span>
                </div>
                <div className="metric-card">
                  <span className="metric-label">Прибуток</span>
                  <span className="metric-value">
                    {roundtripMetrics.totalProfit} EUR
                  </span>
                </div>
                <div className="metric-card">
                  <span className="metric-label">Прибуток %</span>
                  <span className="metric-value">
                    {roundtripMetrics.profitPercentage}%
                  </span>
                </div>
                <div className="metric-card">
                  <span className="metric-label">Витрати/км</span>
                  <span className="metric-value">
                    {roundtripMetrics.costPerKm} EUR
                  </span>
                </div>
                <div className="metric-card">
                  <span className="metric-label">Тариф/км</span>
                  <span className="metric-value">
                    {roundtripMetrics.pricePerKm} EUR
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="roundtrip-placeholder">
              Виберіть 2 маршрути для розрахунку кругового маршруту
            </div>
          )}
        </div>
      )}

      <table className="routes-table">
        <thead>
          <tr>
            <th></th>
            <th>Розраховано</th>
            <th>Маршрут</th>
            <th>Тариф (EUR)</th>
            <th>Загальні витрати (EUR)</th>
            <th>Дохідність</th>
          </tr>
        </thead>
        <tbody>
          {routes.map((route) => (
            <tr
              key={route.id}
              className={selectedRouteId === route.id ? "selected-row" : ""}
              style={{ cursor: "default" }}
            >
              <td>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <div className="roundtrip-selection">
                    {selectedForRoundtrip.some((r) => r.id === route.id) ? (
                      <span
                        className="roundtrip-number"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRoundtripSelection(route);
                        }}
                        title="Вилучити з кругового маршруту"
                      >
                        {selectedForRoundtrip.findIndex(
                          (r) => r.id === route.id
                        ) + 1}
                      </span>
                    ) : (
                      <input
                        type="checkbox"
                        checked={false}
                        onChange={(e) => {
                          e.stopPropagation(); // Prevent row selection when clicking checkbox
                          handleRoundtripSelection(route);
                        }}
                        className="roundtrip-checkbox"
                        title="Додати до кругового маршруту"
                      />
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectRoute(route);
                    }}
                    className={`select-row-btn ${
                      selectedRouteId === route.id ? "selected" : "unselected"
                    }`}
                    title={
                      selectedRouteId === route.id
                        ? "Скасувати вибір маршруту"
                        : "Вибрати маршрути для дій"
                    }
                  >
                    {selectedRouteId === route.id ? "✓" : "○"}
                  </button>
                </div>
              </td>
              <td>
                <div className="combined-field">
                  <div className="main-value">
                    {getCreatedAndUserInfo(route).created}
                  </div>
                  <div className="sub-value">
                    {getCreatedAndUserInfo(route).time} |{" "}
                    {getCreatedAndUserInfo(route).user}
                  </div>
                </div>
              </td>
              <td>
                <div className="combined-field">
                  <div className="main-value">
                    {getRouteAndDistanceInfo(route).route}
                  </div>
                  <div className="sub-value">
                    {getRouteAndDistanceInfo(route).distance.total}км |{" "}
                    {getRouteAndDistanceInfo(route).distance.empty}км порожній
                  </div>
                </div>
              </td>
              <td>
                <div className="combined-field">
                  <div className="main-value">
                    {editingRoute?.id === route.id ? (
                      <input
                        type="number"
                        value={editPrice}
                        onChange={(e) => setEditPrice(e.target.value)}
                        step="0.01"
                        min="0"
                        className="edit-input"
                      />
                    ) : route.price ? (
                      `${getPriceAndTargetInfo(route).price} EUR`
                    ) : (
                      "Немає"
                    )}
                  </div>
                  <div className="sub-value">
                    {getPriceAndTargetInfo(route).pricePerKm}/км | T:
                    {getPriceAndTargetInfo(route).target}€ | P:
                    {getPriceAndTargetInfo(route).profit}€ (
                    {getPriceAndTargetInfo(route).profitPercentage})
                  </div>
                </div>
              </td>
              <td>
                <div className="combined-field">
                  <div className="main-value">
                    {getTotalCostAndTollsInfo(route).totalCost} EUR
                  </div>
                  <div className="sub-value">
                    {getTotalCostAndTollsInfo(route).costPerKm}/км | Дороги:{" "}
                    {getTotalCostAndTollsInfo(route).tolls}€
                  </div>
                </div>
              </td>
              <td>
                <span
                  className="status-icon"
                  title={
                    getPriceStatus(route).icon === "🔴"
                      ? "Низька ціна"
                      : getPriceStatus(route).icon === "🟡"
                      ? "Стандартна ціна"
                      : getPriceStatus(route).icon === "🟢"
                      ? "Хороша ціна"
                      : "Невідомо"
                  }
                >
                  {getPriceStatus(route).icon}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RouteCalculationsTable;
