import React from "react";

const PointCustomerComponent = ({ customer }) => {
    return (
        <>
            <div className="point-details__content-row-block">
                <div className="point-details__content-row-block-title">
                    Замовник
                </div>
                <div className="point-details__content-row-block-value">
                    {customer}
                </div>
            </div>
        </>
    );
};

export default PointCustomerComponent;
