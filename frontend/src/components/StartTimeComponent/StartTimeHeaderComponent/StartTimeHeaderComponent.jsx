import React from "react";

const StartTimeHeaderComponent = ({ selectedTask }) => {
  const wordToLowerCase = (word) => {
    return word?.toLowerCase();
  };

  return (
    <>
      <div className="start-time__header">
        <div className="start-time__header-block">
          Початок {selectedTask && wordToLowerCase(selectedTask?.type)}
        </div>
      </div>
    </>
  );
};

export default StartTimeHeaderComponent;
