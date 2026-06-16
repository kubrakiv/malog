import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import {
  FaCrown,
  FaCheck,
  FaTimes,
  FaTruck,
  FaSpinner,
} from "react-icons/fa";
import "./SubscriptionPlansPage.scss";

const FEATURE_LABELS = {
  "Fleet Management": "Управління автопарком",
  "Driver Management": "Управління водіями",
  "Route Planner": "Планування маршрутів",
  "Orders Management": "Управління замовленнями",
  "Route Calculator": "Калькулятор маршрутів",
  "Points Management": "Управління точками",
  "Invoicing": "Рахунки-фактури",
  "Customer Management": "Управління клієнтами",
  "Tasks Management": "Управління завданнями",
  "Live Map": "Карта в реальному часі",
  "Dashboard": "Аналітика та Звіти",
  "System Administration": "Адміністрування",
  "Employee Management": "Управління персоналом",
  "External Platforms": "Зовнішні платформи",
};

const COMPARISON_FEATURES = [
  "Fleet Management",
  "Driver Management",
  "Employee Management",
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
  "External Platforms",
];

// Switch between "total" (fixed price per plan) and "per_truck" (price × trucks)
const PRICING_MODEL = import.meta.env.REACT_APP_PRICING_MODEL || "total";

// USD per truck per month for each plan tier in per_truck mode
const PER_TRUCK_PRICES_USD = {
  base: 10,
  pro: 15,
  unlimited: 20,
};

// Descriptions rewritten for per_truck context (no truck-limit references)
const PER_TRUCK_DESCRIPTIONS = {
  base: "Ідеально підходить для малих бізнесів, які розпочинають свій логістичний шлях. Базові інструменти для управління автопарком — платіть лише за кількість вантажівок у вашому парку.",
  pro: "Ідеально підходить для зростаючих логістичних компаній. Розширені функції: оптимізація маршрутів, управління клієнтами та детальна аналітика — без обмежень на розмір автопарку.",
  unlimited: "Для великих підприємств із масштабними логістичними операціями. Необмежена кількість вантажівок, усі преміум-функції та персоналізована підтримка.",
};

// Free tier shown in per_truck mode only
const PER_TRUCK_FREE_TIER = {
  id: "free",
  name: "free",
  display_name: "Безкоштовно",
  description: "Спробуйте платформу безкоштовно — до 3 вантажівок протягом 14 днів без жодних зобов'язань.",
  truck_limit: 3,
  trial_duration_days: 14,
  is_trial_plan: true,
  monthly_price: 0,
  features: ["Fleet Management", "Driver Management", "Route Planner", "Orders Management", "Employee Management"],
};

