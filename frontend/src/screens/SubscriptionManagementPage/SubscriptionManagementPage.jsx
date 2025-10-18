import React, { useEffect, useState, useContext } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import OpenContext from "../../components/OpenContext";
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
  const { isSidebarOpen } = useContext(OpenContext);
  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;

  const [subscription, setSubscription] = useState(null);
  const [availablePlans, setAvailablePlans] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBilling, setSelectedBilling] = useState("monthly");

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

  const getCurrentPlanPrice = (plan) => {
    const price =
      selectedBilling === "yearly"
        ? Math.round(plan.yearly_price / 12)
        : Math.round(plan.monthly_price);
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  };

  const handlePlanChange = async (planId) => {
    // Check if user is trying to request the same plan they already have
    if (
      subscription &&
      subscription.plan_details &&
      subscription.plan_details.id === parseInt(planId)
    ) {
      alert(
        "Ви вже використовуєте цей план. Ви не можете запросити зміну на той же план."
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
          "Запит на зміну плану успішно подано! Він буде розглянутий адміністратором."
        );

        // Refetch pending requests to show the new request immediately
        await fetchPendingRequests(token, config);
      }
    } catch (error) {
      console.error("Error submitting plan change request:", error);
      if (error.response?.data?.error) {
        alert(`Error: ${error.response.data.error}`);
      } else {
        alert("Не вдалося подати запит на зміну плану. Спробуйте ще раз.");
      }
    } finally {
      setSubmittingPlanId(null);
    }
  };

  if (loading) {
    return (
      <div
        className={`subscription-management-wrapper ${
          isSidebarOpen ? "sidebar-open" : ""
        }`}
      >
        <div className="subscription-management-container">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Завантаження деталей вашої підписки...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`subscription-management-wrapper ${
        isSidebarOpen ? "sidebar-open" : ""
      }`}
    >
      <div className="subscription-management-container">
        <div className="page-header">
          <h1>Управління підпискою</h1>
          <p>Керуйте планом підписки та переглядайте деталі використання</p>
        </div>
        {/* Pending Requests Notification */}
        {pendingRequests.length > 0 && (
          <div className="pending-requests-notification">
            <FaClock className="pending-icon" />
            <div className="notification-content">
              <h3>Очікуючий запит на зміну плану</h3>
              <p>
                У вас є {pendingRequests.length} очікуюч
                {pendingRequests.length === 1 ? "ий" : "их"} запит
                {pendingRequests.length > 1 ? "и" : ""} на зміну плану
                {pendingRequests.length > 1 ? "ів" : ""}, що очікує схвалення
                адміністратором.
              </p>
              {pendingRequests.map((request) => (
                <div key={request.id} className="pending-request-item">
                  <span>
                    Запитано:{" "}
                    {request.requested_plan_details?.display_name ||
                      "Невідомий план"}
                    {request.requested_at && (
                      <>
                        {" "}
                        (подано{" "}
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
          <h2>Поточна підписка</h2>
          {subscription ? (
            <div className="current-subscription-card">
              <div className="subscription-header">
                <FaCrown className="crown-icon" />
                <div className="subscription-info">
                  <h3>{subscription.plan_details.display_name}</h3>
                  <p className="subscription-status">
                    Статус: <span className="status-active">Активний</span>
                  </p>
                  {subscription.days_remaining !== undefined && (
                    <p className="days-remaining">
                      {subscription.days_remaining > 0 ? (
                        <>
                          <FaCalendarAlt className="calendar-icon" />
                          Залишилося {subscription.days_remaining}{" "}
                          {subscription.days_remaining === 1
                            ? "день"
                            : subscription.days_remaining < 5
                            ? "дні"
                            : "днів"}
                        </>
                      ) : (
                        <>
                          <FaCalendarAlt className="calendar-icon" />
                          Підписка закінчилася
                        </>
                      )}
                    </p>
                  )}
                </div>
                <div className="subscription-cost">
                  <span className="price">
                    {subscription.plan_details.monthly_price
                      .toString()
                      .replace(/\B(?=(\d{3})+(?!\d))/g, " ")}{" "}
                    ₴/міс
                  </span>
                </div>
              </div>

              <div className="subscription-details">
                <div className="usage-info">
                  <div className="usage-item">
                    <FaTruck className="usage-icon" />
                    <span>
                      Вантажівки: {subscription.current_usage?.truck_count || 0}{" "}
                      /{" "}
                      {subscription.plan_details.truck_limit === -1
                        ? "Необмежено"
                        : subscription.plan_details.truck_limit}
                    </span>
                  </div>
                  <div className="usage-item">
                    <FaUsers className="usage-icon" />
                    <span>План: {subscription.plan_details.display_name}</span>
                  </div>
                </div>

                <div className="features-list">
                  <h4>Включені функції:</h4>
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
              <h3>Немає активної підписки</h3>
              <p>У вас немає активного плану підписки.</p>
              <button
                className="choose-plan-btn"
                onClick={() => navigate("/subscription-plans")}
              >
                Обрати план
              </button>
            </div>
          )}
        </div>
        {/* Available Plans */}
        <div className="available-plans-section">
          <h2>Доступні плани</h2>
          <p>
            Порівняйте та переключіться на інший план, який краще відповідає
            вашим потребам
          </p>

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
                    <span className="price">
                      {getCurrentPlanPrice(plan)} ₴/міс
                    </span>
                    {/* <span className="period">/міс</span> */}
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
                </div>

                <div className="plan-limits">
                  <div className="limit-item">
                    <FaTruck />
                    <span>
                      {plan.truck_limit === -1
                        ? "Необмежено вантажівок"
                        : `${plan.truck_limit} вантажівок`}
                    </span>
                  </div>
                  <div className="limit-item">
                    <FaUsers />
                    <span>Підтримка декількох користувачів</span>
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
                      Поточний план
                    </button>
                  ) : (
                    <button
                      className="select-plan-btn"
                      onClick={() => handlePlanChange(plan.id)}
                      disabled={submittingPlanId === plan.id}
                    >
                      {submittingPlanId === plan.id
                        ? "Подання..."
                        : "Перейти на цей план"}
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
