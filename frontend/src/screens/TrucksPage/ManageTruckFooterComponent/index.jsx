import React from "react";

const ManageTruckFooterComponent = ({
  onCloseModal,
  canAddTruck = true,
  saveLabel = "Записати",
}) => {
  return (
    <>
      <div className="end-time__footer">
        <button
          title={canAddTruck ? "Save Date and Time" : "Truck limit reached"}
          className={`end-time__footer-btn ${
            canAddTruck
              ? "end-time__footer-btn_save"
              : "end-time__footer-btn_disabled"
          }`}
          type="submit"
          disabled={!canAddTruck}
        >
          {canAddTruck ? saveLabel : "Limit reached"}
        </button>
        <button
          title="Close Window"
          className="end-time__footer-btn end-time__footer-btn_close"
          onClick={(e) => {
            e.preventDefault();
            onCloseModal();
          }}
        >
          Закрити
        </button>
      </div>
    </>
  );
};

export default ManageTruckFooterComponent;