function SubscriptionPlansPage() {
  const navigate = useNavigate();
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
  const [truckCount, setTruckCount] = useState(5);

  const isPerTruckModel = PRICING_MODEL === "per_truck";

  useEffect(() => { window.scrollTo(0, 0); }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = userInfo?.token;
        const config = token
          ? { headers: { Authorization: `Bearer ${token}` } }
          : {};

        const plansResponse = await axios.get("/api/subscriptions/plans/");
        setSubscriptionPlans(plansResponse.data);

        if (token) {
          try {
            const currentResponse = await axios.get(
              "/api/subscriptions/current/",
              config
            );
            setCurrentSubscription(currentResponse.data);
          } catch {
            // No current subscription is okay
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
      const config = { headers: { Authorization: `Bearer ${token}` } };

      if (currentSubscription) {
        await axios.put(
          "/api/subscriptions/upgrade/",
          { plan_id: plan.id },
          config
        );
      } else {
        await axios.post(
          "/api/subscriptions/create/",
          { plan_id: plan.id, billing_cycle: selectedBilling },
          config
        );
      }

      navigate("/dashboard");
    } catch (error) {
      console.error("Error updating subscription:", error);
    } finally {
      setProcessingPlan(null);
    }
  };

  const getCurrentPlanPrice = (plan) => {
    const price =
      selectedBilling === "yearly"
        ? Math.round(plan.yearly_price / 12)
        : Math.round(plan.monthly_price);
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  };

  // In per-truck mode: show free tier first, then the three paid tiers only
  const visiblePlans = isPerTruckModel
    ? [
        PER_TRUCK_FREE_TIER,
        ...subscriptionPlans.filter(
          (p) => !p.is_trial_plan && PER_TRUCK_PRICES_USD[p.name] !== undefined
        ),
      ]
    : subscriptionPlans;

  if (loading) {
    return (
      <div className="spp-root">
        <div className="spp-loading">
          <div className="spp-spinner"></div>
          <p>Завантаження планів підписки...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="spp-root">
      {/* ── Hero ── */}
      <section className="spp-hero">
        <div className="spp-container">
          <p className="spp-eyebrow">Підписка та тарифи</p>
          <h1 className="spp-hero-title">
            Оберіть <span>ідеальний план</span>
          </h1>
          <p className="spp-hero-sub">
            {currentSubscription
              ? "Підвищіть рівень або змініть свій поточний план підписки"
              : isPerTruckModel
              ? "Платіть лише за кількість вантажівок у вашому парку — масштабуйтесь без переплат"
              : "Оберіть план підписки, який відповідає потребам вашого бізнесу та масштабуйтесь в міру зростання"}
          </p>

          {currentSubscription && (
            <div className="spp-current-banner">
              <FaCrown className="spp-crown" />
              <div>
                <strong>
                  Поточний план: {currentSubscription.plan_details.display_name}
                </strong>
                <span>
                  {currentSubscription.current_usage.truck_count} /{" "}
                  {currentSubscription.plan_details.truck_limit === -1
                    ? "∞"
                    : currentSubscription.plan_details.truck_limit}{" "}
                  вантажівок · {currentSubscription.days_remaining} днів
                  залишилося
                </span>
              </div>
            </div>
          )}

          {isPerTruckModel ? (
            <div className="spp-truck-counter">
              <label className="spp-truck-counter-label">
                <FaTruck />
                Кількість вантажівок:
                <span className="spp-truck-counter-value">{truckCount}</span>
              </label>
              <input
                type="range"
                min={1}
                max={100}
                value={truckCount}
                onChange={(e) => setTruckCount(Number(e.target.value))}
                className="spp-truck-slider"
              />
              <div className="spp-truck-slider-ticks">
                <span>1</span>
                <span>25</span>
                <span>50</span>
                <span>75</span>
                <span>100+</span>
              </div>
            </div>
          ) : (
            <div className="spp-billing-toggle">
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
                <span className="spp-discount-badge">Економія 17%</span>
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ── Pricing cards ── */}
      <section className="spp-pricing-section">
        <div className="spp-container">
          <div className="spp-pricing-grid">
            {visiblePlans.map((plan) => {
              const isCurrentPlan =
                plan.id !== "free" && currentSubscription?.plan_details?.id === plan.id;
              const isUpgrade =
                currentSubscription &&
                plan.monthly_price >
                  currentSubscription.plan_details.monthly_price;
              const isDowngrade =
                currentSubscription &&
                plan.monthly_price <
                  currentSubscription.plan_details.monthly_price;
              const isFeatured = plan.name === "pro";
              const isFree = plan.is_trial_plan && isPerTruckModel;
              const perTruckPrice = PER_TRUCK_PRICES_USD[plan.name];

              return (
                <div
                  key={plan.id}
                  className={`spp-card${isFeatured ? " spp-card--featured" : ""}${isCurrentPlan ? " spp-card--current" : ""}${isFree ? " spp-card--free" : ""}`}
                >
                  {isFree && (
                    <div className="spp-card-badge spp-card-badge--free">
                      Спробуйте безкоштовно
                    </div>
                  )}
                  {isFeatured && (
                    <div className="spp-card-badge spp-card-badge--featured">
                      <FaCrown /> Найпопулярніший
                    </div>
                  )}
                  {isCurrentPlan && !isFeatured && (
                    <div className="spp-card-badge spp-card-badge--current">
                      Поточний план
                    </div>
                  )}

                  <div className="spp-card-header">
                    <h3>
                      {plan.display_name}
                      {plan.is_trial_plan && !isPerTruckModel && (
                        <span className="spp-trial-badge">БЕЗКОШТОВНО</span>
                      )}
                    </h3>

                    {isPerTruckModel && plan.is_trial_plan ? (
                      <div className="spp-price spp-price--per-truck">
                        <div className="spp-price-row">
                          <span className="spp-price-amount">0</span>
                          <span className="spp-price-period">/ {plan.trial_duration_days} днів</span>
                        </div>
                        <div className="spp-price-total">
                          До <strong>{plan.truck_limit} вантажівок</strong> включно
                        </div>
                      </div>
                    ) : isPerTruckModel && perTruckPrice !== undefined ? (
                      <div className="spp-price spp-price--per-truck">
                        <div className="spp-price-row">
                          <span className="spp-price-amount">${perTruckPrice}</span>
                          <span className="spp-price-period">/вант./міс</span>
                        </div>
                        <div className="spp-price-total">
                          = <strong>${perTruckPrice * truckCount}</strong>/міс за {truckCount} вант.
                        </div>
                      </div>
                    ) : (
                      <div
                        className={`spp-price${plan.is_trial_plan ? " spp-price--trial" : ""}`}
                      >
                        {plan.is_trial_plan ? (
                          <>
                            <span className="spp-price-amount">0</span>
                            <span className="spp-price-period">
                              грн / {plan.trial_duration_days} днів
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="spp-price-amount">
                              {getCurrentPlanPrice(plan)}
                            </span>
                            <span className="spp-price-period">₴/міс</span>
                          </>
                        )}
                      </div>
                    )}

                    {!isPerTruckModel && selectedBilling === "yearly" && !plan.is_trial_plan && (
                      <div className="spp-yearly-total">
                        Оплата щорічно:{" "}
                        {Math.round(plan.yearly_price)
                          .toString()
                          .replace(/\B(?=(\d{3})+(?!\d))/g, " ")}{" "}
                        грн
                      </div>
                    )}

                    <p className="spp-plan-desc">
                      {(isPerTruckModel && PER_TRUCK_DESCRIPTIONS[plan.name]) || plan.description}
                    </p>
                  </div>

                  <div className="spp-card-features">
                    {!isPerTruckModel && (
                      <div className="spp-truck-limit">
                        <FaTruck />
                        <strong>
                          {plan.truck_limit === -1
                            ? "Необмежено вантажівок"
                            : `${plan.truck_limit} вантажівок`}
                        </strong>
                      </div>
                    )}
                    <ul className="spp-features-list">
                      {plan.features.map((feature, i) => (
                        <li key={i}>
                          <FaCheck className="spp-check" />
                          {FEATURE_LABELS[feature] || feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    className={`spp-plan-btn${isFeatured ? " spp-plan-btn--featured" : ""}${isFree ? " spp-plan-btn--free" : ""}${isCurrentPlan ? " spp-plan-btn--current" : ""}`}
                    onClick={() => isFree ? navigate("/register") : handleChoosePlan(plan)}
                    disabled={isCurrentPlan || processingPlan === plan.id}
                  >
                    {processingPlan === plan.id ? (
                      <>
                        <FaSpinner className="spp-spinning" /> Обробка...
                      </>
                    ) : isFree ? (
                      "Почати безкоштовно"
                    ) : isCurrentPlan ? (
                      "Поточний план"
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
        </div>
      </section>

      {/* ── Comparison table ── */}
      <section className="spp-comparison-section">
        <div className="spp-container">
          <div className="spp-section-header">
            <h2>
              Детальне <span>порівняння планів</span>
            </h2>
            <p>Повний перелік можливостей кожного тарифного плану</p>
          </div>

          <div className="spp-table-wrap">
            <table className="spp-table">
              <thead>
                <tr>
                  <th className="spp-th--feature">Функція</th>
                  {visiblePlans.map((plan) => (
                    <th
                      key={plan.id}
                      className={plan.name === "pro" ? "spp-th--featured" : ""}
                    >
                      {plan.display_name}
                      {isPerTruckModel && PER_TRUCK_PRICES_USD[plan.name] !== undefined && (
                        <span className="spp-th-price">
                          ${PER_TRUCK_PRICES_USD[plan.name]}/вант.
                        </span>
                      )}
                      {plan.name === "pro" && (
                        <span className="spp-th-crown">
                          <FaCrown />
                        </span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="spp-tr--trucks">
                  <td className="spp-td--label">Ліміт вантажівок</td>
                  {visiblePlans.map((plan) => (
                    <td key={plan.id} className="spp-td--value">
                      <span className="spp-truck-count">
                        {isPerTruckModel ? "∞" : plan.truck_limit === -1 ? "∞" : plan.truck_limit}
                      </span>
                    </td>
                  ))}
                </tr>
                {COMPARISON_FEATURES.map((feature) => (
                  <tr key={feature}>
                    <td className="spp-td--label">
                      {FEATURE_LABELS[feature] || feature}
                    </td>
                    {visiblePlans.map((plan) => (
                      <td key={plan.id} className="spp-td--value">
                        {plan.features.includes(feature) ? (
                          <FaCheck className="spp-icon-check" />
                        ) : (
                          <FaTimes className="spp-icon-times" />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

    </div>
  );
}

export default SubscriptionPlansPage;
