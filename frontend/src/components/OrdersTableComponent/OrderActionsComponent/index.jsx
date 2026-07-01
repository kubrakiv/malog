import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import {
  setSelectedDriver,
  setSelectedTruck,
  setSelectedCustomer,
} from "../../../features/orders/ordersSlicers";
import { getRoute } from "../../../features/orderImport/orderImportOperations";

import {
  FaCalendarAlt,
  FaFileAlt,
  FaPlus,
  FaSyncAlt,
  FaTimes,
  FaTrash,
  FaTruckMoving,
  FaUserCog,
  FaUsers,
} from "react-icons/fa";
import { selectTrucks } from "../../../features/trucks/trucksSelectors";
import { transformSelectOptions } from "../../../utils/transformers";

import SelectComponent from "../../../globalComponents/SelectComponent";

import "./style.scss";

const OrderActionsComponent = ({
  onDelete,
  onRefresh,
  selectedDriver,
  selectedTruck,
  selectedCustomer,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const trucks = useSelector(selectTrucks);
  const drivers = useSelector((state) => state.driversInfo.drivers.data);
  const customers = useSelector((state) => state.customersInfo.customers.data);

  const driverOptions = transformSelectOptions(drivers, "full_name");
  const truckOptions = transformSelectOptions(trucks, "plates");
  const customerOptions = transformSelectOptions(customers, "name");

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDriverShow, setIsDriverShow] = useState(false);
  const [isTruckShow, setIsTruckShow] = useState(false);
  const [isCustomerShow, setIsCustomerShow] = useState(false);
  const [isCalendarShow, setIsCalendarShow] = useState(false);
  const [sovtesRouteNumber, setSovtesRouteNumber] = useState("");
  const [isCreatingSovtesRoute, setIsCreatingSovtesRoute] = useState(false);

  const handleDriverSelect = () => {
    setIsDriverShow(!isDriverShow);
    if (selectedDriver) {
      dispatch(setSelectedDriver(""));
    }
  };

  const handleTruckSelect = () => {
    setIsTruckShow(!isTruckShow);
    if (selectedTruck) {
      dispatch(setSelectedTruck(""));
    }
  };

  const handleCustomerSelect = () => {
    setIsCustomerShow(!isCustomerShow);
    if (selectedCustomer) {
      dispatch(setSelectedCustomer(""));
    }
  };

  const handleCalendarSelect = () => {
    setIsCalendarShow(!isCalendarShow);
    if (!isCalendarShow) {
      onStartDateChange(null);
    }
  };

  const handleRefresh = async () => {
    if (!onRefresh || isRefreshing) return;
    setIsRefreshing(true);
    await onRefresh();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const handleAddOrderButtonClick = () => {
    navigate("/orders/add/");
  };

  const handleCreateSovtesRoute = async (event) => {
    event.preventDefault();
    const routeId = sovtesRouteNumber.trim();

    if (!routeId) {
      toast.error("Вкажіть номер маршруту Sovtes");
      return;
    }

    setIsCreatingSovtesRoute(true);
    try {
      const response = await dispatch(getRoute({ routeId, platform: "sovtes" })).unwrap();
      toast.success(response.message || "Маршрут створено");
      setSovtesRouteNumber("");
      if (onRefresh) await onRefresh();
    } catch (error) {
      toast.error(error?.error || "Не вдалося створити маршрут");
    } finally {
      setIsCreatingSovtesRoute(false);
    }
  };

  return (
    <>
      <div className="order-actions">
        <form
          className="order-actions__sovtes-route-form"
          onSubmit={handleCreateSovtesRoute}
        >
          <input
            className="order-actions__sovtes-route-input"
            type="text"
            value={sovtesRouteNumber}
            onChange={(event) => setSovtesRouteNumber(event.target.value)}
            placeholder="18359-06-26"
            aria-label="Номер маршруту Sovtes"
          />
          <button
            className="order-actions__create-sovtes-route-btn"
            type="submit"
            title="+створити маршрут"
            disabled={isCreatingSovtesRoute}
          >
            <FaPlus />
            <span>{isCreatingSovtesRoute ? "Створення..." : "створити маршрут"}</span>
          </button>
        </form>
        <button
          className="order-actions__add-order-btn"
          onClick={handleAddOrderButtonClick}
          title="Додати маршрут"
        >
          <FaFileAlt />
        </button>
        <button
          className={`order-actions__refresh-btn${isRefreshing ? " order-actions__refresh-btn--spinning" : ""}`}
          onClick={handleRefresh}
          title="Оновити"
          disabled={isRefreshing}
        >
          <FaSyncAlt />
        </button>
        <button
          className="order-actions__find-driver-btn"
          onClick={handleDriverSelect}
          title="Вибрати водія"
        >
          <FaUserCog />
        </button>
        {isDriverShow && (
          <div className="order-actions__find-driver-select">
            <SelectComponent
              title="Виберіть водія"
              type="text"
              value={selectedDriver || ""}
              onChange={(e) => dispatch(setSelectedDriver(e.target.value))}
              options={driverOptions}
            />
          </div>
        )}
        <button
          className="order-actions__find-truck-btn"
          onClick={handleTruckSelect}
          title="Вибрати тягач"
        >
          <FaTruckMoving />
        </button>
        {isTruckShow && (
          <div className="order-actions__find-driver-select">
            <SelectComponent
              title="Виберіть тягач"
              type="text"
              value={selectedTruck || ""}
              onChange={(e) => dispatch(setSelectedTruck(e.target.value))}
              options={truckOptions}
              className="styled-select-component"
            />
          </div>
        )}
        {selectedTruck && (
          <button
            className="order-actions__clear-btn"
            onClick={() => dispatch(setSelectedTruck(""))}
            title="Відмінити"
          >
            <FaTimes />
          </button>
        )}
        <button
          className="order-actions__calendar-btn"
          onClick={handleCalendarSelect}
          title="Вибрати період"
        >
          <FaCalendarAlt />
        </button>
        {isCalendarShow && (
          <div className="order-actions__date-filter">
            <DatePicker
              selected={startDate}
              onChange={onStartDateChange}
              placeholderText="Select Start Date"
              className="date-picker styled-date-picker"
              dateFormat="dd.MM.yyyy"
              isClearable
            />
            <DatePicker
              selected={endDate}
              onChange={onEndDateChange}
              placeholderText="Select End Date"
              className="date-picker styled-date-picker"
              dateFormat="dd.MM.yyyy"
              isClearable
            />
          </div>
        )}
        <button
          className="order-actions__find-customer-btn"
          onClick={handleCustomerSelect}
          title="Вибрати замовника"
        >
          <FaUsers />
        </button>
        {isCustomerShow && (
          <div className="order-actions__find-customer-select">
            <SelectComponent
              title="Виберіть замовника"
              type="text"
              value={selectedCustomer || ""}
              onChange={(e) => dispatch(setSelectedCustomer(e.target.value))}
              options={customerOptions}
              className="styled-select-component"
            />
          </div>
        )}
        <button
          className="order-actions__delete-order-btn"
          onClick={onDelete}
          title="Видалити маршрут"
        >
          <FaTrash />
        </button>
      </div>
    </>
  );
};

export default OrderActionsComponent;
