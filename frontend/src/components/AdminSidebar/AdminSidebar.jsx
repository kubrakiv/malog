import React, { useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FaHome,
  FaUsers,
  FaUserCheck,
  FaCrown,
  FaExchangeAlt,
  FaChartBar,
  FaCog,
  FaDatabase,
  FaShieldAlt,
  FaBell,
  FaFileAlt,
  FaAngleDown,
  FaAngleRight,
} from "react-icons/fa";
import "./AdminSidebar.scss";

function AdminSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;

  const [expandedSections, setExpandedSections] = useState({
    users: false,
    subscriptions: false,
    system: false,
  });

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const isActiveRoute = (route) => {
    return location.pathname === route;
  };

  const menuItems = [
    {
      title: "Dashboard",
      icon: <FaHome />,
      route: "/admin",
      roles: ["admin", "system_admin"],
    },
    {
      title: "User Management",
      icon: <FaUsers />,
      key: "users",
      roles: ["admin", "system_admin"],
      children: [
        {
          title: "All Users",
          route: "/admin/users",
          roles: ["admin", "system_admin"],
        },
        {
          title: "Client Approvals",
          route: "/admin/client-approval",
          roles: ["admin", "system_admin"],
        },
        {
          title: "User Roles",
          route: "/admin/user-roles",
          roles: ["admin", "system_admin"],
        },
      ],
    },
    {
      title: "Subscription Management",
      icon: <FaCrown />,
      key: "subscriptions",
      roles: ["admin", "system_admin"],
      children: [
        {
          title: "Plan Change Requests",
          route: "/admin/plan-change-requests",
          roles: ["admin", "system_admin"],
        },
        {
          title: "Subscription Plans",
          route: "/admin/subscription-plans",
          roles: ["admin", "system_admin"],
        },
        {
          title: "Client Subscriptions",
          route: "/admin/client-subscriptions",
          roles: ["admin", "system_admin"],
        },
        {
          title: "Usage Analytics",
          route: "/admin/usage-analytics",
          roles: ["admin", "system_admin"],
        },
      ],
    },
    {
      title: "System Management",
      icon: <FaShieldAlt />,
      key: "system",
      roles: ["system_admin"],
      children: [
        {
          title: "System Settings",
          route: "/admin/system-settings",
          roles: ["system_admin"],
        },
        {
          title: "Database Management",
          route: "/admin/database",
          roles: ["system_admin"],
        },
        {
          title: "Audit Logs",
          route: "/admin/audit-logs",
          roles: ["system_admin"],
        },
        {
          title: "System Health",
          route: "/admin/system-health",
          roles: ["system_admin"],
        },
        {
          title: "External Client Links",
          route: "/admin/external-identities",
          roles: ["system_admin"],
        },
      ],
    },
    {
      title: "Reports & Analytics",
      icon: <FaChartBar />,
      route: "/admin/reports",
      roles: ["admin", "system_admin"],
    },
    {
      title: "Notifications",
      icon: <FaBell />,
      route: "/admin/notifications",
      roles: ["admin", "system_admin"],
    },
  ];

  const hasPermission = (roles) => {
    return roles.includes(userInfo?.role);
  };

  const renderMenuItem = (item) => {
    if (!hasPermission(item.roles)) {
      return null;
    }

    if (item.children) {
      const isExpanded = expandedSections[item.key];
      return (
        <div key={item.key} className="menu-section">
          <button
            className={`menu-item section-header ${
              isExpanded ? "expanded" : ""
            }`}
            onClick={() => toggleSection(item.key)}
          >
            <div className="menu-item-content">
              <div className="menu-item-icon">{item.icon}</div>
              <span className="menu-item-text">{item.title}</span>
            </div>
            <div className="expand-icon">
              {isExpanded ? <FaAngleDown /> : <FaAngleRight />}
            </div>
          </button>

          {isExpanded && (
            <div className="submenu">
              {item.children.map(
                (child) =>
                  hasPermission(child.roles) && (
                    <button
                      key={child.route}
                      className={`menu-item submenu-item ${
                        isActiveRoute(child.route) ? "active" : ""
                      }`}
                      onClick={() => navigate(child.route)}
                    >
                      <span className="menu-item-text">{child.title}</span>
                    </button>
                  )
              )}
            </div>
          )}
        </div>
      );
    }

    return (
      <button
        key={item.route}
        className={`menu-item ${isActiveRoute(item.route) ? "active" : ""}`}
        onClick={() => navigate(item.route)}
      >
        <div className="menu-item-content">
          <div className="menu-item-icon">{item.icon}</div>
          <span className="menu-item-text">{item.title}</span>
        </div>
      </button>
    );
  };

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-content">
        <nav className="admin-nav">
          <div className="nav-section">
            <h3 className="section-title">Main Navigation</h3>
            {menuItems.slice(0, 1).map(renderMenuItem)}
          </div>

          <div className="nav-section">
            <h3 className="section-title">Management</h3>
            {menuItems.slice(1, 3).map(renderMenuItem)}
          </div>

          {userInfo?.role === "system_admin" && (
            <div className="nav-section">
              <h3 className="section-title">System Administration</h3>
              {menuItems.slice(3, 4).map(renderMenuItem)}
            </div>
          )}

          <div className="nav-section">
            <h3 className="section-title">Analytics & Tools</h3>
            {menuItems.slice(4).map(renderMenuItem)}
          </div>
        </nav>

        {/* Quick Actions */}
        <div className="sidebar-footer">
          <div className="quick-actions">
            <h4>Quick Actions</h4>
            <button
              className="quick-action-btn"
              onClick={() => navigate("/admin/client-approval")}
            >
              <FaUserCheck />
              <span>Approve Clients</span>
            </button>
            <button
              className="quick-action-btn"
              onClick={() => navigate("/admin/plan-change-requests")}
            >
              <FaExchangeAlt />
              <span>Review Requests</span>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default AdminSidebar;
