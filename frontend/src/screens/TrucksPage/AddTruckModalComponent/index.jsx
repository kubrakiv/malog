import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { selectShowAddTruckModal } from "../../../features/trucks/trucksSelectors";
import { setShowAddTruckModal } from "../../../features/trucks/trucksSlice";

import GenericModalComponent from "../../../globalComponents/GenericModalComponent";
import ManageTruckComponent from "../ManageTruckComponent";

const AddTruckModalComponent = () => {
  const dispatch = useDispatch();
  const showAddTruckModal = useSelector(selectShowAddTruckModal);
  const [activeTab, setActiveTab] = useState("basic");

  const handleCloseModal = () => {
    dispatch(setShowAddTruckModal(false));
  };

  return (
    <>
      <GenericModalComponent
        show={showAddTruckModal}
        onClose={handleCloseModal}
        content={
          <ManageTruckComponent
            onCloseModal={handleCloseModal}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
        }
      />
    </>
  );
};

export default AddTruckModalComponent;
