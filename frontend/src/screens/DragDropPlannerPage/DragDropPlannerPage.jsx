import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { DragDropContext, Draggable, Droppable } from "react-beautiful-dnd";

import {
  FaTruck,
  FaTrailer,
  FaUser,
  FaPlus,
  FaCalendarWeek,
  FaCopy,
  FaInfoCircle,
} from "react-icons/fa";

import { selectTrucks } from "../../features/trucks/trucksSelectors";
import { selectTasksByWeek } from "../../features/tasks/tasksSelectors";
import { listTrucks } from "../../features/trucks/trucksOperations";
import {
  listTasksByWeek,
  createTask,
  deleteTask,
} from "../../features/tasks/tasksOperations";
import { listDrivers } from "../../features/drivers/driversOperations";
import { listTaskTypes } from "../../actions/taskTypeActions";

import "./DragDropPlannerPage.scss";

const DragDropPlannerPage = () => {
  const dispatch = useDispatch();

  // State
  const [currentWeek, setCurrentWeek] = useState(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const days = Math.floor((now - start) / (24 * 60 * 60 * 1000));
    return Math.ceil((days + start.getDay() + 1) / 7);
  });
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [showCopyHint, setShowCopyHint] = useState(false);
  const [expandedTruckId, setExpandedTruckId] = useState(null);

  // Selectors
  const trucks = useSelector(selectTrucks);
  const tasksByWeek = useSelector(selectTasksByWeek);

  // Generate week dates
  const weekDates = useMemo(() => {
    const dates = [];
    const startOfWeek = new Date(currentYear, 0, 1 + (currentWeek - 1) * 7);

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      dates.push({
        day: date.toLocaleDateString("uk-UA", { weekday: "short" }),
        date: date.toISOString().split("T")[0],
        displayDate: date.toLocaleDateString("uk-UA", {
          day: "2-digit",
          month: "2-digit",
        }),
      });
    }
    return dates;
  }, [currentWeek, currentYear]);

  // Load initial data
  useEffect(() => {
    dispatch(listTrucks());
    dispatch(listDrivers());
    dispatch(listTaskTypes());
  }, [dispatch]);

  // Load tasks for current week
  useEffect(() => {
    dispatch(listTasksByWeek({ year: currentYear, week: currentWeek }));
  }, [dispatch, currentYear, currentWeek]);

  // Keyboard event listeners for Alt key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Alt") {
        setShowCopyHint(true);
      }
    };

    const handleKeyUp = (e) => {
      if (e.key === "Alt") {
        setShowCopyHint(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // Handle drag and drop end
  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;

    // Parse source and destination
    const [sourceTruckId, sourceDayIndex] = source.droppableId.split("-");
    const [destTruckId, destDayIndex] = destination.droppableId.split("-");

    const sourceTruck = trucks.find(
      (truck) => truck.id === parseInt(sourceTruckId)
    );
    const destTruck = trucks.find(
      (truck) => truck.id === parseInt(destTruckId)
    );

    if (!sourceTruck || !destTruck) return;

    const sourceDate = weekDates[parseInt(sourceDayIndex)];
    const destDate = weekDates[parseInt(destDayIndex)];

    if (!sourceDate || !destDate) return;

    // Find the task to move
    const currentTasks = tasksByWeek[`${currentYear}-${currentWeek}`] || [];
    const taskToMove = currentTasks.find(
      (task) =>
        task.id === parseInt(draggableId) &&
        task.truck === sourceTruck.plates &&
        task.start_date === sourceDate.date
    );

    if (!taskToMove) return;

    // Create new task for destination
    const newTask = {
      ...taskToMove,
      id: undefined,
      start_date: destDate.date,
      end_date: destDate.date,
      truck: destTruck.plates,
    };

    try {
      await dispatch(createTask(newTask));
      dispatch(listTasksByWeek({ year: currentYear, week: currentWeek }));
    } catch (error) {
      console.error("Error moving task:", error);
    }
  };

  // Handle Alt + click to copy task
  const handleTaskCopy = async (e, task, targetTruckId, targetDayIndex) => {
    e.preventDefault();
    e.stopPropagation();

    if (!e.altKey) return;

    const targetTruck = trucks.find((truck) => truck.id === targetTruckId);
    const targetDate = weekDates[targetDayIndex];

    if (!targetTruck || !targetDate) return;

    const taskCopy = {
      ...task,
      id: undefined,
      start_date: targetDate.date,
      end_date: targetDate.date,
      truck: targetTruck.plates,
    };

    try {
      await dispatch(createTask(taskCopy));
      dispatch(listTasksByWeek({ year: currentYear, week: currentWeek }));
    } catch (error) {
      console.error("Error copying task:", error);
    }
  };

  // Helper functions
  const getTasksForDay = (truckId, dayIndex) => {
    const currentTasks = tasksByWeek[`${currentYear}-${currentWeek}`] || [];
    const truck = trucks.find((t) => t.id === truckId);
    if (!truck) return [];

    const dayDate = weekDates[dayIndex];
    return currentTasks.filter(
      (task) =>
        task.truck === truck.plates &&
        task.start_date === dayDate.date &&
        task.type !== "Start"
    );
  };

  const toggleTruckDetails = (truckId) => {
    setExpandedTruckId(expandedTruckId === truckId ? null : truckId);
  };

  const navigateWeek = (direction) => {
    if (direction === "prev") {
      if (currentWeek > 1) {
        setCurrentWeek(currentWeek - 1);
      } else {
        setCurrentYear(currentYear - 1);
        setCurrentWeek(52);
      }
    } else {
      if (currentWeek < 52) {
        setCurrentWeek(currentWeek + 1);
      } else {
        setCurrentYear(currentYear + 1);
        setCurrentWeek(1);
      }
    }
  };

  return (
    <div className="drag-drop-planner">
      {/* Header */}
      <div className="planner-header">
        <div className="header-left">
          <h1>Drag & Drop Планувальник</h1>
          <p>
            Перетягуйте завдання між днями та копіюйте їх за допомогою Alt +
            клік
          </p>
        </div>

        <div className="header-right">
          {/* Copy Hint */}
          {showCopyHint && (
            <div className="copy-hint">
              <FaCopy />
              <span>Alt + клік для копіювання завдання</span>
            </div>
          )}

          {/* Week Navigation */}
          <div className="week-navigation">
            <button className="nav-btn" onClick={() => navigateWeek("prev")}>
              &lt;
            </button>
            <div className="week-info">
              <span className="year">{currentYear}</span>
              <span className="week">Тиждень {currentWeek}</span>
            </div>
            <button className="nav-btn" onClick={() => navigateWeek("next")}>
              &gt;
            </button>
          </div>
        </div>
      </div>

      {/* Main Planner */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="planner-container">
          {/* Header Row */}
          <div className="planner-header-row">
            <div className="truck-header">
              <FaTruck />
              <span>Транспорт</span>
            </div>
            {weekDates.map((date, index) => (
              <div key={index} className="day-header">
                <div className="day-name">{date.day}</div>
                <div className="day-date">{date.displayDate}</div>
              </div>
            ))}
          </div>

          {/* Truck Rows */}
          {trucks
            .filter((truck) => truck.end_date === null)
            .map((truck) => (
              <div key={truck.id} className="truck-row">
                {/* Truck Info Column */}
                <div className="truck-info">
                  <div className="truck-plates">
                    <FaTruck />
                    <span>{truck.plates}</span>
                  </div>

                  {truck.trailer && (
                    <div className="trailer-plates">
                      <FaTrailer />
                      <span>{truck.trailer}</span>
                    </div>
                  )}

                  {truck.driver_details && (
                    <div
                      className="driver-info"
                      onClick={() => toggleTruckDetails(truck.id)}
                    >
                      <FaUser />
                      <span>{truck.driver_details.full_name}</span>
                      <span className="expand-icon">
                        {expandedTruckId === truck.id ? "▼" : "▶"}
                      </span>
                    </div>
                  )}

                  {expandedTruckId === truck.id &&
                    truck.driver_details?.phone_number && (
                      <div className="driver-phone">
                        📞 {truck.driver_details.phone_number}
                      </div>
                    )}
                </div>

                {/* Day Columns */}
                {weekDates.map((date, dayIndex) => (
                  <Droppable
                    key={`${truck.id}-${dayIndex}`}
                    droppableId={`${truck.id}-${dayIndex}`}
                  >
                    {(provided, snapshot) => (
                      <div
                        className={`day-column ${
                          snapshot.isDraggingOver ? "drag-over" : ""
                        }`}
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                      >
                        {/* Tasks */}
                        {getTasksForDay(truck.id, dayIndex).map(
                          (task, taskIndex) => (
                            <Draggable
                              key={`${task.id}-${taskIndex}`}
                              draggableId={`${task.id}-${taskIndex}`}
                              index={taskIndex}
                            >
                              {(provided, snapshot) => (
                                <div
                                  className={`task-item ${
                                    snapshot.isDragging ? "dragging" : ""
                                  }`}
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  onMouseDown={(e) =>
                                    handleTaskCopy(e, task, truck.id, dayIndex)
                                  }
                                  style={{
                                    ...provided.draggableProps.style,
                                    opacity: snapshot.isDragging ? 0.8 : 1,
                                  }}
                                >
                                  <div className="task-content">
                                    <div className="task-type">{task.type}</div>
                                    {task.order_number && (
                                      <div className="task-order">
                                        #{task.order_number}
                                      </div>
                                    )}
                                    {task.customer && (
                                      <div className="task-customer">
                                        {task.customer}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          )
                        )}

                        {provided.placeholder}

                        {/* Add Task Button */}
                        <button
                          className="add-task-btn"
                          title="Додати завдання"
                        >
                          <FaPlus />
                        </button>
                      </div>
                    )}
                  </Droppable>
                ))}
              </div>
            ))}
        </div>
      </DragDropContext>

      {/* Info Panel */}
      <div className="info-panel">
        <div className="info-item">
          <FaInfoCircle />
          <span>Перетягуйте завдання між днями для зміни розкладу</span>
        </div>
        <div className="info-item">
          <FaCopy />
          <span>Утримуйте Alt та клікніть на завдання для копіювання</span>
        </div>
      </div>
    </div>
  );
};

export default DragDropPlannerPage;
