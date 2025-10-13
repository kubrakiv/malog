import Task from "../Task/Task";
import AddTaskButton from "../AddTaskButton/AddTaskButton";
import TachoCardComponent from "../WeekPlanner/TachoCardComponent";

import "./DayTasks.scss";

function DayTasks({
  tasks,
  dayNumber,
  truckId,
  onTruckDateSelect,
  handleEndTime,
  handleStartTime,
  handleDeleteTask,
  handleEditModeTask,
  showTaskType,
}) {
  const hasTasks = tasks.length > 0;
  const week = true;

  return (
    <>
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
    </>
  );
}

export default DayTasks;
