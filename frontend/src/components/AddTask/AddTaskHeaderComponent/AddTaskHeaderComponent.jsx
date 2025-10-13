import React from "react";
import AddTaskModalCloseComponent from "../AddTaskModalCloseComponent/AddTaskModalCloseComponent";
import "./AddTaskHeaderComponent.scss";

const AddTaskHeaderComponent = ({ setShowAddTaskModal, editMode }) => {
    return (
        <>
            <div className="add-task-details__header">
                <div className="add-task-details__header-block">
                    {editMode ? "Редагування завдання" : "Додавання завдання"}
                </div>
                <AddTaskModalCloseComponent
                    setShowAddTaskModal={setShowAddTaskModal}
                />
            </div>
        </>
    );
};

export default AddTaskHeaderComponent;
