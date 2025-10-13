import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import useSubscription from "../hooks/useSubscription";
import {
  FaTruck,
  FaRoute,
  FaUsers,
  FaFileInvoiceDollar,
  FaMapMarkedAlt,
  FaChartLine,
  FaTasks,
  FaUserTie,
  FaCalculator,
  FaCog,
  FaMapMarker,
  FaClipboardList,
  FaCrown,
  FaLock,
} from "react-icons/fa";
import SubscriptionBanner from "../components/SubscriptionBanner/SubscriptionBanner";
import "./StartScreen.scss";

function StartScreen() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;

  const { subscription, loading, hasFeatureAccess } = useSubscription();

  const systemModules = [
    {
      icon: <FaChartLine />,
      title: "Dashboard",
      description:
        "Overview of key metrics, recent activities, and system performance",
      path: "/dashboard",
      roles: ["admin", "logist"],
      color: "#007bff",
    },
    {
      icon: <FaClipboardList />,
      title: "Orders Management",
      description: "Create, track, and manage all transportation orders",
      path: "/orders",
      roles: ["admin", "logist"],
      color: "#28a745",
    },
    {
      icon: <FaTasks />,
      title: "Tasks Management",
      description:
        "Assign and monitor tasks for drivers and logistics operations",
      path: "/tasks",
      roles: ["admin", "logist"],
      color: "#ffc107",
    },
    {
      icon: <FaRoute />,
      title: "Route Planner",
      description: "Plan optimal routes and manage weekly schedules",
      path: "/planner",
      roles: ["admin", "logist"],
      color: "#17a2b8",
    },
    {
      icon: <FaMapMarkedAlt />,
      title: "Live Map",
      description: "Real-time tracking of vehicles and route monitoring",
      path: "/map",
      roles: ["admin", "logist"],
      color: "#dc3545",
    },
    {
      icon: <FaTruck />,
      title: "Fleet Management",
      description: "Manage trucks, trailers, and vehicle maintenance",
      path: "/vehicles",
      roles: ["admin", "logist"],
      color: "#6f42c1",
    },
    {
      icon: <FaUserTie />,
      title: "Driver Management",
      description: "Manage driver profiles, schedules, and performance",
      path: "/drivers",
      roles: ["admin", "logist"],
      color: "#fd7e14",
    },
    {
      icon: <FaUsers />,
      title: "Customer Management",
      description: "Manage customer profiles and business relationships",
      path: "/customers",
      roles: ["admin", "logist"],
      color: "#20c997",
    },
    {
      icon: <FaFileInvoiceDollar />,
      title: "Invoicing",
      description: "Generate and manage invoices for completed orders",
      path: "/invoices",
      roles: ["admin", "logist"],
      color: "#e83e8c",
    },
    {
      icon: <FaMapMarker />,
      title: "Points Management",
      description: "Manage delivery points and location database",
      path: "/points",
      roles: ["admin", "logist"],
      color: "#6c757d",
    },
    {
      icon: <FaCalculator />,
      title: "Route Calculator",
      description: "Calculate distances, costs, and delivery times",
      path: "/calculator",
      roles: ["admin", "logist"],
      color: "#495057",
    },
    {
      icon: <FaCog />,
      title: "System Administration",
      description: "User management and system configuration",
      path: "/admin/userlist",
      roles: ["admin"],
      color: "#343a40",
    },
  ];

  // Module availability is now handled by the subscription hook

  const getAvailableModules = () => {
    if (!userInfo?.role) return [];

    return systemModules.filter((module) => {
      // Check if user role has access
      const hasRoleAccess = module.roles.includes(userInfo.role);

      // If no subscription, no modules are available
      if (!subscription) return false;

      // Map module titles to subscription feature names
      const featureMap = {
        Dashboard: "Dashboard",
        "Orders Management": "Orders Management",
        "Tasks Management": "Tasks Management",
        "Route Planner": "Route Planner",
        "Live Map": "Live Map",
        "Fleet Management": "Fleet Management",
        "Driver Management": "Driver Management",
        "Customer Management": "Customer Management",
        Invoicing: "Invoicing",
        "Points Management": "Points Management",
        "Route Calculator": "Route Calculator",
        "System Administration": "System Administration",
      };

      const featureName = featureMap[module.title];
      const hasModuleFeatureAccess = hasFeatureAccess(featureName);

      return hasRoleAccess && hasModuleFeatureAccess;
    });
  };

  const handleModuleClick = (path, module) => {
    // Check if module is available in subscription
    const featureMap = {
      Dashboard: "Dashboard",
      "Orders Management": "Orders Management",
      "Tasks Management": "Tasks Management",
      "Route Planner": "Route Planner",
      "Live Map": "Live Map",
      "Fleet Management": "Fleet Management",
      "Driver Management": "Driver Management",
      "Customer Management": "Customer Management",
      Invoicing: "Invoicing",
      "Points Management": "Points Management",
      "Route Calculator": "Route Calculator",
      "System Administration": "System Administration",
    };

    const featureName = featureMap[module.title];
    const hasModuleAccess = hasFeatureAccess(featureName);

    if (!hasModuleAccess) {
      navigate("/subscription-plans");
      return;
    }

    navigate(path);
  };

  const availableModules = getAvailableModules();
  const allModules = systemModules.filter((module) =>
    module.roles.includes(userInfo?.role || "")
  );

  if (loading) {
    return (
      <div className="start-screen-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="start-screen-container">
      <SubscriptionBanner />
      <div className="modules-grid">
        {allModules.map((module, index) => {
          const featureMap = {
            Dashboard: "Dashboard",
            "Orders Management": "Orders Management",
            "Tasks Management": "Tasks Management",
            "Route Planner": "Route Planner",
            "Live Map": "Live Map",
            "Fleet Management": "Fleet Management",
            "Driver Management": "Driver Management",
            "Customer Management": "Customer Management",
            Invoicing: "Invoicing",
            "Points Management": "Points Management",
            "Route Calculator": "Route Calculator",
            "System Administration": "System Administration",
          };

          const featureName = featureMap[module.title];
          const hasModuleAccess = hasFeatureAccess(featureName);
          const isLocked = !hasModuleAccess;

          return (
            <div
              key={index}
              className={`module-card ${isLocked ? "locked" : ""}`}
              onClick={() => handleModuleClick(module.path, module)}
              style={{ "--module-color": module.color }}
            >
              <div
                className="module-icon"
                style={{ color: isLocked ? "#ccc" : module.color }}
              >
                {isLocked ? <FaLock /> : module.icon}
              </div>
              <h3
                className="module-title"
                style={{ color: isLocked ? "#ccc" : "inherit" }}
              >
                {module.title}
                {isLocked && <FaCrown className="premium-icon" />}
              </h3>
              <p
                className="module-description"
                style={{ color: isLocked ? "#ccc" : "inherit" }}
              >
                {isLocked
                  ? "Upgrade your plan to access this feature"
                  : module.description}
              </p>
              <div
                className="module-arrow"
                style={{ color: isLocked ? "#ccc" : "inherit" }}
              >
                {isLocked ? "Upgrade" : "→"}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default StartScreen;
