import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import toast from "react-hot-toast";
import {
  listPendingClients,
  approveClient,
  rejectClient,
} from "../../../actions/adminActions";
import "./ClientApprovalPage.scss";

const ClientApprovalPage = () => {
  const dispatch = useDispatch();
  const [selectedClient, setSelectedClient] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const pendingClients = useSelector((state) => state.pendingClients);
  const { loading, clients, error } = pendingClients;

  useEffect(() => {
    dispatch(listPendingClients());
  }, [dispatch]);

  const handleApprove = async (client) => {
    if (window.confirm(`Are you sure you want to approve ${client.name}?`)) {
      setIsProcessing(true);
      try {
        await dispatch(approveClient(client.id));
        toast.success(`${client.name} has been approved successfully!`, {
          position: "top-right",
          duration: 4000,
        });
        dispatch(listPendingClients()); // Refresh list
      } catch (error) {
        toast.error("Failed to approve client. Please try again.", {
          position: "top-right",
        });
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleReject = async (client) => {
    if (rejectionReason.trim()) {
      setIsProcessing(true);
      try {
        await dispatch(rejectClient(client.id, rejectionReason));
        toast.success(`${client.name} has been rejected.`, {
          position: "top-right",
          duration: 4000,
        });
        setSelectedClient(null);
        setRejectionReason("");
        dispatch(listPendingClients()); // Refresh list
      } catch (error) {
        toast.error("Failed to reject client. Please try again.", {
          position: "top-right",
        });
      } finally {
        setIsProcessing(false);
      }
    } else {
      toast.error("Please provide a reason for rejection.", {
        position: "top-right",
      });
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

  return (
    <div className="client-approval-page">
      <div className="page-header">
        <h1>Client Approval</h1>
        <p>Review and approve new client registrations</p>
        {clients && (
          <div className="stats">
            <span className="pending-count">
              {clients.length} pending approval{clients.length !== 1 ? "s" : ""}
            </span>
          </div>
        )}
      </div>

      {loading && (
        <div className="loading-container">
          <div className="loading">Loading pending clients...</div>
        </div>
      )}

      {error && (
        <div className="error-container">
          <div className="error">Error: {error}</div>
        </div>
      )}

      {!loading && clients?.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">✨</div>
          <h3>No pending approvals</h3>
          <p>All client registrations have been processed.</p>
        </div>
      )}

      <div className="clients-grid">
        {clients?.map((client) => (
          <div key={client.id} className="client-card">
            <div className="client-header">
              <h3>{client.name}</h3>
              <span className={`status ${client.approval_status}`}>
                {client.approval_status}
              </span>
            </div>

            <div className="client-details">
              <div className="detail-section">
                <h4>Company Information</h4>
                <p>
                  <strong>Name:</strong> {client.name}
                </p>
                <p>
                  <strong>Slug:</strong> {client.slug}
                </p>
                <p>
                  <strong>Registered:</strong> {formatDate(client.created_at)}
                </p>
                {client.company && (
                  <>
                    <p>
                      <strong>Email:</strong> {client.company.email || "N/A"}
                    </p>
                    <p>
                      <strong>Phone:</strong> {client.company.phone || "N/A"}
                    </p>
                    {client.company.vat_number && (
                      <p>
                        <strong>VAT Number:</strong> {client.company.vat_number}
                      </p>
                    )}
                    {client.company.post_address && (
                      <p>
                        <strong>Address:</strong> {client.company.post_address}
                      </p>
                    )}
                  </>
                )}
              </div>

              {client.admin_user && (
                <div className="detail-section">
                  <h4>Admin User</h4>
                  <p>
                    <strong>Name:</strong> {client.admin_user.full_name}
                  </p>
                  <p>
                    <strong>Email:</strong> {client.admin_user.email}
                  </p>
                  {client.admin_user.phone_number && (
                    <p>
                      <strong>Phone:</strong> {client.admin_user.phone_number}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="client-actions">
              <button
                onClick={() => handleApprove(client)}
                className="btn btn-success"
                disabled={isProcessing}
              >
                {isProcessing ? "Processing..." : "Approve"}
              </button>
              <button
                onClick={() => setSelectedClient(client)}
                className="btn btn-danger"
                disabled={isProcessing}
              >
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Rejection Modal */}
      {selectedClient && (
        <div className="modal-overlay" onClick={() => setSelectedClient(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Reject Client: {selectedClient.name}</h3>
              <button
                className="close-btn"
                onClick={() => setSelectedClient(null)}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <label htmlFor="rejection-reason">Reason for rejection *</label>
              <textarea
                id="rejection-reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Please provide a detailed reason for rejection..."
                rows={4}
                disabled={isProcessing}
              />
            </div>

            <div className="modal-actions">
              <button
                onClick={() => setSelectedClient(null)}
                className="btn btn-secondary"
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                onClick={() => handleReject(selectedClient)}
                className="btn btn-danger"
                disabled={!rejectionReason.trim() || isProcessing}
              >
                {isProcessing ? "Rejecting..." : "Reject Client"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientApprovalPage;
