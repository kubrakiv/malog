import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { updateOrder } from "../../../features/orders/ordersOperations";
import FormWrapper from "../../../components/FormWrapper";

import "./OrderNoticeComponent.scss";

const OrderNoticeComponent = () => {
  const order = useSelector((state) => state.ordersInfo.orderDetails.data);
  const dispatch = useDispatch();

  const [notice, setNotice] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (order?.notice) {
      setNotice(order.notice);
    }
  }, [order]);

  const handleSaveNotice = () => {
    // Update notice field in order using Redux
    const dataToUpdate = { notice: notice.trim() };
    dispatch(updateOrder({ dataToUpdate, orderId: order.id }));
    setIsEditing(false);
  };

  const handleEditNotice = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    // Reset to original notice text
    setNotice(order?.notice || "");
    setIsEditing(false);
  };

  const handleFormSubmit = () => {
    // Handle form submission - save the notice
    handleSaveNotice();
  };

  const renderNoticesContent = () => {
    if (!notice || notice.trim() === "") {
      return (
        <div className="order-details__content-row-block-value">
          <p className="no-notices">Немає примітки</p>
        </div>
      );
    }

    return (
      <div className="order-details__content-row-block-value">
        <div className="notice-display">
          <div className="notice-text">{notice}</div>
        </div>
      </div>
    );
  };

  const renderEditForm = () => {
    return (
      <div className="order-notice-edit-form">
        <div className="notice-form">
          <textarea
            value={notice}
            onChange={(e) => setNotice(e.target.value)}
            placeholder="Введіть примітку..."
            rows={2}
            className="notice-textarea"
            autoFocus
          />
        </div>
      </div>
    );
  };

  return (
    <FormWrapper
      title="Примітки"
      content={renderNoticesContent()}
      handleFormSubmit={handleFormSubmit}
    >
      {renderEditForm()}
    </FormWrapper>
  );
};

export default OrderNoticeComponent;
