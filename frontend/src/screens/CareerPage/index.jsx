import React from "react";
import "./style.scss";
import MainPageHeaderComponent from "../MainPageComponent/MainPageHeaderComponent";
import FooterComponent from "../MainPageComponent/FooterComponent";
import truckImage from "../../img/truck_vacancy_photo.jpg";
import upperSectionImage from "../../img/career-main-bg.jpg";
import KeyPointsComponent from "./KeyPointsComponent";
import { FaRoute } from "react-icons/fa";

const CareerPage = () => {
  return (
    <>
      <div className="main-page">
        <MainPageHeaderComponent />
        <section className="upper-section">
          <img
            src={upperSectionImage}
            alt="Career Upper Section"
            className="upper-section-image"
          />
          <div className="upper-section-text">
            <h1>CAREER</h1>
            <h2>LET'S DRIVE TOGETHER!</h2>
          </div>
        </section>

        {/* Existing Career Section */}
        <KeyPointsComponent />
        {/* New Vacancy Section */}
        <section id="vacancy-section" className="section vacancy-section">
          <div className="container-page vacancy-content">
            <div className="vacancy-text">
              <h2>Vacancy for truck driver</h2>
              <div className="vacancy-main-text">
                <strong>Position:</strong> International driver
              </div>
              <div className="vacancy-main-text">
                <strong>Company:</strong> DELTA LOGISTICS s.r.o.
              </div>
              <div className="vacancy-main-text">
                <strong>Location:</strong> Prague, Czech Republic
              </div>
              <div className="vacancy-main-text">
                <strong>Salary:</strong> 2100 - 2300 EUR
              </div>
              <div className="vacancy-main-text">
                <strong>Fleet:</strong> Scania EURO-6 with Krone curtain
                trailers
              </div>

              <h3>Why Join Us?</h3>
              <ul className="vacancy-list">
                <li>
                  <strong>Work Schedule:</strong> Enjoy the advantage of having
                  weekends off. Our driving schedule is primarily from Monday to
                  Friday.
                </li>
                <li>
                  <strong>Main Routes:</strong>
                  <ul className="sub-list">
                    <li>
                      <FaRoute />
                      <span className="route-element">CZ - IT - CZ</span>
                    </li>
                    <li>
                      <FaRoute />
                      <span className="route-element">CZ - ES - CZ</span>
                    </li>
                    <li>
                      <FaRoute />
                      <span className="route-element">CZ - DE - CZ</span>
                    </li>
                    <li>
                      <FaRoute />
                      <span className="route-element">CZ - FR - CZ</span>
                    </li>
                  </ul>
                </li>
                <li>
                  <strong>Official Employment:</strong> Recruitment in
                  compliance with CZ legislation. Paid holidays, medical, and
                  social insurance.
                </li>
              </ul>

              <h3>Requirements:</h3>
              <ul className="vacancy-list">
                <li>
                  <strong>Driver Category:</strong> CE
                </li>
                <li>
                  <strong>Experience:</strong> Proven experience in
                  international driving.
                </li>
                <li>
                  <strong>Skills:</strong> Good navigation and time-management
                  skills.
                </li>
                <li>
                  <strong>Language:</strong> Basic communication skills in
                  English or Czech.
                </li>
              </ul>

              <p>
                <strong>Interested?</strong>
              </p>
              <p>Send your application to: info@deltalogistics.cz</p>
            </div>
            <div className="vacancy-image">
              <img src={truckImage} alt="Truck" />
            </div>
          </div>
        </section>

        <FooterComponent />
      </div>
    </>
  );
};

export default CareerPage;
