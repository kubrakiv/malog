import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { listDrivers } from "../../../actions/driverActions";
import MessageComponent from "../../../components/MessageComponent/MessageComponent";
import "./style.scss";

const CloseRegistrationComponent = () => {
  const [message, setMessage] = useState("");
  const [isRegistered, setIsRegistered] = useState(false);

  const handleCloseRegistration = () => {
    setIsRegistered(false);
    setMessage("");
    dispatch(listDrivers());
    navigate("/drivers");
    console.log("Close registration");
  };

  return (
    <div className="login-form-container">
      <MessageComponent color={"green"}>{message}</MessageComponent>
      <Link to={"/login"}>Увійти</Link>
      <button
        onClick={handleCloseRegistration}
        className="form-footer-btn form-footer-btn_close"
      >
        Завершити реєстрацію
      </button>
    </div>
  );
};

export default CloseRegistrationComponent;
