import React from "react";

const PointCompanyComponent = ({ company }) => {
    return (
        <>
            <div className="point-details__content-row-block">
                <div className="point-details__content-row-block-title">
                    Компанія
                </div>
                <div className="point-details__content-row-block-value">
                    {company}
                </div>
            </div>
        </>
    );
};

export default PointCompanyComponent;
