import React from "react";

const GenericModalCloseComponent = ({ onClose }) => {
  return (
    <>
      <div className="generic-modal__close" onClick={onClose}>
        &times;
      </div>
    </>
  );
};

export default GenericModalCloseComponent;
