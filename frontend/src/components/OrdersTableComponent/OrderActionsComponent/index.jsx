import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import { setEditModeDocument } from "../../../reducers/documentReducers";
import { listOrders } from "../../../features/orders/ordersOperations";

import {
  setAddTaskMode,
  setSelectedDriver,
  setSelectedTruck,
  setSelectedCustomer,
} from "../../../features/orders/ordersSlicers";

import {
  FaCalendarAlt,
  FaCopy,
  FaFileAlt,
  FaFolder,
  FaSave,
  FaTimes,
  FaTrash,
  FaTruck,
  FaTruckMoving,
  FaUserCog,
  FaUsers,
} from "react-icons/fa";
import { TbApi } from "react-icons/tb";
import { selectTrucks } from "../../../features/trucks/trucksSelectors";
import { transformSelectOptions } from "../../../utils/transformers";

import SelectComponent from "../../../globalComponents/SelectComponent";

import "./style.scss";
import {
  getAllRoutes,
  getRoute,
} from "../../../features/orderImport/orderImportOperations";
import InputComponent from "../../../globalComponents/InputComponent";

const OrderActionsComponent = ({
  onDelete,
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
  const editModeDocument = useSelector((state) => state.documentsInfo.editMode);

  const trucks = useSelector(selectTrucks);
  const drivers = useSelector((state) => state.driversInfo.drivers.data);
  const customers = useSelector((state) => state.customersInfo.customers.data);

  const driverOptions = transformSelectOptions(drivers, "full_name");
  const truckOptions = transformSelectOptions(trucks, "plates");
  const customerOptions = transformSelectOptions(customers, "name");

  const [isDriverShow, setIsDriverShow] = useState(false);
  const [isTruckShow, setIsTruckShow] = useState(false);
  const [isCustomerShow, setIsCustomerShow] = useState(false);
  const [isCalendarShow, setIsCalendarShow] = useState(false);
  const [isRouteInputShow, setIsRouteInputShow] = useState(false);

  const [orderNumber, setOrderNumber] = useState("");

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

  const handleRouteInputSelect = () => {
    setIsRouteInputShow(!isRouteInputShow);
    if (orderNumber) {
      setOrderNumber("");
    }
  };

  const handleDocumentModalOpen = () => {
    dispatch(setEditModeDocument(!editModeDocument));
  };

  const handleImportOrderApi = (routeId, platform) => {
    const data = { routeId: routeId, platform: platform };

    dispatch(getRoute(data))
      .unwrap() // Wait for the async thunk to resolve or reject
      .then((response) => {
        // Success toast
        toast.success(response.message || "Order imported successfully!");

        // Dispatch listOrders only after getRoute is successfully resolved
        dispatch(listOrders());
      })
      .catch((error) => {
        // Log or handle specific error messages returned by the backend
        if (error.error) {
          toast.error(`Error: ${error.error}`);
        } else {
          toast.error("An unexpected error occurred. Please try again.");
        }
      });
  };

  const handleGetAllSovtesRoutes = async () => {
    const result = await dispatch(getAllRoutes()).unwrap();
    console.log("Get all routes result:", result);
  };

  // const handleAddTaskButtonClick = (e) => {
  //   e.stopPropagation();
  //   dispatch(setAddTaskMode(true));
  // };

  const handleAddOrderButtonClick = () => {
    console.log("Add order button clicked");
    navigate("/orders/add/");
  };

  return (
    <>
      <div className="order-actions order-details">
        <button
          className="order-actions__add-order-btn"
          onClick={handleAddOrderButtonClick}
          title="Додати маршрут"
        >
          <FaFileAlt />
        </button>
        {/* <button
          className="order-actions__copy-order-btn"
          //   onClick={handleAddTaskButtonClick}
          title="Копіювати маршрут"
        >
          <FaCopy />
        </button>
        <button
          className="order-actions__add-documents-btn"
          onClick={handleDocumentModalOpen}
          title="Додати документи"
        >
          <FaFolder />
        </button> */}
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
        {/* {selectedDriver && (
          <button
            className="order-actions__clear-btn"
            onClick={() => dispatch(setSelectedDriver(""))}
            title="Відмінити"
          >
            <FaTimes />
          </button>
        )} */}
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
          className="order-actions__add-documents-btn"
          // onClick={() => handleImportOrderApi("sovtes")}
          onClick={handleRouteInputSelect}
          title="Завантажити маршрут з Совтес"
        >
          <TbApi />
          {"Sovtes"}
        </button>

        {isRouteInputShow && (
          <div className="order-actions__date-filter">
            <InputComponent
              type="text"
              id="orderNumber"
              name="orderNumber"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="Введіть номер маршруту"
              autoFocus
              style="form-field__input"
            />
            <button
              type="button"
              className="order-actions__add-order-btn"
              onClick={() => handleImportOrderApi(orderNumber, "sovtes")}
            >
              <FaSave />
            </button>
            <button
              type="button"
              className="order-actions__clear-btn-order-number"
              onClick={() => handleRouteInputSelect()}
              title="Відмінити"
            >
              <FaTimes />
            </button>
          </div>
        )}
        <button
          className="order-details__action-open-invoice-btn"
          onClick={handleGetAllSovtesRoutes}
          title="Отримати всі маршрути з SOVTES"
        >
          <FaTruck /> SOVTES Routes
        </button>
        {/* <button
          className="order-actions__add-documents-btn"
          onClick={() => handleImportOrderApi("lkw")}
          title="Завантажити маршрут з LKW"
        >
          <TbApi />
          {"LKW"}
        </button> */}
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
