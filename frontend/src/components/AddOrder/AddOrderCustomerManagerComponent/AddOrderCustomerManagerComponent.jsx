import React from "react";
import "./AddOrderCustomerManagerComponent.scss";

const AddOrderCustomerManagerComponent = ({
  selectedCustomerManager,
  setSelectedCustomerManager,
  customerManagersList,
}) => {
  return (
    <>
      <div className="add-order-details__content-row-block">
        <div className="add-order-details__content-row-block-title">
          Менеджер замовника
        </div>
        <select
          id="form-field__select"
          name="form-field__select"
          className="form-field__select"
          value={selectedCustomerManager || ""}
          onChange={(e) => setSelectedCustomerManager(e.target.value)}
        >
          <option value={""}>Вибрати менеджера</option>
          {customerManagersList.map((manager) => (
            <option key={manager.email}>{manager.full_name}</option>
          ))}
        </select>
      </div>
    </>
  );
};

export default AddOrderCustomerManagerComponent;
