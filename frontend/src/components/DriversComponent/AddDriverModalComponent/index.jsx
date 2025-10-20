import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { selectShowAddDriverModal } from "../../../features/drivers/driversSelectors";
import { setShowAddDriverModal } from "../../../features/drivers/driversSlice";

import GenericModalComponent from "../../../globalComponents/GenericModalComponent";
import RegisterFormComponent from "../../../screens/RegisterPage/RegisterFormComponent";

const AddDriverModalComponent = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const showAddDriverModal = useSelector(selectShowAddDriverModal);

  // Clean up location state when component mounts
  useEffect(() => {
    if (location.state?.addDriver && history.replaceState) {
      const newState = { ...location.state };
      delete newState.addDriver;
      history.replaceState({ ...newState }, document.title);
    }
  }, []);

  const handleCloseModal = () => {
    dispatch(setShowAddDriverModal(false));
  };

  return (
    <>
      <GenericModalComponent
        title="Додати нового водія"
        show={showAddDriverModal}
        onClose={handleCloseModal}
        content={
          <RegisterFormComponent
            inModal={true}
            onCloseModal={handleCloseModal}
          />
        }
        // header
      />
    </>
  );
};

export default AddDriverModalComponent;
