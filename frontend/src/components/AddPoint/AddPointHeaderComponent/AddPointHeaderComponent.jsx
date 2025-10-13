import React from "react";
import AddPointModalCloseComponent from "../AddPointModalCloseComponent/AddPointModalCloseComponent";
import "./AddPointHeaderComponent.scss";

const AddPointHeaderComponent = ({ setShowAddPointModal, editMode }) => {
    return (
        <>
            <div className="point-details__header">
                <div className="point-details__header-block">
                    {editMode
                        ? "Редагування пункту завантаження/розвантаження"
                        : "Додавання пункту завантаження/розвантаження"}
                </div>
                <AddPointModalCloseComponent
                    setShowAddPointModal={setShowAddPointModal}
                />
            </div>
        </>
    );
};

export default AddPointHeaderComponent;
