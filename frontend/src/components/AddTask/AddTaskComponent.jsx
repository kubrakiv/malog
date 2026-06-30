import { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { v4 as uuidv4 } from "uuid";
import { useJsApiLoader } from "@react-google-maps/api";
import { listPoints } from "../../features/points/pointsOperations";
import { listTaskTypes } from "../../actions/taskTypeActions";
import { setMapCurrentLocation } from "../../actions/mapActions";
import {
  setAddTaskMode,
  setShowTaskModal,
} from "../../features/orders/ordersSlicers";

import { listOrderDetails } from "../../features/orders/ordersOperations";

import { setMapOption } from "../../utils/setMapOption";
import { transformSelectOptions } from "../../utils/transformers";

import SelectComponent from "../../globalComponents/SelectComponent";
import Map from "../Map";
import Select from "react-select";
import AddTaskFooterComponent from "./AddTaskFooterComponent/AddTaskFooterComponent";
import InputComponent from "../../globalComponents/InputComponent";

import "./AddTaskComponent.scss";

import { createTask, updateTask } from "../../features/tasks/tasksOperations";
import { selectSelectedPoint } from "../../features/points/pointsSelectors";
import { setSelectedPoint } from "../../features/points/pointsSlice";

const { REACT_APP_API_KEY: API_KEY } = import.meta.env;

function AddTaskComponent({ onCloseModal, initialTaskData = null }) {
  const dispatch = useDispatch();

  const selectedPoint = useSelector(selectSelectedPoint);
  const map = useSelector((state) => state.map);

  const currentLocation = useSelector((state) => state.map.currentLocation);
  const defaultCenter = useSelector((state) => state.map.defaultCenter);

  const order = useSelector((state) => state.ordersInfo.orderDetails.data);
  const task = useSelector((state) => state.ordersInfo.task.data);

  const editModeTask = useSelector(
    (state) => state.ordersInfo.task.editModeTask
  );
  const addTaskMode = useSelector((state) => state.ordersInfo.addTaskMode);
  const trucks = useSelector((state) => state.trucksInfo.trucks.data);
  const drivers = useSelector((state) => state.driversInfo.drivers.data);
  const points = useSelector((state) => state.pointsInfo.points.data);
  const point = useSelector((state) => state.pointsInfo.point.data);
  const taskTypes = useSelector((state) => state.taskTypesInfo.taskTypes.data);

  const trucksOptions = transformSelectOptions(trucks, "plates");
  const driversOptions = transformSelectOptions(drivers, "full_name");
  const taskTypesOptions = useMemo(
    () => taskTypes.map((t) => ({ value: t.name, label: t.name_uk || t.name })),
    [taskTypes]
  );

  const [center, setCenter] = useState({ lat: 0, lng: 0 });

  const [title, setTitle] = useState("");
  const [taskType, setTaskType] = useState({});
  const [driver, setDriver] = useState("");
  const [truck, setTruck] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: API_KEY,
    libraries: map.libraries,
  });

  // Convert API points to options format
  const pointOptions = points.map((point) => setMapOption(point));
  const selectedOptions = useMemo(() => setMapOption(point), [point]);

  // Set task data if in edit mode
  useEffect(() => {
    const data = initialTaskData || task; // Use initialTaskData if available
    if (editModeTask && data) {
      console.log("Task in edit mode:", data);
      setTitle(data ? data.title : "");
      setStartDate(data ? data.start_date : "");
      setStartTime(data ? data.start_time : "");
      setEndDate(data ? data.end_date : "");
      setEndTime(data ? data.end_time : "");
      setTruck(data ? data.truck : "");
      setDriver(data ? data.driver : "");

      const taskTypeOption = taskTypes.find((type) => type.name === data?.type);
      setTaskType(
        taskTypeOption
          ? { value: taskTypeOption.name, label: taskTypeOption.name_uk || taskTypeOption.name }
          : {}
      );
      dispatch(setSelectedPoint(selectedOptions));
    }
  }, [editModeTask, initialTaskData, task, selectedOptions, taskTypes]);

  useEffect(() => {
    if (addTaskMode) {
      setTitle("");
      setStartDate("");
      setStartTime("");
      setEndDate("");
      setEndTime("");
      setTruck(order.truck);
      setDriver(order.driver);
      setTaskType({});
      dispatch(setSelectedPoint({}));
    }
  }, [addTaskMode, order]);

  // Set selected point and center on map
  useEffect(() => {
    if (selectedPoint && Object.keys(selectedPoint).length > 0) {
      dispatch(
        setMapCurrentLocation({
          lat: parseFloat(selectedPoint.gps_latitude),
          lng: parseFloat(selectedPoint.gps_longitude),
        })
      );
      setTitle(selectedPoint.title);
    } else {
      dispatch(
        setMapCurrentLocation({
          lat: parseFloat(defaultCenter.lat),
          lng: parseFloat(defaultCenter.lng),
        })
      );
    }
  }, [selectedPoint, defaultCenter, dispatch]);

  // Fetch points and task types
  useEffect(() => {
    dispatch(listPoints());
    dispatch(listTaskTypes());
  }, [dispatch]);

  console.log("Task Types", taskTypes);

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
      order: order || order.number, // Create a new order reference
      type: taskType?.value,
      point_details: selectedPoint,
      point_title: selectedPoint.title,
    };

    console.log("Data:", data);

    if (order && !editModeTask) {
      try {
        const newTask = { ...task, ...data, order: order.number };
        await dispatch(createTask(newTask)).unwrap();

        dispatch(setAddTaskMode(false));
        dispatch(setShowTaskModal(false));
        dispatch(listOrderDetails(order.id));
      } catch (taskError) {
        console.error("Error creating task:", taskError.message);
      }
    }
    if (order && editModeTask) {
      try {
        const updatedTask = { ...task, ...data, order: order.number };
        await dispatch(updateTask(updatedTask)).unwrap();

        dispatch(setAddTaskMode(false));
        dispatch(setShowTaskModal(false));
        dispatch(listOrderDetails(order.id));
      } catch (taskError) {
        console.error("Error updating task:", taskError.message);
      }
    }
    if (!order) {
      // For cases where no order exists, create a new task with a generated ID
      const newTaskWithoutOrder = { ...data, id: uuidv4() };
      handleTaskCreate(newTaskWithoutOrder);
      dispatch(setAddTaskMode(false));
      dispatch(setShowTaskModal(false));
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
                      value={
                        Object.keys(taskType).length === 0 ? null : taskType
                      }
                      onChange={(selected) => setTaskType(selected)}
                      options={taskTypesOptions}
                      isSearchable
                      placeholder="Виберіть тип завдання"
                    />
                  </div>
                </div>
                <div className="add-task-details__row">
                  <div className="add-task-details__content-row-block">
                    <InputComponent
                      label={"Назва завдання"}
                      title={"Введіть назву завдання"}
                      placeholder="Введіть назву завдання"
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="add-task-details__row">
                  <div className="add-task-details__content-row-block">
                    <InputComponent
                      label={"Дата початку"}
                      title={"Введіть дату початку"}
                      placeholder="Введіть дату початку"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="add-task-details__content-row-block">
                    <InputComponent
                      label={"Час початку"}
                      title={"Введіть час початку"}
                      placeholder="Введіть час початку"
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
                      label={"Дата завершення"}
                      title={"Введіть дату завершення"}
                      placeholder="Введіть дату завершення"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                  <div className="add-task-details__content-row-block">
                    <InputComponent
                      label={"Час завершення"}
                      title={"Введіть час завершення"}
                      placeholder="Введіть час завершення"
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                    />
                  </div>
                </div>
                <div className="add-task-details__row">
                  <div className="add-task-details__content-row-block">
                    <SelectComponent
                      label={"Автомобіль"}
                      title={"Виберіть авто"}
                      key="truck"
                      id="truck"
                      name="truck"
                      value={truck || ""}
                      placeholder="Виберіть авто"
                      onChange={(e) => setTruck(e.target.value)}
                      options={trucksOptions}
                    />
                  </div>
                  <div className="add-task-details__content-row-block">
                    <SelectComponent
                      label={"Водій"}
                      title={"Виберіть водія"}
                      key="driver"
                      id="driver"
                      name="driver"
                      value={driver || ""}
                      placeholder="Виберіть водія"
                      onChange={(e) => setDriver(e.target.value)}
                      options={driversOptions}
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
                      // value={selectedPoint ? selectedPoint : null}
                      onChange={(selected) =>
                        dispatch(setSelectedPoint(selected))
                      }
                      options={pointOptions}
                      isSearchable
                      placeholder="Пошук точки на карті..."
                      onMenuOpen={() => setIsDropdownOpen(true)}
                      onMenuClose={() => setIsDropdownOpen(false)}
                      menuIsOpen={isDropdownOpen}
                    />
                  </div>
                </div>
                <div className="add-task-details__row">
                  <div className="add-task-details__row-block">
                    <div className="add-task-details__content-row-block add-task-details__content-row-block-map">
                      {isLoaded ? <Map center={center} /> : <h2>Loading...</h2>}
                    </div>
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

export default AddTaskComponent;
