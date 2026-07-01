import axios from "axios";
import { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { v4 as uuidv4 } from "uuid";
import Select from "react-select";

import {
  setAddTaskMode,
  setAddTaskNoOrderMode,
  setShowTaskModal,
  setTaskListNoOrder,
} from "../../../features/orders/ordersSlicers";

import {
  listOrderDetails,
  listOrders,
} from "../../../features/orders/ordersOperations";

import { listTaskTypes } from "../../../actions/taskTypeActions";
import { listPoints } from "../../../features/points/pointsOperations";
import { transformSelectOptions } from "../../../utils/transformers";
import { getCsrfToken } from "../../../utils/getCsrfToken";
import { setMapCurrentLocation } from "../../../actions/mapActions";
import { useJsApiLoader } from "@react-google-maps/api";
import { setMapOption } from "../../../utils/setMapOption";
import { listTrucks } from "../../../features/trucks/trucksOperations";
import { listDrivers } from "../../../features/drivers/driversOperations";

import Map from "../../Map";
import AddTaskFooterComponent from "../AddTaskFooterComponent/AddTaskFooterComponent";
import InputComponent from "../../../globalComponents/InputComponent";

import "../AddTaskComponent.scss";

const { REACT_APP_API_KEY: API_KEY } = import.meta.env;

function AddTaskNoOrderComponent({
  onCloseModal,
  defaultTruck = "",
  defaultDriver = "",
}) {
  const dispatch = useDispatch();

  const map = useSelector((state) => state.map);
  const currentLocation = useSelector((state) => state.map.currentLocation);
  const defaultCenter = useSelector((state) => state.map.defaultCenter);
  const order = useSelector((state) => state.ordersInfo.orderDetails.data);
  const task = useSelector((state) => state.ordersInfo.task.data);
  const editModeTask = useSelector(
    (state) => state.ordersInfo.task.editModeTask,
  );
  const addTaskMode = useSelector((state) => state.ordersInfo.addTaskMode);
  const addTaskNoOrderMode = useSelector(
    (state) => state.ordersInfo.addTaskNoOrderMode,
  );
  const trucks = useSelector((state) => state.trucksInfo.trucks.data);
  const drivers = useSelector((state) => state.driversInfo.drivers.data);
  const points = useSelector((state) => state.pointsInfo.points.data);
  const point = useSelector((state) => state.pointsInfo.point.data);
  const taskTypes = useSelector((state) => state.taskTypesInfo.taskTypes.data);

  const trucksOptions = transformSelectOptions(trucks, "plates");
  const driversOptions = transformSelectOptions(drivers, "full_name");
  const taskTypesOptions = taskTypes.map((t) => ({
    label: t.name_uk || t.name,
    value: t.name,
  }));

  const [tasks, setTasks] = useState(order.tasks || []);
  const [selectedTask, setSelectedTask] = useState(task);

  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [truck, setTruck] = useState("");
  const [driver, setDriver] = useState("");
  const [taskType, setTaskType] = useState({});
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: API_KEY,
    libraries: map.libraries,
  });

  // Convert API points to options format
  const pointOptions = points.map((point) => setMapOption(point));

  const selectedOption = useMemo(() => setMapOption(point), [point]);

  // Set task data if in edit mode
  useEffect(() => {
    if (editModeTask) {
      setTitle(task ? task.title : "");
      setStartDate(task ? task.start_date : "");
      setStartTime(task ? task.start_time : "");
      setEndDate(task ? task.end_date : "");
      setEndTime(task ? task.end_time : "");
      setTruck(task ? task.truck : "");
      setDriver(task ? task.driver : "");
      setTaskType(task ? task.type : "");
      setSelectedPoint(selectedOption);
    }
  }, [editModeTask, task, currentLocation, selectedOption]);

  useEffect(() => {
    if (addTaskMode) {
      setTitle("");
      setStartDate("");
      setStartTime("");
      setEndDate("");
      setEndTime("");
      setTruck(order.truck);
      setDriver(order.driver);
      setTaskType("");
      setSelectedPoint("");
    }
  }, [addTaskMode, order]);

  useEffect(() => {
    if (addTaskNoOrderMode) {
      setTitle("");
      setStartDate("");
      setStartTime("");
      setEndDate("");
      setEndTime("");
      setTruck(defaultTruck);
      setDriver(defaultDriver);
      setTaskType("");
      setSelectedPoint("");
    }
  }, [addTaskNoOrderMode, defaultTruck, defaultDriver]);

  // Set selected point
  useEffect(() => {
    if (selectedPoint && Object.keys(selectedPoint).length > 0) {
      dispatch(
        setMapCurrentLocation({
          lat: parseFloat(selectedPoint.gps_latitude),
          lng: parseFloat(selectedPoint.gps_longitude),
        }),
      );
      setTitle(selectedPoint.title);
    } else {
      dispatch(setMapCurrentLocation(defaultCenter));
    }
  }, [selectedPoint, defaultCenter, dispatch]);

  // Fetch CSRF token
  // useEffect(() => {
  //   getCsrfToken();
  // }, []);

  // Fetch data
  useEffect(() => {
    dispatch(listPoints());
    dispatch(listTaskTypes());
    dispatch(listTrucks());
    dispatch(listDrivers());
  }, [dispatch]);

  const handleTaskCreate = (taskData) => {
    setTasks((prevTasks) => [...prevTasks, taskData]);
  };

  const handleTaskUpdate = (taskId, taskData) => {
    setTasks((prevTasks) => {
      const newTasks = [...prevTasks];
      const taskIndex = newTasks.findIndex((task) => task.id === taskId);
      newTasks[taskIndex] = taskData;
      return newTasks;
    });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    const data = {
      title,
      start_date: startDate,
      start_time: startTime,
      end_date: endDate,
      end_time: endTime,
      truck: truck,
      driver: driver,
      order: order?.number, // Create a new order reference
      type: taskType?.value,
      point_details: selectedPoint,
      point_title: selectedPoint.title,
    };

    console.log("Data:", data);

    if (order && !editModeTask && !addTaskNoOrderMode) {
      try {
        // Create a new task object to avoid mutating the existing task
        const newTask = { ...task, ...data, order: order.number };
        const responseTask = await axios.post(`/api/tasks/create/`, newTask);
        handleTaskCreate(responseTask.data);
        dispatch(listOrderDetails(order.id));
        dispatch(setAddTaskMode(false));
      } catch (taskError) {
        console.error("Error creating task:", taskError.message);
      }
    }
    if (order && editModeTask) {
      try {
        // Create a new task object to avoid mutating the existing task
        const updatedTask = { ...task, ...data, order: order.number };
        const response = await axios.put(
          `/api/tasks/edit/${selectedTask.id}/`,
          updatedTask,
        );

        handleTaskUpdate(selectedTask.id, response.data);
        dispatch(setAddTaskMode(false));
      } catch (taskError) {
        console.error("Error creating task:", taskError.message);
      }
    }
    if (addTaskNoOrderMode) {
      // For cases where no order exists, create a new task with a generated ID
      const newTaskWithoutOrder = { ...data, id: uuidv4() };
      dispatch(setTaskListNoOrder(newTaskWithoutOrder));
      dispatch(setAddTaskNoOrderMode(false));
      dispatch(setShowTaskModal(false));
      console.log("TASK WITHOUT ORDER", newTaskWithoutOrder);
    }
  };

  return (
    <>
      <div className="add-task-container">
        <div className="add-task-details">
          <form onSubmit={handleFormSubmit} className="add-task-form">
            <div className="add-task-details__content">
              <div className="add-task-details__content-block">
                <div className="add-task-details__row">
                  <div className="add-task-details__content-row-block">
                    <label className="add-task-details__form-title">
                      Тип завдання
                    </label>

                    <Select
                      className="add-task-details__row-block"
                      value={taskType || null}
                      onChange={(selected) => setTaskType(selected)}
                      options={taskTypesOptions}
                      placeholder="Виберіть тип завдання"
                      isClearable
                      menuPortalTarget={document.body}
                      menuPosition="fixed"
                      styles={{
                        menuPortal: (base) => ({ ...base, zIndex: 13000 }),
                      }}
                    />
                  </div>
                </div>
                <div className="add-task-details__row">
                  <div className="add-task-details__content-row-block">
                    <InputComponent
                      label="Назва завдання"
                      placeholder="Введіть назву завдання"
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>
                </div>

                <div className="add-task-details__row">
                  <div className="add-task-details__content-row-block">
                    <InputComponent
                      label="Дата початку"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="add-task-details__content-row-block">
                    <InputComponent
                      label="Час початку"
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="add-task-details__row">
                  <div className="add-task-details__content-row-block">
                    <InputComponent
                      label="Дата завершення"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                  <div className="add-task-details__content-row-block">
                    <InputComponent
                      label="Час завершення"
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                    />
                  </div>
                </div>
                <div className="add-task-details__row">
                  <div className="add-task-details__content-row-block">
                    <label className="add-task-details__form-title">
                      Автомобіль
                    </label>
                    <Select
                      value={
                        trucksOptions.find((o) => o.value === truck) || null
                      }
                      onChange={(selected) => setTruck(selected?.value || "")}
                      options={trucksOptions}
                      placeholder="Виберіть авто"
                      isClearable
                      menuPortalTarget={document.body}
                      menuPosition="fixed"
                      styles={{
                        menuPortal: (base) => ({ ...base, zIndex: 13000 }),
                      }}
                    />
                  </div>
                  <div className="add-task-details__content-row-block">
                    <label className="add-task-details__form-title">
                      Водій
                    </label>
                    <Select
                      value={
                        driversOptions.find((o) => o.value === driver) || null
                      }
                      onChange={(selected) => setDriver(selected?.value || "")}
                      options={driversOptions}
                      placeholder="Виберіть водія"
                      isClearable
                      menuPortalTarget={document.body}
                      menuPosition="fixed"
                      styles={{
                        menuPortal: (base) => ({ ...base, zIndex: 13000 }),
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="add-task-details__content-block">
                <div className="add-task-details__row">
                  <div className="add-task-details__content-row-block">
                    <label className="add-task-details__form-title">
                      Пункти
                    </label>
                    <Select
                      className="add-task-details__row-block"
                      value={selectedPoint || ""}
                      onChange={(selected) => setSelectedPoint(selected)}
                      options={pointOptions}
                      isSearchable
                      placeholder="Пошук точки на карті..."
                      onMenuOpen={() => setIsDropdownOpen(true)}
                      onMenuClose={() => setIsDropdownOpen(false)}
                      menuIsOpen={isDropdownOpen}
                    />
                  </div>
                </div>
                <div className="add-task-details__content-row add-task-details__content-row_map">
                  <div className="add-task-details__content-row-block add-task-details__content-row-block-map">
                    {isLoaded ? (
                      <Map center={currentLocation || defaultCenter} />
                    ) : (
                      <h2>Loading...</h2>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <AddTaskFooterComponent onCloseModal={onCloseModal} />
          </form>
        </div>
      </div>
    </>
  );
}

export default AddTaskNoOrderComponent;
