import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { selectShowAddTruckModal } from "../../../features/trucks/trucksSelectors";
import { setShowAddTruckModal } from "../../../features/trucks/trucksSlice";

import GenericModalComponent from "../../../globalComponents/GenericModalComponent";
import ManageTruckComponent from "../ManageTruckComponent";

const AddTruckModalComponent = () => {
  const dispatch = useDispatch();
  const showAddTruckModal = useSelector(selectShowAddTruckModal);
  const [activeTab, setActiveTab] = useState("basic");
  const [formInstanceKey, setFormInstanceKey] = useState(0);

  useEffect(() => {
    if (showAddTruckModal) {
      // Start with a clean tab and form state whenever modal opens.
      setActiveTab("basic");
      setFormInstanceKey((prev) => prev + 1);
    }
  }, [showAddTruckModal]);

  const handleCloseModal = () => {
    dispatch(setShowAddTruckModal(false));
  };

  return (
    <>
      <GenericModalComponent
        show={showAddTruckModal}
        onClose={handleCloseModal}
        content={
          showAddTruckModal ? (
            <ManageTruckComponent
              key={formInstanceKey}
              onCloseModal={handleCloseModal}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />
          ) : null
        }
      />
    </>
  );
};

export default AddTruckModalComponent;
