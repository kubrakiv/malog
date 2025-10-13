import { useDispatch, useSelector } from "react-redux";

import {
  setShowTruckModal,
  setEditModeTruck,
} from "../../../features/trucks/trucksSlice";
import { selectShowTruckModal } from "../../../features/trucks/trucksSelectors";

import TruckCardComponent from "../TruckCardComponent";
import GenericModalComponent from "../../../globalComponents/GenericModalComponent";

const TruckModalComponent = ({ selectedTruck }) => {
  const dispatch = useDispatch();
  const showTruckModal = useSelector(selectShowTruckModal);

  const handleCloseModal = () => {
    dispatch(setShowTruckModal(false));
    dispatch(setEditModeTruck(false));
  };

  return (
    <>
      <GenericModalComponent
        show={showTruckModal}
        onClose={handleCloseModal}
        content={
          <TruckCardComponent
            truck={selectedTruck}
            closeModal={handleCloseModal}
          />
        }
      />
    </>
  );
};

export default TruckModalComponent;
