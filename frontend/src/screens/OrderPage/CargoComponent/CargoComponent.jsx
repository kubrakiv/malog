import { useEffect, useState } from "react";
import FormWrapper from "../../../components/FormWrapper";
import InputComponent from "../../../globalComponents/InputComponent";
import { updateOrder } from "../../../features/orders/ordersOperations";
import { useSelector, useDispatch } from "react-redux";

import "./CargoComponent.scss";

const CARGO_CONSTANTS = {
  CARGO_NAME: "cargo_name",
  CARGO_WEIGHT: "cargo_weight",
  CARGO_LOADING_TYPE: "loading_type",
  TRAILER_TYPE: "trailer_type",
};

const { CARGO_NAME, CARGO_WEIGHT, CARGO_LOADING_TYPE, TRAILER_TYPE } =
  CARGO_CONSTANTS;

const CargoComponent = () => {
  const order = useSelector((state) => state.ordersInfo.orderDetails.data);

  const dispatch = useDispatch();

  const [cargoFields, setCargoFields] = useState(
    Object.values(CARGO_CONSTANTS).reduce((acc, item) => {
      acc[item] = "";
      return acc;
    }, {})
  );

  useEffect(() => {
    if (order) {
      const defaultValues = Object.values(CARGO_CONSTANTS).reduce(
        (acc, item) => {
          acc[item] = order?.[item] || "";
          return acc;
        },
        {}
      );
      setCargoFields(defaultValues);
    }
  }, [order]);

  const formFields = [
    [
      {
        id: CARGO_NAME,
        placeholder: "Вантаж",
      },
      {
        id: CARGO_WEIGHT,
        placeholder: "Вага, т",
      },
    ],
    [
      {
        id: TRAILER_TYPE,
        placeholder: "Тип кузова",
      },
      {
        id: CARGO_LOADING_TYPE,
        placeholder: "Тип завант",
      },
    ],
  ];

  const handleCargoChange = (e) => {
    const { name, value } = e.target;
    setCargoFields((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFormSubmit = () => {
    let dataToUpdate = {};
    Object.keys(cargoFields).forEach((key) => {
      dataToUpdate[key] = cargoFields[key];
    });

    dispatch(updateOrder({ dataToUpdate, orderId: order.id }));
  };

  return (
    <>
      <FormWrapper
        title="Вантаж"
        handleFormSubmit={handleFormSubmit}
        content={
          <div className="cargo-info">
            {formFields.map((row, i) => (
              <div key={i} className="cargo-info__row">
                {row.map((field) => (
                  <div key={field.id} className="cargo-info__cell">
                    <span className="cargo-info__label">{field.placeholder}:</span>
                    <span className="cargo-info__value">
                      {!cargoFields[field.id] || cargoFields[field.id] === "Unknown"
                        ? "—"
                        : cargoFields[field.id]}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        }
      >
        <form>
          <div className="order-details__cargo-form-container">
            {formFields.map((fields, index) => (
              <div key={index} className="order-details__form-col">
                {fields.map((field) => {
                  return (
                    <div key={field.id}>
                      <InputComponent
                        id={field.id}
                        name={field.id}
                        placeholder={field.placeholder}
                        value={cargoFields[field.id]}
                        onChange={(e) => handleCargoChange(e)}
                      />
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </form>
      </FormWrapper>
    </>
  );
};

export default CargoComponent;
