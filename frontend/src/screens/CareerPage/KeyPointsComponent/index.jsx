import React from "react";
import "./style.scss";
import employment from "../../../img/employment.jpg";
import driver from "../../../img/scania-driver.jpg";
import scania from "../../../img/scania_assist.jpeg";

const KeyPointsComponent = () => {
  return (
    <>
      <div className="container-page vacancy-page">
        <div className="career-header">
          <div className="career-header__title">Join Our Team</div>
          <p>
            We are always looking for talented individuals to join our team. If
            you are passionate about logistics and are looking for a challenging
            and rewarding career, we want to hear from you.
          </p>
        </div>
        <div className="career-cards">
          <div className="card">
            <div className="card-image">
              <img src={employment} alt="Employment process" />
            </div>
            <div className="card-content">
              <h3>Employment process</h3>
              <p>
                We will help you to lead you through the entire employment
                process
              </p>
            </div>
          </div>
          <div className="card">
            <div className="card-image">
              <div className="card-image">
                <img src={driver} alt="Driving expirience" />
              </div>
            </div>
            <div className="card-content">
              <h3>Driver Support</h3>
              <p>
                Our team always in contact with the driver for any urgent
                situations
              </p>
            </div>
          </div>
          <div className="card">
            <div className="card-image">
              <img src={scania} alt="Maintenance" />
            </div>
            <div className="card-content">
              <h3>Maintenance</h3>
              <p>
                All services are done on Scania stations. ScaniaAssist will
                always help us on the road
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default KeyPointsComponent;
