import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";

import {
  FaMapMarkerAlt,
  FaPencilAlt,
  FaRegCheckCircle,
  FaRegClock,
  FaRegTrashAlt,
  FaRoute,
} from "react-icons/fa";

import {
  selectShowTruckOnMapModal,
  selectSwitchers,
} from "../../features/planner/plannerSelectors";

import { DELIVERY_CONSTANTS } from "../../constants/global";
const {
  LOADING,
  UNLOADING,
  CUSTOMS,
  BORDER_CROSSING,
  SERVICE,
  DRIVING,
  WEEKEND,
  RESERVE,
  START,
  WAITING,
} = DELIVERY_CONSTANTS;

import "./Task.scss";
import { setShowTruckOnMapModal } from "../../features/planner/plannerSlice";
import { listOrderDetails } from "../../features/orders/ordersOperations";
import { selectTrucks } from "../../features/trucks/trucksSelectors";
import { getTruckLocation } from "../../services/truckLocationService";
import { setTruckDetails } from "../../actions/mapActions";

function Task({
  task,
  handleEndTime,
  handleStartTime,
  handleDeleteTask,
  handleEditModeTask,
  showTaskType,
  canCopyTask,
  handleTaskCopyDragStart,
  handleTaskCopyDragEnd,
}) {
  const dispatch = useDispatch();

  const showTruckOnMapModal = useSelector(selectShowTruckOnMapModal);
  const trucks = useSelector(selectTrucks);
  const { showDriver, showOrderNumber, showCustomer, showAddress } =
    useSelector(selectSwitchers);

  const [isHovered, setHovered] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [unloadingStatus, setUnloadingStatus] = useState(false);
  const routeTaskTypes = [LOADING, UNLOADING, CUSTOMS, BORDER_CROSSING];

  // Set loading and unloading statuses
  useEffect(() => {
    // Function to set loading and unloading statuses
    const setStatus = () => {
      if (task.type === LOADING) {
        if (task.end_date && task.end_time) {
          setLoadingStatus(true);
        } else {
          setLoadingStatus(false);
        }
      } else if (task.type === UNLOADING) {
        if (task.end_date && task.end_time) {
          setUnloadingStatus(true);
        } else {
          setUnloadingStatus(false);
        }
      }
    };
    setStatus();
  }, [task]);

  const handleMouseEnter = () => {
    setHovered(true);
  };

  const handleMouseLeave = () => {
    setHovered(false);
  };

  const handleMouseClick = () => {
    // Don't allow interactions with placeholder tasks
    if (task.isPlaceholder) {
      return;
    }
    setHovered((prev) => !prev);
  };

  const handleShowTruckOnMap = (e) => {
    e.stopPropagation();

    console.log("Show truck on map");
    dispatch(setShowTruckOnMapModal(true));
    dispatch(listOrderDetails(task.order_id));

    if (task?.truck) {
      const truck = trucks.find((t) => t.plates === task.truck);
      dispatch(setTruckDetails(truck));

      if (truck && truck.gps_id) {
        getTruckLocation(truck, dispatch).catch((error) => {
          console.error("Failed to fetch truck location:", error);
        });
      } else {
        console.log(
          truck
            ? "Truck found, but no gps_id available"
            : "Truck not found in the list"
        );
      }
    } else {
      console.log("No truck assigned to the task");
    }
  };

  const getTaskColor = (taskType, endDate, endTime) => {
    switch (taskType) {
      case LOADING:
        if (!endDate || !endTime) {
          return "rgb(255, 255, 0)"; //yellow color
        } else {
          return "rgba(0, 0, 255, 0.8)"; //blue color
        }
      case UNLOADING:
        if (!endDate || !endTime) {
          return "rgb(255, 0, 255)"; //pink color
        } else {
          return "rgba(0, 255, 0, 0.8)"; //green color
        }
      case CUSTOMS:
        return "rgba(14, 165, 233, 0.35)";
      case BORDER_CROSSING:
        return "rgba(168, 85, 247, 0.35)";
      case SERVICE:
        return "rgba(255, 0, 0, 1)"; //red color
      case DRIVING:
        return "rgba(255, 229, 152, 1)"; //sweet yellow color
      case RESERVE:
        return "rgba(0, 255, 255, 1)"; //cyan color
      case WEEKEND:
        return "rgba(255, 153, 0, 1)"; //orange color
      case START:
        return "rgba(41, 116, 214, 0.7)"; //blue color
      case WAITING:
        return "rgba(255, 0, 0, 0.4)"; //red color
      default:
        return "rgba(140, 177, 186, 0.3)"; //grey color
    }
  };

  const getTextColor = (taskType, endDate, endTime) => {
    switch (taskType) {
      case LOADING:
        if (!endDate || !endTime) {
          return "black";
        } else {
          return "white";
        }
      case UNLOADING:
        return "black";
      default:
        return "black";
    }
  };

  const getTimeComponent = (taskType, endDate, endTime) => {
    switch (taskType) {
      case LOADING:
        return !loadingStatus ? (
          <>
            <div className="task__time">
              {task?.start_time?.substring(0, 5)}
            </div>
          </>
        ) : (
          <>
            <div className="task__time">{task?.end_time?.substring(0, 5)}</div>
          </>
        );
      case UNLOADING:
        return !unloadingStatus ? (
          <>
            <div className="task__time">
              {task?.start_time?.substring(0, 5)}
            </div>
          </>
        ) : (
          <>
            <div className="task__time">{task?.end_time?.substring(0, 5)}</div>
          </>
        );
      case "Service":
        return !loadingStatus ? (
          <>
            <div className="task__time">
              {task?.start_time?.substring(0, 5)}
            </div>
          </>
        ) : (
          <>
            <div className="task__time">{task?.end_time?.substring(0, 5)}</div>
          </>
        );
      case CUSTOMS:
      case BORDER_CROSSING:
        return (
          <>
            <div className="task__time">
              {task?.start_time?.substring(0, 5)}
            </div>
          </>
        );
      default:
        return null;
    }
  };

  const getTaskAddress = () => {
    const point = task.point_details || {};
    const streetAddress = [point.street, point.street_number]
      .filter(Boolean)
      .join(" ");

    return streetAddress || point.address || point.full_address || "";
  };

  const taskStyle = {
    backgroundColor:
      task.isPlaceholder && task.color
        ? task.color
        : getTaskColor(task.type, task.end_date, task.end_time),
    opacity: task.isPlaceholder ? 0.8 : 1,
  };

  const textStyle = {
    color: getTextColor(task.type, task.end_date, task.end_time),
  };

  return (
    <>
      <div className="task__container">
        <div
          className={`task ${task.isPlaceholder ? "task--placeholder" : ""}`}
          draggable={canCopyTask?.(task) ?? false}
          onDragStart={(event) => handleTaskCopyDragStart?.(event, task)}
          onDragEnd={handleTaskCopyDragEnd}
          // onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onClick={handleMouseClick}
          style={taskStyle}
          title={
            task.isPlaceholder
              ? "This is a sample task - click on truck or driver placeholders to add real data"
              : undefined
          }
        >
          {isHovered && !task.isPlaceholder && (
            <div className="task-actions">
              {routeTaskTypes.includes(task.type) ? (
                <>
                  <Link to={`/orders/${task.order || task.order_id}`}>
                    <button
                      type="button"
                      title="Перейти в маршрут"
                      className="task-actions_first"
                    >
                      <FaRoute />
                    </button>
                  </Link>
                  <button
                    type="button"
                    title="Показати авто"
                    className="task-actions_map"
                    onClick={(e) => handleShowTruckOnMap(e)}
                  >
                    <FaMapMarkerAlt />
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  title="Видалити завдання"
                  className="task-actions_delete"
                  onClick={(e) => handleDeleteTask(e, task.id)}
                >
                  <FaRegTrashAlt />
                </button>
              )}
              {task.type === "Service" ||
              task.type === "Driving" ||
              task.type === "Service" ||
              task.type === "Weekend" ||
              task.type === "Reserve" ||
              task.type === "Start" ||
              task.type === "Waiting" ? (
                <button
                  type="button"
                  title="Редагувати"
                  className="task-actions_edit"
                  onClick={(e) => handleEditModeTask(e, task)}
                >
                  <FaPencilAlt />
                </button>
              ) : null}

              <button
                type="button"
                title="Початок"
                className="task-actions_second"
                onClick={() => handleStartTime(task)}
              >
                <FaRegClock />
              </button>
              <button
                type="button"
                title="Завершено"
                className="task-actions_third"
                onClick={() => handleEndTime(task)}
              >
                <FaRegCheckCircle />
              </button>
            </div>
          )}
          <div className="task-details" style={textStyle}>
            {task.isPlaceholder ? (
              // Placeholder task display
              <>
                {showTaskType && (
                  <div
                    className="task-details__type"
                    style={{
                      color: "white",
                      fontSize: "10px",
                      fontStyle: "italic",
                    }}
                  >
                    {task.type_uk || task.type}
                  </div>
                )}
                <span style={{ color: "white", fontSize: "11px" }}>
                  {task.start_time}
                </span>
                <div
                  className="task-details__order"
                  style={{ fontWeight: "bold", color: "white" }}
                >
                  {task.order_number}
                </div>
                {task.customer && (
                  <div
                    className="task-details__customer"
                    style={{ color: "white" }}
                  >
                    {task.customer}
                  </div>
                )}
              </>
            ) : (
              // Regular task display
              <>
                {showTaskType && (
                  <div className="task-details__type" style={{ fontSize: "10px", fontStyle: "italic" }}>
                    {task.type_uk || task.type}
                  </div>
                )}
                {showOrderNumber && (
                  <div className="task-details__order">{task.order_number}</div>
                )}
                {showDriver && (
                  <div className="task-details__driver">{task.driver}</div>
                )}
                {showCustomer && (
                  <div className="task-details__customer">{task.customer}</div>
                )}
                <span>
                  {getTimeComponent(task.type, task.end_date, task.end_time)}
                </span>
                <div className="task__title">
                  <span className="task__title-text">{task.title}</span>
                  {showAddress && getTaskAddress() && (
                    <span className="task__address" title={getTaskAddress()}>
                      {getTaskAddress()}
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default Task;
