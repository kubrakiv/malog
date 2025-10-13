import React from "react";

const AddTaskModalCloseComponent = ({ setShowAddTaskModal }) => {
    return (
        <>
            <div
                className="modal__close"
                onClick={() => setShowAddTaskModal(false)}
            >
                &times;
            </div>
        </>
    );
};

export default AddTaskModalCloseComponent;
