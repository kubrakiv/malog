import { useEffect, useState, useMemo, useRef, Fragment } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { useConfirm } from "../../globalComponents/ConfirmModal/useConfirm";

import { getISOWeek, getISOWeekYear, parseISO } from "date-fns";
import { generateDatesArray } from "./dateFunctions";

import {
  FaAngleDown,
  FaAngleRight,
  FaAngleUp,
  FaCheck,
  FaCopy,
  FaFileAlt,
  FaSyncAlt,
} from "react-icons/fa";
import toast from "react-hot-toast";

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

import { listDrivers } from "../../features/drivers/driversOperations";
import { listTaskTypes } from "../../actions/taskTypeActions";
import {
  createTask,
  deleteTask,
  listTasks,
  listTasksByWeek,
} from "../../features/tasks/tasksOperations";
import {
  selectTrucks,
  selectTrucksLoading,
} from "../../features/trucks/trucksSelectors";
import { listTrucks } from "../../features/trucks/trucksOperations";
import { selectTasksByWeek } from "../../features/tasks/tasksSelectors";
import { listTruckUnits } from "../../features/truckUnits/truckUnitsOperations";

import DayTasks from "../Tasks/DayTasks";
import WeekSwitcherComponent from "../WeekSwitcherComponent/WeekSwitcherComponent";
import WeekDateComponent from "../WeekDateComponent/WeekDateComponent";
import EndTimeModalComponent from "./EndTimeModalComponent/EndTimeModalComponent";
import StartTimeModalComponent from "./StartTimeModalComponent/StartTimeModalComponent";
import ServiceTaskModalComponent from "./ServiceTaskModalComponent/ServiceTaskModalComponent";
import SwitchComponent from "../SwitchComponent/SwitchComponent";
import TruckOnMapModalComponent from "./TruckOnMapModalComponent";
import PlannerFilterDropdown from "./PlannerFilterDropdown";
import { DELIVERY_CONSTANTS } from "../../constants/global";

import "./WeekPlanner.scss";

const TASK_COPY_EXCLUDED_TYPES = new Set([
  DELIVERY_CONSTANTS.LOADING,
  DELIVERY_CONSTANTS.UNLOADING,
]);

const PLANNER_VIEW_STORAGE_KEY = "malog.weekPlanner.viewState";

