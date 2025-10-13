import React from "react";
import "./AddDriverHeaderComponent.scss";
import AddDriverModalCloseComponent from "../AddDriverModalCloseComponent/AddDriverModalCloseComponent";

const AddDriverHeaderComponent = ({
    setShowDriverModal,
    editDriverProfileMode,
    selectedDriver,
}) => {
    return (
        <>
            <div className="driver-details__header">
                <div
                    // className="driver-details__header-block"
                    style={{ color: "white", padding: "10px" }}
                >
                    {editDriverProfileMode
                        ? `Редагування водія ${selectedDriver.full_name}`
                        : `Профіль водія ${selectedDriver.full_name}`}
                </div>
                <AddDriverModalCloseComponent
                    setShowDriverModal={setShowDriverModal}
                />
            </div>
        </>
    );
};

export default AddDriverHeaderComponent;
