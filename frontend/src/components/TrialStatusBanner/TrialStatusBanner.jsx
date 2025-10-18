import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import "./TrialStatusBanner.scss";

const TrialStatusBanner = () => {
  const [trialStatus, setTrialStatus] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const { userInfo } = useSelector((state) => state.user);

  useEffect(() => {
    if (userInfo) {
      fetchTrialStatus();
    }
  }, [userInfo]);

  const fetchTrialStatus = async () => {
    try {
      setLoading(true);
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.access}`,
        },
      };

      const { data } = await axios.get(
        "/api/subscriptions/trial/status/",
        config
      );
      setTrialStatus(data);
    } catch (error) {
      console.error("Error fetching trial status:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (planName, billingCycle) => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.access}`,
        },
      };

      const requestData = {
        plan: planName,
        billing_cycle: billingCycle,
      };

      await axios.post(
        "/api/subscriptions/trial/convert/",
        requestData,
        config
      );

      // Refresh trial status
      await fetchTrialStatus();
      setShowUpgradeModal(false);

      // Show success message
      alert("Успішно оновлено до платного плану!");
    } catch (error) {
      console.error("Error upgrading subscription:", error);
      alert("Помилка при оновленні підписки. Спробуйте ще раз.");
    }
  };

  if (loading || !trialStatus || !trialStatus.has_trial) {
    return null;
  }

  // Don't show banner if trial has already been converted
  if (trialStatus.status !== "trial") {
    return null;
  }

  const isExpiringSoon = trialStatus.days_remaining <= 3;
  const isExpired = trialStatus.days_remaining <= 0;

  return (
    <>
      <div
        className={`trial-status-banner ${
          isExpired ? "expired" : isExpiringSoon ? "warning" : "info"
        }`}
      >
        <div className="trial-content">
          <div className="trial-info">
            <span className="trial-icon">
              {isExpired ? "⚠️" : isExpiringSoon ? "⏰" : "🎉"}
            </span>
            <div className="trial-text">
              {isExpired ? (
                <span>
                  <strong>Тріальний період закінчився</strong>
                  <br />
                  Оновіть свій план, щоб продовжити використання сервісу
                </span>
              ) : (
                <span>
                  <strong>Тріальний період: </strong>
                  залишилось {trialStatus.days_remaining}{" "}
                  {trialStatus.days_remaining === 1 ? "день" : "днів"}
                  <br />
                  <small>
                    Тріал до:{" "}
                    {new Date(trialStatus.trial_end_date).toLocaleDateString(
                      "uk-UA"
                    )}
                  </small>
                </span>
              )}
            </div>
          </div>

          <div className="trial-actions">
            <button
              className="btn-upgrade"
              onClick={() => setShowUpgradeModal(true)}
            >
              {isExpired ? "Відновити доступ" : "Оновити план"}
            </button>
          </div>
        </div>

        {trialStatus.current_usage && (
          <div className="usage-info">
            <span>
              Вантажівки: {trialStatus.current_usage.truck_count}/
              {trialStatus.current_usage.truck_limit === -1
                ? "∞"
                : trialStatus.current_usage.truck_limit}
            </span>
          </div>
        )}
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="modal-overlay">
          <div className="upgrade-modal">
            <div className="modal-header">
              <h3>Оберіть план підписки</h3>
              <button
                className="close-btn"
                onClick={() => setShowUpgradeModal(false)}
              >
                ×
              </button>
            </div>

            <div className="modal-content">
              <div className="upgrade-plans">
                <div
                  className="plan-option"
                  onClick={() => handleUpgrade("base", "monthly")}
                >
                  <h4>Базовий план</h4>
                  <div className="price">$29/місяць</div>
                  <p>Ідеально для малих автопарків</p>
                </div>

                <div
                  className="plan-option featured"
                  onClick={() => handleUpgrade("pro", "monthly")}
                >
                  <div className="featured-badge">РЕКОМЕНДУЄТЬСЯ</div>
                  <h4>Професійний план</h4>
                  <div className="price">$59/місяць</div>
                  <p>Для середніх та великих автопарків</p>
                </div>

                <div
                  className="plan-option"
                  onClick={() => handleUpgrade("unlimited", "monthly")}
                >
                  <h4>Безлімітний план</h4>
                  <div className="price">$99/місяць</div>
                  <p>Для корпоративних клієнтів</p>
                </div>
              </div>

              <div className="billing-note">
                <p>💡 Зекономте 20% при річній оплаті</p>
                <div className="yearly-options">
                  <button onClick={() => handleUpgrade("base", "yearly")}>
                    Базовий (річний): $278/рік
                  </button>
                  <button onClick={() => handleUpgrade("pro", "yearly")}>
                    Професійний (річний): $566/рік
                  </button>
                  <button onClick={() => handleUpgrade("unlimited", "yearly")}>
                    Безлімітний (річний): $950/рік
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TrialStatusBanner;
