import React from "react";

const ModalCloseComponent = ({ onClose }) => {
  return (
    <>
      <div className="modal__close" onClick={onClose}>
        &times;
      </div>
    </>
  );
};

export default ModalCloseComponent;
