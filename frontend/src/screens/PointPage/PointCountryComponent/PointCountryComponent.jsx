import React from "react";

const PointCountryComponent = ({ country }) => {
    return (
        <>
            <div className="point-details__content-row-block">
                <div className="point-details__content-row-block-title">
                    Країна
                </div>
                <div className="point-details__content-row-block-value">
                    {country}
                </div>
            </div>
        </>
    );
};

export default PointCountryComponent;
