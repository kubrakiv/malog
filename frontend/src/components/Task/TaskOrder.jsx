import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import {
  FaCalendar,
  FaClock,
  FaFlagCheckered,
  FaMapMarkerAlt,
  FaPencilAlt,
  FaRegTrashAlt,
} from "react-icons/fa";
import {
  PiArrowFatDownBold,
  PiArrowFatUpBold,
  PiArrowFatDownFill,
  PiArrowFatUpFill,
} from "react-icons/pi";
import { formattedTime } from "../../utils/formattedTime";
import { getTaskTitle } from "../../utils/getTaskTitle";
import { setMapCurrentLocation } from "../../actions/mapActions";
import { transformDate } from "../../utils/formatDate";

import { DELIVERY_CONSTANTS } from "../../constants/global";
const { LOADING, UNLOADING, START } = DELIVERY_CONSTANTS;

import "./TaskOrder.scss";

function TaskOrder({ task, handleDeleteTask, onEditMode }) {
  const dispatch = useDispatch();

  const [isHovered, setHovered] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [unloadingStatus, setUnloadingStatus] = useState(false);

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

  const handleShowPointOnMap = (task) => {
    if (task && task.point_details) {
      const { gps_latitude, gps_longitude } = task.point_details;
      if (gps_latitude !== undefined && gps_longitude !== undefined) {
        dispatch(
          setMapCurrentLocation({
            lat: parseFloat(gps_latitude),
            lng: parseFloat(gps_longitude),
          })
        );
      } else {
        console.error("Latitude or longitude is undefined");
      }
    } else {
      console.error("Invalid order or missing details");
    }
  };

  const handleMouseEnter = () => {
    setHovered(true);
  };

  const handleMouseLeave = () => {
    setHovered(false);
  };

  const getIconComponent = () => {
    switch (task.type) {
      case LOADING:
        return loadingStatus ? (
          <PiArrowFatDownFill style={iconStyle()} />
        ) : (
          <PiArrowFatDownBold style={iconStyle()} />
        );
      case UNLOADING:
        return unloadingStatus ? (
          <PiArrowFatUpFill style={iconStyle()} />
        ) : (
          <PiArrowFatUpBold style={iconStyle()} />
        );
      case START:
        return <FaFlagCheckered style={iconStyle()} />;
      default:
        return null;
    }
  };

  const getTimeComponent = () => {
    switch (task.type) {
      case LOADING:
        return !loadingStatus ? (
          <>
            <div className="task-order__date">
              <FaCalendar /> {transformDate(task.start_date)}
            </div>
            <div className="task-order__time">
              <FaClock /> {formattedTime(task.start_time)}
            </div>
          </>
        ) : (
          <>
            <div className="task-order__date">
              <FaCalendar /> {transformDate(task.end_date)}
            </div>
            <div className="task-order__time">
              <FaClock /> {formattedTime(task.end_time)}
            </div>
          </>
        );
      case UNLOADING:
        return !unloadingStatus ? (
          <>
            <div className="task-order__date">
              <FaCalendar /> {transformDate(task.start_date)}
            </div>
            <div className="task-order__time">
              <FaClock /> {formattedTime(task.start_time)}
            </div>
          </>
        ) : (
          <>
            <div className="task-order__date">
              <FaCalendar /> {transformDate(task.end_date)}
            </div>
            <div className="task-order__time">
              <FaClock /> {formattedTime(task.end_time)}
            </div>
          </>
        );
      case START:
        return (
          <>
            <div className="task-order__date">
              <FaCalendar /> {transformDate(task.start_date)}
            </div>
            <div className="task-order__time">
              <FaClock /> {formattedTime(task.start_time)}
            </div>
          </>
        );
      default:
        return null;
    }
  };

  const iconStyle = () => {
    switch (task.type) {
      case LOADING:
        return { color: "green" };
      case UNLOADING:
        return { color: "red" };
      case START:
        return { color: "blue" };
      default:
        return { color: "black" };
    }
  };

  // const taskStyle = {
  //   backgroundColor: isHovered
  //     ? task.type === LOADING
  //       ? "rgba(63, 177, 40, 0.6)"
  //       : "rgba(226, 97, 85, 0.6)"
  //     : "rgba(140, 177, 186, 0.3)",
  // };

  const getBackgroundColor = (taskType) => {
    switch (taskType) {
      case LOADING:
        return "rgba(63, 177, 40, 0.3)"; //green color
      case UNLOADING:
        return "rgba(226, 97, 85, 0.3)"; //red color
      case START:
        return "rgba(140, 177, 186, 0.3)"; //blue color
      default:
        return "rgba(140, 177, 186, 0.3)"; //grey color
    }
  };

  const getTextColor = (taskType) => {
    switch (taskType) {
      case LOADING:
        return !loadingStatus ? "black" : "white";
      case UNLOADING:
        return !unloadingStatus ? "black" : "white";
      case START:
        return "black";
      default:
        return "black";
    }
  };

  const taskStyle = {
    backgroundColor: isHovered
      ? task.type === LOADING
        ? "rgba(63, 177, 40, 0.6)"
        : task.type === UNLOADING
        ? "rgba(226, 97, 85, 0.6)"
        : task.type === START
        ? "rgba(140, 177, 186, 0.6)"
        : "rgba(140, 146, 186, 0.9)"
      : "rgba(140, 170, 186, 0.3)",

    // color: getTextColor(task.type, task.end_date, task.end_time),
    color: "black",
  };

  return (
    <>
      {task && (
        <div
          className="task-order"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          style={taskStyle}
        >
          <div className="task-order__icon">{getIconComponent()}</div>
          <div className="task-order__info">
            <div className="task-order__address">
              {task.title || getTaskTitle(task)}
            </div>
            <div className="task-order__company">
              {task.point_details?.company_name || "No company name"}
            </div>
            <div className="task-order__date-time">{getTimeComponent()}</div>
          </div>
          {isHovered && (
            <div className="task-order__actions">
              <button
                type="button"
                title="Edit task"
                className="task-order__btn task-order__btn_edit"
                onClick={(e) => onEditMode(e, task)}
              >
                <FaPencilAlt />
              </button>
              <button
                type="button"
                title="Delete task"
                className="task-order__btn task-order__btn_delete"
                onClick={(e) => handleDeleteTask(e, task.id)}
              >
                <FaRegTrashAlt />
              </button>
              <button
                type="button"
                title="Show on map"
                className="task-order__btn task-order__btn_map"
                onClick={() => handleShowPointOnMap(task)}
              >
                <FaMapMarkerAlt />
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}

export default TaskOrder;
