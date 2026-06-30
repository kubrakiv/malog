import React from "react";
import "./EndTimeHeaderComponent.scss";

const EndTimeHeaderComponent = ({ selectedTask }) => {
  const getTaskTypeLabel = (task) => {
    if (task?.type_uk) {
      return task.type_uk.toLowerCase();
    }

    const typeMap = {
      Loading: "завантаження",
      Unloading: "розвантаження",
    };

    return (typeMap[task?.type] || "завдання").toLowerCase();
  };

  return (
    <>
      <div className="end-time__header">
        <div className="end-time__header-block">
          Завершення {getTaskTypeLabel(selectedTask)}
        </div>
      </div>
    </>
  );
};

export default EndTimeHeaderComponent;
