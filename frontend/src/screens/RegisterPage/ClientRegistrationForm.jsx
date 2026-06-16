import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import toast from "react-hot-toast";
import axios from "axios";
import { FaTruck, FaCheck, FaCrown, FaSpinner, FaTimes } from "react-icons/fa";
import InputComponent from "../../globalComponents/InputComponent";
import MessageComponent from "../../components/MessageComponent/MessageComponent";
import { registerClient } from "../../actions/userActions";

import "./ClientRegistrationForm.scss";

const FEATURE_LABELS = {
  "Fleet Management":    "Управління автопарком",
  "Driver Management":   "Управління водіями",
  "Employee Management": "Управління персоналом",
  "Route Planner":       "Планування маршрутів",
  "Orders Management":   "Управління замовленнями",
  "Route Calculator":    "Калькулятор маршрутів",
  "Points Management":   "Управління точками",
  "Invoicing":           "Рахунки-фактури",
  "Customer Management": "Управління клієнтами",
  "Tasks Management":    "Управління завданнями",
  "Live Map":            "Карта в реальному часі",
  "Dashboard":           "Аналітика та Звіти",
  "System Administration": "Адміністрування",
  "External Platforms":  "Зовнішні платформи",
  "Basic Support":       "Базова підтримка",
};

const ClientRegistrationForm = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [subscriptionPlans, setSubscriptionPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [edrpouStatus, setEdrpouStatus] = useState(null); // null | 'loading' | 'found' | 'not_found' | 'error'
  const [edrpouMessage, setEdrpouMessage] = useState("");
  const edrpouTimerRef = useRef(null);

  // Form data state
  const [formData, setFormData] = useState({
    // Client data
    clientName: "",
    companyNameEng: "",
    clientSlug: "",

    // Company data
    companyEmail: "",
    companyPhone: "",
    companyAddress: "",
    companyLegalAddress: "",
    companyVatNumber: "",

    // Admin user data
    username: "",
    email: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",

    // Subscription data
    subscriptionPlan: "trial",
    billingCycle: "monthly",
    pricingModel: import.meta.env.REACT_APP_PRICING_MODEL || "total",
  });

  // Load subscription plans on component mount
  useEffect(() => {
    const fetchSubscriptionPlans = async () => {
      setPlansLoading(true);
      try {
        const { data } = await axios.get("/api/subscriptions/plans/");
        setSubscriptionPlans(data);
      } catch (error) {
        console.error("Failed to load subscription plans:", error);
        toast.error("Не вдалося завантажити плани підписки");
      } finally {
        setPlansLoading(false);
      }
    };

    fetchSubscriptionPlans();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  // Ukrainian to Latin transliteration map
  const ukrainianToLatin = {
    а: "a",
    б: "b",
    в: "v",
    г: "h",
    ґ: "g",
    д: "d",
    е: "e",
    є: "ye",
    ж: "zh",
    з: "z",
    и: "y",
    і: "i",
    ї: "yi",
    й: "y",
    к: "k",
    л: "l",
    м: "m",
    н: "n",
    о: "o",
    п: "p",
    р: "r",
    с: "s",
    т: "t",
    у: "u",
    ф: "f",
    х: "kh",
    ц: "ts",
    ч: "ch",
    ш: "sh",
    щ: "shch",
    ь: "",
    ю: "yu",
    я: "ya",
    А: "A",
    Б: "B",
    В: "V",
    Г: "H",
    Ґ: "G",
    Д: "D",
    Е: "E",
    Є: "Ye",
    Ж: "Zh",
    З: "Z",
    И: "Y",
    І: "I",
    Ї: "Yi",
    Й: "Y",
    К: "K",
    Л: "L",
    М: "M",
    Н: "N",
    О: "O",
    П: "P",
    Р: "R",
    С: "S",
    Т: "T",
    У: "U",
    Ф: "F",
    Х: "Kh",
    Ц: "Ts",
    Ч: "Ch",
    Ш: "Sh",
    Щ: "Shch",
    Ь: "",
    Ю: "Yu",
    Я: "Ya",
  };

  // Function to transliterate Ukrainian text to Latin
  const transliterateToLatin = (text) => {
    return text
      .split("")
      .map((char) => ukrainianToLatin[char] || char)
      .join("");
  };

  // Slug generation helper
  const generateSlug = (text) => {
    const transliterated = transliterateToLatin(text);
    return transliterated
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "")
      .trim();
  };

  // Auto-generate slug from English company name
  const handleCompanyNameEngChange = (e) => {
    const name = e.target.value;
    const slug = generateSlug(name);
    setFormData((prev) => ({ ...prev, companyNameEng: name, clientSlug: slug }));
  };

  // ЄДРПОУ field change — debounce lookup after 8+ digits
  const handleEdrpouChange = (e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 10);
    setFormData((prev) => ({ ...prev, companyVatNumber: value }));
    setEdrpouStatus(null);
    setEdrpouMessage("");

    if (edrpouTimerRef.current) clearTimeout(edrpouTimerRef.current);

    if (value.length === 8 || value.length === 10) {
      setEdrpouStatus("loading");
      edrpouTimerRef.current = setTimeout(() => fetchCompanyByEdrpou(value), 600);
    }
  };

  const fetchCompanyByEdrpou = async (edrpou) => {
    try {
      const { data } = await axios.get(`/api/youscore/register/company-lookup/${edrpou}`);
      setEdrpouStatus("found");

      const engName = data.nameEn || "";
      setFormData((prev) => ({
        ...prev,
        clientName:          data.name      || prev.clientName,
        companyNameEng:      engName        || prev.companyNameEng,
        clientSlug:          engName ? generateSlug(engName) : prev.clientSlug,
        companyLegalAddress: data.address   || prev.companyLegalAddress,
        companyPhone:        data.phone     || prev.companyPhone,
        companyEmail:        data.email     || prev.companyEmail,
      }));
    } catch (err) {
      const data = err.response?.data;
      if (err.response?.status === 404) {
        setEdrpouStatus("not_found");
        setEdrpouMessage("Компанію не знайдено");
      } else {
        setEdrpouStatus("error");
        setEdrpouMessage(data?.user_message || "Помилка пошуку");
      }
    }
  };

  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      if (!formData.clientName.trim()) {
        newErrors.clientName = "Назва компанії (UA) обов'язкова";
      }
      if (
        formData.companyEmail &&
        !/\S+@\S+\.\S+/.test(formData.companyEmail)
      ) {
        newErrors.companyEmail = "Введіть дійсну адресу електронної пошти";
      }
    }

    if (step === 2) {
      // Validate admin user information
      if (!formData.username.trim()) {
        newErrors.username = "Ім'я користувача обов'язкове";
      }
      if (!formData.email.trim()) {
        newErrors.email = "Електронна пошта обов'язкова";
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = "Введіть дійсну адресу електронної пошти";
      }
      if (!formData.firstName.trim()) {
        newErrors.firstName = "Ім'я обов'язкове";
      }
      if (!formData.lastName.trim()) {
        newErrors.lastName = "Прізвище обов'язкове";
      }
      if (!formData.password) {
        newErrors.password = "Пароль обов'язковий";
      } else if (formData.password.length < 8) {
        newErrors.password = "Пароль повинен містити принаймні 8 символів";
      }
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = "Підтвердіть свій пароль";
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Паролі не співпадають";
      }
    }

    if (step === 3) {
      // Validate subscription plan selection
      if (!formData.subscriptionPlan) {
        newErrors.subscriptionPlan = "Оберіть план підписки";
      }
      if (!formData.billingCycle) {
        newErrors.billingCycle = "Оберіть цикл оплати";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    console.log("handleNext called, currentStep:", currentStep);

    // Prevent advancing beyond step 3
    if (currentStep >= 3) {
      console.log("Already at step 3, not advancing");
      return;
    }

    setHasAttemptedSubmit(true);
    if (validateStep(currentStep)) {
      console.log("Validation passed, moving to next step");
      setCurrentStep((prev) => Math.min(prev + 1, 3));
      setHasAttemptedSubmit(false); // Reset for next step
      setErrors({}); // Clear all errors when moving to next step
    } else {
      console.log("Validation failed for step:", currentStep);
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => prev - 1);
    setHasAttemptedSubmit(false); // Reset validation state when going back
    setErrors({}); // Clear errors when going back
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("handleSubmit called, currentStep:", currentStep);

    // Only allow submission on step 3
    if (currentStep !== 3) {
      console.log("Not on step 3, preventing submission");
      return;
    }

    console.log("Submitting registration form");
    setHasAttemptedSubmit(true);
    if (!validateStep(3)) {
      console.log("Step 3 validation failed");
      return;
    }

    setIsLoading(true);

    try {
      const slug = formData.clientSlug || generateSlug(formData.companyNameEng || formData.clientName);
      const registrationData = {
        client: {
          name: formData.clientName,
          slug,
        },
        company: {
          name: formData.clientName,
          name_en: formData.companyNameEng,
          email: formData.companyEmail,
          phone: formData.companyPhone,
          address: formData.companyAddress,
          legal_address: formData.companyLegalAddress,
          vat_number: formData.companyVatNumber,
        },
        admin_user: {
          username: formData.username,
          email: formData.email,
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone_number: formData.phoneNumber,
          password1: formData.password,
          password2: formData.confirmPassword,
        },
        subscription: {
          plan: formData.subscriptionPlan,
          billing_cycle: formData.billingCycle,
          pricing_model: formData.pricingModel,
        },
      };

      const result = await dispatch(registerClient(registrationData));

      if (result.success) {
        // Don't auto-login for pending approvals
        if (result.data.approval_status === "pending") {
          // Store registration info for the pending page
          const registrationInfo = {
            client_name: result.data.client_name,
            client_slug: result.data.client_slug,
            admin_email: result.data.admin_email,
            registration_date: new Date().toISOString(),
          };

          localStorage.setItem(
            "pendingRegistration",
            JSON.stringify(registrationInfo),
          );

          toast.success(
            "Реєстрацію подано успішно! Ваш обліковий запис очікує схвалення. Ви отримаєте електронний лист після схвалення.",
            {
              position: "top-right",
              duration: 6000,
            },
          );

          navigate("/registration-pending", {
            state: { registrationData: registrationInfo },
          });
        } else {
          // Handle immediate approval (if implemented)
          toast.success("Реєстрація успішна! Ласкаво просимо до TMS SOVTES!", {
            position: "top-right",
            duration: 4000,
          });
          navigate("/main");
        }
      } else {
        // Handle server validation errors
        if (result.errors) {
          setErrors(result.errors);
          toast.error("Виправте помилки та спробуйте ще раз", {
            position: "top-right",
          });
        } else {
          toast.error(
            result.message || "Реєстрація не вдалась. Спробуйте ще раз.",
            {
              position: "top-right",
            },
          );
        }
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast.error("Реєстрація не вдалась. Спробуйте ще раз.", {
        position: "top-right",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="step-indicator">
      <div className={`step ${currentStep >= 1 ? "active" : ""}`}>
        <div className="step-number">1</div>
        <div className="step-label">Інформація про компанію</div>
      </div>
      <div className="step-connector"></div>
      <div className={`step ${currentStep >= 2 ? "active" : ""}`}>
        <div className="step-number">2</div>
        <div className="step-label">Обліковий запис адміністратора</div>
      </div>
      <div className="step-connector"></div>
      <div className={`step ${currentStep >= 3 ? "active" : ""}`}>
        <div className="step-number">3</div>
        <div className="step-label">План підписки</div>
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="registration-step">
      <h3>Інформація про компанію</h3>
      <p className="step-description">
        Введіть ЄДРПОУ — дані компанії заповняться автоматично
      </p>

      {/* Row 1: ЄДРПОУ — full width */}
      <div className="form-row form-row--full">
        <div className="form-group edrpou-group">
          <InputComponent
            label="ЄДРПОУ"
            name="companyVatNumber"
            type="text"
            placeholder="Введіть 8-значний код ЄДРПОУ"
            value={formData.companyVatNumber}
            onChange={handleEdrpouChange}
            error={hasAttemptedSubmit ? errors.companyVatNumber : ""}
          />
          {edrpouStatus === "loading" && (
            <span className="edrpou-status edrpou-status--loading">
              <FaSpinner className="edrpou-spinner" /> Пошук компанії...
            </span>
          )}
          {edrpouStatus === "found" && (
            <span className="edrpou-status edrpou-status--found">
              <FaCheck /> Компанію знайдено
            </span>
          )}
          {(edrpouStatus === "not_found" || edrpouStatus === "error") && (
            <span className="edrpou-status edrpou-status--error">
              <FaTimes /> {edrpouMessage}
            </span>
          )}
        </div>
      </div>

      {/* Row 2: Company name ENG | Company name UA */}
      <div className="form-row">
        <div className="form-group">
          <InputComponent
            label="Назва Компанії ENG"
            name="companyNameEng"
            type="text"
            placeholder="Company name in English"
            value={formData.companyNameEng}
            onChange={handleCompanyNameEngChange}
            error={hasAttemptedSubmit ? errors.companyNameEng : ""}
          />
        </div>
        <div className="form-group">
          <InputComponent
            label="Назва Компанії UA *"
            name="clientName"
            type="text"
            placeholder="Назва вашої компанії"
            value={formData.clientName}
            onChange={handleInputChange}
            error={hasAttemptedSubmit ? errors.clientName : ""}
          />
        </div>
      </div>

      {/* Row 3: Email | Phone */}
      <div className="form-row">
        <div className="form-group">
          <InputComponent
            label="Електронна Пошта"
            name="companyEmail"
            type="email"
            placeholder="info@trans.com.ua"
            value={formData.companyEmail}
            onChange={handleInputChange}
            error={hasAttemptedSubmit ? errors.companyEmail : ""}
          />
        </div>
        <div className="form-group">
          <InputComponent
            label="Телефон Компанії"
            name="companyPhone"
            type="tel"
            placeholder="+380 (99) 123-45-67"
            value={formData.companyPhone}
            onChange={handleInputChange}
            error={hasAttemptedSubmit ? errors.companyPhone : ""}
          />
        </div>
      </div>

      {/* Row 4: Legal address — full width */}
      <div className="form-row form-row--full">
        <div className="form-group">
          <InputComponent
            label="Юридична Адреса"
            name="companyLegalAddress"
            type="textarea"
            placeholder="Юридична адреса компанії"
            value={formData.companyLegalAddress}
            onChange={handleInputChange}
            error={hasAttemptedSubmit ? errors.companyLegalAddress : ""}
            rows={3}
          />
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="registration-step">
      <h3>Обліковий запис адміністратора</h3>
      <p className="step-description">
        Створіть свій обліковий запис адміністратора для управління компанією
      </p>

      <div className="form-row">
        <div className="form-group">
          <InputComponent
            label="Ім'я Користувача *"
            name="username"
            type="text"
            placeholder="ім'я_користувача"
            value={formData.username}
            onChange={handleInputChange}
            error={hasAttemptedSubmit ? errors.username : ""}
          />
        </div>
        <div className="form-group">
          <InputComponent
            label="Електронна пошта *"
            name="email"
            type="email"
            placeholder="info@trans.com.ua"
            value={formData.email}
            onChange={handleInputChange}
            error={hasAttemptedSubmit ? errors.email : ""}
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <InputComponent
            label="Ім'я *"
            name="firstName"
            type="text"
            placeholder="Іван"
            value={formData.firstName}
            onChange={handleInputChange}
            error={hasAttemptedSubmit ? errors.firstName : ""}
          />
        </div>
        <div className="form-group">
          <InputComponent
            label="Прізвище *"
            name="lastName"
            type="text"
            placeholder="Іваненко"
            value={formData.lastName}
            onChange={handleInputChange}
            error={hasAttemptedSubmit ? errors.lastName : ""}
          />
        </div>
        <div className="form-group">
          <InputComponent
            label="Номер Телефону"
            name="phoneNumber"
            type="tel"
            placeholder="+380 (99) 123-45-67"
            value={formData.phoneNumber}
            onChange={handleInputChange}
            error={hasAttemptedSubmit ? errors.phoneNumber : ""}
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <InputComponent
            label="Пароль *"
            name="password"
            type="password"
            placeholder="Введіть надійний пароль"
            value={formData.password}
            onChange={handleInputChange}
            error={hasAttemptedSubmit ? errors.password : ""}
          />
        </div>
        <div className="form-group">
          <InputComponent
            label="Підтвердити Пароль *"
            name="confirmPassword"
            type="password"
            placeholder="Підтвердіть свій пароль"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            error={hasAttemptedSubmit ? errors.confirmPassword : ""}
          />
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="subscription-step">
      <div className="subscription-header">
        <h3>Оберіть ваш план підписки</h3>
        <p>Оберіть план, який найкраще відповідає потребам вашого бізнесу</p>
      </div>

      {plansLoading ? (
        <div className="loading-plans">
          <p>Завантаження планів підписки...</p>
        </div>
      ) : (
        <>
          <div className="billing-toggle">
            <button
              className={formData.billingCycle === "monthly" ? "active" : ""}
              onClick={() =>
                handleInputChange({ target: { name: "billingCycle", value: "monthly" } })
              }
            >
              Щомісяця
            </button>
            <button
              className={formData.billingCycle === "yearly" ? "active" : ""}
              onClick={() =>
                handleInputChange({ target: { name: "billingCycle", value: "yearly" } })
              }
            >
              Щорічно
              <span className="discount-badge">Економія 17%</span>
            </button>
          </div>

          <div className="subscription-plans">
            {subscriptionPlans.map((plan) => (
              <div
                key={plan.name}
                className={`plan-card${formData.subscriptionPlan === plan.name ? " selected" : ""}${plan.name === "pro" ? " featured" : ""}`}
                onClick={() =>
                  handleInputChange({ target: { name: "subscriptionPlan", value: plan.name } })
                }
              >
                {plan.name === "pro" && (
                  <div className="plan-card-badge">
                    <FaCrown /> Найпопулярніший
                  </div>
                )}

                <div className="plan-header">
                  <h4>{plan.display_name}</h4>
                  <div className="plan-price">
                    {plan.is_trial_plan ? (
                      <div className="trial-price">
                        <span className="price-amount">0</span>
                        <span className="price-period">
                          грн/{plan.trial_duration_days}д
                        </span>
                      </div>
                    ) : (
                      <>
                        <span className="price-amount">
                          {(formData.billingCycle === "yearly"
                            ? Math.round(plan.yearly_price / 12)
                            : Math.round(plan.monthly_price)
                          ).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")}
                        </span>
                        <span className="price-period">₴/міс</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="plan-features">
                  <div className="plan-truck-limit">
                    <FaTruck />
                    <strong>
                      {plan.truck_limit === -1 ? "Необмежено" : plan.truck_limit}{" "}
                      вантажівок
                    </strong>
                  </div>
                  <ul className="plan-features-list">
                    {plan.features.slice(0, 6).map((feature, idx) => (
                      <li key={idx}>
                        <FaCheck className="plan-check" />
                        {FEATURE_LABELS[feature] || feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          {hasAttemptedSubmit && errors.subscriptionPlan && (
            <div className="error-message">{errors.subscriptionPlan}</div>
          )}
        </>
      )}
    </div>
  );

  return (
    <div className="client-registration-form">
      <div className="registration-header">
        <button type="button" className="reg-logo" onClick={() => navigate("/")}>
          <FaTruck className="reg-logo-icon" />
          TMS SOVTES
        </button>
        <h2>Приєднуйтесь до <span>TMS SOVTES</span></h2>
        <p>Платформа управління транспортом</p>
      </div>

      {renderStepIndicator()}

      <form
        onSubmit={handleSubmit}
        onKeyDown={(e) => {
          // Prevent form submission on Enter key if not on step 3
          if (e.key === "Enter" && currentStep !== 3) {
            e.preventDefault();
            handleNext();
          }
        }}
      >
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}

        <div className="form-actions">
          <div className="form-actions-left">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handlePrevious}
                className="btn btn-secondary"
                disabled={isLoading}
              >
                Назад
              </button>
            )}
          </div>

          <div className="form-actions-right">
            {currentStep < 3 ? (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    handleNext();
                  }}
                  className="btn btn-primary"
                  disabled={isLoading}
                >
                  Далі
                </button>
                <div className="login-link">
                  Вже маєте обліковий запис?{" "}
                  <button
                    type="button"
                    onClick={() => navigate("/login")}
                    className="link-button"
                  >
                    Увійти тут
                  </button>
                </div>
              </>
            ) : (
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isLoading}
              >
                {isLoading
                  ? "Створення облікового запису..."
                  : "Зареєструвати компанію"}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default ClientRegistrationForm;
