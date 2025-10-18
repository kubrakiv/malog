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
      icon: <FaTruck />,
      title: "Управління автопарком",
      description:
        "Управління вантажівками, причепами та технічним обслуговуванням",
      path: "/vehicles",
      roles: ["client_admin", "logist"],
      color: "#6f42c1",
    },
    {
      icon: <FaUserTie />,
      title: "Управління водіями",
      description: "Управління профілями водіїв, розкладами та продуктивністю",
      path: "/drivers",
      roles: ["client_admin", "logist"],
      color: "#fd7e14",
    },
    {
      icon: <FaClipboardList />,
      title: "Управління замовленнями",
      description:
        "Створення, відстеження та управління всіма транспортними замовленнями",
      path: "/orders",
      roles: ["client_admin", "logist"],
      color: "#28a745",
    },
    {
      icon: <FaRoute />,
      title: "Планувальник маршрутів",
      description:
        "Планування оптимальних маршрутів та управління тижневими розкладами",
      path: "/planner",
      roles: ["client_admin", "logist"],
      color: "#17a2b8",
    },
    {
      icon: <FaCalculator />,
      title: "Калькулятор маршрутів",
      description: "Розрахунок відстаней, витрат та часу доставки",
      path: "/calculator",
      roles: ["client_admin", "logist"],
      color: "#495057",
    },
    {
      icon: <FaChartLine />,
      title: "Панель керування",
      description:
        "Огляд ключових метрик, останніх дій та продуктивності системи",
      path: "/dashboard",
      roles: ["client_admin", "logist"],
      color: "#007bff",
    },

    {
      icon: <FaTasks />,
      title: "Управління завданнями",
      description:
        "Призначення та моніторинг завдань для водіїв та логістичних операцій",
      path: "/tasks",
      roles: ["client_admin", "logist"],
      color: "#ffc107",
    },

    {
      icon: <FaMapMarkedAlt />,
      title: "Інтерактивна карта",
      description: "Відстеження транспортних засобів в режимі реального часу",
      path: "/map",
      roles: ["client_admin", "logist"],
      color: "#dc3545",
    },

    {
      icon: <FaUsers />,
      title: "Управління клієнтами",
      description: "Управління профілями клієнтів та бізнес-відносинами",
      path: "/customers",
      roles: ["client_admin", "logist"],
      color: "#20c997",
    },
    {
      icon: <FaFileInvoiceDollar />,
      title: "Виставлення рахунків",
      description: "Генерування та управління рахунками за виконані замовлення",
      path: "/invoices",
      roles: ["client_admin", "logist"],
      color: "#e83e8c",
    },
    {
      icon: <FaMapMarker />,
      title: "Управління точками",
      description: "Управління точками доставки та базою даних локацій",
      path: "/points",
      roles: ["client_admin", "logist"],
      color: "#6c757d",
    },

    {
      icon: <FaCog />,
      title: "Системне адміністрування",
      description: "Управління користувачами та конфігурацією системи",
      path: "/admin/userlist",
      roles: ["client_admin"],
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
        "Управління автопарком": "Fleet Management",
        "Панель керування": "Dashboard",
        "Управління замовленнями": "Orders Management",
        "Управління завданнями": "Tasks Management",
        "Планувальник маршрутів": "Route Planner",
        "Інтерактивна карта": "Live Map",
        "Управління водіями": "Driver Management",
        "Управління клієнтами": "Customer Management",
        "Виставлення рахунків": "Invoicing",
        "Управління точками": "Points Management",
        "Калькулятор маршрутів": "Route Calculator",
        "Системне адміністрування": "System Administration",
      };

      const featureName = featureMap[module.title];
      const hasModuleFeatureAccess = hasFeatureAccess(featureName);

      return hasRoleAccess && hasModuleFeatureAccess;
    });
  };

  const handleModuleClick = (path, module) => {
    // Check if module is available in subscription
    const featureMap = {
      "Fleet Management": "Fleet Management",
      Dashboard: "Dashboard",
      "Orders Management": "Orders Management",
      "Tasks Management": "Tasks Management",
      "Route Planner": "Route Planner",
      "Live Map": "Live Map",
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
          <p>Завантаження панелі керування...</p>
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
            "Управління автопарком": "Fleet Management",
            "Панель керування": "Dashboard",
            "Управління замовленнями": "Orders Management",
            "Управління завданнями": "Tasks Management",
            "Планувальник маршрутів": "Route Planner",
            "Інтерактивна карта": "Live Map",
            "Управління водіями": "Driver Management",
            "Управління клієнтами": "Customer Management",
            "Виставлення рахунків": "Invoicing",
            "Управління точками": "Points Management",
            "Калькулятор маршрутів": "Route Calculator",
            "Системне адміністрування": "System Administration",
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
                  ? "Оновіть свій план для доступу до цієї функції"
                  : module.description}
              </p>
              <div
                className="module-arrow"
                style={{ color: isLocked ? "#ccc" : "inherit" }}
              >
                {isLocked ? "Оновити" : "→"}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default StartScreen;
