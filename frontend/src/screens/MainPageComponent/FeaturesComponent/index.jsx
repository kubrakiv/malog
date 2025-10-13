import React from "react";
import "./style.scss";

const FeaturesComponent = () => {
  return (
    <div className="features-section">
      <div className="feature-item">
        <div className="icon gps-icon"></div>
        <div className="icon__content">
          GPS <br /> Tracking
        </div>
      </div>
      <div className="feature-item">
        <div className="icon insurance-icon"></div>
        <div className="icon__content">
          CMR <br /> Insurance
        </div>
      </div>
      <div className="feature-item">
        <div className="icon tracking-icon"></div>
        <div className="icon__content">
          24/7 <br /> Coordination
        </div>
      </div>
    </div>
  );
};

export default FeaturesComponent;
