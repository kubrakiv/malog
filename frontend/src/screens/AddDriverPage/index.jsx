import React from "react";
import { FaArrowLeft } from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";
import RegisterFormComponent from "../RegisterPage/RegisterFormComponent";

const AddDriverPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Check if coming from onboarding wizard
  const fromOnboarding = location.state?.fromOnboarding;
  const nextStep = location.state?.nextStep;

  const handleGoBack = () => {
    if (fromOnboarding) {
      navigate("/onboarding");
    } else {
      navigate(-1);
    }
  };
  return (
    <div className="drivers-container">
      <div className="add-order-details">
        <div className="add-order-details__header">
          <div
            className="add-order-details__return-button"
            style={{ height: "30px" }}
            onClick={handleGoBack}
          >
            <FaArrowLeft />
          </div>
          {fromOnboarding && (
            <div className="onboarding-indicator">
              Onboarding: Adding Driver
            </div>
          )}
        </div>
        <RegisterFormComponent
          fromOnboarding={fromOnboarding}
          onboardingNextStep={nextStep}
        />
      </div>
    </div>
  );
};

export default AddDriverPage;
