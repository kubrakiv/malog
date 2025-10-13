import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import {
  FaCrown,
  FaCheck,
  FaTimes,
  FaClock,
  FaTruck,
  FaEye,
  FaThumbsUp,
  FaThumbsDown,
} from "react-icons/fa";
import "./PlanChangeRequestsPage.scss";

function PlanChangeRequestsPage() {
  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const token = userInfo?.token;
        if (token) {
          const config = {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          };
          const response = await axios.get(
            `/api/subscriptions/change-requests/?status=${statusFilter}`,
            config
          );
          setRequests(response.data);
        }
      } catch (error) {
        console.error("Error fetching requests:", error);
      } finally {
        setLoading(false);
      }
    };

    if (userInfo) {
      fetchRequests();
    }
  }, [userInfo, statusFilter]);

  const handleApprove = async (requestId) => {
    try {
      const token = userInfo?.token;
      if (token) {
        const config = {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        };
        await axios.post(
          `/api/subscriptions/change-requests/${requestId}/approve/`,
          { admin_notes: adminNotes },
          config
        );

        // Refresh the requests
        setRequests(requests.filter((req) => req.id !== requestId));
        setSelectedRequest(null);
        setAdminNotes("");
        alert("Plan change request approved successfully!");
      }
    } catch (error) {
      console.error("Error approving request:", error);
      alert("Failed to approve request. Please try again.");
    }
  };

  const handleReject = async (requestId) => {
    try {
      const token = userInfo?.token;
      if (token) {
        const config = {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        };
        await axios.post(
          `/api/subscriptions/change-requests/${requestId}/reject/`,
          { admin_notes: adminNotes },
          config
        );

        // Refresh the requests
        setRequests(requests.filter((req) => req.id !== requestId));
        setSelectedRequest(null);
        setAdminNotes("");
        alert("Plan change request rejected.");
      }
    } catch (error) {
      console.error("Error rejecting request:", error);
      alert("Failed to reject request. Please try again.");
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <FaClock className="status-pending" />;
      case "approved":
        return <FaCheck className="status-approved" />;
      case "rejected":
        return <FaTimes className="status-rejected" />;
      default:
        return <FaClock />;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="plan-change-requests-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading plan change requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="plan-change-requests-container">
      <div className="page-header">
        <h1>Subscription Plan Change Requests</h1>
        <p>Review and manage subscription plan change requests from clients</p>
      </div>

      <div className="filters">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="status-filter"
        >
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div className="requests-grid">
        {requests.length === 0 ? (
          <div className="no-requests">
            <FaClock className="no-requests-icon" />
            <h3>No {statusFilter} requests found</h3>
            <p>There are currently no {statusFilter} plan change requests.</p>
          </div>
        ) : (
          requests.map((request) => (
            <div key={request.id} className="request-card">
              <div className="request-header">
                <div className="client-info">
                  <h3>{request.client_name}</h3>
                  <span className="request-date">
                    Requested: {formatDate(request.requested_at)}
                  </span>
                </div>
                <div className="status-badge">
                  {getStatusIcon(request.status)}
                  <span className={`status-text status-${request.status}`}>
                    {request.status}
                  </span>
                </div>
              </div>

              <div className="plan-comparison">
                <div className="current-plan">
                  <h4>Current Plan</h4>
                  <div className="plan-info">
                    <FaCrown />
                    <span>{request.current_plan.display_name}</span>
                    <small>${request.current_plan.monthly_price}/month</small>
                  </div>
                  <div className="plan-limits">
                    <FaTruck />
                    <span>
                      {request.current_plan.truck_limit === -1
                        ? "Unlimited trucks"
                        : `${request.current_plan.truck_limit} trucks`}
                    </span>
                  </div>
                </div>

                <div className="arrow">→</div>

                <div className="requested-plan">
                  <h4>Requested Plan</h4>
                  <div className="plan-info">
                    <FaCrown />
                    <span>{request.requested_plan_details.display_name}</span>
                    <small>
                      ${request.requested_plan_details.monthly_price}/month
                    </small>
                  </div>
                  <div className="plan-limits">
                    <FaTruck />
                    <span>
                      {request.requested_plan_details.truck_limit === -1
                        ? "Unlimited trucks"
                        : `${request.requested_plan_details.truck_limit} trucks`}
                    </span>
                  </div>
                </div>
              </div>

              {request.reason && (
                <div className="request-reason">
                  <h4>Reason:</h4>
                  <p>{request.reason}</p>
                </div>
              )}

              <div className="request-meta">
                <small>Requested by: {request.requested_by_name}</small>
                {request.reviewed_by_name && (
                  <small>
                    Reviewed by: {request.reviewed_by_name} on{" "}
                    {formatDate(request.reviewed_at)}
                  </small>
                )}
              </div>

              {request.admin_notes && (
                <div className="admin-notes">
                  <h4>Admin Notes:</h4>
                  <p>{request.admin_notes}</p>
                </div>
              )}

              {request.status === "pending" && (
                <div className="request-actions">
                  <button
                    className="view-btn"
                    onClick={() => setSelectedRequest(request)}
                  >
                    <FaEye /> Review
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Review Modal */}
      {selectedRequest && (
        <div className="modal-overlay">
          <div className="review-modal">
            <div className="modal-header">
              <h2>Review Plan Change Request</h2>
              <button
                className="close-btn"
                onClick={() => setSelectedRequest(null)}
              >
                <FaTimes />
              </button>
            </div>

            <div className="modal-content">
              <div className="request-summary">
                <h3>{selectedRequest.client_name}</h3>
                <p>
                  Wants to change from{" "}
                  <strong>{selectedRequest.current_plan.display_name}</strong>{" "}
                  to{" "}
                  <strong>
                    {selectedRequest.requested_plan_details.display_name}
                  </strong>
                </p>
                {selectedRequest.reason && (
                  <div className="reason">
                    <strong>Reason:</strong> {selectedRequest.reason}
                  </div>
                )}
              </div>

              <div className="admin-notes-input">
                <label>Admin Notes:</label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes about your decision..."
                  rows={3}
                />
              </div>

              <div className="modal-actions">
                <button
                  className="approve-btn"
                  onClick={() => handleApprove(selectedRequest.id)}
                >
                  <FaThumbsUp /> Approve
                </button>
                <button
                  className="reject-btn"
                  onClick={() => handleReject(selectedRequest.id)}
                >
                  <FaThumbsDown /> Reject
                </button>
                <button
                  className="cancel-btn"
                  onClick={() => setSelectedRequest(null)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PlanChangeRequestsPage;
