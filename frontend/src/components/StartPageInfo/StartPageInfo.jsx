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
  FaPlay,
  FaRocket,
  FaClock,
  FaCloud,
  FaWallet,
  FaTag,
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

  const advantageMetrics = [
    {
      icon: <FaChartLine />,
      title: "Зменшення витрат",
      value: 30,
      description: "Оптимізація операційних витрат завдяки автоматизації.",
    },
    {
      icon: <FaRoute />,
      title: "Швидкість доставки",
      value: 92,
      description: "Розумна маршрутизація з актуальними дорожніми даними.",
    },
    {
      icon: <FaTasks />,
      title: "Контроль процесів",
      value: 95,
      description: "Прозорість етапів перевезень у режимі реального часу.",
    },
    {
      icon: <FaUsers />,
      title: "Масштабування",
      value: 88,
      description: "Готовність до росту автопарку без втрати керованості.",
    },
  ];

  const heroSignals = [
    {
      title: "PROFIT",
      direction: "up",
      description: "Прибуток зростає",
      trend: "+23%",
      icon: <FaChartLine />,
      linePoints: "2,24 18,14 32,16 46,10 62,12 78,4",
    },
    {
      title: "COST",
      direction: "down",
      description: "Витрати знижуються",
      trend: "-18%",
      icon: <FaWallet />,
      linePoints: "2,4 18,8 32,12 46,14 62,18 78,22",
    },
    {
      title: "PRICE",
      direction: "up",
      description: "Ціна зростає",
      trend: "+15%",
      icon: <FaTag />,
      linePoints: "2,26 18,20 32,18 46,12 62,14 78,6",
    },
  ];

  const heroTrust = [
    { icon: <FaShieldAlt />, label: "Безпечно та надійно" },
    { icon: <FaClock />, label: "Доступ 24/7" },
    { icon: <FaCloud />, label: "Хмарна платформа" },
  ];

  return (
    <div className="start-page-container">
      <div id="hero-section" className="hero-section">
        <div className="container-page hero-shell">
          <div className="hero-main">
            <div className="hero-content">
              <p className="hero-eyebrow">Український онлайн-сервіс</p>
              <h1 className="hero-title">
                TMS <span>SOVTES</span>
              </h1>
              <p className="hero-subtitle">
                Ваше комплексне інноваційне рішення для управління автопарком в
                режимі реального часу.
              </p>

              <div className="hero-actions">
                <button
                  className="hero-register-btn"
                  onClick={handleGetStarted}
                >
                  <FaRocket />
                  <span>Реєстрація</span>
                </button>
                <button className="hero-demo-btn" type="button">
                  <FaPlay />
                  <span>Демо-тур</span>
                </button>
              </div>

              <div className="hero-trust">
                {heroTrust.map((item, index) => (
                  <div key={index} className="trust-item">
                    <span className="trust-icon">{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="hero-stats">
            {heroSignals.map((signal, index) => (
              <div
                key={index}
                className={`stat-item stat-item--${signal.direction}`}
              >
                <div className="stat-body">
                  <span className="stat-icon">{signal.icon}</span>
                  <div className="stat-content">
                    <span className="stat-title">{signal.title}</span>
                    <span className="stat-label">{signal.description}</span>
                    <span className="stat-trend">{signal.trend}</span>
                  </div>
                  <div className="stat-spark" aria-hidden="true">
                    <svg viewBox="0 0 80 30" preserveAspectRatio="none">
                      <polyline points={signal.linePoints} />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div id="features-section" className="features-section">
        <div className="container-page">
          <div className="section-header">
            <h2>
              Функції <span>платформи</span>
            </h2>
            <p>
              Відкрийте для себе потужні інструменти, які роблять TMS SOVTES
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

      <div className="section-bridge" aria-hidden="true">
        <span>Операційна аналітика</span>
      </div>

      <div id="info-section" className="info-section">
        <div className="container-page">
          <div className="info-grid">
            <div className="info-card">
              <h3>Про систему</h3>
              <p>
                TMS SOVTES - це комплексна платформа управління автопарком,
                призначена для підвищення прибутковості та спрощення
                транспортних операцій. Побудована з використанням сучасних
                технологій та штучного інтелекту, вона надає надійні рішення для
                управління перевезеннями, оптимізації маршрутів та відстеження в
                реальному часі.
              </p>
              <div className="system-tags">
                <span>GPS Моніторинг</span>
                <span>AI Планування</span>
                <span>Мультітенантність</span>
                <span>Аналітика 24/7</span>
              </div>
            </div>
            <div className="info-card advantages-card">
              <h3>Ключові Переваги</h3>
              <div className="advantages-overview">
                <div className="efficiency-ring" aria-hidden="true">
                  <div className="ring-inner">
                    <strong>91%</strong>
                    <span>Ефективність</span>
                  </div>
                </div>
                <p>
                  Візуальна панель показує ключові зони росту вашої логістики та
                  дозволяє швидко оцінити операційну ефективність.
                </p>
              </div>

              <div className="advantages-list">
                {advantageMetrics.map((item, index) => (
                  <div key={index} className="advantage-item">
                    <div className="advantage-head">
                      <span className="advantage-icon">{item.icon}</span>
                      <div>
                        <h4>{item.title}</h4>
                        <small>{item.description}</small>
                      </div>
                      <span className="advantage-value">{item.value}%</span>
                    </div>
                    <div className="advantage-bar">
                      <span style={{ width: `${item.value}%` }}></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div id="pricing-section" className="pricing-section">
        <div className="container-page">
          <div className="section-header">
            <h2>
              Оберіть <span>ідеальний план</span>
            </h2>
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
              Приєднуйтеся до тих, хто вже використовує TMS SOVTES для
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
