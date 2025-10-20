import React from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  selectSelectedDriver,
  selectShowDriverModal,
} from "../../../features/drivers/driversSelectors";
import {
  setShowDriverModal,
  setSelectedDriver,
} from "../../../features/drivers/driversSlice";

import GenericModalComponent from "../../../globalComponents/GenericModalComponent";
import DriverCardComponent from "../DriverCardComponent";

import "./style.scss";

const DriverModalComponent = () => {
  const dispatch = useDispatch();
  const selectedDriver = useSelector(selectSelectedDriver);
  const showDriverModal = useSelector(selectShowDriverModal);

  const handleCloseModal = () => {
    dispatch(setShowDriverModal(false));
    dispatch(setSelectedDriver({}));
  };

  return (
    <GenericModalComponent
      show={showDriverModal}
      title={`${selectedDriver?.first_name || ""} ${
        selectedDriver?.last_name || ""
      }`}
      content={<DriverCardComponent driver={selectedDriver} inModal={true} />}
      onClose={handleCloseModal}
    />
  );
};

export default DriverModalComponent;
