import React from "react";

const ManageTrailerFooterComponent = ({ onCloseModal, saveLabel = "Записати" }) => {
  return (
    <div className="end-time__footer">
      <button
        className="end-time__footer-btn end-time__footer-btn_save"
        type="submit"
      >
        {saveLabel}
      </button>
      <button
        className="end-time__footer-btn end-time__footer-btn_close"
        onClick={(e) => { e.preventDefault(); onCloseModal(); }}
      >
        Закрити
      </button>
    </div>
  );
};

export default ManageTrailerFooterComponent;
