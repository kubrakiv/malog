import TaskOrder from "../../Task/TaskOrder";
import { useSelector } from "react-redux";

const AddOrderTaskComponent = ({
  handleShowPointOnMap,
  handleEditModeTask,
  handleDeleteTask,
}) => {
  const taskListNoOrder = useSelector(
    (state) => state.ordersInfo.taskListNoOrder.data
  );

  const getDateTime = (date, time) => {
    return new Date(`${date}T${time}`);
  };

  const sortedTasks =
    taskListNoOrder &&
    taskListNoOrder.sort((a, b) => {
      let dateTimeA = getDateTime(a.start_date, a.start_time);
      let dateTimeB = getDateTime(b.start_date, b.start_time);
      return dateTimeA - dateTimeB;
    });

  return (
    <>
      {sortedTasks &&
        sortedTasks.map((task) => (
          <div key={task.id}>
            <TaskOrder
              task={task}
              handleShowPointOnMap={handleShowPointOnMap}
              handleEditModeTask={handleEditModeTask}
              handleDeleteTask={handleDeleteTask}
            />
          </div>
        ))}
    </>
  );
};

export default AddOrderTaskComponent;
