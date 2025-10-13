import React from "react";
import "./AddDriverFooterComponent.scss";

const AddDriverFooterComponent = ({
    setShowDriverModal,
    setEditDriverProfileMode,
}) => {
    return (
        <>
            <div className="driver-details__footer">
                <button
                    title="Редагувати профіль водія"
                    className="driver-details__footer-btn driver-details__footer-btn_edit"
                    onClick={(e) => {
                        e.preventDefault();
                        setEditDriverProfileMode(true);
                    }}
                >
                    Редагувати
                </button>
                <button
                    title="Записати профіль водія"
                    className="driver-details__footer-btn driver-details__footer-btn_save"
                    type="submit"
                >
                    Записати
                </button>
                <button
                    title="Закрити вікно"
                    className="driver-details__footer-btn driver-details__footer-btn_close"
                    onClick={(e) => {
                        e.preventDefault();
                        setShowDriverModal(false);
                        setEditDriverProfileMode(false);
                    }}
                >
                    Закрити
                </button>
            </div>
        </>
    );
};

export default AddDriverFooterComponent;
