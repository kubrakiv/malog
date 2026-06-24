import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useConfirm } from "../../../globalComponents/ConfirmModal/useConfirm";
import axios from "axios";
import {
  FaCrown,
  FaBuilding,
  FaCalendarAlt,
  FaCheck,
  FaTimes,
  FaSearch,
  FaFilter,
  FaTruck,
  FaDollarSign,
  FaEye,
  FaEdit,
  FaTrash,
  FaPlus,
} from "react-icons/fa";
import "./AdminClientSubscriptionsPage.scss";

function AdminClientSubscriptionsPage() {
  const confirm = useConfirm();
  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;

  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    fetchSubscriptions();
  }, [userInfo, statusFilter]);

  const fetchSubscriptions = async () => {
    try {
      const token = userInfo?.token;
      if (token) {
        const config = {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        };

        let url = "/api/subscriptions/admin/client-subscriptions/";
        if (statusFilter !== "all") {
          url += `?status=${statusFilter}`;
        }

        const response = await axios.get(url, config);
        setSubscriptions(response.data);
      }
    } catch (error) {
      console.error("Error fetching client subscriptions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (subscriptionId, newStatus) => {
    try {
      const token = userInfo?.token;
      if (token) {
        const config = {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        };

        await axios.patch(
          `/api/subscriptions/admin/client-subscriptions/${subscriptionId}/`,
          { status: newStatus },
          config
        );

        alert(`Subscription status updated to ${newStatus}`);
        fetchSubscriptions();
      }
    } catch (error) {
      console.error("Error updating subscription status:", error);
      alert("Failed to update subscription status.");
    }
  };

  const handleViewDetails = (subscription) => {
    setSelectedSubscription(subscription);
    setShowDetailsModal(true);
  };

  const handleDeleteSubscription = async (subscriptionId) => {
    if (
      !await confirm(
        "Are you sure you want to delete this subscription? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const token = userInfo?.token;
      if (token) {
        const config = {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        };

        await axios.delete(
          `/api/subscriptions/admin/client-subscriptions/${subscriptionId}/`,
          config
        );
        alert("Subscription deleted successfully!");
        fetchSubscriptions();
      }
    } catch (error) {
      console.error("Error deleting subscription:", error);
      alert("Failed to delete subscription.");
    }
  };

  const filteredSubscriptions = subscriptions.filter(
    (sub) =>
      sub.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.plan_details?.display_name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { color: "success", icon: <FaCheck />, text: "Active" },
      expired: { color: "warning", icon: <FaTimes />, text: "Expired" },
      cancelled: { color: "danger", icon: <FaTimes />, text: "Cancelled" },
      suspended: { color: "secondary", icon: <FaTimes />, text: "Suspended" },
    };

    const config = statusConfig[status] || statusConfig.active;
    return (
      <span className={`status-badge status-${config.color}`}>
        {config.icon}
        {config.text}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const calculateDaysRemaining = (endDate) => {
    const today = new Date();
    const end = new Date(endDate);
    const diffTime = end - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="admin-client-subscriptions-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading client subscriptions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-client-subscriptions-page admin-page">
      <div className="page-header">
        <h1>Client Subscriptions Management</h1>
        <p>Monitor and manage all client subscriptions across the platform</p>
      </div>

      {/* Filters and Search */}
      <div className="filters-section">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by client name or plan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-controls">
          <div className="filter-group">
            <FaFilter className="filter-icon" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="cancelled">Cancelled</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="stats-overview">
        <div className="stat-card">
          <div className="stat-number">{subscriptions.length}</div>
          <div className="stat-label">Total Subscriptions</div>
        </div>
        <div className="stat-card active">
          <div className="stat-number">
            {subscriptions.filter((s) => s.status === "active").length}
          </div>
          <div className="stat-label">Active</div>
        </div>
        <div className="stat-card expired">
          <div className="stat-number">
            {subscriptions.filter((s) => s.status === "expired").length}
          </div>
          <div className="stat-label">Expired</div>
        </div>
        <div className="stat-card cancelled">
          <div className="stat-number">
            {subscriptions.filter((s) => s.status === "cancelled").length}
          </div>
          <div className="stat-label">Cancelled</div>
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="content-section">
        <div className="subscriptions-table-container">
          <table className="subscriptions-table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Plan</th>
                <th>Status</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Days Remaining</th>
                <th>Billing Cycle</th>
                <th>Monthly Cost</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubscriptions.map((subscription) => {
                const daysRemaining = calculateDaysRemaining(
                  subscription.end_date
                );
                return (
                  <tr
                    key={subscription.id}
                    className={`subscription-row ${subscription.status}`}
                  >
                    <td>
                      <div className="client-info">
                        <FaBuilding className="client-icon" />
                        <span className="client-name">
                          {subscription.client_name}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="plan-info">
                        <FaCrown className="plan-icon" />
                        <span className="plan-name">
                          {subscription.plan_details?.display_name}
                        </span>
                      </div>
                    </td>
                    <td>{getStatusBadge(subscription.status)}</td>
                    <td>
                      <div className="date-info">
                        <FaCalendarAlt className="date-icon" />
                        {formatDate(subscription.start_date)}
                      </div>
                    </td>
                    <td>
                      <div className="date-info">
                        <FaCalendarAlt className="date-icon" />
                        {formatDate(subscription.end_date)}
                      </div>
                    </td>
                    <td>
                      <span
                        className={`days-remaining ${
                          daysRemaining <= 30
                            ? "warning"
                            : daysRemaining <= 7
                            ? "critical"
                            : "normal"
                        }`}
                      >
                        {daysRemaining > 0
                          ? `${daysRemaining} days`
                          : "Expired"}
                      </span>
                    </td>
                    <td>
                      <span className="billing-cycle">
                        {subscription.billing_cycle}
                      </span>
                    </td>
                    <td>
                      <div className="cost-info">
                        <FaDollarSign className="cost-icon" />
                        {subscription.plan_details?.monthly_price}
                      </div>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="action-btn view-btn"
                          onClick={() => handleViewDetails(subscription)}
                          title="View Details"
                        >
                          <FaEye />
                        </button>

                        {subscription.status === "active" && (
                          <button
                            className="action-btn suspend-btn"
                            onClick={() =>
                              handleStatusChange(subscription.id, "suspended")
                            }
                            title="Suspend"
                          >
                            <FaTimes />
                          </button>
                        )}

                        {subscription.status === "suspended" && (
                          <button
                            className="action-btn activate-btn"
                            onClick={() =>
                              handleStatusChange(subscription.id, "active")
                            }
                            title="Activate"
                          >
                            <FaCheck />
                          </button>
                        )}

                        <button
                          className="action-btn delete-btn"
                          onClick={() =>
                            handleDeleteSubscription(subscription.id)
                          }
                          title="Delete"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredSubscriptions.length === 0 && (
            <div className="no-subscriptions">
              <FaCrown className="no-subscriptions-icon" />
              <h3>No subscriptions found</h3>
              <p>
                {searchTerm || statusFilter !== "all"
                  ? "No subscriptions match your current filters."
                  : "No client subscriptions have been created yet."}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Subscription Details Modal */}
      {showDetailsModal && selectedSubscription && (
        <div className="modal-overlay">
          <div className="subscription-details-modal">
            <div className="modal-header">
              <h2>Subscription Details</h2>
              <button
                className="close-btn"
                onClick={() => setShowDetailsModal(false)}
              >
                <FaTimes />
              </button>
            </div>

            <div className="modal-content">
              <div className="details-grid">
                <div className="detail-section">
                  <h3>Client Information</h3>
                  <div className="detail-item">
                    <span className="label">Client Name:</span>
                    <span className="value">
                      {selectedSubscription.client_name}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Subscription ID:</span>
                    <span className="value">#{selectedSubscription.id}</span>
                  </div>
                </div>

                <div className="detail-section">
                  <h3>Plan Information</h3>
                  <div className="detail-item">
                    <span className="label">Plan Name:</span>
                    <span className="value">
                      {selectedSubscription.plan_details?.display_name}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Plan Type:</span>
                    <span className="value">
                      {selectedSubscription.plan_details?.name}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Truck Limit:</span>
                    <span className="value">
                      {selectedSubscription.plan_details?.truck_limit === -1
                        ? "Unlimited"
                        : selectedSubscription.plan_details?.truck_limit}
                    </span>
                  </div>
                </div>

                <div className="detail-section">
                  <h3>Subscription Status</h3>
                  <div className="detail-item">
                    <span className="label">Status:</span>
                    <span className="value">
                      {getStatusBadge(selectedSubscription.status)}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Billing Cycle:</span>
                    <span className="value">
                      {selectedSubscription.billing_cycle}
                    </span>
                  </div>
                </div>

                <div className="detail-section">
                  <h3>Billing Information</h3>
                  <div className="detail-item">
                    <span className="label">Monthly Price:</span>
                    <span className="value">
                      ${selectedSubscription.plan_details?.monthly_price}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Yearly Price:</span>
                    <span className="value">
                      ${selectedSubscription.plan_details?.yearly_price}
                    </span>
                  </div>
                </div>

                <div className="detail-section full-width">
                  <h3>Timeline</h3>
                  <div className="detail-item">
                    <span className="label">Start Date:</span>
                    <span className="value">
                      {formatDate(selectedSubscription.start_date)}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="label">End Date:</span>
                    <span className="value">
                      {formatDate(selectedSubscription.end_date)}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Days Remaining:</span>
                    <span className="value">
                      {calculateDaysRemaining(selectedSubscription.end_date)}{" "}
                      days
                    </span>
                  </div>
                </div>

                {selectedSubscription.plan_details?.features && (
                  <div className="detail-section full-width">
                    <h3>Plan Features</h3>
                    <ul className="features-list">
                      {selectedSubscription.plan_details.features.map(
                        (feature, index) => (
                          <li key={index}>
                            <FaCheck className="feature-check" />
                            {feature}
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                )}
              </div>

              <div className="modal-actions">
                <button
                  className="close-modal-btn"
                  onClick={() => setShowDetailsModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminClientSubscriptionsPage;
