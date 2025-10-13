import axios from "axios";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import { DirectionsService, useJsApiLoader } from "@react-google-maps/api";
import { getCsrfToken } from "../../utils/getCsrfToken";
import { getUserDetails } from "../../actions/userActions";
import { getRouteNoOrderTasks, getRouteTitle } from "../../utils/getRouteTitle";
import {
  clearTaskListNoOrder,
  setAddTaskNoOrderMode,
  setShowTaskModal,
  setTaskListNoOrder,
} from "../../features/orders/ordersSlicers";

import { selectCurrencies } from "../../features/currencies/currenciesSelectors";

import { listCurrencies } from "../../features/currencies/currenciesOperations";
import { listCustomers } from "../../features/customers/customersOperations";
import { listDrivers } from "../../actions/driverActions";
import { listPaymentTypes } from "../../actions/paymentTypeActions";
import { listPlatforms } from "../../actions/platformActions";
import { listTrucks } from "../../features/trucks/trucksOperations";

import AddOrderCustomerManagerComponent from "./AddOrderCustomerManagerComponent/AddOrderCustomerManagerComponent";
import AddTaskModalComponent from "../AddTask/AddTaskModalComponent/AddTaskModalComponent";
import CarrierComponent from "../../screens/OrderPage/CarrierComponent/CarrierComponent";
import Map from "../Map";
import AddOrderTaskComponent from "./AddOrderTaskComponent";

import "./AddOrder.scss";

const { REACT_APP_API_KEY: API_KEY } = import.meta.env;

