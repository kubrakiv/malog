import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FaUsers,
  FaCrown,
  FaExchangeAlt,
  FaUserCheck,
  FaChartLine,
  FaTruck,
  FaBuilding,
  FaBell,
} from "react-icons/fa";
import "./AdminDashboard.scss";

function AdminDashboard() {
  const navigate = useNavigate();
  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;

  const [dashboardStats, setDashboardStats] = useState({
    totalClients: 0,
    totalUsers: 0,
    activeSubscriptions: 0,
    pendingApprovals: 0,
    pendingPlanChanges: 0,
    totalRevenue: 0,
    recentActivity: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = userInfo?.token;
        if (token) {
          const config = {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          };
          const { data } = await axios.get(
            "/api/admin/dashboard-stats/",
            config,
          );
          setDashboardStats(data);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [userInfo]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const activityTime =
      timestamp instanceof Date ? timestamp : new Date(timestamp);
    const diff = now - activityTime;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (minutes < 60) {
      return `${minutes} minutes ago`;
    } else {
      return `${hours} hours ago`;
    }
  };

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>System Administration Dashboard</h1>
        <p>
          Welcome back, {userInfo?.first_name}! Here's what's happening in your
          system.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card users">
          <div className="stat-icon">
            <FaUsers />
          </div>
          <div className="stat-content">
            <h3>{dashboardStats.totalUsers}</h3>
            <p>Total Users</p>
            <span className="stat-change neutral">Managed accounts</span>
          </div>
        </div>

        <div className="stat-card clients">
          <div className="stat-icon">
            <FaBuilding />
          </div>
          <div className="stat-content">
            <h3>{dashboardStats.totalClients}</h3>
            <p>Total Clients</p>
            <span className="stat-change neutral">Across all tenants</span>
          </div>
        </div>

        <div className="stat-card subscriptions">
          <div className="stat-icon">
            <FaCrown />
          </div>
          <div className="stat-content">
            <h3>{dashboardStats.activeSubscriptions}</h3>
            <p>Active Subscriptions</p>
            <span className="stat-change positive">Currently billed</span>
          </div>
        </div>

        <div className="stat-card approvals">
          <div className="stat-icon">
            <FaUserCheck />
          </div>
          <div className="stat-content">
            <h3>{dashboardStats.pendingApprovals}</h3>
            <p>Pending Approvals</p>
            <span className="stat-change neutral">Requires attention</span>
          </div>
        </div>

        <div className="stat-card plan-changes">
          <div className="stat-icon">
            <FaExchangeAlt />
          </div>
          <div className="stat-content">
            <h3>{dashboardStats.pendingPlanChanges}</h3>
            <p>Plan Change Requests</p>
            <span className="stat-change neutral">Pending review</span>
          </div>
        </div>

        <div className="stat-card revenue">
          <div className="stat-icon">
            <FaChartLine />
          </div>
          <div className="stat-content">
            <h3>{formatCurrency(dashboardStats.totalRevenue)}</h3>
            <p>Monthly Revenue</p>
            <span className="stat-change positive">+12% from last month</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="dashboard-section">
        <h2>Quick Actions</h2>
        <div className="quick-actions-grid">
          <div className="action-card">
            <FaUsers className="action-icon" />
            <h3>User Management</h3>
            <p>Manage users, roles, and password reset access from one place</p>
            <button
              className="action-btn"
              onClick={() => navigate("/admin/users")}
            >
              Open Users
            </button>
          </div>

          <div className="action-card">
            <FaUserCheck className="action-icon" />
            <h3>Client Approvals</h3>
            <p>Review and approve new client registrations</p>
            <button
              className="action-btn"
              onClick={() => navigate("/admin/client-approval")}
            >
              Review Now
            </button>
          </div>

          <div className="action-card">
            <FaExchangeAlt className="action-icon" />
            <h3>Plan Changes</h3>
            <p>Process subscription plan change requests</p>
            <button
              className="action-btn"
              onClick={() => navigate("/admin/plan-change-requests")}
            >
              Review Requests
            </button>
          </div>

          <div className="action-card">
            <FaChartLine className="action-icon" />
            <h3>Analytics</h3>
            <p>View system usage and performance metrics</p>
            <button
              className="action-btn"
              onClick={() => navigate("/admin/reports")}
            >
              View Reports
            </button>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="dashboard-section">
        <h2>Recent Activity</h2>
        <div className="activity-feed">
          {dashboardStats.recentActivity.length === 0 ? (
            <div className="activity-empty">No recent admin activity yet.</div>
          ) : (
            dashboardStats.recentActivity.map((activity) => (
              <div key={activity.id} className="activity-item">
                <div className="activity-icon">
                  {activity.type === "client_registration" && <FaUsers />}
                  {activity.type === "plan_change" && <FaExchangeAlt />}
                  {activity.type === "subscription" && <FaCrown />}
                </div>
                <div className="activity-content">
                  <p>{activity.message}</p>
                  <span className="activity-time">
                    {formatTimeAgo(activity.timestamp)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* System Health Overview */}
      <div className="dashboard-section">
        <h2>System Health</h2>
        <div className="health-grid">
          <div className="health-card">
            <div className="health-status healthy">
              <div className="status-indicator"></div>
              <span>Database</span>
            </div>
            <p>All systems operational</p>
          </div>

          <div className="health-card">
            <div className="health-status healthy">
              <div className="status-indicator"></div>
              <span>API Services</span>
            </div>
            <p>Response time: 125ms</p>
          </div>

          <div className="health-card">
            <div className="health-status warning">
              <div className="status-indicator"></div>
              <span>Storage</span>
            </div>
            <p>78% capacity used</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
