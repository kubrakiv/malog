import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { selectSelectedTask } from "../../features/planner/plannerSelectors";
import { setShowStartTimeModal } from "../../features/planner/plannerSlice";
import { updateTask } from "../../features/tasks/tasksOperations";

import StartTimeHeaderComponent from "./StartTimeHeaderComponent/StartTimeHeaderComponent";
import InputComponent from "../../globalComponents/InputComponent";
import StartTimeFooterComponent from "./StartTimeFooterComponent/StartTimeFooterComponent";

import "./StartTimeComponent.scss";

const StartTimeComponent = () => {
  const dispatch = useDispatch();
  const selectedTask = useSelector(selectSelectedTask);

  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");

  useEffect(() => {
    setStartDate(selectedTask?.start_date);
    setStartTime(selectedTask?.start_time);
  }, [selectedTask]);

  const getTaskTypeLabel = (task) => {
    if (task?.type_uk) {
      return task.type_uk.toLowerCase();
    }

    const typeMap = {
      Loading: "завантаження",
      Unloading: "розвантаження",
    };

    return (typeMap[task?.type] || "завдання").toLowerCase();
  };

  const taskTypeLabel = getTaskTypeLabel(selectedTask);

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    // if (!startDate || !startTime) {
    //   return;
    // }

    const data = {
      start_date: startDate,
      start_time: startTime,
    };

    if (data) {
      dispatch(updateTask({ id: selectedTask.id, ...data }));
      dispatch(setShowStartTimeModal(false));
    }
  };

  return (
    <>
      <div className="start-time-container">
        <div className="start-time">
          <StartTimeHeaderComponent selectedTask={selectedTask} />
          <form onSubmit={handleFormSubmit} className="start-time-form">
            <div className="start-time__content">
              <div className="start-time__content-block">
                <div className="start-time__row">
                  <div className="start-time__content-row-block">
                    <div className="start-time__row-block">
                      <InputComponent
                        label={`Дата початку ${taskTypeLabel}`}
                        required
                        type="date"
                        placeholder="Оберіть дату"
                        value={startDate}
                        className="add-task-form__input"
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="start-time__content-row-block">
                    <div className="start-time__row-block">
                      <InputComponent
                        label={`Час початку ${taskTypeLabel}`}
                        required
                        type="time"
                        placeholder="Оберіть час"
                        value={startTime}
                        className="add-task-form__input"
                        onChange={(e) => setStartTime(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <StartTimeFooterComponent />
          </form>
        </div>
      </div>
    </>
  );
};

export default StartTimeComponent;
