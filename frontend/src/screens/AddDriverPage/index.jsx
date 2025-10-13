import React from "react";
import { FaArrowLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import RegisterFormComponent from "../RegisterPage/RegisterFormComponent";

const AddDriverPage = () => {
  const navigate = useNavigate();
  const handleGoBack = () => {
    navigate(-1);
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
        </div>
        <RegisterFormComponent />
      </div>
    </div>
  );
};

export default AddDriverPage;
