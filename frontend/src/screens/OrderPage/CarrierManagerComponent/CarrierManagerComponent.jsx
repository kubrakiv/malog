import React from "react";
import { FaRegUser } from "react-icons/fa";
import FormWrapper from "../../../components/FormWrapper";
import { useSelector } from "react-redux";

const CarrierManagerComponent = () => {
  const order = useSelector((state) => state.ordersInfo.orderDetails.data);
  const { user } = order;

  return (
    <>
      <FormWrapper
        disableEditMode
        title="Відповідальний"
        hiddenContent={
          <div className="order-details__content-row-block-value">
            {user && (
              <span>
                &#9990; {user?.phone_number} <br />
              </span>
            )}
            {user && <span>&#128386; {user?.email}</span>}
          </div>
        }
        content={
          <div className="order-details__content-row-block-value">
            <FaRegUser /> {user?.last_name} {user?.first_name}
          </div>
        }
      />
    </>
  );
};

export default CarrierManagerComponent;
