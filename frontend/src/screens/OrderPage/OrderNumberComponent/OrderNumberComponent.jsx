import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { updateOrder } from "../../../features/orders/ordersOperations";
import { FaSave, FaTimes } from "react-icons/fa";

import InputComponent from "../../../globalComponents/InputComponent";

import "./OrderNumberComponent.scss";

function OrderNumberComponent() {
  const dispatch = useDispatch();
  const order = useSelector((state) => state.ordersInfo.orderDetails.data);

  const [editModeOrderNumber, setEditModeOrderNumber] = useState(false);

  const [orderNumber, setOrderNumber] = useState("");

  useEffect(() => {
    setOrderNumber(order.order_number);
  }, [order]);

  const handleFormSubmit = () => {
    let dataToUpdate = {};
    dataToUpdate = { order_number: orderNumber };
    dispatch(updateOrder({ dataToUpdate, orderId: order.id }));
    setEditModeOrderNumber(false);
  };

  return (
    <>
      <div
        className="order-details__header-block"
        style={{ userSelect: "none" }}
        onDoubleClick={() => setEditModeOrderNumber((prev) => !prev)}
      >
        {!editModeOrderNumber ? `Заявка ${order.order_number}` : "Заявка"}
        {editModeOrderNumber && (
          <form>
            <div className="order-details__order-number-form">
              <InputComponent
                id="orderNumber"
                name="orderNumber"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                autoFocus
                style={"form-field__input-order-number"}
              ></InputComponent>
            </div>
          </form>
        )}
        {editModeOrderNumber && (
          <>
            <button
              type="button"
              className="form-footer-btn form-footer-btn_save-order-number"
              onClick={handleFormSubmit}
            >
              <FaSave />
            </button>
            <button
              className="order-actions__clear-btn-order-number"
              onClick={() => setEditModeOrderNumber(false)}
              title="Відмінити"
            >
              <FaTimes />
            </button>
          </>
        )}
      </div>
    </>
  );
}

export default OrderNumberComponent;
