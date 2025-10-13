import React from "react";

const ManageTrailerFooterComponent = ({ onCloseModal }) => {
  return (
    <>
      <div className="end-time__footer">
        <button
          title="Зберегти "
          className="end-time__footer-btn end-time__footer-btn_save"
          type="submit"
        >
          Записати
        </button>
        <button
          title="Закрити вікно"
          className="end-time__footer-btn end-time__footer-btn_close"
          onClick={(e) => {
            e.preventDefault();
            onCloseModal();
          }}
        >
          Закрити
        </button>
      </div>
    </>
  );
};

export default ManageTrailerFooterComponent;
