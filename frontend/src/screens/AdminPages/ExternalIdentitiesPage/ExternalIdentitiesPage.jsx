import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useConfirm } from "../../../globalComponents/ConfirmModal/useConfirm";
import axios from "axios";
import toast from "react-hot-toast";
import { FaCopy, FaLink, FaSyncAlt } from "react-icons/fa";
import "./ExternalIdentitiesPage.scss";

const ExternalIdentitiesPage = () => {
  const confirm = useConfirm();
  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;

  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [identities, setIdentities] = useState([]);
  const [externalIdInputs, setExternalIdInputs] = useState({});

  const config = useMemo(
    () => ({
      headers: {
        Authorization: `Bearer ${userInfo?.token}`,
      },
    }),
    [userInfo?.token]
  );

  const fetchIdentities = async () => {
    if (!userInfo?.token) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams({ provider: "sovtes" });
      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }

      const { data } = await axios.get(
        `/api/admin/external-identities/?${params.toString()}`,
        config
      );
      setIdentities(data.results || []);

      const prefilled = {};
      (data.results || []).forEach((item) => {
        prefilled[item.id] = item.external_client_id || "";
      });
      setExternalIdInputs(prefilled);
    } catch (requestError) {
      const detail =
        requestError.response?.data?.detail ||
        requestError.response?.data?.error ||
        requestError.message;
      setError(detail);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIdentities();
  }, [statusFilter, userInfo?.token]);

  const copyLinkKey = async (value) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success("Link key copied", { position: "top-right" });
    } catch (copyError) {
      toast.error("Could not copy link key", { position: "top-right" });
    }
  };

  const handleLinkIdentity = async (identity) => {
    const externalClientId = (externalIdInputs[identity.id] || "").trim();
    if (!externalClientId) {
      toast.error("External client ID is required", { position: "top-right" });
      return;
    }

    try {
      setProcessingId(identity.id);
      await axios.post(
        `/api/admin/external-identities/${identity.id}/link/`,
        { external_client_id: externalClientId },
        config
      );

      toast.success(`Linked ${identity.client.name} to ${externalClientId}`, {
        position: "top-right",
      });
      fetchIdentities();
    } catch (requestError) {
      const detail =
        requestError.response?.data?.detail ||
        requestError.response?.data?.error ||
        requestError.message;
      toast.error(detail, { position: "top-right" });
    } finally {
      setProcessingId(null);
    }
  };

  const handleResetIdentity = async (identity) => {
    if (!await confirm(`Reset external identity for ${identity.client.name}?`)) {
      return;
    }

    try {
      setProcessingId(identity.id);
      await axios.post(
        `/api/admin/external-identities/${identity.id}/reset/`,
        {},
        config
      );

      toast.success(`Reset mapping for ${identity.client.name}`, {
        position: "top-right",
      });
      fetchIdentities();
    } catch (requestError) {
      const detail =
        requestError.response?.data?.detail ||
        requestError.response?.data?.error ||
        requestError.message;
      toast.error(detail, { position: "top-right" });
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="external-identities-page">
      <div className="page-header">
        <div>
          <h1>External Client Links</h1>
          <p>Manage Sovtes client ID ↔ TMS client mappings and link-key onboarding.</p>
        </div>
        <div className="header-controls">
          <label htmlFor="status-filter">Status</label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="linked">Linked</option>
            <option value="conflict">Conflict</option>
            <option value="disabled">Disabled</option>
          </select>
        </div>
      </div>

      {loading && <div className="state-box">Loading external identities...</div>}
      {!loading && error && <div className="state-box error">{error}</div>}

      {!loading && !error && (
        <div className="table-wrapper">
          <table className="identity-table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Status</th>
                <th>Sovtes Client ID</th>
                <th>Link Key</th>
                <th>Linked At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {identities.length === 0 && (
                <tr>
                  <td colSpan={6} className="empty-row">
                    No external identities found for selected filter.
                  </td>
                </tr>
              )}

              {identities.map((identity) => (
                <tr key={identity.id}>
                  <td>
                    <strong>{identity.client.name}</strong>
                    <div className="sub-text">{identity.client.slug}</div>
                  </td>
                  <td>
                    <span className={`status-badge ${identity.link_status}`}>
                      {identity.link_status}
                    </span>
                  </td>
                  <td>
                    <input
                      type="text"
                      value={externalIdInputs[identity.id] || ""}
                      onChange={(event) =>
                        setExternalIdInputs((prev) => ({
                          ...prev,
                          [identity.id]: event.target.value,
                        }))
                      }
                      placeholder="e.g. sovtes-client-123"
                    />
                  </td>
                  <td>
                    <div className="link-key-cell">
                      <code>{identity.link_key}</code>
                      <button
                        type="button"
                        className="icon-btn"
                        onClick={() => copyLinkKey(identity.link_key)}
                        title="Copy link key"
                      >
                        <FaCopy />
                      </button>
                    </div>
                  </td>
                  <td>{identity.linked_at ? new Date(identity.linked_at).toLocaleString() : "-"}</td>
                  <td>
                    <div className="actions-cell">
                      <button
                        type="button"
                        className="action-btn link"
                        disabled={processingId === identity.id}
                        onClick={() => handleLinkIdentity(identity)}
                      >
                        <FaLink />
                        Link
                      </button>
                      <button
                        type="button"
                        className="action-btn reset"
                        disabled={processingId === identity.id}
                        onClick={() => handleResetIdentity(identity)}
                      >
                        <FaSyncAlt />
                        Reset
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ExternalIdentitiesPage;