import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import cn from "classnames";

import { transformSelectOptions } from "../../../utils/transformers";
import {
  createCustomer,
  updateCustomer,
} from "../../../features/customers/customersOperations";
import {
  setCustomerDetailsData,
  setEditModeCustomer,
} from "../../../features/customers/customersSlice";
import { listPaymentTypes } from "../../../actions/paymentTypeActions";

import { CUSTOMER_CONSTANTS } from "../../../constants/global";
import { formFields } from "./customerFormFields.jsx";

import AddCustomerFooterComponent from "../AddCustomerFooterComponent";
import InputComponent from "../../../globalComponents/InputComponent";
import SelectComponent from "../../../globalComponents/SelectComponent";

import "./style.scss";

const AddCustomerComponent = ({
  onCloseModal,
  onEditMode,
  initialCustomerData = null,
}) => {
  const dispatch = useDispatch();

  const paymentTypes = useSelector(
    (state) => state.paymentTypesInfo.paymentTypes.data
  );

  const paymentTypesOptions = transformSelectOptions(paymentTypes, "name");

  const [customerFields, setCustomerFields] = useState(() => {
    if (initialCustomerData) {
      const paymentTypeName = paymentTypes.find(
        (type) => type.id === initialCustomerData.payment_type
      )?.name;

      return {
        ...initialCustomerData,
        payment_type: paymentTypeName || "",
      };
    }

    return Object.values(CUSTOMER_CONSTANTS).reduce((acc, item) => {
      acc[item] = "";
      return acc;
    }, {});
  });

  useEffect(() => {
    dispatch(listPaymentTypes());
  }, [dispatch]);

  const handleCustomerChange = (e) => {
    const { name, value } = e.target;
    setCustomerFields((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    let data = {};
    Object.keys(customerFields).forEach((key) => {
      data[key] = customerFields[key];
    });

    // Convert payment_type to ID
    const selectedPaymentType = paymentTypes.find(
      (type) => type.name === data["payment_type"]
    );
    if (selectedPaymentType) {
      data["payment_type"] = selectedPaymentType.id;
    }

    if (initialCustomerData) {
      dispatch(updateCustomer(data));
      dispatch(setCustomerDetailsData(data));
      dispatch(setEditModeCustomer(false));
    } else {
      dispatch(createCustomer(data));
      onCloseModal();
    }
  };

  return (
    <>
      <form
        className="add-customer__form"
        onSubmit={(e) => handleFormSubmit(e)}
      >
        <div className="customer-card-container">
          <div className="customer-card-details">
            <div className="add-customer__content">
              <div className="add-customer__content-block">
                {!onEditMode && (
                  <h3 className="add-customer__title">Дані замовника</h3>
                )}
                <div className="add-customer__content-row">
                  {formFields.map((fields) => (
                    <div
                      className={cn(
                        "add-customer__content-row-block",
                        initialCustomerData !== null &&
                          "add-customer__content-row-block_edit-mode"
                      )}
                      key={`fields-row-${fields[0].id}`}
                    >
                      {fields.map((field) => {
                        const { id, title, placeholder, component, type } =
                          field;
                        return component === "select" ? (
                          <SelectComponent
                            label={title}
                            key={id}
                            id={id}
                            name={id}
                            title={title}
                            placeholder={placeholder}
                            value={customerFields[id]}
                            options={paymentTypesOptions}
                            onChange={(e) => handleCustomerChange(e)}
                            disabled={initialCustomerData !== null}
                          />
                        ) : (
                          <InputComponent
                            label={field.title}
                            id={field.id}
                            name={field.id}
                            title={field.title}
                            placeholder={field.placeholder}
                            value={customerFields[field.id]}
                            onChange={(e) => handleCustomerChange(e)}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {!initialCustomerData && (
              <AddCustomerFooterComponent onCloseModal={onCloseModal} />
            )}
            {initialCustomerData && (
              <div className="edit-customer-manager__footer">
                <button
                  title={
                    initialCustomerData
                      ? "Оновити замовника"
                      : "Додати менеджера"
                  }
                  className="end-time__footer-btn end-time__footer-btn_save"
                  type="submit"
                  // disabled={initialCustomerData ? isFormValid : !isFormValid}
                >
                  {initialCustomerData
                    ? "Оновити замовника"
                    : "Додати менеджера"}
                </button>
              </div>
            )}
          </div>
        </div>
      </form>
    </>
  );
};

export default AddCustomerComponent;
