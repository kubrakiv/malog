import { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FaCalculator } from "react-icons/fa";
import {
  listOrderDetails,
  updateOrder,
} from "../../../features/orders/ordersOperations";
import { calculateTotalDistance, calculateEmptyDistance } from "../../../services/distanceCalculationService";
import FormButtonComponent from "../FormButtonComponent/FormButtonComponent";
import InputComponent from "../../../globalComponents/InputComponent";
import { selectOrderFactData } from "../../../features/orders/ordersSelectors";

import { DELIVERY_CONSTANTS } from "../../../constants/global";
const { START, LOADING } = DELIVERY_CONSTANTS;
import { generatePointsFromTasks } from "../../../utils/generatePointsFromTasks";

import "./RouteComponent.scss";

const RouteComponent = () => {
  const dispatch = useDispatch();
  const order = useSelector((state) => state.ordersInfo.orderDetails.data);
  const tasks = useSelector((state) => state.ordersInfo.orderDetails.data.tasks);
  const orderFactData = useSelector(selectOrderFactData);
  const editModeOrder = useSelector((state) => state.ordersInfo.editModeOrder);

  const points = useMemo(() => generatePointsFromTasks(tasks), [tasks]);

  const [distance, setDistance] = useState(null);
  const [emptyDistance, setEmptyDistance] = useState(null);
  const [editEmptyMode, setEditEmptyMode] = useState(false);

  useEffect(() => {
    setEmptyDistance(order.empty_distance);
  }, [order]);

  const calculateDistance = async () => {
    if (!points || points.length < 2) return;
    try {
      const platform = new H.service.Platform({
        apikey: import.meta.env.REACT_APP_HERE_API_KEY,
      });
      const router = platform.getRoutingService(null, 8);
      const totalDistance = await calculateTotalDistance(points, router);
      if (totalDistance > 0) {
        setDistance(totalDistance);
        dispatch(updateOrder({ dataToUpdate: { distance: Number(totalDistance) }, orderId: order.id }));
        dispatch(listOrderDetails(order.id));
      } else {
        alert("Failed to calculate distance. Please check your route points.");
      }
    } catch (error) {
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
        dispatch(updateOrder({ dataToUpdate: { empty_distance: parseFloat(distanceKm) }, orderId: order.id }))
          .then(() => dispatch(listOrderDetails(order.id)));
      } else {
        alert("Failed to calculate distance.");
      }
    });
  };

  const handleEmptySubmit = () => {
    dispatch(updateOrder({ dataToUpdate: { empty_distance: emptyDistance }, orderId: order.id }));
    setEditEmptyMode(false);
  };

  const getDifferenceClass = (planned, factual) => {
    if (!planned || !factual) return "";
    const difference = parseFloat(orderFactData?.factual?.deltaPct || 0);
    if (difference <= 5) return "difference-good";
    if (difference <= 15) return "difference-warning";
    return "difference-bad";
  };

  const totalDistance = distance || order.distance + order.empty_distance || emptyDistance;

  return (
    <div className="route-cards">
      {/* Холостий пробіг */}
      <div
        className="route-card"
        onDoubleClick={() => !editModeOrder && setEditEmptyMode(true)}
      >
        <div className="route-card__header">
          <span className="route-card__title">Холостий пробіг</span>
          <button
            className="route-card__calc-btn"
            title="Порахувати холостий пробіг"
            onClick={(e) => { e.stopPropagation(); handleCalculateEmptyDistance(); }}
          >
            <FaCalculator />
          </button>
        </div>
        <div className="route-card__body">
          {(editEmptyMode || editModeOrder) ? (
            <>
              <InputComponent
                title="Введіть холостий пробіг"
                name="empty_distance"
                type="number"
                value={emptyDistance}
                onChange={(e) => setEmptyDistance(e.target.value)}
                autoFocus
                placeholder="Введіть холостий пробіг"
              />
              <FormButtonComponent
                onSave={handleEmptySubmit}
                onClose={setEditEmptyMode}
                setEditMode={setEditEmptyMode}
              />
            </>
          ) : (
            <div className="route-card__row">
              <span className="route-card__label">Відстань:</span>
              <span className="route-card__value">
                {orderFactData?.emptyDistance || order.empty_distance || 0} км
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Відстань по маршруту */}
      {order && (
        <div className="route-card">
          <div className="route-card__header">
            <span className="route-card__title">Відстань по маршруту</span>
            <button
              className="route-card__calc-btn"
              title="Порахувати відстань"
              onClick={calculateDistance}
            >
              <FaCalculator />
            </button>
          </div>
          <div className="route-card__body">
            <div className="route-card__row">
              <span className="route-card__label">Планова:</span>
              <span className="route-card__value">{totalDistance} км</span>
            </div>
            <div className="route-card__row">
              <span className="route-card__label">Фактична:</span>
              <span className="route-card__value">
                {orderFactData?.factual?.distance
                  ? `${orderFactData.factual.distance} км`
                  : "Не вказано"}
              </span>
            </div>
            {orderFactData?.factual?.distance && (
              <div className="route-card__row route-card__row--diff">
                <span className="route-card__label">Різниця:</span>
                <span className="route-card__diff-badges">
                  <span className={`route-card__diff-pct ${getDifferenceClass(order.distance || distance, orderFactData.factual.distance)}`}>
                    {orderFactData.factual.deltaPct}%
                  </span>
                  <span className="route-card__diff-km">({orderFactData.factual.deltaKm} км)</span>
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RouteComponent;
