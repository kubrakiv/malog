import React from "react";
import "./style.scss"; // Import the SCSS file
import truck from "../../../img/delta_dog_1.jpg"; // Import the image

const GoalsComponent = () => {
  return (
    <div className="goals-section">
      <div className="image-container">
        <img src={truck} alt="Driver" />
      </div>
      <div className="content-container">
        {/* <div className="commitment">Our Commitment</div> */}
        <h2>Our Goals</h2>
        <ul>
          <li>Provide exceptional service and value</li>
          <li>Ensure safety and security</li>
          <li>Drive innovation and improvement</li>
          <li>Foster a positive work environment</li>
          <li>Promote sustainability in transportation</li>
        </ul>
        {/* <button className="contact-button">Contact Us</button> */}
      </div>
    </div>
  );
};

export default GoalsComponent;
