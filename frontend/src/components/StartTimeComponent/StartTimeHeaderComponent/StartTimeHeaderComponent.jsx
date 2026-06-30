import React from "react";

const StartTimeHeaderComponent = ({ selectedTask }) => {
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
      <div className="start-time__header">
        <div className="start-time__header-block">
          Початок {getTaskTypeLabel(selectedTask)}
        </div>
      </div>
    </>
  );
};

export default StartTimeHeaderComponent;
