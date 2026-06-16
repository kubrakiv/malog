import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaTruck, FaCheck, FaEnvelope, FaBuilding, FaCalendarAlt } from "react-icons/fa";
import { MdHourglassTop } from "react-icons/md";
import "./RegistrationPendingPage.scss";

const RegistrationPendingPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [registrationInfo, setRegistrationInfo] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (location.state?.registrationData) {
      setRegistrationInfo(location.state.registrationData);
    } else {
      const storedInfo = localStorage.getItem("pendingRegistration");
      if (storedInfo) {
        try {
          setRegistrationInfo(JSON.parse(storedInfo));
        } catch {
          // ignore parse error
        }
      }
    }
  }, [location.state]);

  const formattedDate = registrationInfo?.registration_date
    ? new Date(registrationInfo.registration_date).toLocaleDateString("uk-UA", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <div className="rpp-background">
      <div className="rpp-card">

        {/* Logo */}
        <button type="button" className="rpp-logo" onClick={() => navigate("/")}>
          <FaTruck className="rpp-logo-icon" />
          TMS SOVTES
        </button>

        {/* Icon + title */}
        <div className="rpp-icon-wrap">
          <MdHourglassTop className="rpp-hourglass" />
        </div>

        <h1 className="rpp-title">
          Заявка на <span>розгляді</span>
        </h1>
        <p className="rpp-subtitle">
          Дякуємо за реєстрацію в <strong>TMS SOVTES</strong>!<br />
          Наша команда розгляне вашу заявку протягом 24–48 годин.
        </p>

        {/* Status badge */}
        <div className="rpp-status-badge">
          <span className="rpp-status-dot" />
          Очікує перевірки
        </div>

        {/* Registration details */}
        {registrationInfo && (
          <div className="rpp-details">
            <h3 className="rpp-details-title">Деталі реєстрації</h3>
            <div className="rpp-details-grid">
              {registrationInfo.client_name && (
                <div className="rpp-detail-item">
                  <FaBuilding className="rpp-detail-icon" />
                  <div>
                    <span className="rpp-detail-label">Компанія</span>
                    <span className="rpp-detail-value">{registrationInfo.client_name}</span>
                  </div>
                </div>
              )}
              {registrationInfo.admin_email && (
                <div className="rpp-detail-item">
                  <FaEnvelope className="rpp-detail-icon" />
                  <div>
                    <span className="rpp-detail-label">Електронна пошта</span>
                    <span className="rpp-detail-value">{registrationInfo.admin_email}</span>
                  </div>
                </div>
              )}
              {formattedDate && (
                <div className="rpp-detail-item rpp-detail-item--full">
                  <FaCalendarAlt className="rpp-detail-icon" />
                  <div>
                    <span className="rpp-detail-label">Дата подачі</span>
                    <span className="rpp-detail-value">{formattedDate}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Next steps */}
        <div className="rpp-steps">
          <h3 className="rpp-steps-title">Що відбувається далі?</h3>
          <ul className="rpp-steps-list">
            <li><FaCheck className="rpp-step-check" />Наша команда розгляне вашу заявку протягом 24–48 годин</li>
            <li><FaCheck className="rpp-step-check" />Ви отримаєте сповіщення на електронну пошту після схвалення</li>
            <li><FaCheck className="rpp-step-check" />Після схвалення ви зможете увійти та почати роботу</li>
          </ul>
        </div>

        {/* Contact */}
        <p className="rpp-contact">
          Маєте питання?{" "}
          <a href="mailto:support@sovtes.com.ua">support@sovtes.com.ua</a>
        </p>

        {/* Actions */}
        <div className="rpp-actions">
          <Link to="/login" className="rpp-btn rpp-btn--secondary">
            Увійти
          </Link>
          <Link to="/" className="rpp-btn rpp-btn--primary">
            На головну
          </Link>
        </div>

      </div>
    </div>
  );
};

export default RegistrationPendingPage;
