import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { setEditModeOrder } from "../../../features/orders/ordersSlicers";

import "./FormButtonComponent.scss";

function FormButtonComponent({ onSave, onClose }) {
  const dispatch = useDispatch();

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.keyCode === 27) {
        dispatch(setEditModeOrder(false));
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  });

  const handleEditModeClose = () => {
    onClose(false);
    dispatch(setEditModeOrder(false));
  };

  const handleSave = (e) => {
    e.preventDefault();
    e.stopPropagation();

    onSave();
    handleEditModeClose();
  };

  return (
    <>
      <div className="form-footer form-footer_number">
        <button
          type="button"
          className="form-footer-btn form-footer-btn_save"
          onClick={(e) => handleSave(e)}
        >
          Зберегти
        </button>
        <button
          type="button"
          className="form-footer-btn form-footer-btn_close"
          onClick={handleEditModeClose}
        >
          Закрити
        </button>
      </div>
    </>
  );
}

export default FormButtonComponent;
