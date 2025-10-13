import { useEffect } from "react";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

export const RestrictedAdminRoute = ({ component: Component }) => {
  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;
  const navigate = useNavigate();
  console.log("userInfo", userInfo);

  const notify = () => {
    toast.error("You are not Admin!", {
      position: "top-right",
      style: { color: "black", marginTop: "0rem" },
    });
  };

  useEffect(() => {
    if (userInfo && userInfo.role !== "admin") {
      notify();
      navigate(-1);
    }
  }, [userInfo, navigate]);

  return userInfo && userInfo.role === "admin" ? Component : null;
};
