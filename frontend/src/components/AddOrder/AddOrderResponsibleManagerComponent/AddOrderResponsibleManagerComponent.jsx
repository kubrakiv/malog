import React, { useState } from "react";
import { FaRegUser, FaAngleDown, FaAngleUp } from "react-icons/fa";

const AddOrderResponsibleManagerComponent = () => {
    const [showDetails, setShowDetails] = useState(false);

    const toggleDetails = () => {
        setShowDetails(!showDetails);
    };
    return (
        <div
            className="add-order-details__content-row-block"
            onClick={toggleDetails}
            style={{ cursor: "pointer" }}
        >
            <div
                className="add-order-details__content-row-block-title"
                onClick={toggleDetails}
                style={{ cursor: "pointer" }}
            >
                <div className="arrow-icon">
                    Відповідальний
                    {showDetails ? <FaAngleUp /> : <FaAngleDown />}
                </div>
            </div>
            <div className="add-order-details__content-row-block-value">
                <FaRegUser /> Kubrak Ivan
                {showDetails && (
                    <div className="contact-details">
                        &#9990; +380504186484 <br />
                        &#128386; kubrak@gmail.com
                    </div>
                )}
            </div>
        </div>
    );
};

export default AddOrderResponsibleManagerComponent;
