import React from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

const PublicRoute = ({ component: Component, redirectTo = "" }) => {
    const userLogin = useSelector((state) => state.userLogin);
    const { userInfo } = userLogin;

    return !userInfo ? Component : <Navigate to={redirectTo} />;
};

export default PublicRoute;
