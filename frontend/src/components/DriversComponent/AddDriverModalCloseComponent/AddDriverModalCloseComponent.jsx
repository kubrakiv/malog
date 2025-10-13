import React from "react";

const AddDriverModalCloseComponent = ({ setShowDriverModal }) => {
    return (
        <>
            <div
                className="modal__close"
                onClick={() => setShowDriverModal(false)}
            >
                &times;
            </div>
        </>
    );
};

export default AddDriverModalCloseComponent;
