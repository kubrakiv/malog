import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import { setEditModeOrder } from "../../../features/orders/ordersSlicers";

const FooterComponent = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const editModeOrder = useSelector((state) => state.ordersInfo.editModeOrder);

  const toggleEditMode = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(setEditModeOrder(!editModeOrder));
  };

  const handleOrderClose = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigate("/orders");
  };

  return (
    <>
      <div className="order-details__footer">
        <button
          title="Edit Order"
          className="order-details__footer-btn order-details__footer-btn_edit"
          onClick={toggleEditMode}
        >
          {!editModeOrder ? "Редагувати" : "Завершити редагування"}
        </button>
        <button
          title="Save Order"
          className="order-details__footer-btn order-details__footer-btn_save"
        >
          Записати
        </button>
        <button
          title="Close Order"
          className="order-details__footer-btn order-details__footer-btn_close"
          onClick={handleOrderClose}
        >
          Закрити
        </button>
      </div>
    </>
  );
};

export default FooterComponent;
