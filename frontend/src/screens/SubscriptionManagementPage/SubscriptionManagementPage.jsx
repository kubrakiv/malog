import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FaCrown,
  FaLock,
  FaCheck,
  FaTimes,
  FaCalendarAlt,
  FaTruck,
  FaUsers,
  FaChartLine,
  FaClock,
} from "react-icons/fa";
import "./SubscriptionManagementPage.scss";

function SubscriptionManagementPage() {
  const navigate = useNavigate();
  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;

  const [subscription, setSubscription] = useState(null);
  const [availablePlans, setAvailablePlans] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Function to fetch pending requests
  const fetchPendingRequests = async (token, config) => {
    try {
      console.log("Fetching pending requests...");
      const requestsResponse = await axios.get(
        "/api/subscriptions/change-requests/my/",
        config
      );
      console.log("Pending requests response:", requestsResponse.data);
      const pendingOnly = requestsResponse.data.filter(
        (req) => req.status === "pending"
      );
      console.log("Filtered pending requests:", pendingOnly);
      setPendingRequests(pendingOnly);
    } catch (error) {
      console.log("Error fetching pending requests:", error);
      setPendingRequests([]);
    }
  };

  useEffect(() => {
    // Redirect if not admin or client_admin
    if (userInfo && !["admin", "client_admin"].includes(userInfo.role)) {
      navigate("/main");
      return;
    }

    const fetchData = async () => {
      try {
        const token = userInfo?.token;
        if (token) {
          const config = {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          };

          // Fetch current subscription
          try {
            const subscriptionResponse = await axios.get(
              "/api/subscriptions/current/",
              config
            );
            setSubscription(subscriptionResponse.data);
          } catch (error) {
            if (error.response?.status === 404) {
              console.log("No active subscription found");
            }
          }

          // Fetch available plans
          const plansResponse = await axios.get(
            "/api/subscriptions/plans/",
            config
          );
          console.log("Available plans response:", plansResponse.data);
          setAvailablePlans(plansResponse.data);

          // Fetch pending requests
          await fetchPendingRequests(token, config);
        }
      } catch (error) {
        console.error("Error fetching subscription data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userInfo, navigate]);

  const [submittingPlanId, setSubmittingPlanId] = useState(null);

  const handlePlanChange = async (planId) => {
    // Check if user is trying to request the same plan they already have
    if (
      subscription &&
      subscription.plan_details &&
      subscription.plan_details.id === parseInt(planId)
    ) {
      alert(
        "You are already on this plan. You cannot request a change to the same plan."
      );
      return;
    }

    setSubmittingPlanId(planId);

    try {
      const token = userInfo?.token;
      if (token) {
        const config = {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        };

        const response = await axios.post(
          "/api/subscriptions/change-plan/",
          { plan_id: planId, reason: "User requested plan change" },
          config
        );

        console.log("Plan change response:", response.data);

        // Show success message
        alert(
          "Plan change request submitted successfully! It will be reviewed by an administrator."
        );

        // Refetch pending requests to show the new request immediately
        await fetchPendingRequests(token, config);
      }
    } catch (error) {
      console.error("Error submitting plan change request:", error);
      if (error.response?.data?.error) {
        alert(`Error: ${error.response.data.error}`);
      } else {
        alert("Failed to submit plan change request. Please try again.");
      }
    } finally {
      setSubmittingPlanId(null);
    }
  };

  if (loading) {
    return (
      <div className="subscription-management-wrapper">
        <div className="subscription-management-container">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading your subscription details...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="subscription-management-wrapper">
      <div className="subscription-management-container">
        <div className="page-header">
          <h1>Subscription Management</h1>
          <p>Manage your subscription plan and view usage details</p>
        </div>
        {/* Pending Requests Notification */}
        {pendingRequests.length > 0 && (
          <div className="pending-requests-notification">
            <FaClock className="pending-icon" />
            <div className="notification-content">
              <h3>Pending Plan Change Request</h3>
              <p>
                You have {pendingRequests.length} pending plan change request
                {pendingRequests.length > 1 ? "s" : ""}
                awaiting admin approval.
              </p>
              {pendingRequests.map((request) => (
                <div key={request.id} className="pending-request-item">
                  <span>
                    Requested:{" "}
                    {request.requested_plan_details?.display_name ||
                      "Unknown Plan"}
                    {request.requested_at && (
                      <>
                        {" "}
                        (submitted{" "}
                        {new Date(request.requested_at).toLocaleDateString()})
                      </>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}{" "}
        {/* Current Subscription */}
        <div className="current-subscription-section">
          <h2>Current Subscription</h2>
          {subscription ? (
            <div className="current-subscription-card">
              <div className="subscription-header">
                <FaCrown className="crown-icon" />
                <div className="subscription-info">
                  <h3>{subscription.plan_details.display_name}</h3>
                  <p className="subscription-status">
                    Status: <span className="status-active">Active</span>
                  </p>
                </div>
                <div className="subscription-cost">
                  <span className="price">
                    ${subscription.plan_details.monthly_price}/month
                  </span>
                </div>
              </div>

              <div className="subscription-details">
                <div className="usage-info">
                  <div className="usage-item">
                    <FaTruck className="usage-icon" />
                    <span>
                      Trucks: {subscription.current_usage?.truck_count || 0} /{" "}
                      {subscription.plan_details.truck_limit === -1
                        ? "Unlimited"
                        : subscription.plan_details.truck_limit}
                    </span>
                  </div>
                  <div className="usage-item">
                    <FaUsers className="usage-icon" />
                    <span>Plan: {subscription.plan_details.display_name}</span>
                  </div>
                </div>

                <div className="features-list">
                  <h4>Included Features:</h4>
                  <div className="features-grid">
                    {subscription.plan_details.features?.map(
                      (feature, index) => (
                        <div key={index} className="feature-item">
                          <FaCheck className="check-icon" />
                          <span>{feature}</span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="no-subscription-card">
              <FaLock className="lock-icon" />
              <h3>No Active Subscription</h3>
              <p>You don't have an active subscription plan.</p>
              <button
                className="choose-plan-btn"
                onClick={() => navigate("/subscription-plans")}
              >
                Choose a Plan
              </button>
            </div>
          )}
        </div>
        {/* Available Plans */}
        <div className="available-plans-section">
          <h2>Available Plans</h2>
          <p>
            Compare and switch to a different plan that better fits your needs
          </p>

          <div className="plans-grid">
            {availablePlans.map((plan) => (
              <div
                key={plan.id}
                className={`plan-card ${
                  subscription?.plan_details?.id === plan.id ? "current" : ""
                }`}
              >
                <div className="plan-header">
                  <h3>{plan.display_name}</h3>
                  <div className="plan-price">
                    <span className="price">${plan.monthly_price}</span>
                    <span className="period">/month</span>
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
                  <div className="limit-item">
                    <FaUsers />
                    <span>Multiple user support</span>
                  </div>
                </div>

                <div className="plan-features">
                  {plan.features?.map((feature, index) => (
                    <div key={index} className="feature-item">
                      <FaCheck />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="plan-actions">
                  {subscription?.plan_details?.id === plan.id ? (
                    <button className="current-plan-btn" disabled>
                      Current Plan
                    </button>
                  ) : (
                    <button
                      className="select-plan-btn"
                      onClick={() => handlePlanChange(plan.id)}
                      disabled={submittingPlanId === plan.id}
                    >
                      {submittingPlanId === plan.id
                        ? "Submitting..."
                        : "Switch to This Plan"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SubscriptionManagementPage;
