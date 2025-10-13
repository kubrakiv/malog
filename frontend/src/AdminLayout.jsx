import { useSelector, useDispatch } from "react-redux";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useEffect, Suspense } from "react";

import AdminSidebar from "./components/AdminSidebar/AdminSidebar";
import AdminHeader from "./components/AdminHeader/AdminHeader";
import Footer from "./components/Footer/Footer";

import { logout } from "./actions/userActions";
import "./AdminLayout.scss";

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;

  // Normalize path by removing trailing slash
  const normalizedPathname = location.pathname.replace(/\/$/, "");
  const isRootUrl = normalizedPathname === "";

  useEffect(() => {
    if (userInfo && isRootUrl) {
      dispatch(logout());
    }
  }, [userInfo, isRootUrl, dispatch]);

  // Check if user has admin access
  useEffect(() => {
    if (userInfo && !["admin", "system_admin"].includes(userInfo.role)) {
      navigate("/main");
    }
  }, [userInfo, navigate]);

  return userInfo && ["system_admin"].includes(userInfo.role) ? (
    <div className="admin-layout">
      <Suspense fallback={<div>Loading...</div>}>
        <AdminHeader />
        <div className="admin-main-content">
          <AdminSidebar />
          <div className="admin-content-area">
            <Outlet />
          </div>
        </div>
        <Footer />
        <Toaster position="top-right" reverseOrder={false} />
      </Suspense>
    </div>
  ) : (
    <div>
      <Suspense fallback={<div>Loading...</div>}>
        <div className="access-denied">
          <h2>Access Denied</h2>
          <p>You don't have permission to access the admin area.</p>
        </div>
        <Toaster position="top-right" reverseOrder={false} />
      </Suspense>
    </div>
  );
};

export default AdminLayout;
