import React from "react";
import "./style.scss";

const RouteInputForm = ({
  startPoint,
  setStartPoint,
  loadingPoints,
  setLoadingPoints,
  unloadingPoints,
  setUnloadingPoints,
  selectedTruckParams,
  setSelectedTruckParams,
  truckParameters,
  routePrice,
  setRoutePrice,
  handleCalculateRoute,
  isCalculating,
  routeInfo,
  selectedRouteId,
  handleSaveRoute,
  isSaving,
  handleClearForm,
}) => {
  return (
    <div className="route-input-form">
      {/* X Button in top right corner */}
      <button
        onClick={handleClearForm}
        className="close-button"
        style={{
          position: "absolute",
          top: "8px",
          right: "8px",
          width: "24px",
          height: "24px",
          backgroundColor: "#dc3545",
          color: "#fff",
          border: "none",
          borderRadius: "50%",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "14px",
          fontWeight: "bold",
          zIndex: 10,
          transition: "all 0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = "#c82333";
          e.target.style.transform = "scale(1.1)";
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = "#dc3545";
          e.target.style.transform = "scale(1)";
        }}
        title="Clear Form"
      >
        ×
      </button>

      <div className="form-group">
        <label className="form-label">Старт:</label>
        <input
          type="text"
          value={startPoint}
          onChange={(e) => setStartPoint(e.target.value)}
          placeholder="e.g. IT-20001 Milano"
          className="form-input"
        />
      </div>

      <div className="form-group">
        <div className="form-label-with-button">
          <label className="form-label">Завантаження:</label>
          <button
            onClick={() => setLoadingPoints([...loadingPoints, ""])}
            className="add-button-compact"
            title="Додати завантаження"
          >
            +
          </button>
        </div>
        <div className="input-list">
          {loadingPoints.map((point, index) => (
            <div key={index} className="input-item">
              <input
                type="text"
                value={point}
                onChange={(e) =>
                  setLoadingPoints((prev) =>
                    prev.map((p, i) => (i === index ? e.target.value : p))
                  )
                }
                placeholder={`Завантаження ${
                  index + 1
                }: e.g. IT-28614 Somaglia`}
                className="form-input"
              />
              {loadingPoints.length > 1 && (
                <button
                  onClick={() =>
                    setLoadingPoints((prev) =>
                      prev.filter((_, i) => i !== index)
                    )
                  }
                  className="delete-point-button"
                  title="Вилучити це завантаження"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="form-group">
        <div className="form-label-with-button">
          <label className="form-label">Розвантаження:</label>
          <button
            onClick={() => setUnloadingPoints([...unloadingPoints, ""])}
            className="add-button-compact"
            title="Додати розвантаження"
          >
            +
          </button>
        </div>
        <div className="input-list">
          {unloadingPoints.map((point, index) => (
            <div key={index} className="input-item">
              <input
                type="text"
                value={point}
                onChange={(e) =>
                  setUnloadingPoints((prev) =>
                    prev.map((p, i) => (i === index ? e.target.value : p))
                  )
                }
                placeholder={`Розвантаження ${index + 1}: e.g. CZ-19800 Prague`}
                className="form-input"
              />
              {unloadingPoints.length > 1 && (
                <button
                  onClick={() =>
                    setUnloadingPoints((prev) =>
                      prev.filter((_, i) => i !== index)
                    )
                  }
                  className="delete-point-button"
                  title="Вилучити це розвантаження"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Тип автомобіля:</label>
        <select
          value={selectedTruckParams || ""}
          onChange={(e) =>
            setSelectedTruckParams(
              e.target.value ? parseInt(e.target.value) : null
            )
          }
          className="form-input"
        >
          <option value="">Виберіть тип автомобіля...</option>
          {truckParameters.map((truck) => (
            <option key={truck.id} value={truck.id}>
              {truck.name} ({truck.weight_capacity}t {truck.truck_type})
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">Тариф маршруту (EUR):</label>
        <input
          type="number"
          value={routePrice}
          onChange={(e) => setRoutePrice(e.target.value)}
          placeholder="Введіть тариф маршруту в EUR"
          className="form-input"
          min="0"
          step="0.01"
        />
      </div>

      <button
        onClick={handleCalculateRoute}
        className="calculate-button"
        disabled={
          isCalculating ||
          loadingPoints.filter((p) => p.trim()).length +
            unloadingPoints.filter((p) => p.trim()).length <
            1
        }
        style={{
          opacity: isCalculating ? 0.6 : 1,
          cursor: isCalculating ? "not-allowed" : "pointer",
        }}
      >
        {isCalculating ? (
          <>
            <span
              style={{
                display: "inline-block",
                width: "16px",
                height: "16px",
                border: "2px solid #ffffff",
                borderTop: "2px solid transparent",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                marginRight: "8px",
              }}
            />
            Розраховуємо...
          </>
        ) : (
          "Розрахувати маршрут"
        )}
      </button>

      {routeInfo.distance && !selectedRouteId && (
        <button
          onClick={handleSaveRoute}
          className="save-button"
          disabled={isSaving}
          style={{
            backgroundColor: "#007bff",
            color: "#fff",
            border: "none",
            padding: "0.6rem 1.2rem",
            borderRadius: "6px",
            cursor: "pointer",
            width: "100%",
            fontWeight: "bold",
            marginTop: "0.5rem",
            opacity: isSaving ? 0.6 : 1,
          }}
        >
          {isSaving ? "Зберігаємо..." : "Зберегти маршрут в базу"}
        </button>
      )}
    </div>
  );
};

export default RouteInputForm;
