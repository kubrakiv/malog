import React from "react";
import FeaturesComponent from "../FeaturesComponent";
import "./style.scss";

const MainComponent = () => {
  const scrollToSection = (id) => {
    const section = document.getElementById(id);
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
  };
  return (
    <section id="section1" className="section">
      <div className="section-background main-bg"></div>
      <div className="container-page golovna-page">
        <div className="golovna-title">DELTA LOGISTICS</div>
        <h3>CZECH TRANSPORTATION COMPANY</h3>

        <FeaturesComponent />
        <div className="golovna-btns">
          <button
            className="contact-us-btn"
            onClick={() => scrollToSection("section6")}
          >
            Contact Us
          </button>
        </div>
      </div>
    </section>
  );
};

export default MainComponent;
