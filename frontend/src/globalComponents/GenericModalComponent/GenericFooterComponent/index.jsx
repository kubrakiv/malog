import React from "react";

const GenericFooterComponent = ({ onClose }) => {
    return (
        <>
            <div className="generic-modal__footer">
                <button
                    title="Зберегти"
                    className="generic-modal__footer-btn generic-modal__footer-btn_save"
                    type="submit"
                >
                    Записати
                </button>
                <button
                    title="Закрити"
                    className="generic-modal__footer-btn generic-modal__footer-btn_close"
                    onClick={onClose}
                >
                    Закрити
                </button>
            </div>
        </>
    );
};

export default GenericFooterComponent;
