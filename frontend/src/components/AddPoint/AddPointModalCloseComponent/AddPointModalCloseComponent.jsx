import React from "react";

const AddPointModalCloseComponent = ({ setShowAddPointModal }) => {
    return (
        <>
            <div
                className="modal__close"
                onClick={() => setShowAddPointModal(false)}
            >
                &times;
            </div>
        </>
    );
};

export default AddPointModalCloseComponent;
