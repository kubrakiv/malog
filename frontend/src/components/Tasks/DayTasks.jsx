import Task from "../Task/Task";
import AddTaskButton from "../AddTaskButton/AddTaskButton";
import TachoCardComponent from "../WeekPlanner/TachoCardComponent";

import "./DayTasks.scss";

function DayTasks({
  tasks,
  dayNumber,
  truckId,
  truckPlates,
  onTruckDateSelect,
  handleEndTime,
  handleStartTime,
  handleDeleteTask,
  handleEditModeTask,
  showTaskType,
  canCopyTask,
  handleTaskCopyDragStart,
  handleTaskCopyDragEnd,
  handleTaskCopyDragOver,
  handleTaskCopyDrop,
  isCopyDropActive,
}) {
  const hasTasks = tasks.length > 0;
  const week = true;

  return (
    <div
      className={`day-tasks${isCopyDropActive ? " day-tasks--copy-active" : ""}`}
      onDragOver={(event) =>
        handleTaskCopyDragOver?.(event, { truckPlates, dayNumber })
      }
      onDrop={(event) =>
        handleTaskCopyDrop?.(event, { truckPlates, dayNumber })
      }
    >
      {hasTasks &&
        tasks.map((task) => (
          <div key={task.id} style={{ width: "100%" }}>
            <Task
              task={task}
              handleEndTime={handleEndTime}
              handleStartTime={handleStartTime}
              handleDeleteTask={handleDeleteTask}
              handleEditModeTask={handleEditModeTask}
              showTaskType={showTaskType}
              canCopyTask={canCopyTask}
              handleTaskCopyDragStart={handleTaskCopyDragStart}
              handleTaskCopyDragEnd={handleTaskCopyDragEnd}
            />
          </div>
        ))}
      <div className="weekplanner__button-container">
        <AddTaskButton
          onTruckDateSelect={onTruckDateSelect}
          dayNumber={dayNumber}
          truckId={truckId}
          style={week}
        />
        <TachoCardComponent truckId={truckId} />
      </div>
    </div>
  );
}

export default DayTasks;
