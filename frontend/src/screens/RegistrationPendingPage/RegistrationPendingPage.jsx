import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import MainPageHeaderComponent from "../MainPageComponent/MainPageHeaderComponent";
import FooterComponent from "../MainPageComponent/FooterComponent";
import "./RegistrationPendingPage.scss";

const RegistrationPendingPage = () => {
  const location = useLocation();
  const [registrationInfo, setRegistrationInfo] = useState(null);

  useEffect(() => {
    // Try to get registration info from location state first
    if (location.state && location.state.registrationData) {
      setRegistrationInfo(location.state.registrationData);
    } else {
      // Try to get from localStorage as fallback
      const storedInfo = localStorage.getItem("pendingRegistration");
      if (storedInfo) {
        try {
          setRegistrationInfo(JSON.parse(storedInfo));
        } catch (error) {
          console.error("Error parsing stored registration info:", error);
        }
      }
    }
  }, [location.state]);

  return (
    <div className="registration-pending-page">
      <MainPageHeaderComponent />
      <div className="registration-pending-container">
        <div className="registration-pending-card">
          <div className="icon-section">
            <div className="pending-icon">⏳</div>
          </div>

          <h1>Реєстрація очікує схвалення</h1>

          <p className="main-message">
            Дякуємо за реєстрацію в <strong>Malog Systems</strong>!
          </p>

          {registrationInfo && (
            <div className="registration-details">
              <h3>Деталі реєстрації</h3>
              <div className="details-grid">
                <div className="detail-item">
                  <span className="detail-label">Компанія:</span>
                  <span className="detail-value">
                    {registrationInfo.client_name}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Ідентифікатор:</span>
                  <span className="detail-value">
                    {registrationInfo.client_slug}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Електронна пошта:</span>
                  <span className="detail-value">
                    {registrationInfo.admin_email}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Дата подачі:</span>
                  <span className="detail-value">
                    {new Date().toLocaleDateString("uk-UA", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="status-info">
            <div className="status-item">
              <span className="status-label">Статус:</span>
              <span className="status-value pending">Очікує перевірки</span>
            </div>
          </div>

          <div className="info-section">
            <h3>Що відбувається далі?</h3>
            <ul>
              <li>Наша команда розгляне вашу заявку протягом 24-48 годин</li>
              <li>
                Ви отримаєте повідомлення електронною поштою після схвалення
              </li>
              <li>
                Після схвалення ви зможете увійти та почати користуватися Malog
                Systems
              </li>
            </ul>
          </div>

          <div className="contact-info">
            <p>Маєте питання щодо реєстрації?</p>
            <p>
              Зв'яжіться з нами:{" "}
              <a href="mailto:support@malog.com">support@malog.com.ua</a>
            </p>
          </div>

          <div className="actions">
            <Link to="/login" className="btn btn-secondary">
              Спробувати увійти
            </Link>
            <Link to="/" className="btn btn-primary">
              На головну
            </Link>
          </div>
        </div>
      </div>
      <FooterComponent />
    </div>
  );
};

export default RegistrationPendingPage;
