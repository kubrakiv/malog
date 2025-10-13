import React from "react";
import "./MainPage.scss";
import logo from "../../img/istockphoto-1208885251-612x612.jpg";
import { useNavigate } from "react-router-dom";

const MainPage = () => {
  const navigate = useNavigate();
  const handleLogin = () => {
    navigate("/login");
  };
  return (
    <>
      <div className="background">
        <div className="welcome-header">
          <img className="logo" src={logo} alt="Delta Logistics SRO Logo" />
          <button className="enter-button" onClick={handleLogin}>
            Вхід
          </button>
        </div>
        <div className="welcome-container">
          <div className="welcome-content">
            <h2 className="welcome-content__title">
              WELCOME TO DELTA LOGISTICS
            </h2>
            <h3 className="welcome-content__subtitle">
              The website for <strong>deltalogistics.cz</strong> is under
              construction now...
            </h3>
          </div>
        </div>
      </div>
    </>
  );
};

export default MainPage;
