import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import useSubscription from "../../hooks/useSubscription";
import "./ProtectedRoute.scss";

/**
 * Component to protect routes based on subscription features
 */
const ProtectedRoute = ({
  children,
  requiredFeature,
  fallbackPath = "/subscription-plans",
}) => {
  const location = useLocation();
  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;
  const { hasFeatureAccess, subscription, loading, error } = useSubscription();

  // If not logged in, redirect to login
  if (!userInfo) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Show loading while checking subscription
  if (loading) {
    return (
      <div className="protected-route-loading">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Checking subscription access...</p>
        </div>
      </div>
    );
  }

  // If no subscription found
  if (!subscription && !error) {
    return (
      <div className="protected-route-no-subscription">
        <div className="no-subscription-container">
          <div className="lock-icon">🔒</div>
          <h3>No Active Subscription</h3>
          <p>You need an active subscription to access this feature.</p>
          <div className="action-buttons">
            <button
              className="btn-primary"
              onClick={() => (window.location.href = "/subscription-plans")}
            >
              View Plans
            </button>
            <button
              className="btn-secondary"
              onClick={() => (window.location.href = "/main")}
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If subscription error (but allow access to maintain user experience)
  if (error) {
    console.warn("Subscription check failed, allowing access:", error);
  }

  // If no specific feature required, allow access
  if (!requiredFeature) {
    return children;
  }

  // Check if user has access to the required feature
  const hasAccess = hasFeatureAccess(requiredFeature);

  if (!hasAccess) {
    return (
      <div className="protected-route-access-denied">
        <div className="access-denied-container">
          <div className="lock-icon">🔒</div>
          <h3>Feature Not Available</h3>
          <p>
            The "{requiredFeature}" feature is not included in your current
            subscription plan.
          </p>
          {subscription && (
            <div className="current-plan-info">
              <p>
                Current Plan:{" "}
                <strong>{subscription.plan_details?.display_name}</strong>
              </p>
              <div className="included-features">
                <h4>Your plan includes:</h4>
                <ul>
                  {subscription.plan_details?.features?.map(
                    (feature, index) => (
                      <li key={index}>{feature}</li>
                    )
                  )}
                </ul>
              </div>
            </div>
          )}
          <div className="action-buttons">
            <button
              className="btn-primary"
              onClick={() => (window.location.href = "/subscription-plans")}
            >
              Upgrade Plan
            </button>
            <button
              className="btn-secondary"
              onClick={() => (window.location.href = "/main")}
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // User has access, render the protected content
  return children;
};

/**
 * Higher-order component to wrap routes with subscription protection
 */
export const withSubscriptionProtection = (Component, requiredFeature) => {
  return (props) => (
    <ProtectedRoute requiredFeature={requiredFeature}>
      <Component {...props} />
    </ProtectedRoute>
  );
};

/**
 * Hook to check if current route requires subscription protection
 */
export const useRouteProtection = () => {
  const location = useLocation();
  const { hasFeatureAccess } = useSubscription();

  // Route to feature mapping
  const routeFeatureMap = {
    "/orders": "Orders Management",
    "/orders/add": "Orders Management",
    "/free-orders": "Orders Management",
    "/planner": "Route Planner",
    "/planner/drag-drop": "Route Planner",
    "/drivers": "Driver Management",
    "/vehicles": "Fleet Management",
    "/customers": "Customer Management",
    "/invoices": "Invoicing",
    "/tasks": "Tasks Management",
    "/tasks/add": "Tasks Management",
    "/points": "Points Management",
    "/calculator": "Route Calculator",
    "/platforms/sovtes": "External Platforms",
    "/platforms/lardi": "External Platforms",
    "/userlist": "Employee Management",
    "/user/add": "Employee Management",
    "/user/:id/edit": "Employee Management",
  };

  // Handle dynamic routes by checking pattern matches
  let currentRequiredFeature = routeFeatureMap[location.pathname];

  // If exact match not found, check for pattern matches
  if (!currentRequiredFeature) {
    // Check for user edit pattern /user/[id]/edit
    if (location.pathname.match(/^\/user\/\d+\/edit$/)) {
      currentRequiredFeature = "Employee Management";
    }
  }

  const hasCurrentAccess = currentRequiredFeature
    ? hasFeatureAccess(currentRequiredFeature)
    : true;

  return {
    requiredFeature: currentRequiredFeature,
    hasAccess: hasCurrentAccess,
    isProtectedRoute: !!currentRequiredFeature,
  };
};

export default ProtectedRoute;
