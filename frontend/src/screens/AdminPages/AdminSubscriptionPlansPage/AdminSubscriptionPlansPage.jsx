import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import {
  FaCrown,
  FaPlus,
  FaEdit,
  FaTrash,
  FaCheck,
  FaTimes,
  FaTruck,
  FaDollarSign,
  FaToggleOn,
  FaToggleOff,
  FaSave,
} from "react-icons/fa";
import "./AdminSubscriptionPlansPage.scss";

function AdminSubscriptionPlansPage() {
  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;

  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    display_name: "",
    description: "",
    truck_limit: "",
    monthly_price: "",
    yearly_price: "",
    features: "",
    is_active: true,
  });

  useEffect(() => {
    fetchPlans();
  }, [userInfo]);

  const fetchPlans = async () => {
    try {
      const token = userInfo?.token;
      if (token) {
        const config = {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        };
        // You'll need to create this admin endpoint to fetch all plans including inactive ones
        const response = await axios.get(
          "/api/subscriptions/admin/plans/",
          config
        );
        setPlans(response.data);
      }
    } catch (error) {
      console.error("Error fetching plans:", error);
      // For now, let's use the regular endpoint
      try {
        const token = userInfo?.token;
        if (token) {
          const config = {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          };
          const response = await axios.get("/api/subscriptions/plans/", config);
          setPlans(response.data);
        }
      } catch (fallbackError) {
        console.error("Fallback error:", fallbackError);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleCreatePlan = async (e) => {
    e.preventDefault();
    try {
      const token = userInfo?.token;
      if (token) {
        const config = {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        };

        const planData = {
          ...formData,
          truck_limit:
            formData.truck_limit === "" ? -1 : parseInt(formData.truck_limit),
          monthly_price: parseFloat(formData.monthly_price),
          yearly_price: parseFloat(formData.yearly_price),
          features: formData.features
            .split("\n")
            .map((f) => f.trim())
            .filter((f) => f),
        };

        await axios.post("/api/subscriptions/admin/plans/", planData, config);
        alert("Plan created successfully!");
        setShowCreateForm(false);
        setFormData({
          name: "",
          display_name: "",
          description: "",
          truck_limit: "",
          monthly_price: "",
          yearly_price: "",
          features: "",
          is_active: true,
        });
        fetchPlans();
      }
    } catch (error) {
      console.error("Error creating plan:", error);
      alert("Failed to create plan. Please try again.");
    }
  };

  const handleEditPlan = (plan) => {
    setEditingPlan(plan.id);
    setFormData({
      name: plan.name,
      display_name: plan.display_name,
      description: plan.description,
      truck_limit: plan.truck_limit === -1 ? "" : plan.truck_limit.toString(),
      monthly_price: plan.monthly_price.toString(),
      yearly_price: plan.yearly_price.toString(),
      features: plan.features?.join("\n") || "",
      is_active: plan.is_active,
    });
  };

  const handleUpdatePlan = async (planId) => {
    try {
      const token = userInfo?.token;
      if (token) {
        const config = {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        };

        const planData = {
          ...formData,
          truck_limit:
            formData.truck_limit === "" ? -1 : parseInt(formData.truck_limit),
          monthly_price: parseFloat(formData.monthly_price),
          yearly_price: parseFloat(formData.yearly_price),
          features: formData.features
            .split("\n")
            .map((f) => f.trim())
            .filter((f) => f),
        };

        await axios.put(
          `/api/subscriptions/admin/plans/${planId}/`,
          planData,
          config
        );
        alert("Plan updated successfully!");
        setEditingPlan(null);
        fetchPlans();
      }
    } catch (error) {
      console.error("Error updating plan:", error);
      alert("Failed to update plan. Please try again.");
    }
  };

  const handleToggleActive = async (planId, currentStatus) => {
    try {
      const token = userInfo?.token;
      if (token) {
        const config = {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        };

        await axios.patch(
          `/api/subscriptions/admin/plans/${planId}/`,
          {
            is_active: !currentStatus,
          },
          config
        );

        fetchPlans();
      }
    } catch (error) {
      console.error("Error toggling plan status:", error);
      alert("Failed to update plan status.");
    }
  };

  const handleDeletePlan = async (planId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this plan? This action cannot be undone."
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

        await axios.delete(`/api/subscriptions/admin/plans/${planId}/`, config);
        alert("Plan deleted successfully!");
        fetchPlans();
      }
    } catch (error) {
      console.error("Error deleting plan:", error);
      alert("Failed to delete plan. It may be in use by active subscriptions.");
    }
  };

  if (loading) {
    return (
      <div className="admin-subscription-plans-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading subscription plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-subscription-plans-page admin-page">
      <div className="page-header">
        <h1>Subscription Plans Management</h1>
        <p>Create, edit, and manage subscription plans for your clients</p>
        <button
          className="create-plan-btn"
          onClick={() => setShowCreateForm(true)}
        >
          <FaPlus /> Create New Plan
        </button>
      </div>

      {/* Create Plan Form */}
      {showCreateForm && (
        <div className="modal-overlay">
          <div className="plan-form-modal">
            <div className="modal-header">
              <h2>Create New Subscription Plan</h2>
              <button
                className="close-btn"
                onClick={() => setShowCreateForm(false)}
              >
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleCreatePlan} className="plan-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>Plan Name (Internal)</label>
                  <select
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Plan Type</option>
                    <option value="base">Base Plan</option>
                    <option value="pro">Pro Plan</option>
                    <option value="unlimited">Unlimited Plan</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Display Name</label>
                  <input
                    type="text"
                    name="display_name"
                    value={formData.display_name}
                    onChange={handleInputChange}
                    placeholder="e.g., Basic Package"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Truck Limit</label>
                  <input
                    type="number"
                    name="truck_limit"
                    value={formData.truck_limit}
                    onChange={handleInputChange}
                    placeholder="Leave empty for unlimited"
                    min="1"
                  />
                </div>

                <div className="form-group">
                  <label>Monthly Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="monthly_price"
                    value={formData.monthly_price}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Yearly Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="yearly_price"
                    value={formData.yearly_price}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleInputChange}
                    />
                    <span>Active Plan</span>
                  </label>
                </div>
              </div>

              <div className="form-group full-width">
                <label>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Plan description..."
                  rows={3}
                  required
                />
              </div>

              <div className="form-group full-width">
                <label>Features (one per line)</label>
                <textarea
                  name="features"
                  value={formData.features}
                  onChange={handleInputChange}
                  placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
                  rows={4}
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="save-btn">
                  <FaSave /> Create Plan
                </button>
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Plans List */}
      <div className="content-section">
        <div className="plans-grid">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`plan-card ${!plan.is_active ? "inactive" : ""}`}
            >
              <div className="plan-header">
                <div className="plan-title">
                  <FaCrown className="plan-icon" />
                  <h3>{plan.display_name}</h3>
                </div>
                <div className="plan-status">
                  <button
                    className={`status-toggle ${
                      plan.is_active ? "active" : "inactive"
                    }`}
                    onClick={() => handleToggleActive(plan.id, plan.is_active)}
                  >
                    {plan.is_active ? <FaToggleOn /> : <FaToggleOff />}
                    {plan.is_active ? "Active" : "Inactive"}
                  </button>
                </div>
              </div>

              <div className="plan-details">
                <div className="plan-pricing">
                  <div className="price-item">
                    <FaDollarSign />
                    <span>${plan.monthly_price}/month</span>
                  </div>
                  <div className="price-item">
                    <FaDollarSign />
                    <span>${plan.yearly_price}/year</span>
                  </div>
                </div>

                <div className="plan-limits">
                  <div className="limit-item">
                    <FaTruck />
                    <span>
                      {plan.truck_limit === -1
                        ? "Unlimited trucks"
                        : `${plan.truck_limit} trucks`}
                    </span>
                  </div>
                </div>

                <div className="plan-description">
                  <p>{plan.description}</p>
                </div>

                {plan.features && plan.features.length > 0 && (
                  <div className="plan-features">
                    <h4>Features:</h4>
                    <ul>
                      {plan.features.map((feature, index) => (
                        <li key={index}>
                          <FaCheck />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="plan-actions">
                {editingPlan === plan.id ? (
                  <div className="edit-form">
                    <div className="form-grid">
                      <input
                        type="text"
                        name="display_name"
                        value={formData.display_name}
                        onChange={handleInputChange}
                        placeholder="Display Name"
                      />
                      <input
                        type="number"
                        name="truck_limit"
                        value={formData.truck_limit}
                        onChange={handleInputChange}
                        placeholder="Truck Limit"
                      />
                      <input
                        type="number"
                        step="0.01"
                        name="monthly_price"
                        value={formData.monthly_price}
                        onChange={handleInputChange}
                        placeholder="Monthly Price"
                      />
                      <input
                        type="number"
                        step="0.01"
                        name="yearly_price"
                        value={formData.yearly_price}
                        onChange={handleInputChange}
                        placeholder="Yearly Price"
                      />
                    </div>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Description"
                      rows={2}
                    />
                    <textarea
                      name="features"
                      value={formData.features}
                      onChange={handleInputChange}
                      placeholder="Features (one per line)"
                      rows={3}
                    />
                    <div className="edit-actions">
                      <button
                        className="save-btn"
                        onClick={() => handleUpdatePlan(plan.id)}
                      >
                        <FaSave /> Save
                      </button>
                      <button
                        className="cancel-btn"
                        onClick={() => setEditingPlan(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="action-buttons">
                    <button
                      className="edit-btn"
                      onClick={() => handleEditPlan(plan)}
                    >
                      <FaEdit /> Edit
                    </button>
                    <button
                      className="delete-btn"
                      onClick={() => handleDeletePlan(plan.id)}
                    >
                      <FaTrash /> Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {plans.length === 0 && (
          <div className="no-plans">
            <FaCrown className="no-plans-icon" />
            <h3>No subscription plans found</h3>
            <p>Create your first subscription plan to get started.</p>
            <button
              className="create-first-plan-btn"
              onClick={() => setShowCreateForm(true)}
            >
              <FaPlus /> Create First Plan
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminSubscriptionPlansPage;
