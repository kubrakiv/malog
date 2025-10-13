import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";

import { getISOWeek, parseISO, getYear } from "date-fns";
import { generateDatesArray } from "./dateFunctions";

import {
  FaAngleDown,
  FaAngleUp,
  FaFileAlt,
  FaTrailer,
  FaTruck,
} from "react-icons/fa";

import {
  setSwitchers,
  setSelectedTask,
  setShowStartTimeModal,
  setShowEndTimeModal,
  setShowServiceTaskModal,
  setEditModeServiceTask,
  setSelectedTruck,
  setSelectedDriver,
  setSelectedDate,
} from "../../features/planner/plannerSlice";

import { selectSwitchers } from "../../features/planner/plannerSelectors";

import { listDrivers } from "../../actions/driverActions";
import { listTaskTypes } from "../../actions/taskTypeActions";
import {
  deleteTask,
  listTasks,
  listTasksByWeek,
} from "../../features/tasks/tasksOperations";
import { selectTrucks } from "../../features/trucks/trucksSelectors";
import { listTrucks } from "../../features/trucks/trucksOperations";
import { selectTasksByWeek } from "../../features/tasks/tasksSelectors";

import DayTasks from "../Tasks/DayTasks";
import WeekSwitcherComponent from "../WeekSwitcherComponent/WeekSwitcherComponent";
import WeekDateComponent from "../WeekDateComponent/WeekDateComponent";
import EndTimeModalComponent from "./EndTimeModalComponent/EndTimeModalComponent";
import StartTimeModalComponent from "./StartTimeModalComponent/StartTimeModalComponent";
import ServiceTaskModalComponent from "./ServiceTaskModalComponent/ServiceTaskModalComponent";
import SwitchComponent from "../SwitchComponent/SwitchComponent";
import TruckOnMapModalComponent from "./TruckOnMapModalComponent";

import "./WeekPlanner.scss";

