import { useSelector, useDispatch } from "react-redux";
import { Outlet, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useEffect, Suspense } from "react";

import SubscriptionAwareSidebar from "./components/Sidebar/SubscriptionAwareSidebar";
import Header from "./components/Header/Header";
import SubscriptionBanner from "./components/SubscriptionBanner/SubscriptionBanner";
import SovtesAuthHandler from "./components/SovtesAuthHandler/SovtesAuthHandler";

// Import subscription-aware sidebar styles
import "./components/Sidebar/SubscriptionAwareSidebar.scss";

import { logout } from "./actions/userActions";
import { fetchSubscription } from "./features/subscription/subscriptionOperations";
import { clearSubscription } from "./features/subscription/subscriptionSlice";

const Layout = () => {
  const location = useLocation();
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

  // Fetch subscription once when user is present; clear on logout
  useEffect(() => {
    if (userInfo) {
      dispatch(fetchSubscription());
    } else {
      dispatch(clearSubscription());
    }
  }, [userInfo, dispatch]);

  return userInfo ? (
    <div>
      <Suspense fallback={<div>Loading...</div>}>
        <SovtesAuthHandler />
        <Header />
        <SubscriptionAwareSidebar>
          <SubscriptionBanner showOnlyWarnings={true} />
          <Outlet />
          <Toaster
            position="top-right"
            reverseOrder={false}
            toastOptions={{
              duration: 4000,
              style: {
                borderRadius: "12px",
                fontSize: "0.875rem",
                fontWeight: "500",
                padding: "12px 18px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
                maxWidth: "360px",
              },
              success: {
                style: {
                  background: "#0b6976",
                  color: "#fff",
                },
                iconTheme: { primary: "#fff", secondary: "#0b6976" },
              },
              error: {
                style: {
                  background: "#dc2626",
                  color: "#fff",
                },
                iconTheme: { primary: "#fff", secondary: "#dc2626" },
              },
            }}
          />
        </SubscriptionAwareSidebar>
      </Suspense>
    </div>
  ) : (
    <div>
      <Suspense fallback={<div>Loading...</div>}>
        <SovtesAuthHandler />
        <Outlet />
        <Toaster position="top-right" reverseOrder={false} />
      </Suspense>
    </div>
  );
};

export default Layout;
