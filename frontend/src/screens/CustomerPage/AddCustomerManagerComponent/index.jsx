import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { updateCustomerManager } from "../../../features/customerManagers/customerManagersOperations";
import {
  setAddCustomerManager,
  setIsEditModeCustomerManager,
  setShowCustomerManagerForm,
} from "../../../features/customerManagers/customerManagersSlice";
import { CUSTOMER_MANAGER_CONSTANTS } from "../../../constants/global";

import { formFields } from "./customerManagerFormFields";

import InputComponent from "../../../globalComponents/InputComponent";

import "./style.scss";

const { CUSTOMER, FULL_NAME } = CUSTOMER_MANAGER_CONSTANTS;

const AddCustomerManagerComponent = ({
  customer,
  onAddManager,
  initialManagerData = null,
  onFinishEdit,
  isEditMode,
}) => {
  const dispatch = useDispatch();

  const [customerManagerFields, setCustomerManagerFields] = useState(
    initialManagerData ||
      Object.values(CUSTOMER_MANAGER_CONSTANTS).reduce((acc, item) => {
        acc[item] = "";
        return acc;
      }, {})
  );

  const [isFormValid, setIsFormValid] = useState(false);

  const handleCustomerManagerChange = (e) => {
    const { name, value } = e.target;
    setCustomerManagerFields((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Check if all user-input fields (excluding customer) are filled properly
  useEffect(() => {
    const isValid = Object.keys(customerManagerFields)
      .filter((key) => key !== CUSTOMER) // Exclude the customer field
      .every((key) => {
        const value = customerManagerFields[key];
        return typeof value === "string" && value.trim() !== ""; // Ensure the value is a string before calling trim
      });

    console.log("Form Valid:", isValid);
    setIsFormValid(isValid);
  }, [customerManagerFields]);

  const handleFormSubmit = (e) => {
    e.preventDefault();

    const data = {};
    Object.keys(customerManagerFields).forEach((key) => {
      let val = customerManagerFields[key];
      if (key === FULL_NAME && typeof val === "string") {
        val = val.trim(); // <-- simple trim for the title/full name
      }
      if (val) data[key] = val;
    });
    data[CUSTOMER] = customer.id;

    if (initialManagerData) {
      console.log("Updating manager data", data);
      dispatch(updateCustomerManager(data)).then((result) => {
        if (result.meta.requestStatus === "fulfilled") {
          onFinishEdit(result.payload);
        }
      });
      dispatch(setIsEditModeCustomerManager(false));
    } else {
      console.log("Adding new manager data", data);
      onAddManager(data);
    }

    dispatch(setShowCustomerManagerForm(false));
    dispatch(setAddCustomerManager(false));
  };

  return (
    <>
      <form
        className="add-customer-manager__form"
        onSubmit={(e) => handleFormSubmit(e)}
      >
        <div className="customer-card-container">
          <div className="customer-card-details">
            <div className="add-customer-manager__content">
              <div className="add-customer-manager__content-block">
                <div className="add-customer-manager__content-row">
                  {formFields.map((fields, index) => (
                    <div
                      className="add-customer-manager__content-row-block"
                      key={`fields-row-${index}`}
                    >
                      {fields.map((field) => {
                        const { id, title, placeholder, type } = field;
                        return (
                          <div key={id}>
                            <InputComponent
                              type={type}
                              label={title}
                              id={id}
                              name={id}
                              title={title}
                              placeholder={placeholder}
                              value={customerManagerFields[id]}
                              onChange={(e) => handleCustomerManagerChange(e)}
                            />
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="edit-customer-manager__footer">
              <button
                title={
                  initialManagerData ? "Оновити менеджера" : "Додати менеджера"
                }
                className="end-time__footer-btn end-time__footer-btn_save"
                type="submit"
                disabled={initialManagerData ? isFormValid : !isFormValid}
              >
                {initialManagerData ? "Оновити менеджера" : "Додати менеджера"}
              </button>
              {isEditMode && (
                <button
                  title="Завершити редагування"
                  className="end-time__footer-btn end-time__footer-btn_edit"
                  type="submit"
                  onClick={onFinishEdit}
                >
                  Завершити редагування
                </button>
              )}
            </div>
          </div>
        </div>
      </form>
    </>
  );
};

export default AddCustomerManagerComponent;
