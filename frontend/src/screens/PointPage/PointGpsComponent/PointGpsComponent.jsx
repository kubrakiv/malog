import React from "react";

const PointGpsComponent = ({ lat, lng }) => {
    return (
        <>
            <div className="point-details__content-row-block">
                <div className="point-details__content-row-block-title">
                    GPS Координати
                </div>
                <div className="point-details__content-row-block-value">
                    Latitude: {lat}
                </div>
                <div className="point-details__content-row-block-value">
                    Longitude: {lng}
                </div>
            </div>
        </>
    );
};

export default PointGpsComponent;
