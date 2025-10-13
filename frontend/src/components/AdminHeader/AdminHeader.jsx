import React, { useState, useRef, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  FaUser,
  FaCog,
  FaSignOutAlt,
  FaUserShield,
  FaBell,
} from "react-icons/fa";
import { logout } from "../../actions/userActions";
import "./AdminHeader.scss";

function AdminHeader() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const notificationsRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target)
      ) {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const toggleNotifications = () => {
    setNotificationsOpen(!notificationsOpen);
  };

  return (
    <header className="admin-header">
      <div className="admin-header-container">
        {/* Logo and Brand */}
        <div className="admin-brand">
          <FaUserShield className="admin-icon" />
          <div className="brand-text">
            <h1>System Admin Panel</h1>
            <span>Management Dashboard</span>
          </div>
        </div>

        {/* Right Side - User Actions */}
        <div className="admin-header-actions">
          {/* Notifications */}
          <div className="notifications-container" ref={notificationsRef}>
            <button
              className="notifications-btn"
              onClick={toggleNotifications}
              title="Notifications"
            >
              <FaBell />
              <span className="notification-badge">3</span>
            </button>

            {notificationsOpen && (
              <div className="notifications-dropdown">
                <div className="notifications-header">
                  <h3>Notifications</h3>
                </div>
                <div className="notifications-list">
                  <div className="notification-item">
                    <div className="notification-content">
                      <p>New client registration pending approval</p>
                      <span className="notification-time">5 min ago</span>
                    </div>
                  </div>
                  <div className="notification-item">
                    <div className="notification-content">
                      <p>Plan change request from Acme Corp</p>
                      <span className="notification-time">1 hour ago</span>
                    </div>
                  </div>
                  <div className="notification-item">
                    <div className="notification-content">
                      <p>System backup completed successfully</p>
                      <span className="notification-time">2 hours ago</span>
                    </div>
                  </div>
                </div>
                <div className="notifications-footer">
                  <button className="view-all-btn">View All</button>
                </div>
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="user-menu-container" ref={dropdownRef}>
            <button
              className="user-menu-btn"
              onClick={toggleDropdown}
              title={`${userInfo?.first_name} ${userInfo?.last_name}`}
            >
              <FaUser className="user-icon" />
              <span className="user-name">
                {userInfo?.first_name} {userInfo?.last_name}
              </span>
              <span className="user-role">{userInfo?.role}</span>
            </button>

            {dropdownOpen && (
              <div className="user-dropdown">
                <div className="dropdown-header">
                  <div className="user-info">
                    <FaUser className="avatar" />
                    <div className="user-details">
                      <span className="name">
                        {userInfo?.first_name} {userInfo?.last_name}
                      </span>
                      <span className="email">{userInfo?.email}</span>
                      <span className="role">{userInfo?.role}</span>
                    </div>
                  </div>
                </div>

                <div className="dropdown-menu">
                  <button
                    className="dropdown-item"
                    onClick={() => {
                      navigate("/profile");
                      setDropdownOpen(false);
                    }}
                  >
                    <FaUser />
                    <span>Profile</span>
                  </button>

                  <button
                    className="dropdown-item"
                    onClick={() => {
                      navigate("/admin/settings");
                      setDropdownOpen(false);
                    }}
                  >
                    <FaCog />
                    <span>Settings</span>
                  </button>

                  <div className="dropdown-divider"></div>

                  <button
                    className="dropdown-item logout-item"
                    onClick={handleLogout}
                  >
                    <FaSignOutAlt />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default AdminHeader;
