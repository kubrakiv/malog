import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FaTruck,
  FaRoute,
  FaUsers,
  FaFileInvoiceDollar,
  FaMapMarkedAlt,
  FaChartLine,
  FaCog,
  FaShieldAlt,
  FaCrown,
  FaCheck,
  FaTimes,
  FaCalculator,
  FaMapMarker,
  FaClipboardList,
  FaTasks,
  FaUserTie,
} from "react-icons/fa";
import "./StartPageInfo.scss";

function StartPageInfo() {
  const navigate = useNavigate();
  const [subscriptionPlans, setSubscriptionPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBilling, setSelectedBilling] = useState("monthly");

  useEffect(() => {
    const fetchSubscriptionPlans = async () => {
      try {
        const response = await axios.get("/api/subscriptions/plans/");
        setSubscriptionPlans(response.data);
      } catch (error) {
        console.error("Error fetching subscription plans:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptionPlans();
  }, []);

  const handleGetStarted = () => {
    navigate("/register");
  };

  const handleChoosePlan = (planId) => {
    // Navigate to registration with selected plan
    navigate(`/register?plan=${planId}&billing=${selectedBilling}`);
  };

  const features = [
    {
      icon: <FaTruck />,
      title: "Управління Автопарком",
      description:
        "Комплексна система управління вантажівками та причепами з відстеженням в реальному часі та планування технічного обслуговування.",
    },
    {
      icon: <FaFileInvoiceDollar />,
      title: "Управління Замовленнями",
      description:
        "Спрощена обробка замовлень, відстеження та генерація рахунків для безперебійної роботи бізнесу.",
    },

    {
      icon: <FaRoute />,
      title: "Планування Маршрутів",
      description:
        "Передові алгоритми оптимізації маршрутів для забезпечення ефективних шляхів доставки та зниження витрат палива.",
    },
    {
      icon: <FaUsers />,
      title: "Управління Водіями",
      description:
        "Повне управління профілями водіїв, робочими графіками та системою відстеження продуктивності.",
    },

    {
      icon: <FaMapMarkedAlt />,
      title: "Відстеження в Реальному Часі",
      description:
        "Відстеження GPS транспортних засобів в режимі реального часу з інтерактивними картами та оновленням місцезнаходження для клієнтів.",
    },
    {
      icon: <FaChartLine />,
      title: "Аналітика та Звіти",
      description:
        "Детальна аналітика та інструменти звітності для моніторингу продуктивності, витрат та бізнес-метрик.",
    },
    {
      icon: <FaCog />,
      title: "Автоматизація Завдань",
      description:
        "Автоматизоване планування завдань та управління робочими процесами для підвищення операційної ефективності.",
    },
    {
      icon: <FaShieldAlt />,
      title: "Мультітенантна Безпека",
      description:
        "Корпоративний рівень безпеки з мультітенантною архітектурою для ізоляції та захисту даних.",
    },
  ];

  return (
    <div className="start-page-container">
      <div id="hero-section" className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">MALOG SYSTEMS</h1>
          <p className="hero-subtitle">
            Ваше комплексне інноваційне рішення для управління автопарком в
            режимі реального часу.
          </p>
          {/* <p className="hero-description">
            Автоматизуйте рутинні операції, підвищуйте ефективність перевезень
            та контролюйте весь автопарк в режимі реального часу з нашою
            інноваційною платформою.
          </p> */}
          <div className="hero-stats">
            <div className="stat-item">
              <span className="stat-number">100+</span>
              <span className="stat-label">Активних транспортних засобів</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">24/7</span>
              <span className="stat-label">Відстеження в реальному часі</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">99.9%</span>
              <span className="stat-label">Час роботи системи</span>
            </div>
          </div>

          <div className="hero-cta">
            <button className="hero-register-btn" onClick={handleGetStarted}>
              <span>Реєстрація</span>
            </button>
          </div>
        </div>
      </div>

      <div id="features-section" className="features-section">
        <div className="container-page">
          <div className="section-header">
            <h2>Функції платформи</h2>
            <p>
              Відкрийте для себе потужні інструменти, які роблять Malog Systems
              ідеальним вибором для вашої транспортної компанії
            </p>
          </div>

          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="feature-icon">{feature.icon}</div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div id="info-section" className="info-section">
        <div className="container-page">
          <div className="info-grid">
            <div className="info-card">
              <h3>Про систему</h3>
              <p>
                Malog Systems - це комплексна платформа управління автопарком,
                призначена для підвищення прибутковості та спрощення
                транспортних операцій. Побудована з використанням сучасних
                технологій та штучного інтелекту, вона надає надійні рішення для
                управління перевезеннями, оптимізації маршрутів та відстеження в
                реальному часі.
              </p>
            </div>
            <div className="info-card">
              <h3>Ключові Переваги</h3>
              <ul>
                <li>Зменшення операційних витрат до 30%</li>
                <li>
                  Покращення часу доставки завдяки розумному маршрутизації
                </li>
                <li>Видимість в реальному часі всіх операцій</li>
                <li>Масштабована мультітенантна архітектура</li>
                <li>Комплексна звітність та аналітика</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div id="pricing-section" className="pricing-section">
        <div className="container-page">
          <div className="section-header">
            <h2>Оберіть ідеальний план</h2>
            <p>
              Оберіть план підписки, який відповідає потребам вашого бізнесу та
              масштабуйтесь в міру зростання
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
          </div>

          {loading ? (
            <div className="loading-plans">
              <div className="loading-spinner"></div>
              <p>Завантаження планів підписки...</p>
            </div>
          ) : (
            <div className="pricing-grid">
              {subscriptionPlans.map((plan, index) => (
                <div
                  key={plan.id}
                  className={`pricing-card ${
                    plan.name === "pro" ? "featured" : ""
                  }`}
                >
                  {plan.name === "pro" && (
                    <div className="featured-badge">
                      <FaCrown /> Найпопулярніший
                    </div>
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
                            {(() => {
                              const price =
                                selectedBilling === "yearly"
                                  ? Math.round(plan.yearly_price / 12)
                                  : Math.round(plan.monthly_price);
                              return price
                                .toString()
                                .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
                            })()}
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
                      <strong>
                        {plan.truck_limit === -1
                          ? "Необмежено"
                          : plan.truck_limit}{" "}
                        Вантажівок
                      </strong>
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
                    }`}
                    onClick={() => handleChoosePlan(plan.id)}
                  >
                    Обрати {plan.display_name}
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="compare-plans-section">
            <button
              className="compare-plans-btn"
              onClick={() => navigate("/subscription-plans")}
            >
              Детальне порівняння планів
            </button>
            <p className="compare-plans-text">
              Переглядайте детальне порівняння функцій та керуйте своєю
              підпискою
            </p>
          </div>
        </div>
      </div>

      <div id="cta-section" className="cta-section">
        <div className="container-page">
          <div className="cta-content">
            <h2>Готові трансформувати вашу компанію?</h2>
            <p>
              Приєднуйтеся до тих, хто вже використовує Malog Systems для
              оптимізації своїх перевезень та підвищення ефективності автопарку.
            </p>
            <div className="cta-buttons">
              <button className="btn-primary" onClick={handleGetStarted}>
                Почати
              </button>
              <button className="btn-secondary">Дізнатися більше</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StartPageInfo;
