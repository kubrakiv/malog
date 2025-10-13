import React from "react";

const PointAddressComponent = ({ full_address }) => {
    return (
        <>
            <div className="point-details__content-row-block">
                <div className="point-details__content-row-block-title">
                    Адреса
                </div>
                <div className="point-details__content-row-block-value">
                    {full_address}
                </div>
            </div>
        </>
    );
};

export default PointAddressComponent;
