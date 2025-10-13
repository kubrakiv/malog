import { useDispatch, useSelector } from "react-redux";
import { setShowStartTimeModal } from "../../../features/planner/plannerSlice";
import { selectShowStartTimeModal } from "../../../features/planner/plannerSelectors";

import StartTimeComponent from "../../StartTimeComponent/StartTimeComponent";
import GenericModalComponent from "../../../globalComponents/GenericModalComponent";

import "./StartTimeModalComponent.scss";

const StartTimeModalComponent = () => {
  const dispatch = useDispatch();
  const showStartTimeModal = useSelector(selectShowStartTimeModal);

  const handleCloseModal = () => {
    dispatch(setShowStartTimeModal(false));
  };

  return (
    <>
      <GenericModalComponent
        show={showStartTimeModal}
        onClose={handleCloseModal}
        content={<StartTimeComponent />}
      />
    </>
  );
};

export default StartTimeModalComponent;
