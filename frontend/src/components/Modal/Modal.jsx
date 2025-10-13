import React, { useRef, useEffect } from "react";
import PointPage from "../../screens/PointPage/PointPage";
import "./Modal.scss";

const Modal = ({ showPointModal, setShowPointModal, selectedPoint }) => {
    const modalRef = useRef(null);

    const handleClickOutside = (event) => {
        if (modalRef.current && !modalRef.current.contains(event.target)) {
            setShowPointModal(false);
        }
    };

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.keyCode === 27) {
                setShowPointModal(false);
            }
        };

        document.addEventListener("click", handleClickOutside);
        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("click", handleClickOutside);
            document.removeEventListener("keydown", handleKeyDown);
        };
    });

    return (
        <>
            <div
                className="modal-overlay"
                style={{ display: showPointModal ? "block" : "none" }}
            >
                <div
                    ref={modalRef}
                    className={`modal${showPointModal ? "" : " hidden"}`}
                    style={{ display: showPointModal ? "block" : "none" }}
                >
                    <PointPage
                        selectedPoint={selectedPoint}
                        setShowPointModal={setShowPointModal}
                    />
                </div>
            </div>
        </>
    );
};

export default Modal;
