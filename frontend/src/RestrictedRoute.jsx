import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { capitalizeFirstLetter } from "./utils/capitalizeFirstLetter";

export const RestrictedRoute = ({
  children,
  redirectTo = "/login",
  requiredRoles = [],
}) => {
  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;
  const location = useLocation();
  const navigate = useNavigate();
  const [shouldRedirect, setShouldRedirect] = useState(false);
  console.log("userInfo", userInfo);

  const generateErrorMessage = (roles) => {
    const capitalizedRoles = roles.map((role) => capitalizeFirstLetter(role));
    if (capitalizedRoles.length === 1) {
      return `You are not ${capitalizedRoles[0]}!`;
    }
    const lastRole = capitalizedRoles.pop();
    return `You are not ${capitalizedRoles.join(", ")} or ${lastRole}!`;
  };

  useEffect(() => {
    if (userInfo && !requiredRoles.includes(userInfo.role)) {
      toast.error(generateErrorMessage([...requiredRoles]), {
        position: "top-right",
        style: { color: "black", marginTop: "0rem" },
      });
      setShouldRedirect(true);
    }
  }, [userInfo, requiredRoles, navigate]);

  useEffect(() => {
    if (shouldRedirect) {
      navigate(-1);
    }
  }, [shouldRedirect, navigate]);

  if (!userInfo) {
    return <Navigate to={redirectTo} state={{ from: location }} />;
  }

  if (userInfo && requiredRoles.includes(userInfo.role)) {
    return children;
  }

  return null;
};
