import { useDispatch, useSelector } from "react-redux";
import EndTimeComponent from "../../EndTimeComponent/EndTimeComponent";
import GenericModalComponent from "../../../globalComponents/GenericModalComponent";

import { setShowEndTimeModal } from "../../../features/planner/plannerSlice";
import { selectShowEndTimeModal } from "../../../features/planner/plannerSelectors";

import "./EndTimeModalComponent.scss";

const EndTimeModalComponent = () => {
  const dispatch = useDispatch();
  const showEndTimeModal = useSelector(selectShowEndTimeModal);

  const handleCloseModal = () => {
    dispatch(setShowEndTimeModal(false));
  };

  return (
    <>
      <GenericModalComponent
        show={showEndTimeModal}
        onClose={handleCloseModal}
        content={<EndTimeComponent />}
      />
    </>
  );
};

export default EndTimeModalComponent;
