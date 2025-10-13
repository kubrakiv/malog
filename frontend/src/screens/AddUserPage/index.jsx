import React from "react";
import { FaArrowLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import AddUserFormComponent from "./AddUserFormComponent";
import "./AddUserPage.scss";

const AddUserPage = () => {
  const navigate = useNavigate();
  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="users-container">
      <div className="add-user-details">
        <div className="add-user-details__header">
          <div
            className="add-user-details__return-button"
            style={{ height: "30px" }}
            onClick={handleGoBack}
          >
            <FaArrowLeft />
          </div>
        </div>
        <AddUserFormComponent />
      </div>
    </div>
  );
};

export default AddUserPage;
