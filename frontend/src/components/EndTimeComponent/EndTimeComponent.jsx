import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { selectSelectedTask } from "../../features/planner/plannerSelectors";
import { setShowEndTimeModal } from "../../features/planner/plannerSlice";
import { updateTask } from "../../features/tasks/tasksOperations";

import InputComponent from "../../globalComponents/InputComponent";
import EndTimeFooterComponent from "./EndTimeFooterComponent/EndTimeFooterComponent";
import EndTimeHeaderComponent from "./EndTimeHeaderComponent/EndTimeHeaderComponent";

import "./EndTimeComponent.scss";

const EndTimeComponent = () => {
  const dispatch = useDispatch();
  const selectedTask = useSelector(selectSelectedTask);

  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");

  useEffect(() => {
    setEndDate(selectedTask?.end_date);
    setEndTime(selectedTask?.end_time);
  }, [selectedTask]);

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    // if (!endDate || !endTime) {
    //   return;
    // }

    const data = {
      end_date: endDate,
      end_time: endTime,
    };

    if (data) {
      dispatch(updateTask({ id: selectedTask.id, ...data }));
      dispatch(setShowEndTimeModal(false));
    }
  };

  return (
    <>
      <div className="end-time-container">
        <div className="end-time">
          <EndTimeHeaderComponent selectedTask={selectedTask} />
          <form onSubmit={handleFormSubmit} className="end-time-form">
            <div className="end-time__content">
              <div className="end-time__content-block">
                <div className="end-time__row">
                  <div className="end-time__content-row-block">
                    <div className="end-time__row-block">
                      <InputComponent
                        label={"Дата завершення"}
                        required
                        type="date"
                        placeholder="Enter end date"
                        value={endDate}
                        className="add-task-form__input"
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="end-time__content-row-block">
                    <div className="end-time__row-block">
                      <InputComponent
                        label={"Час завершення"}
                        required
                        type="time"
                        placeholder="Enter end time"
                        value={endTime}
                        className="add-task-form__input"
                        onChange={(e) => setEndTime(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <EndTimeFooterComponent />
          </form>
        </div>
      </div>
    </>
  );
};

export default EndTimeComponent;
