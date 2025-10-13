import { useDispatch, useSelector } from "react-redux";
import {
  setSelectedDate,
  setSelectedDriver,
  setSelectedTask,
  setSelectedTruck,
  setShowServiceTaskModal,
} from "../../../features/planner/plannerSlice";
import {
  selectShowServiceTaskModal,
  selectSelectedTask,
  selectEditModeServiceTask,
} from "../../../features/planner/plannerSelectors";

import GenericModalComponent from "../../../globalComponents/GenericModalComponent";
import AddServiceTaskComponent from "../../AddServiceTaskComponent/AddServiceTaskComponent";

import "./ServiceTaskModalComponent.scss";

const ServiceTaskModalComponent = () => {
  const dispatch = useDispatch();
  const showServiceTaskModal = useSelector(selectShowServiceTaskModal);
  const editModeServiceTask = useSelector(selectEditModeServiceTask);
  const selectedTask = useSelector(selectSelectedTask);

  const handleModalClose = () => {
    dispatch(setShowServiceTaskModal(false));
    dispatch(setSelectedTask(null));
    dispatch(setSelectedTruck(null));
    dispatch(setSelectedDriver(null));
    dispatch(setSelectedDate(null));
  };

  return (
    <>
      <GenericModalComponent
        show={showServiceTaskModal}
        onClose={handleModalClose}
        content={
          editModeServiceTask ? (
            <AddServiceTaskComponent
              onCloseModal={handleModalClose}
              initialTaskData={selectedTask}
            />
          ) : (
            <AddServiceTaskComponent onCloseModal={handleModalClose} />
          )
        }
      />
    </>
  );
};

export default ServiceTaskModalComponent;
