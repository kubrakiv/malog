import React from "react";
import "./EndTimeHeaderComponent.scss";

const EndTimeHeaderComponent = ({ selectedTask }) => {
  return (
    <>
      <div className="end-time__header">
        <div className="end-time__header-block">
          {selectedTask?.type} завершено
        </div>
      </div>
    </>
  );
};

export default EndTimeHeaderComponent;
