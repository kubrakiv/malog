import { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FaCalculator } from "react-icons/fa";
import {
  listOrderDetails,
  updateOrder,
} from "../../../features/orders/ordersOperations";
import { calculateTotalDistance } from "../../../services/distanceCalculationService";
import { calculateEmptyDistance } from "../../../services/distanceCalculationService";
import FormWrapper from "../../../components/FormWrapper";
import InputComponent from "../../../globalComponents/InputComponent";
import { selectOrderFactData } from "../../../features/orders/ordersSelectors";

import { DELIVERY_CONSTANTS } from "../../../constants/global";
const { START, LOADING, UNLOADING } = DELIVERY_CONSTANTS;
import { generatePointsFromTasks } from "../../../utils/generatePointsFromTasks";

import "./RouteComponent.scss";

const RouteComponent = () => {
  const dispatch = useDispatch();
  const order = useSelector((state) => state.ordersInfo.orderDetails.data);
  const tasks = useSelector(
    (state) => state.ordersInfo.orderDetails.data.tasks
  );
  const orderFactData = useSelector(selectOrderFactData);

  const points = useMemo(() => generatePointsFromTasks(tasks), [tasks]);

  const [distance, setDistance] = useState(null);
  const [emptyDistance, setEmptyDistance] = useState(null);
  const [isHovered, setHovered] = useState(false);
  const [isEmptyHovered, setEmptyHovered] = useState(false);

  useEffect(() => {
    setEmptyDistance(order.empty_distance);
  }, [order]);

  const handleMouseEnter = () => {
    setHovered(true);
  };

  const handleMouseLeave = () => {
    setHovered(false);
  };

  const handleEmptyMouseEnter = () => {
    setEmptyHovered(true);
  };

  const handleEmptyMouseLeave = () => {
    setEmptyHovered(false);
  };

  const calculateDistance = async () => {
    if (!points || points.length < 2) {
      console.warn("Not enough points to calculate distance");
      return;
    }

    try {
      const platform = new H.service.Platform({
        apikey: import.meta.env.REACT_APP_HERE_API_KEY,
      });

      const router = platform.getRoutingService(null, 8);

      const totalDistance = await calculateTotalDistance(points, router);

      if (totalDistance > 0) {
        setDistance(totalDistance);
        console.log("DISTANCE:", totalDistance);

        const dataToUpdate = { distance: Number(totalDistance) };
        dispatch(updateOrder({ dataToUpdate, orderId: order.id }));

        // Refresh order details
        dispatch(listOrderDetails(order.id));
      } else {
        console.error("Failed to calculate distance - result was 0 or invalid");
        alert("Failed to calculate distance. Please check your route points.");
      }
    } catch (error) {
      console.error("Error calculating distance:", error);
      alert("Error calculating distance. Please try again.");
    }
  };

  const handleCalculateEmptyDistance = () => {
    const start = points.find((p) => p.type === START);
    const firstLoading = points.find((p) => p.type === LOADING);

    if (!start || !firstLoading) {
      alert("Start or first loading point not found.");
      return;
    }

    calculateEmptyDistance({ start, firstLoading }, (distanceKm) => {
      if (distanceKm !== null) {
        setEmptyDistance(distanceKm);
        const dataToUpdate = { empty_distance: parseFloat(distanceKm) };
        dispatch(updateOrder({ dataToUpdate, orderId: order.id }))
          .then(() => {
            // Fetch new order details to refresh data
            dispatch(listOrderDetails(order.id));
          })
          .catch((error) => {
            console.error("Failed to update empty distance:", error);
          });
      } else {
        alert("Failed to calculate distance.");
      }
    });
  };

  const handleFormSubmit = () => {
    // let dataToUpdate = {};
    const dataToUpdate = { empty_distance: emptyDistance };
    console.log("Order.ID:", order.id);
    dispatch(updateOrder({ dataToUpdate, orderId: order.id }));
  };

  // Helper functions for distance calculations
  const getDifferenceClass = (planned, factual) => {
    if (!planned || !factual) return "";
    const difference = parseFloat(orderFactData?.factual?.deltaPct || 0);
    if (difference <= 5) return "difference-good"; // Within 5% is good
    if (difference <= 15) return "difference-warning"; // Within 15% is warning
    return "difference-bad"; // Over 15% is bad
  };

  const totalDistance =
    distance || order.distance + order.empty_distance || emptyDistance;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        width: "100%",
        gap: "10px",
      }}
    >
      <div
        className="order-details__route mb-5"
        style={{ flex: 1 }}
        onMouseEnter={handleEmptyMouseEnter}
        onMouseLeave={handleEmptyMouseLeave}
      >
        <FormWrapper
          title="Холостий пробіг"
          content={
            <div className="order-details__content-row-block-value">
              Відстань: {orderFactData?.emptyDistance || order.empty_distance}{" "}
              км
            </div>
          }
          handleFormSubmit={handleFormSubmit}
        >
          <form>
            <InputComponent
              title="Введіть холостий пробіг"
              name="empty_distance"
              type="number"
              value={emptyDistance}
              onChange={(e) => setEmptyDistance(e.target.value)}
              autoFocus
              placeholder="Введіть холостий пробіг"
            />
          </form>
        </FormWrapper>
        {isEmptyHovered && (
          <button
            type="button"
            title="Порахувати холостий пробіг"
            className="order-details__route_calc-btn"
            onClick={handleCalculateEmptyDistance}
          >
            <FaCalculator />
          </button>
        )}
      </div>
      {order && (
        <div
          className="order-details__route mb-5 "
          style={{ flex: 1 }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className="order-details__route_title">Відстань по маршруту</div>
          <div className="order-details__route_distance">
            <div className="distance-row">
              <span>Планова:</span>
              <span className="distance-value">
                {/* {distance ? distance : order.distance} км */}
                {totalDistance} км
              </span>
            </div>
            <div className="distance-row">
              <span>Фактична:</span>
              <span className="distance-value">
                {orderFactData?.factual?.distance
                  ? `${orderFactData.factual.distance} км`
                  : "Не вказано"}
              </span>
            </div>
            {orderFactData?.factual?.distance && (
              <div className="distance-difference">
                <span>Різниця:</span>
                <div className="difference-details">
                  <span
                    className={`difference-value ${getDifferenceClass(
                      order.distance || distance,
                      orderFactData.factual.distance
                    )}`}
                  >
                    {orderFactData.factual.deltaPct}%
                  </span>
                  <span className="difference-km">
                    ({orderFactData.factual.deltaKm} км)
                  </span>
                </div>
              </div>
            )}
          </div>
          {isHovered && (
            <button
              type="button"
              title="Порахувати відстань"
              className="order-details__route_calc-btn"
              onClick={calculateDistance}
            >
              <FaCalculator />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default RouteComponent;
