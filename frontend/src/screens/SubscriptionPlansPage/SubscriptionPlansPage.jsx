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
import MainPageHeaderComponent from "../MainPageComponent/MainPageHeaderComponent";
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
          <p>Завантаження планів підписки...</p>
        </div>
      </div>
    );
  }

  const getCurrentPlanPrice = (plan) => {
    const price =
      selectedBilling === "yearly"
        ? Math.round(plan.yearly_price / 12)
        : Math.round(plan.monthly_price);
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  };

  return (
    <div className="subscription-plans-page">
      <MainPageHeaderComponent />
      <div className="subscription-plans-content">
        <div className="page-header">
          <h1>Оберіть ваш план підписки</h1>
          <p>
            {currentSubscription
              ? "Підвищіть рівень або змініть свій поточний план підписки"
              : "Оберіть план, який відповідає потребам вашого бізнесу"}
          </p>
        </div>

        {currentSubscription && (
          <div className="current-subscription">
            <div className="current-plan-info">
              <FaCrown className="crown-icon" />
              <div className="plan-details">
                <h3>
                  Поточний План: {currentSubscription.plan_details.display_name}
                </h3>
                <p>
                  {currentSubscription.current_usage.truck_count} /{" "}
                  {currentSubscription.plan_details.truck_limit === -1
                    ? "∞"
                    : currentSubscription.plan_details.truck_limit}{" "}
                  вантажівок використано
                </p>
                <p>{currentSubscription.days_remaining} днів залишилося</p>
              </div>
            </div>
          </div>
        )}

        <div className="billing-toggle">
          <button
            className={selectedBilling === "monthly" ? "active" : ""}
            onClick={() => setSelectedBilling("monthly")}
          >
            Щомісяця
          </button>
          <button
            className={selectedBilling === "yearly" ? "active" : ""}
            onClick={() => setSelectedBilling("yearly")}
          >
            Щорічно
            <span className="discount-badge">Економія 17%</span>
          </button>
        </div>

        <div className="pricing-grid">
          {subscriptionPlans.map((plan) => {
            const isCurrentPlan =
              currentSubscription?.plan_details?.id === plan.id;
            const isUpgrade =
              currentSubscription &&
              plan.monthly_price >
                currentSubscription.plan_details.monthly_price;
            const isDowngrade =
              currentSubscription &&
              plan.monthly_price <
                currentSubscription.plan_details.monthly_price;

            return (
              <div
                key={plan.id}
                className={`pricing-card ${
                  plan.name === "pro" ? "featured" : ""
                } ${isCurrentPlan ? "current" : ""}`}
              >
                {plan.name === "pro" && (
                  <div className="featured-badge">
                    <FaCrown /> Найпопулярніший
                  </div>
                )}

                {isCurrentPlan && (
                  <div className="current-badge">Поточний План</div>
                )}

                <div className="plan-header">
                  <h3>
                    {plan.display_name}
                    {plan.is_trial_plan && (
                      <span className="trial-badge">БЕЗКОШТОВНО</span>
                    )}
                  </h3>
                  <div className="price">
                    {plan.is_trial_plan ? (
                      <div className="trial-price">
                        <span className="amount">0</span>
                        <span className="period">
                          грн / {plan.trial_duration_days} днів
                        </span>
                      </div>
                    ) : (
                      <>
                        <span className="currency"></span>
                        <span className="amount">
                          {getCurrentPlanPrice(plan)}
                        </span>
                        <span className="period">₴/міс</span>
                      </>
                    )}
                  </div>
                  {selectedBilling === "yearly" && (
                    <div className="yearly-total">
                      Оплата щорічно:{" "}
                      {Math.round(plan.yearly_price)
                        .toString()
                        .replace(/\B(?=(\d{3})+(?!\d))/g, " ")}{" "}
                      грн
                    </div>
                  )}
                  <p className="plan-description">{plan.description}</p>
                </div>

                <div className="plan-features">
                  <div className="truck-limit">
                    <FaTruck />
                    {plan.truck_limit === -1
                      ? "Необмежено"
                      : plan.truck_limit}{" "}
                    Вантажівок
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
                      <FaSpinner className="spinning" /> Обробка...
                    </>
                  ) : isCurrentPlan ? (
                    "Поточний План"
                  ) : isUpgrade ? (
                    `Підвищити до ${plan.display_name}`
                  ) : isDowngrade ? (
                    `Понизити до ${plan.display_name}`
                  ) : (
                    `Обрати ${plan.display_name}`
                  )}
                </button>
              </div>
            );
          })}
        </div>

        <div className="plan-comparison">
          <h2>Порівняти Плани</h2>
          <p className="scroll-hint">
            Прокрутіть таблицю горизонтально для перегляду всіх планів
          </p>
          <div className="comparison-scroll-container">
            <div className="comparison-table">
              <div className="comparison-header">
                <div className="feature-column">Функції</div>
                {subscriptionPlans.map((plan) => (
                  <div key={plan.id} className="plan-column">
                    {plan.display_name}
                  </div>
                ))}
              </div>

              <div className="comparison-row">
                <div className="feature-name">Ліміт Вантажівок</div>
                {subscriptionPlans.map((plan) => (
                  <div key={plan.id} className="plan-value">
                    {plan.truck_limit === -1 ? "Необмежено" : plan.truck_limit}
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
      </div>
    </div>
  );
}

export default SubscriptionPlansPage;