export const WeekPlanner = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const currentYear = parseInt(searchParams.get("year")) || getYear(new Date());
  const currentWeek =
    parseInt(searchParams.get("week")) || getISOWeek(new Date());

  const [week, setWeek] = useState(currentWeek);
  const [year, setYear] = useState(currentYear);

  const { showDriver, showOrderNumber, showCustomer, showTaskType } =
    useSelector(selectSwitchers);

  const trucks = useSelector(selectTrucks);

  const tasksByWeek = useSelector(selectTasksByWeek);
  const currentKey = `${year}-${week}`;
  const tasks = tasksByWeek[currentKey] || [];

  // Create placeholder trucks for new clients
  const createPlaceholderTrucks = () => {
    return [
      {
        id: "placeholder-1",
        plates: "Add Truck 1",
        trailer: null,
        driver_details: {
          full_name: "Add Driver 1",
          phone_number: "+38 (0XX) XXX-XX-XX",
        },
        end_date: null,
        isPlaceholder: true,
      },
      {
        id: "placeholder-2",
        plates: "Add Truck 2",
        trailer: null,
        driver_details: {
          full_name: "Add Driver 2",
          phone_number: "+38 (0XX) XXX-XX-XX",
        },
        end_date: null,
        isPlaceholder: true,
      },
      {
        id: "placeholder-3",
        plates: "Add Truck 3",
        trailer: null,
        driver_details: {
          full_name: "Add Driver 3",
          phone_number: "+38 (0XX) XXX-XX-XX",
        },
        end_date: null,
        isPlaceholder: true,
      },
    ];
  };

  // Create placeholder tasks for the first placeholder truck
  const createPlaceholderTasks = (weekDatesArray) => {
    const placeholderTasks = [];

    weekDatesArray.forEach((date, index) => {
      const dateStr = date[1]; // Get the date string

      switch (index) {
        case 0: // Monday
          placeholderTasks.push({
            id: `placeholder-task-${index}-1`,
            start_date: dateStr,
            start_time: "06:55",
            end_time: "08:00",
            truck: "Add Truck 1",
            type: "Завантаження",
            order_number: "CZ-25090",
            customer: "Praha-východ",
            isPlaceholder: true,
            color: "#4169E1", // Blue
          });
          break;
        case 1: // Tuesday
          placeholderTasks.push({
            id: `placeholder-task-${index}-1`,
            start_date: dateStr,
            start_time: "08:00",
            end_time: "10:00",
            truck: "Add Truck 1",
            type: "Сервіс",
            order_number: "Шиномонтаж",
            customer: "",
            isPlaceholder: true,
            color: "#DC143C", // Red
          });
          break;
        case 2: // Wednesday
          placeholderTasks.push({
            id: `placeholder-task-${index}-1`,
            start_date: dateStr,
            start_time: "13:00",
            end_time: "15:00",
            truck: "Add Truck 1",
            type: "Розвантаження",
            order_number: "IT-28047",
            customer: "Oleggio",
            isPlaceholder: true,
            color: "#8A2BE2", // Purple
          });
          break;
        case 3: // Thursday
          placeholderTasks.push({
            id: `placeholder-task-${index}-1`,
            start_date: dateStr,
            start_time: "08:00",
            end_time: "12:00",
            truck: "Add Truck 1",
            type: "Завантаження",
            order_number: "IT-24020",
            customer: "Casnigo",
            isPlaceholder: true,
            color: "#FFD700", // Yellow
          });
          break;
        case 4: // Friday
          placeholderTasks.push({
            id: `placeholder-task-${index}-1`,
            start_date: dateStr,
            start_time: "09:00",
            end_time: "17:00",
            truck: "Add Truck 1",
            type: "Дорога",
            order_number: "IT-CZ",
            customer: "",
            isPlaceholder: true,
            color: "#32CD32", // Green
          });
          break;
        case 5: // Saturday
          placeholderTasks.push({
            id: `placeholder-task-${index}-1`,
            start_date: dateStr,
            start_time: "00:00",
            end_time: "23:59",
            truck: "Add Truck 1",
            type: "Вихідні",
            order_number: "ВИХІДНІ",
            customer: "",
            isPlaceholder: true,
            color: "#FF8C00", // Orange
          });
          break;
        case 6: // Sunday
          placeholderTasks.push({
            id: `placeholder-task-${index}-1`,
            start_date: dateStr,
            start_time: "00:00",
            end_time: "23:59",
            truck: "Add Truck 1",
            type: "Вихідні",
            order_number: "ВИХІДНІ",
            customer: "",
            isPlaceholder: true,
            color: "#FF8C00", // Orange
          });
          break;
        default:
          break;
      }
    });

    return placeholderTasks;
  };

  const date = new Date();

  const [expandedTruckId, setExpandedTruckId] = useState(null);

  const [datesArray, setDatesArray] = useState(
    generateDatesArray(date, week, year)
  );

  // Use real trucks if available, otherwise use placeholders
  const displayTrucks = trucks.length > 0 ? trucks : createPlaceholderTrucks();
  const placeholderTasks =
    trucks.length === 0 ? createPlaceholderTasks(datesArray) : [];

  console.log("tasks", tasks);
  console.log("tasksByWeek", tasksByWeek);
  console.log("placeholderTasks", placeholderTasks);
  const [isToggledDriver, setIsToggledDriver] = useState(false);
  const [isToggledOrderNumber, setIsToggledOrderNumber] = useState(false);
  const [isToggledCustomer, setIsToggledCustomer] = useState(false);
  const [isToggledTaskType, setIsToggledTaskType] = useState(false);
  console.log("DATES ARRAY", datesArray);

  useEffect(() => {
    dispatch(listTrucks());
    dispatch(listDrivers());
    dispatch(listTaskTypes());
  }, []);

  const keysToPrefetch = useMemo(() => {
    return [`${year}-${week - 1}`, `${year}-${week}`, `${year}-${week + 1}`];
  }, [year, week]);

  useEffect(() => {
    keysToPrefetch.forEach((key) => {
      const [y, w] = key.split("-").map(Number);
      if (w > 0 && w <= 52 && !tasksByWeek[key]) {
        dispatch(listTasksByWeek({ year: y, week: w }));
      }
    });
  }, [dispatch, keysToPrefetch]);

  const handleAddRouteBtn = () => {
    navigate("/orders/add");
  };

  const handlePlaceholderTruckClick = (e) => {
    e.stopPropagation();
    navigate("/vehicles");
  };

  const handlePlaceholderDriverClick = (e) => {
    e.stopPropagation();
    navigate("/drivers");
  };

  const handleWeekChange = (newWeek) => {
    setWeek(newWeek);
    navigate(`/planner?year=${year}&week=${newWeek}`);
    setDatesArray(generateDatesArray(date, newWeek, year));
  };

  const handleYearChange = (newYear) => {
    setYear(newYear);
    navigate(`/planner?year=${newYear}&week=${week}`);
  };

  const handleTruckDateSelect = ({ truckId, dayNumber }) => {
    const truck = displayTrucks.find((truck) => truck.id === truckId);

    // Don't allow task creation for placeholder trucks
    if (truck?.isPlaceholder) {
      alert(
        "Please add real trucks to the system before creating tasks. Click on the truck placeholder to add vehicles or on the driver placeholder to add drivers."
      );
      return;
    }

    dispatch(setSelectedTruck(truck));
    dispatch(setSelectedDate(datesArray[dayNumber]));
    dispatch(setSelectedDriver(truck.driver_details));
    dispatch(setShowServiceTaskModal(true));
  };

  const handleEditModeTask = (e, task) => {
    e.preventDefault();

    dispatch(setSelectedTask(task));
    dispatch(setEditModeServiceTask(true));
    dispatch(setShowServiceTaskModal(true));
  };

  const handleStartTime = (task) => {
    dispatch(setShowStartTimeModal(true));
    dispatch(setSelectedTask(task));
  };

  const handleEndTime = (task) => {
    dispatch(setShowEndTimeModal(true));
    dispatch(setSelectedTask(task));
  };

  const handleDeleteTask = async (e, taskId) => {
    e.stopPropagation();

    const isConfirmed = window.confirm(
      "Ви впевнені, що хочете видалити задачу?"
    );

    if (!isConfirmed) {
      return;
    }

    dispatch(deleteTask(taskId));
  };

  const toggleDetails = (truckId) => {
    setExpandedTruckId((prevTruckId) =>
      prevTruckId === truckId ? null : truckId
    );
  };

  const handleShowDriver = () => {
    dispatch(setSwitchers({ showDriver: !showDriver }));
    setIsToggledDriver(!isToggledDriver);
  };

  const handleShowOrderNumber = () => {
    dispatch(setSwitchers({ showOrderNumber: !showOrderNumber }));
    setIsToggledOrderNumber(!isToggledOrderNumber);
  };

  const handleShowCustomer = () => {
    dispatch(setSwitchers({ showCustomer: !showCustomer }));
    setIsToggledCustomer(!isToggledCustomer);
  };

  const handleShowTaskType = () => {
    dispatch(setSwitchers({ showTaskType: !showTaskType }));
    setIsToggledTaskType(!isToggledTaskType);
  };

  const isSameDate = (date1, date2) => {
    return new Date(date1).toDateString() === new Date(date2).toDateString();
  };

  return (
    <>
      <StartTimeModalComponent />
      <EndTimeModalComponent />
      <ServiceTaskModalComponent />
      <TruckOnMapModalComponent />

      <div className="planner-container">
        <div className="week-number">
          <button
            className="week-number__btn-add-route"
            title="Додати маршрут"
            onClick={() => handleAddRouteBtn()}
          >
            {/* <FaFileAlt /> */}
            Створити замовлення
          </button>
          <div className="week-number__switcher">
            <WeekSwitcherComponent
              year={year}
              week={week}
              handleWeekChange={handleWeekChange}
              handleYearChange={handleYearChange}
            />
          </div>
          <SwitchComponent
            title="Водій"
            isToggled={isToggledDriver}
            onToggle={handleShowDriver}
          />
          <SwitchComponent
            title="Заявка"
            isToggled={isToggledOrderNumber}
            onToggle={handleShowOrderNumber}
          />
          <SwitchComponent
            title="Замовник"
            isToggled={isToggledCustomer}
            onToggle={handleShowCustomer}
          />
          <SwitchComponent
            title="Завдання"
            isToggled={isToggledTaskType}
            onToggle={handleShowTaskType}
          />
        </div>

        <hr className="divide-block" />
        <div className="table-body-container">
          <div className="week">
            <div className="week__day-list">
              <div className="week-header__row">
                <div className="week-header__day-container">
                  <div className="week-header__day-container_date-item">
                    <div className="week-header__day-container_truck">
                      Truck Plates
                    </div>
                  </div>
                </div>
                {datesArray.map(([day, date]) => {
                  return (
                    <div className="week-header__day-container" key={date}>
                      <WeekDateComponent day={day} date={date} />
                    </div>
                  );
                })}
              </div>

              {displayTrucks
                .filter((truck) => truck.end_date === null)
                .map((truck) => {
                  console.log("DatesArray", datesArray);
                  console.log(`TASKS Week${week}`, tasks);
                  // For placeholder trucks, return placeholder tasks for first truck, empty for others
                  const weeklyTasks = truck.isPlaceholder
                    ? truck.id === "placeholder-1"
                      ? datesArray.map((date) =>
                          placeholderTasks.filter((task) =>
                            isSameDate(task.start_date, date[1])
                          )
                        )
                      : datesArray.map(() => [])
                    : datesArray.map((date) =>
                        tasks
                          .filter(
                            (task) =>
                              isSameDate(task.start_date, date[1]) &&
                              task.truck === truck.plates &&
                              task.type !== "Start" // Exclude service tasks
                          )
                          .sort((a, b) => {
                            // Compare based on start_date and start_time
                            const startDateComparison =
                              new Date(a.start_date + " " + a.start_time) -
                              new Date(b.start_date + " " + b.start_time);

                            if (startDateComparison !== 0) {
                              return startDateComparison;
                            }

                            // If start_date and start_time are equal, fallback to end_date and end_time
                            return (
                              new Date(a.end_date + " " + a.end_time) -
                              new Date(b.end_date + " " + b.end_time)
                            );
                          })
                      );
                  console.log("weeklyTasks", weeklyTasks);

                  return (
                    <div
                      className={`week-truck__row ${
                        truck.isPlaceholder
                          ? "week-truck__row--placeholder"
                          : ""
                      }`}
                      key={truck.id}
                    >
                      <div className="week-truck__day-container">
                        <div className="week-truck__first-col">
                          <div
                            className={`week-truck__truck-plates ${
                              truck.isPlaceholder
                                ? "week-truck__truck-plates--clickable"
                                : ""
                            }`}
                            onClick={
                              truck.isPlaceholder
                                ? handlePlaceholderTruckClick
                                : undefined
                            }
                            title={
                              truck.isPlaceholder
                                ? "Click to add trucks"
                                : undefined
                            }
                          >
                            <span className="week-truck__truck-plates_icon">
                              {<FaTruck />}
                            </span>
                            <span>{truck.plates}</span>
                          </div>
                          {truck.trailer && (
                            <div className="week-truck__trailer-plates">
                              <span className="week-truck__trailer-plates_icon">
                                {<FaTrailer />}
                              </span>
                              <span>{truck.trailer}</span>
                            </div>
                          )}
                          {truck?.driver_details && (
                            <div
                              className={`week-truck__driver-details ${
                                truck.isPlaceholder
                                  ? "week-truck__driver-details--clickable"
                                  : ""
                              }`}
                              onClick={
                                truck.isPlaceholder
                                  ? handlePlaceholderDriverClick
                                  : () => toggleDetails(truck.id)
                              }
                              title={
                                truck.isPlaceholder
                                  ? "Click to add drivers"
                                  : undefined
                              }
                            >
                              <div className="week-truck__driver-details_title">
                                <span className="week-truck__driver-details_name">
                                  {truck?.driver_details?.full_name}
                                </span>
                                <span className="week-truck__driver-details_arrow">
                                  {expandedTruckId === truck.id ? (
                                    <FaAngleUp />
                                  ) : (
                                    <FaAngleDown />
                                  )}
                                </span>
                              </div>
                            </div>
                          )}
                          {expandedTruckId === truck.id && (
                            <span className="week-truck__driver-details_phone-number">
                              {truck?.driver &&
                                truck?.driver_details?.phone_number}
                            </span>
                          )}
                        </div>
                      </div>

                      {weeklyTasks.map((dayTasks, dayNumber) => (
                        <div
                          className="week-truck__day-container"
                          key={dayNumber}
                        >
                          <DayTasks
                            tasks={dayTasks}
                            truckId={truck.id}
                            dayNumber={dayNumber}
                            onTruckDateSelect={handleTruckDateSelect}
                            handleEndTime={handleEndTime}
                            handleStartTime={handleStartTime}
                            handleDeleteTask={handleDeleteTask}
                            handleEditModeTask={handleEditModeTask}
                            showTaskType={showTaskType}
                          />
                        </div>
                      ))}
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
