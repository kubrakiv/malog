import { useEffect } from "react";
import { FaExclamationTriangle } from "react-icons/fa";
import "./style.scss";

const ConfirmModal = ({
  message,
  title = "Підтвердження",
  confirmLabel = "Підтвердити",
  cancelLabel = "Скасувати",
  onConfirm,
  onCancel,
}) => {
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onCancel(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onCancel]);

  return (
    <div className="confirm-modal__overlay" onClick={onCancel}>
      <div className="confirm-modal__box" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-modal__icon">
          <FaExclamationTriangle />
        </div>
        <div className="confirm-modal__title">{title}</div>
        {message && <div className="confirm-modal__message">{message}</div>}
        <div className="confirm-modal__footer">
          <button className="confirm-modal__btn-cancel" type="button" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button className="confirm-modal__btn-confirm" type="button" onClick={onConfirm} autoFocus>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