function AddOrder() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const defaultCenter = useSelector((state) => state.map.defaultCenter);
  const map = useSelector((state) => state.map);

  const taskListNoOrder = useSelector(
    (state) => state.ordersInfo.taskListNoOrder.data
  );
  console.log("Task list no order", taskListNoOrder);

  const trucks = useSelector((state) => state.trucksInfo.trucks.data);
  const drivers = useSelector((state) => state.driversInfo.drivers.data);
  const customers = useSelector((state) => state.customersInfo.customers.data);
  const platforms = useSelector((state) => state.platformsInfo.platforms.data);
  const paymentTypes = useSelector(
    (state) => state.paymentTypesInfo.paymentTypes.data
  );
  const currencies = useSelector(selectCurrencies);

  const [center, setCenter] = useState(defaultCenter);
  const [editModeOrder, setEditModeOrder] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editModeTask, setEditModeTask] = useState(false);

  const [order, setOrder] = useState([]);
  const [tasks, setTasks] = useState(taskListNoOrder || []);

  const [selectedPlatform, setSelectedPlatform] = useState(null);

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [price, setPrice] = useState("");
  const [marketPrice, setMarketPrice] = useState("");
  const [paymentDays, setPaymentDays] = useState("");
  const [vat, setVat] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [cargoName, setCargoName] = useState("");
  const [cargoWeight, setCargoWeight] = useState("");
  const [cargoLoadingType, setCargoLoadingType] = useState("");
  const [trailerType, setTrailerType] = useState("");

  const [selectedTask, setSelectedTask] = useState({});
  const [selectedTruck, setSelectedTruck] = useState(null);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [selectedCustomerManager, setSelectedCustomerManager] = useState(null);
  const [selectedPaymentType, setSelectedPaymentType] = useState(null);
  const [selectedCurrency, setSelectedCurrency] = useState(null);
  const [selectedPoint, setSelectedPoint] = useState({});

  const [customerManagersList, setCustomerManagersList] = useState([]);

  const [origin, setOrigin] = useState();
  const [destination, setDestination] = useState();
  const [directionsResponse, setDirectionsResponse] = useState(null);
  const [distance, setDistance] = useState(null);
  const [duration, setDuration] = useState("");

  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: API_KEY,
    libraries: map.libraries,
  });

  useEffect(() => {
    dispatch(listTrucks());
    dispatch(listDrivers());
    dispatch(listCustomers());
    dispatch(listPlatforms());
    dispatch(listPaymentTypes());
    dispatch(listCurrencies());
  }, []);

  useEffect(() => {
    if (userInfo) {
      dispatch(getUserDetails(userInfo.id));
    }
  }, [userInfo]);

  useEffect(() => {
    if (taskListNoOrder.length > 0) {
      setTasks(taskListNoOrder);
    }
  }, [taskListNoOrder]);

  async function calculateRoute(origin, destination) {
    try {
      // eslint-disable-next-line no-undef
      const directionsService = new google.maps.DirectionsService();
      const results = await directionsService.route({
        origin: origin,
        destination: destination,
        // eslint-disable-next-line no-undef
        travelMode: google.maps.TravelMode.DRIVING,
      });
      return results.routes[0].legs[0].distance.value; // distance in meters
    } catch (error) {
      console.error("Error calculating route: ", error);
      return 0;
    }
  }

  const handleTaskCreate = (taskData) => {
    setTasks((prevTasks) => [...prevTasks, taskData]);
  };

  const handleAddTaskNoOrderButtonClick = () => {
    dispatch(setShowTaskModal(true));
    dispatch(setAddTaskNoOrderMode(true));
  };

  // useEffect(() => {
  //   getCsrfToken();
  // }, []);

  const calculateDistance = async () => {
    if (tasks.length < 2) return;

    let totalDistance = 0;
    for (let i = 0; i < tasks.length - 1; i++) {
      const origin = {
        lat: parseFloat(tasks[i].point_details.gps_latitude),
        lng: parseFloat(tasks[i].point_details.gps_longitude),
      };

      const destination = {
        lat: parseFloat(tasks[i + 1].point_details.gps_latitude),
        lng: parseFloat(tasks[i + 1].point_details.gps_longitude),
      };

      const distanceBetweenPoints = await calculateRoute(origin, destination);
      totalDistance += distanceBetweenPoints;
    }

    const distanceInKm = (totalDistance / 1000).toFixed();
    setDistance(distanceInKm);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    calculateDistance();

    let dataOrder = {
      user: userInfo.id,
      truck: selectedTruck,
      price: parseFloat(price),
      market_price: parseFloat(marketPrice),
      payment_period: parseInt(paymentDays),
      payment_type: selectedPaymentType,
      currency: selectedCurrency,
      vat: vat,
      driver: selectedDriver,
      customer: selectedCustomer,
      distance: distance ? parseInt(distance) : 0,
      customer_manager: selectedCustomerManager,
      cargo_name: cargoName,
      cargo_weight: cargoWeight,
      loading_type: cargoLoadingType,
      trailer_type: trailerType,
      order_number: orderNumber,
      platform: selectedPlatform,
    };
    console.log("Created order data", dataOrder);

    try {
      const responseOrder = await axios.post(`/api/orders/create/`, dataOrder);
      setOrder(responseOrder.data);
      console.log("Order CREATED successfully:", responseOrder.data);

      // Processing the task sequentially
      for (const task of taskListNoOrder) {
        // Create a new task object instead of mutating the existing one
        const updatedTask = {
          ...task,
          order: responseOrder.data.number,
        };
        try {
          const responseTask = await axios.post(
            `/api/tasks/create/`,
            updatedTask
          );
          handleTaskCreate(responseTask.data);
          dispatch(clearTaskListNoOrder());
        } catch (taskError) {
          console.error("Error creating task:", taskError.message);
        }
      }

      navigate(`/orders/${responseOrder.data.id}/`);
    } catch (error) {
      console.error("Error creating order:", error.message);
    }
  };

  useEffect(() => {
    const targetCustomer = customers.find(
      (customer) => customer.name === selectedCustomer
    );
    setCustomerManagersList(targetCustomer ? targetCustomer.managers : []);
    setSelectedCustomerManager(null);
  }, [customers, selectedCustomer]);

  const handleSelectTask = ({ task, editMode }) => {
    setEditMode(editMode);

    if (editMode) {
      setSelectedTask(task);
    }

    // handleModalShow();
  };

  const handleShowPointOnMap = (task) => {
    if (task && task.point_details) {
      const { gps_latitude, gps_longitude } = task.point_details;
      if (gps_latitude !== undefined && gps_longitude !== undefined) {
        setCenter({
          lat: parseFloat(gps_latitude),
          lng: parseFloat(gps_longitude),
        });
      } else {
        console.error("Latitude or longitude is undefined");
      }
    } else {
      console.error("Invalid order or missing details");
    }
  };

  const handleEditModeTask = (e, task) => {
    e.preventDefault();

    setEditModeTask(true);
    setSelectedTask(task);
    dispatch(setShowTaskModal(true));
    // setShowAddTaskModal(true);
  };

  const handleDeleteTask = async (e, taskId) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("Task to delete:", taskId);

    const taskToDelete = tasks.find((task) => task.id === taskId);
    if (taskToDelete) {
      console.log("Task deleted:", taskToDelete);

      const updatedTasks = tasks.filter((task) => task.id !== taskId);
      // setTasks(updatedTasks);
      dispatch(setTaskListNoOrder(updatedTasks));
    } else {
      console.log("Task not found:", taskId);
    }
  };

  const directionsServiceOptions = useMemo(() => {
    if (!tasks || tasks.length < 2) {
      return null;
    }

    const origin = {
      lat: parseFloat(tasks[0].point_details.gps_latitude || 0),
      lng: parseFloat(tasks[0].point_details.gps_longitude || 0),
    };

    const destination = {
      lat: parseFloat(tasks[tasks?.length - 1].point_details.gps_latitude || 0),
      lng: parseFloat(
        tasks[tasks?.length - 1].point_details.gps_longitude || 0
      ),
    };

    const waypoints =
      tasks &&
      tasks.slice(1, -1).map((task) => ({
        location: {
          lat: parseFloat(task.point_details.gps_latitude || 0),
          lng: parseFloat(task.point_details.gps_longitude || 0),
        },
        stopover: true,
      }));

    return {
      origin,
      destination,
      travelMode: "DRIVING",
      waypoints,
    };
  }, [tasks]);

  const directionsCallback = useCallback(
    (response) => {
      if (response !== null) {
        if (response.status === "OK") {
          setDirectionsResponse(response);
        } else {
          console.log("response: ", response);
        }
      }
    },
    [setDirectionsResponse]
  );

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <>
      <AddTaskModalComponent />
      <div className="order-container">
        <div className="add-order-details">
          <form onSubmit={(e) => handleFormSubmit(e)}>
            <div className="add-order-details__header">
              <div
                className="add-order-details__return-button"
                onClick={handleGoBack}
              >
                <FaArrowLeft />
              </div>
              <div className="add-order-details__header-block">
                Маршрут № {order.number}
              </div>
              {tasks.length > 0 && (
                <div className="add-order-details__header-block">
                  {getRouteNoOrderTasks(tasks)}
                </div>
              )}

              <div className="add-order-details__header-block">
                <div className="add-order-details__header-block_order-number">
                  Заявка
                </div>
                <input
                  className="form-field__input"
                  id="orderNumber"
                  name="orderNumber"
                  value={orderNumber}
                  placeholder="Номер заявки замовника"
                  onChange={(e) => setOrderNumber(e.target.value)}
                ></input>
              </div>
            </div>
            <div className="add-order-details__actions">
              <button
                type="button"
                className="add-order-details__action-add-task-btn"
                onClick={handleAddTaskNoOrderButtonClick}
              >
                Додати завдання
              </button>
            </div>

            <div className="add-order-details__content">
              <div className="add-order-details__content-block">
                <div className="add-order-details__content-row">
                  {/* <div className="add-order-details__content-row-block">
                    <div className="add-order-details__content-row-block-title">
                      Перевізник
                    </div>
                    <div className="add-order-details__content-row-block-value">
                      Delta Logistics SRO
                    </div>
                  </div> */}
                  <CarrierComponent />
                </div>
                <div className="add-order-details__content-row">
                  <div className="add-order-details__content-row-block">
                    <div className="add-order-details__content-row-block-title">
                      Автомобіль
                    </div>

                    {editModeOrder && (
                      <select
                        className="form-field__select form-select-mb10"
                        id="truck"
                        name="truck"
                        value={selectedTruck || ""}
                        onChange={(e) => setSelectedTruck(e.target.value)}
                      >
                        <option value={""}>Select truck</option>
                        {trucks.map((truck) => (
                          <option key={truck.id}>{truck.plates}</option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="add-order-details__content-row-block">
                    <div className="add-order-details__content-row-block-title">
                      Водій
                    </div>
                    {editModeOrder && (
                      <select
                        className="form-field__select form-select-mb10"
                        id="driver"
                        name="driver"
                        value={selectedDriver || ""}
                        onChange={(e) => setSelectedDriver(e.target.value)}
                      >
                        <option value={""}>Select driver</option>
                        {drivers &&
                          drivers.map((driver) => (
                            <option
                              key={driver.profile}
                              value={driver.full_name}
                            >
                              {driver.full_name}
                            </option>
                          ))}
                      </select>
                    )}
                  </div>
                </div>
                {taskListNoOrder.length > 0 && (
                  <div className="add-order-details__content-row">
                    <div className="add-order-details__content-row-block">
                      <AddOrderTaskComponent
                        handleShowPointOnMap={handleShowPointOnMap}
                        handleEditModeTask={handleEditModeTask}
                        handleDeleteTask={handleDeleteTask}
                      />
                    </div>
                  </div>
                )}
              </div>
              <div className="add-order-details__content-block">
                <div className="add-order-details__content-row">
                  <div className="add-order-details__content-row-block">
                    <div className="add-order-details__content-row-block-title">
                      Тариф
                    </div>
                    {editModeOrder && (
                      <div className="add-order-details__price-form-container">
                        <div className="add-order-details__form-col">
                          <input
                            id="price"
                            name="text"
                            className="form-field__input form-select-mb5"
                            value={price}
                            placeholder="Тариф"
                            onChange={(e) => setPrice(e.target.value)}
                          ></input>
                          <input
                            id="price"
                            name="text"
                            className="form-field__input form-select-mb5"
                            value={marketPrice}
                            placeholder="Ринковий тариф"
                            onChange={(e) => setMarketPrice(e.target.value)}
                          ></input>
                          <div className="checkbox-container">
                            <input
                              id="vat"
                              name="vat"
                              type="checkbox"
                              checked={vat}
                              onChange={(e) => setVat(e.target.checked)}
                            ></input>
                            <label
                              htmlFor="vat"
                              className="upload-documents__form-title"
                            >
                              ПДВ
                            </label>
                          </div>
                        </div>
                        <div className="add-order-details__form-col">
                          <input
                            id="paymentDays"
                            name="number"
                            className="form-field__input form-select-mb5"
                            value={paymentDays}
                            placeholder="Дні оплати"
                            onChange={(e) => setPaymentDays(e.target.value)}
                          ></input>
                          <select
                            id="payment-type"
                            name="payment-type"
                            className="form-field__select form-select-mb10"
                            value={selectedPaymentType || ""}
                            onChange={(e) =>
                              setSelectedPaymentType(e.target.value)
                            }
                          >
                            <option value={""}>Тип оплати</option>
                            {paymentTypes.map((paymentType) => (
                              <option key={paymentType.id}>
                                {paymentType.name}
                              </option>
                            ))}
                          </select>
                          <select
                            id="currency"
                            name="currency"
                            className="form-field__select form-select-mb10"
                            value={selectedCurrency || ""}
                            onChange={(e) =>
                              setSelectedCurrency(e.target.value)
                            }
                          >
                            <option value={""}>Валюта</option>
                            {currencies.map((currency) => (
                              <option key={currency.id}>
                                {currency.short_name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="add-order-details__content-row-block">
                    <div className="add-order-details__content-row-block-title">
                      Замовник
                    </div>
                    <select
                      className="form-field__select form-select-mb10"
                      id="customer"
                      name="customer"
                      value={selectedCustomer || ""}
                      onChange={(e) => setSelectedCustomer(e.target.value)}
                    >
                      <option value={""}>Select customer</option>

                      {customers &&
                        customers.map((customer) => (
                          <option key={customer.id}>{customer.name}</option>
                        ))}
                    </select>
                    <div className="add-order-details__content-row-block-title">
                      Платформа
                    </div>

                    {editModeOrder && (
                      <select
                        className="form-field__select form-select-mb10"
                        id="platform"
                        name="platform"
                        value={selectedPlatform || ""}
                        onChange={(e) => setSelectedPlatform(e.target.value)}
                      >
                        <option value={""}>Select platform</option>
                        {platforms.map((platform) => (
                          <option key={platform.id}>{platform.name}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
                <div className="add-order-details__content-row">
                  <div className="add-order-details__content-row-block">
                    <div className="add-order-details__content-row-block-title">
                      Вантаж
                    </div>
                    {editModeOrder && (
                      <div className="add-order-details__cargo-form-container">
                        <div className="add-order-details__form-col">
                          <input
                            id="weight"
                            name="weight"
                            placeholder="Вага"
                            className="form-field__input form-select-mb5"
                            value={cargoWeight}
                            onChange={(e) => setCargoWeight(e.target.value)}
                          ></input>
                          <input
                            id="cargoName"
                            name="cargoName"
                            placeholder="Назва вантажу"
                            className="form-field__input form-select-mb5"
                            // className="add-order-details__cargo-form-container__form-input"
                            value={cargoName}
                            onChange={(e) => setCargoName(e.target.value)}
                          ></input>
                        </div>
                        <div className="add-order-details__form-col">
                          <input
                            id="bodyType"
                            name="bodyType"
                            placeholder="Тип кузова"
                            className="form-field__input form-select-mb5"
                            value={trailerType}
                            onChange={(e) => setTrailerType(e.target.value)}
                          ></input>
                          <input
                            id="loadingType"
                            name="loadingType"
                            placeholder="Тип завантаження"
                            className="form-field__input form-select-mb5"
                            value={cargoLoadingType}
                            onChange={(e) =>
                              setCargoLoadingType(e.target.value)
                            }
                          ></input>
                        </div>
                      </div>
                    )}
                  </div>
                  <AddOrderCustomerManagerComponent
                    selectedCustomerManager={selectedCustomerManager}
                    setSelectedCustomerManager={setSelectedCustomerManager}
                    customerManagersList={customerManagersList}
                  />
                </div>
                <div className="add-order-details__content-row">
                  {taskListNoOrder.length > 0 && (
                    <div className="order-details__content-row-block order-details__content-row-block-map">
                      {isLoaded ? (
                        <>
                          {directionsServiceOptions && (
                            <DirectionsService
                              options={directionsServiceOptions}
                              callback={directionsCallback}
                            />
                          )}
                          <Map
                            tasks={taskListNoOrder}
                            center={center}
                            directionsResponse={directionsResponse}
                          />
                        </>
                      ) : (
                        <h2>Loading...</h2>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="add-order-details__footer">
              <button
                className="add-order-details__footer-btn add-order-details__footer-btn_save"
                type="submit"
              >
                Записати
              </button>
              <button
                className="add-order-details__footer-btn add-order-details__footer-btn_close"
                onClick={(e) => {
                  e.preventDefault();
                }}
              >
                <Link to="/orders-list">
                  <div>Закрити</div>
                </Link>
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default AddOrder;