const readPlannerViewState = () => {
  try {
    const raw = sessionStorage.getItem(PLANNER_VIEW_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
};

const getPlannerScrollState = () => {
  const table = document.querySelector(".table-body-container");
  return {
    windowScrollX: window.scrollX || 0,
    windowScrollY: window.scrollY || 0,
    tableScrollLeft: table?.scrollLeft || 0,
    tableScrollTop: table?.scrollTop || 0,
  };
};

const writePlannerViewState = (viewState) => {
  try {
    sessionStorage.setItem(
      PLANNER_VIEW_STORAGE_KEY,
      JSON.stringify({
        ...viewState,
        ...getPlannerScrollState(),
      }),
    );
  } catch (_) {}
};

export const WeekPlanner = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const confirm = useConfirm();
  const restoredPlannerView = useMemo(() => readPlannerViewState(), []);
  const restoredScrollAppliedRef = useRef(false);
  const plannerViewSnapshotRef = useRef(null);

  const searchParams = new URLSearchParams(location.search);
  const yearParam = Number.parseInt(searchParams.get("year"), 10);
  const weekParam = Number.parseInt(searchParams.get("week"), 10);
  const hasValidYear = Number.isInteger(yearParam);
  const hasValidWeek = Number.isInteger(weekParam);
  const currentYear = hasValidYear
    ? yearParam
    : restoredPlannerView?.year || getISOWeekYear(new Date());
  const currentWeek = hasValidWeek
    ? weekParam
    : restoredPlannerView?.week || getISOWeek(new Date());

  const [week, setWeek] = useState(currentWeek);
  const [year, setYear] = useState(currentYear);

  const { showDriver, showOrderNumber, showCustomer, showAddress, showTaskType } =
    useSelector(selectSwitchers);

  const trucks = useSelector(selectTrucks);
  const trucksLoading = useSelector(selectTrucksLoading);
  const units = useSelector((state) => state.truckUnitsInfo.units);
  const userInfo = useSelector((state) => state.userLogin.userInfo);

  const [filterUnit, setFilterUnit] = useState(
    () => restoredPlannerView?.filterUnit ?? null,
  );
  const [filterLogists, setFilterLogists] = useState(() =>
    Array.isArray(restoredPlannerView?.filterLogists)
      ? new Set(restoredPlannerView.filterLogists.map(String))
      : userInfo?.role === "logist"
        ? new Set([String(userInfo.id)])
        : new Set(),
  );
  const [logists, setLogists] = useState([]);

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

  const [expandedTruckId, setExpandedTruckId] = useState(
    () => restoredPlannerView?.expandedTruckId ?? null,
  );
  const [collapsedUnits, setCollapsedUnits] = useState(
    () => new Set(restoredPlannerView?.collapsedUnits || []),
  );
  const [copiedTruckId, setCopiedTruckId] = useState(null);
  const [copyDragTask, setCopyDragTask] = useState(null);
  const [copyDropTarget, setCopyDropTarget] = useState(null);
  const [isRefreshingTasks, setIsRefreshingTasks] = useState(false);
  const [weekTransition, setWeekTransition] = useState({
    direction: null,
    key: 0,
  });

  const toggleUnit = (unitId) => {
    setCollapsedUnits((prev) => {
      const next = new Set(prev);
      if (next.has(unitId)) next.delete(unitId);
      else next.add(unitId);
      return next;
    });
  };

  const [datesArray, setDatesArray] = useState(
    generateDatesArray(date, week, year),
  );

  const visibleTrucks = useMemo(() => {
    let result = trucks;
    if (filterUnit) {
      result = result.filter(
        (t) =>
          t.current_unit && String(t.current_unit.id) === String(filterUnit),
      );
    }
    if (filterLogists.size > 0) {
      result = result.filter(
        (t) =>
          Array.isArray(t.logist) &&
          t.logist.some((id) => filterLogists.has(String(id))),
      );
    }
    return result;
  }, [trucks, filterUnit, filterLogists]);

  // Use real trucks if available, otherwise show placeholders once we know
  // for sure there are none (avoid flashing the placeholder onboarding
  // template while the initial trucks request is still in flight).
  const showPlaceholders = !trucksLoading && trucks.length === 0;
  const displayTrucks = showPlaceholders
    ? createPlaceholderTrucks()
    : visibleTrucks;
  const placeholderTasks = showPlaceholders
    ? createPlaceholderTasks(datesArray)
    : [];

  console.log("tasks", tasks);
  console.log("tasksByWeek", tasksByWeek);
  console.log("placeholderTasks", placeholderTasks);
  const [isToggledDriver, setIsToggledDriver] = useState(
    () => !!restoredPlannerView?.switchers?.showDriver,
  );
  const [isToggledOrderNumber, setIsToggledOrderNumber] = useState(
    () => !!restoredPlannerView?.switchers?.showOrderNumber,
  );
  const [isToggledCustomer, setIsToggledCustomer] = useState(
    () => !!restoredPlannerView?.switchers?.showCustomer,
  );
  const [isToggledAddress, setIsToggledAddress] = useState(
    () => !!restoredPlannerView?.switchers?.showAddress,
  );
  const [isToggledTaskType, setIsToggledTaskType] = useState(
    () => !!restoredPlannerView?.switchers?.showTaskType,
  );
  console.log("DATES ARRAY", datesArray);

  useEffect(() => {
    if (!hasValidYear || !hasValidWeek) {
      navigate(`/planner?year=${year}&week=${week}`, { replace: true });
    }
  }, [hasValidYear, hasValidWeek, navigate, week, year]);

  useEffect(() => {
    if (restoredPlannerView?.switchers) {
      dispatch(setSwitchers(restoredPlannerView.switchers));
    }
  }, [dispatch, restoredPlannerView]);

  useEffect(() => {
    plannerViewSnapshotRef.current = {
      year,
      week,
      filterUnit,
      filterLogists: Array.from(filterLogists),
      expandedTruckId,
      collapsedUnits: Array.from(collapsedUnits),
      switchers: {
        showDriver,
        showOrderNumber,
        showCustomer,
        showAddress,
        showTaskType,
      },
    };
    writePlannerViewState(plannerViewSnapshotRef.current);
  }, [
    year,
    week,
    filterUnit,
    filterLogists,
    expandedTruckId,
    collapsedUnits,
    showDriver,
    showOrderNumber,
    showCustomer,
    showAddress,
    showTaskType,
  ]);

  useEffect(() => {
    const saveCurrentView = () => {
      if (plannerViewSnapshotRef.current) {
        writePlannerViewState(plannerViewSnapshotRef.current);
      }
    };
    const table = document.querySelector(".table-body-container");

    window.addEventListener("scroll", saveCurrentView, { passive: true });
    window.addEventListener("pagehide", saveCurrentView);
    table?.addEventListener("scroll", saveCurrentView, { passive: true });

    return () => {
      saveCurrentView();
      window.removeEventListener("scroll", saveCurrentView);
      window.removeEventListener("pagehide", saveCurrentView);
      table?.removeEventListener("scroll", saveCurrentView);
    };
  }, []);

  useEffect(() => {
    if (!restoredPlannerView || restoredScrollAppliedRef.current) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      const table = document.querySelector(".table-body-container");
      if (table) {
        table.scrollLeft = restoredPlannerView.tableScrollLeft || 0;
        table.scrollTop = restoredPlannerView.tableScrollTop || 0;
      }
      window.scrollTo(
        restoredPlannerView.windowScrollX || 0,
        restoredPlannerView.windowScrollY || 0,
      );
      restoredScrollAppliedRef.current = true;
    });

    return () => window.cancelAnimationFrame(frame);
  }, [displayTrucks.length, restoredPlannerView, tasks.length, trucksLoading]);

  useEffect(() => {
    dispatch(listTrucks());
    dispatch(listDrivers());
    dispatch(listTaskTypes());
    dispatch(listTruckUnits());

    const token = userInfo?.token;
    if (token) {
      import("axios").then(({ default: axios }) => {
        axios
          .get("/api/users/logists/", {
            headers: { Authorization: `Bearer ${token}` },
          })
          .then(({ data }) => setLogists(data))
          .catch(() => {});
      });
    }
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
    navigate("/fleet");
  };

  const handlePlaceholderDriverClick = (e) => {
    e.stopPropagation();
    navigate("/drivers");
  };

  const handleWeekChange = (newWeek, newYear = year) => {
    if (newWeek === week && newYear === year) {
      return;
    }

    setWeekTransition((prev) => ({
      direction:
        newYear > year || (newYear === year && newWeek > week)
          ? "left"
          : "right",
      key: prev.key + 1,
    }));
    setWeek(newWeek);
    setYear(newYear);
    navigate(`/planner?year=${newYear}&week=${newWeek}`);
    setDatesArray(generateDatesArray(date, newWeek, newYear));
  };

  const handleYearChange = (newYear) => {
    setYear(newYear);
    navigate(`/planner?year=${newYear}&week=${week}`);
  };

  const handleRefreshTasks = async () => {
    setIsRefreshingTasks(true);

    try {
      await dispatch(listTasksByWeek({ year, week })).unwrap();
      toast.success("Дані завдань оновлено", { position: "top-right" });
    } catch (error) {
      toast.error("Не вдалося оновити завдання", { position: "top-right" });
    } finally {
      setIsRefreshingTasks(false);
    }
  };

  const handleTruckDateSelect = ({ truckId, dayNumber }) => {
    const truck = displayTrucks.find((truck) => truck.id === truckId);

    // Don't allow task creation for placeholder trucks
    if (truck?.isPlaceholder) {
      alert(
        "Please add real trucks to the system before creating tasks. Click on the truck placeholder to add vehicles or on the driver placeholder to add drivers.",
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

    const isConfirmed = await confirm(
      "Ви впевнені, що хочете видалити задачу?",
    );

    if (!isConfirmed) {
      return;
    }

    dispatch(deleteTask(taskId));
  };

  const toggleDetails = (truckId) => {
    setExpandedTruckId((prevTruckId) =>
      prevTruckId === truckId ? null : truckId,
    );
  };

  const getShortDriverName = (fullName = "") => {
    const [lastName, firstName] = fullName.trim().split(/\s+/);
    return [lastName, firstName].filter(Boolean).join(" ");
  };

  const getTruckUnitLabel = (truck) => {
    return [truck?.plates, truck?.trailer].filter(Boolean).join(" | ");
  };

  const getTruckContactText = (truck) => {
    const unitLine = [truck?.plates, truck?.trailer].filter(Boolean).join(" / ");
    return [
      unitLine,
      truck?.driver_details?.full_name,
      truck?.driver_details?.phone_number,
    ]
      .filter(Boolean)
      .join("\n");
  };

  const handleCopyTruckDetails = async (event, truck) => {
    event.stopPropagation();

    const contactText = getTruckContactText(truck);
    if (!contactText) {
      return;
    }

    try {
      await navigator.clipboard.writeText(contactText);
      setCopiedTruckId(truck.id);
      toast.success("Дані авто скопійовано", { position: "top-right" });
      window.setTimeout(() => setCopiedTruckId(null), 1200);
    } catch (error) {
      toast.error("Не вдалося скопіювати дані авто", {
        position: "top-right",
      });
    }
  };

  const canCopyTask = (task) => {
    return (
      !task?.isPlaceholder &&
      task?.id &&
      !task?.order &&
      !task?.order_id &&
      !TASK_COPY_EXCLUDED_TYPES.has(task.type)
    );
  };

  const handleTaskCopyDragStart = (event, task) => {
    if (!event.ctrlKey || !canCopyTask(task)) {
      event.preventDefault();
      toast.error("Для копіювання затисніть Ctrl і перетягніть завдання", {
        position: "top-right",
      });
      return;
    }

    setCopyDragTask(task);
    event.dataTransfer.effectAllowed = "copy";
    event.dataTransfer.setData("text/plain", String(task.id));
  };

  const handleTaskCopyDragEnd = () => {
    setCopyDragTask(null);
    setCopyDropTarget(null);
  };

  const isSameCopyDropTarget = (target) => {
    return (
      copyDropTarget?.truckPlates === target.truckPlates &&
      copyDropTarget?.dayNumber === target.dayNumber
    );
  };

  const canDropCopiedTask = ({ truckPlates }) => {
    return copyDragTask && copyDragTask.truck === truckPlates;
  };

  const handleTaskCopyDragOver = (event, target) => {
    if (!canDropCopiedTask(target)) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";

    if (!isSameCopyDropTarget(target)) {
      setCopyDropTarget(target);
    }
  };

  const buildCopiedTask = (task, targetDate) => {
    const {
      id,
      created_at,
      updated_at,
      point_details,
      driver_details,
      type_uk,
      ...taskPayload
    } = task;

    return {
      ...taskPayload,
      start_date: targetDate,
      end_date: task.end_date ? targetDate : task.end_date,
    };
  };

  const handleTaskCopyDrop = async (event, target) => {
    if (!canDropCopiedTask(target)) {
      return;
    }

    event.preventDefault();
    const targetDate = datesArray[target.dayNumber]?.[1];

    if (!targetDate) {
      return;
    }

    try {
      await dispatch(createTask(buildCopiedTask(copyDragTask, targetDate))).unwrap();
      toast.success("Завдання скопійовано", {
        position: "top-right",
      });
    } catch (error) {
      toast.error("Не вдалося скопіювати завдання", {
        position: "top-right",
      });
    } finally {
      handleTaskCopyDragEnd();
    }
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

  const handleShowAddress = () => {
    dispatch(setSwitchers({ showAddress: !showAddress }));
    setIsToggledAddress(!isToggledAddress);
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
          <div className="week-number__left">
            <div className="planner-filters">
              <PlannerFilterDropdown
                label="Колона"
                value={filterUnit}
                options={units.map((u) => ({ label: u.name, value: u.id }))}
                onChange={setFilterUnit}
              />
              <PlannerFilterDropdown
                label="Логіст"
                value={filterLogists}
                options={logists.map((l) => ({
                  label: l.full_name || l.username,
                  value: l.id,
                }))}
                onChange={setFilterLogists}
                multi
              />
              <button
                type="button"
                className="planner-refresh-button"
                onClick={handleRefreshTasks}
                disabled={isRefreshingTasks}
                title="Оновити завдання"
              >
                <FaSyncAlt
                  className={
                    isRefreshingTasks
                      ? "planner-refresh-button__icon--spinning"
                      : ""
                  }
                />
                <span>{isRefreshingTasks ? "Оновлення" : "Оновити"}</span>
              </button>
            </div>
          </div>
          <div className="week-number__switcher">
            <WeekSwitcherComponent
              year={year}
              week={week}
              handleWeekChange={handleWeekChange}
              handleYearChange={handleYearChange}
            />
          </div>
          <div className="week-number__right">
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
              title="Адреса"
              isToggled={isToggledAddress}
              onToggle={handleShowAddress}
            />
            <SwitchComponent
              title="Завдання"
              isToggled={isToggledTaskType}
              onToggle={handleShowTaskType}
            />
          </div>
        </div>

        <hr className="divide-block" />
        <div className="table-body-container">
          <div
            key={weekTransition.key}
            className={`week ${
              weekTransition.direction
                ? `week--slide-${weekTransition.direction}`
                : ""
            }`}
          >
            <div className="week__day-list">
              <div className="week-header__row">
                <div className="week-header__day-container">
                  <div className="week-header__day-container_date-item">
                    <div className="week-header__day-container_truck">
                      Номери ТЗ
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

              {trucksLoading && trucks.length === 0 ? (
                <div className="week-planner-loading">Завантаження...</div>
              ) : (
                (() => {
                  const filteredTrucks = displayTrucks.filter(
                    (t) => t.end_date === null,
                  );

                  // Group trucks by current_unit, preserving truck order
                  const groupMap = new Map();
                  filteredTrucks.forEach((truck) => {
                    const unitId = truck.current_unit?.id ?? "unassigned";
                    const unitName = truck.current_unit?.name ?? "Без колони";
                    if (!groupMap.has(unitId)) {
                      groupMap.set(unitId, {
                        id: unitId,
                        name: unitName,
                        trucks: [],
                      });
                    }
                    groupMap.get(unitId).trucks.push(truck);
                  });
                  const groups = Array.from(groupMap.values());

                  const renderTruckRow = (truck) => {
                    const weeklyTasks = truck.isPlaceholder
                      ? truck.id === "placeholder-1"
                        ? datesArray.map((date) =>
                            placeholderTasks.filter((task) =>
                              isSameDate(task.start_date, date[1]),
                            ),
                          )
                        : datesArray.map(() => [])
                      : datesArray.map((date) =>
                          tasks
                            .filter(
                              (task) =>
                                isSameDate(task.start_date, date[1]) &&
                                task.truck === truck.plates &&
                                task.type !== "Start",
                            )
                            .sort((a, b) => {
                              const startDateComparison =
                                new Date(a.start_date + " " + a.start_time) -
                                new Date(b.start_date + " " + b.start_time);
                              if (startDateComparison !== 0)
                                return startDateComparison;
                              return (
                                new Date(a.end_date + " " + a.end_time) -
                                new Date(b.end_date + " " + b.end_time)
                              );
                            }),
                        );

                    return (
                      <div
                        className={`week-truck__row ${truck.isPlaceholder ? "week-truck__row--placeholder" : ""}`}
                        key={truck.id}
                      >
                        <div className="week-truck__day-container">
                          <div className="week-truck__first-col">
                            <div
                              className={`week-truck__truck-plates ${truck.isPlaceholder ? "week-truck__truck-plates--clickable" : ""}`}
                              onClick={
                                truck.isPlaceholder
                                  ? handlePlaceholderTruckClick
                                  : undefined
                              }
                              title={
                                truck.isPlaceholder
                                  ? "Click to add trucks"
                                  : getTruckUnitLabel(truck)
                              }
                            >
                              <span className="week-truck__plates-text">
                                {getTruckUnitLabel(truck)}
                              </span>
                            </div>
                            {truck?.driver_details && (
                              <div
                                className={`week-truck__driver-details ${truck.isPlaceholder ? "week-truck__driver-details--clickable" : ""}`}
                                onClick={
                                  truck.isPlaceholder
                                    ? handlePlaceholderDriverClick
                                    : () => toggleDetails(truck.id)
                                }
                                title={
                                  truck.isPlaceholder
                                    ? "Click to add drivers"
                                    : truck?.driver_details?.full_name
                                }
                              >
                                <div className="week-truck__driver-details_title">
                                  <span className="week-truck__driver-details_name">
                                    {getShortDriverName(
                                      truck?.driver_details?.full_name,
                                    )}
                                  </span>
                                  <span className="week-truck__driver-details_actions">
                                    {!truck.isPlaceholder && (
                                      <button
                                        type="button"
                                        className="week-truck__copy-button"
                                        onClick={(event) =>
                                          handleCopyTruckDetails(event, truck)
                                        }
                                        title="Скопіювати авто, причіп, водія і телефон"
                                        aria-label="Скопіювати дані авто"
                                      >
                                        {copiedTruckId === truck.id ? (
                                          <FaCheck />
                                        ) : (
                                          <FaCopy />
                                        )}
                                      </button>
                                    )}
                                    <span className="week-truck__driver-details_arrow">
                                      {expandedTruckId === truck.id ? (
                                        <FaAngleUp />
                                      ) : (
                                        <FaAngleDown />
                                      )}
                                    </span>
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
                              truckPlates={truck.plates}
                              dayNumber={dayNumber}
                              onTruckDateSelect={handleTruckDateSelect}
                              handleEndTime={handleEndTime}
                              handleStartTime={handleStartTime}
                              handleDeleteTask={handleDeleteTask}
                              handleEditModeTask={handleEditModeTask}
                              showTaskType={showTaskType}
                              canCopyTask={canCopyTask}
                              handleTaskCopyDragStart={handleTaskCopyDragStart}
                              handleTaskCopyDragEnd={handleTaskCopyDragEnd}
                              handleTaskCopyDragOver={handleTaskCopyDragOver}
                              handleTaskCopyDrop={handleTaskCopyDrop}
                              isCopyDropActive={
                                copyDropTarget?.truckPlates === truck.plates &&
                                copyDropTarget?.dayNumber === dayNumber
                              }
                            />
                          </div>
                        ))}
                      </div>
                    );
                  };

                  return groups.map((group) => (
                    <Fragment key={group.id}>
                      <div
                        className="week-unit-group__header"
                        onClick={() => toggleUnit(group.id)}
                      >
                        <div className="week-unit-group__title-cell">
                          <span className="week-unit-group__arrow">
                            {collapsedUnits.has(group.id) ? (
                              <FaAngleRight />
                            ) : (
                              <FaAngleDown />
                            )}
                          </span>
                          <span className="week-unit-group__name">
                            {group.name}
                          </span>
                          <span className="week-unit-group__count">
                            {group.trucks.length}
                          </span>
                        </div>
                      </div>
                      {!collapsedUnits.has(group.id) &&
                        group.trucks.map(renderTruckRow)}
                    </Fragment>
                  ));
                })()
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
