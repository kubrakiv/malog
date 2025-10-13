import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import {
  FaCrown,
  FaCheck,
  FaTimes,
  FaTruck,
  FaArrowLeft,
  FaSpinner,
} from "react-icons/fa";
import "./SubscriptionPlansPage.scss";

function SubscriptionPlansPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;

  const [subscriptionPlans, setSubscriptionPlans] = useState([]);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedBilling, setSelectedBilling] = useState(
    searchParams.get("billing") || "monthly"
  );
  const [processingPlan, setProcessingPlan] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = userInfo?.token;
        const config = token
          ? {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          : {};

        // Fetch subscription plans
        const plansResponse = await axios.get("/api/subscriptions/plans/");
        setSubscriptionPlans(plansResponse.data);

        // Fetch current subscription if user is logged in
        if (token) {
          try {
            const currentResponse = await axios.get(
              "/api/subscriptions/current/",
              config
            );
            setCurrentSubscription(currentResponse.data);
          } catch (error) {
            // No current subscription is okay
            console.log("No current subscription found");
          }
        }
      } catch (error) {
        console.error("Error fetching subscription data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userInfo]);

  const handleChoosePlan = async (plan) => {
    if (!userInfo) {
      navigate(
        `/login?redirect=/subscription-plans&plan=${plan.id}&billing=${selectedBilling}`
      );
      return;
    }

    setProcessingPlan(plan.id);

    try {
      const token = userInfo.token;
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      if (currentSubscription) {
        // Upgrade/downgrade existing subscription
        await axios.put(
          "/api/subscriptions/upgrade/",
          {
            plan_id: plan.id,
          },
          config
        );
      } else {
        // Create new subscription
        await axios.post(
          "/api/subscriptions/create/",
          {
            plan_id: plan.id,
            billing_cycle: selectedBilling,
          },
          config
        );
      }

      // Redirect to dashboard
      navigate("/dashboard");
    } catch (error) {
      console.error("Error updating subscription:", error);
      // Handle error (show notification, etc.)
    } finally {
      setProcessingPlan(null);
    }
  };

  const handleGoBack = () => {
    if (currentSubscription) {
      navigate("/");
    } else {
      navigate("/");
    }
  };

  if (loading) {
    return (
      <div className="subscription-plans-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading subscription plans...</p>
        </div>
      </div>
    );
  }

  const getCurrentPlanPrice = (plan) => {
    if (selectedBilling === "yearly") {
      return Math.round((plan.yearly_price / 12) * 100) / 100;
    }
    return plan.monthly_price;
  };

  return (
    <div className="subscription-plans-content">
      <div className="page-header">
        <h1>Choose Your Subscription Plan</h1>
        <p>
          {currentSubscription
            ? "Upgrade or change your current subscription plan"
            : "Select a plan that fits your business needs"}
        </p>
      </div>

      {currentSubscription && (
        <div className="current-subscription">
          <div className="current-plan-info">
            <FaCrown className="crown-icon" />
            <div className="plan-details">
              <h3>
                Current Plan: {currentSubscription.plan_details.display_name}
              </h3>
              <p>
                {currentSubscription.current_usage.truck_count} /{" "}
                {currentSubscription.plan_details.truck_limit === -1
                  ? "∞"
                  : currentSubscription.plan_details.truck_limit}{" "}
                trucks used
              </p>
              <p>{currentSubscription.days_remaining} days remaining</p>
            </div>
          </div>
        </div>
      )}

      <div className="billing-toggle">
        <button
          className={selectedBilling === "monthly" ? "active" : ""}
          onClick={() => setSelectedBilling("monthly")}
        >
          Monthly
        </button>
        <button
          className={selectedBilling === "yearly" ? "active" : ""}
          onClick={() => setSelectedBilling("yearly")}
        >
          Yearly
          <span className="discount-badge">Save 17%</span>
        </button>
      </div>

      <div className="pricing-grid">
        {subscriptionPlans.map((plan) => {
          const isCurrentPlan =
            currentSubscription?.plan_details?.id === plan.id;
          const isUpgrade =
            currentSubscription &&
            plan.monthly_price > currentSubscription.plan_details.monthly_price;
          const isDowngrade =
            currentSubscription &&
            plan.monthly_price < currentSubscription.plan_details.monthly_price;

          return (
            <div
              key={plan.id}
              className={`pricing-card ${
                plan.name === "pro" ? "featured" : ""
              } ${isCurrentPlan ? "current" : ""}`}
            >
              {plan.name === "pro" && (
                <div className="featured-badge">
                  <FaCrown /> Most Popular
                </div>
              )}

              {isCurrentPlan && (
                <div className="current-badge">Current Plan</div>
              )}

              <div className="plan-header">
                <h3>{plan.display_name}</h3>
                <div className="price">
                  <span className="currency">$</span>
                  <span className="amount">{getCurrentPlanPrice(plan)}</span>
                  <span className="period">/month</span>
                </div>
                {selectedBilling === "yearly" && (
                  <div className="yearly-total">
                    Billed yearly: ${plan.yearly_price}
                  </div>
                )}
                <p className="plan-description">{plan.description}</p>
              </div>

              <div className="plan-features">
                <div className="truck-limit">
                  <FaTruck />
                  {plan.truck_limit === -1
                    ? "Unlimited"
                    : plan.truck_limit}{" "}
                  Trucks
                </div>

                <ul className="features-list">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex}>
                      <FaCheck className="check-icon" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <button
                className={`plan-btn ${
                  plan.name === "pro" ? "btn-featured" : "btn-primary"
                } ${isCurrentPlan ? "btn-current" : ""}`}
                onClick={() => handleChoosePlan(plan)}
                disabled={isCurrentPlan || processingPlan === plan.id}
              >
                {processingPlan === plan.id ? (
                  <>
                    <FaSpinner className="spinning" /> Processing...
                  </>
                ) : isCurrentPlan ? (
                  "Current Plan"
                ) : isUpgrade ? (
                  `Upgrade to ${plan.display_name}`
                ) : isDowngrade ? (
                  `Downgrade to ${plan.display_name}`
                ) : (
                  `Choose ${plan.display_name}`
                )}
              </button>
            </div>
          );
        })}
      </div>

      <div className="plan-comparison">
        <h2>Compare Plans</h2>
        <div className="comparison-table">
          <div className="comparison-header">
            <div className="feature-column">Features</div>
            {subscriptionPlans.map((plan) => (
              <div key={plan.id} className="plan-column">
                {plan.display_name}
              </div>
            ))}
          </div>

          <div className="comparison-row">
            <div className="feature-name">Truck Limit</div>
            {subscriptionPlans.map((plan) => (
              <div key={plan.id} className="plan-value">
                {plan.truck_limit === -1 ? "Unlimited" : plan.truck_limit}
              </div>
            ))}
          </div>

          {/* Feature comparison rows */}
          {[
            "Fleet Management",
            "Driver Management",
            "Route Planner",
            "Orders Management",
            "Route Calculator",
            "Points Management",
            "Invoicing",
            "Customer Management",
            "Tasks Management",
            "Live Map",
            "Dashboard",
            "System Administration",
          ].map((feature) => (
            <div key={feature} className="comparison-row">
              <div className="feature-name">{feature}</div>
              {subscriptionPlans.map((plan) => (
                <div key={plan.id} className="plan-value">
                  {plan.features.includes(feature) ? (
                    <FaCheck className="check-icon" />
                  ) : (
                    <FaTimes className="times-icon" />
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default SubscriptionPlansPage;
