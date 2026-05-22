import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import toast from "react-hot-toast";
import axios from "axios";
import InputComponent from "../../globalComponents/InputComponent";
import MessageComponent from "../../components/MessageComponent/MessageComponent";
import { registerClient } from "../../actions/userActions";

import "./ClientRegistrationForm.scss";

const ClientRegistrationForm = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [subscriptionPlans, setSubscriptionPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(false);

  // Form data state
  const [formData, setFormData] = useState({
    // Client data
    clientName: "",
    clientSlug: "",

    // Company data
    companyEmail: "",
    companyPhone: "",
    companyAddress: "",
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
    subscriptionPlan: "trial", // Default to trial plan
    billingCycle: "monthly", // Default to monthly
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

  // Auto-generate slug from company name (supports Ukrainian)
  const handleClientNameChange = (e) => {
    const name = e.target.value;

    // First transliterate Ukrainian to Latin
    const transliterated = transliterateToLatin(name);

    // Then create slug from transliterated text
    const slug = transliterated
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .replace(/-+/g, "-") // Replace multiple hyphens with single
      .replace(/^-+|-+$/g, "") // Remove leading/trailing hyphens
      .trim();

    setFormData((prev) => ({
      ...prev,
      clientName: name,
      clientSlug: slug,
    }));
  };

  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      // Validate company information
      if (!formData.clientName.trim()) {
        newErrors.clientName = "Назва компанії обов'язкова";
      }
      if (!formData.clientSlug.trim()) {
        newErrors.clientSlug = "Ідентифікатор компанії обов'язковий";
      } else if (!/^[a-z0-9-]+$/.test(formData.clientSlug)) {
        newErrors.clientSlug = "Дозволені лише малі літери, цифри та дефіси";
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
      const registrationData = {
        client: {
          name: formData.clientName,
          slug: formData.clientSlug,
        },
        company: {
          name: formData.clientName, // Use client name as initial company name
          email: formData.companyEmail,
          phone: formData.companyPhone,
          address: formData.companyAddress,
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
        Почнемо з налаштування профілю вашої компанії
      </p>

      <div className="form-row">
        <div className="form-group">
          <InputComponent
            label="Назва Компанії *"
            name="clientName"
            type="text"
            placeholder="Назва вашої компанії"
            value={formData.clientName}
            onChange={handleClientNameChange}
            error={hasAttemptedSubmit ? errors.clientName : ""}
          />
        </div>
        <div className="form-group">
          <InputComponent
            label="Ідентифікатор Компанії *"
            name="clientSlug"
            type="text"
            placeholder="ідентифікатор-компанії"
            value={formData.clientSlug}
            onChange={handleInputChange}
            error={hasAttemptedSubmit ? errors.clientSlug : ""}
            helperText="Ідентифікатор (формується автоматично з назви)"
          />
        </div>
      </div>

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

      <div className="form-row">
        <div className="form-group">
          <InputComponent
            label="ЄДРПОУ"
            name="companyVatNumber"
            type="text"
            placeholder="Введіть номер ЄДРПОУ"
            value={formData.companyVatNumber}
            onChange={handleInputChange}
            error={hasAttemptedSubmit ? errors.companyVatNumber : ""}
            // helperText="Опціонально - код ЄДРПОУ вашої компанії"
          />
        </div>
        <div className="form-group">
          <InputComponent
            label="Адреса Компанії"
            name="companyAddress"
            type="textarea"
            placeholder="Введіть адресу вашої компанії"
            value={formData.companyAddress}
            onChange={handleInputChange}
            error={hasAttemptedSubmit ? errors.companyAddress : ""}
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
    <div className="step-content subscription-step">
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
                handleInputChange({
                  target: { name: "billingCycle", value: "monthly" },
                })
              }
            >
              Щомісяця
            </button>
            <button
              className={formData.billingCycle === "yearly" ? "active" : ""}
              onClick={() =>
                handleInputChange({
                  target: { name: "billingCycle", value: "yearly" },
                })
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
                className={`plan-card ${
                  formData.subscriptionPlan === plan.name ? "selected" : ""
                }`}
                onClick={() =>
                  handleInputChange({
                    target: { name: "subscriptionPlan", value: plan.name },
                  })
                }
              >
                <div className="plan-header">
                  <h4>
                    {plan.display_name}
                    {plan.is_trial_plan && (
                      <span className="trial-badge">БЕЗКОШТОВНО</span>
                    )}
                  </h4>
                  <div className="plan-price">
                    {plan.is_trial_plan ? (
                      <div className="trial-price">
                        <span className="price">0 грн</span>
                        <span className="period">
                          /{plan.trial_duration_days} днів
                        </span>
                      </div>
                    ) : (
                      <>
                        <span className="price">
                          $
                          {formData.billingCycle === "yearly"
                            ? plan.yearly_price
                            : plan.monthly_price}
                        </span>
                        <span className="period">
                          /
                          {formData.billingCycle === "yearly"
                            ? "рік"
                            : "місяць"}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="plan-features">
                  <div className="truck-limit">
                    <strong>
                      {plan.truck_limit === -1
                        ? "Необмежено вантажівок"
                        : `До ${plan.truck_limit} вантажівок`}
                    </strong>
                  </div>

                  <ul className="features-list">
                    {plan.features.map((feature, index) => (
                      <li key={index}>✓ {feature}</li>
                    ))}
                  </ul>
                </div>

                <div className="plan-description">
                  <p>{plan.description}</p>
                  {plan.is_trial_plan && (
                    <div className="trial-benefits">
                      <p className="trial-highlight">
                        🎉 Спробуйте всі функції безкоштовно протягом{" "}
                        {plan.trial_duration_days} днів!
                      </p>
                      <p className="trial-note">
                        Жодних зобов'язань • Легке оновлення • Скасування в
                        будь-який час
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {hasAttemptedSubmit && errors.subscriptionPlan && (
            <div className="error-message">{errors.subscriptionPlan}</div>
          )}
          {hasAttemptedSubmit && errors.billingCycle && (
            <div className="error-message">{errors.billingCycle}</div>
          )}
        </>
      )}
    </div>
  );

  return (
    <div className="client-registration-form">
      <div className="registration-header">
        <h2>Приєднуйтесь до TMS SOVTES</h2>
        <p>Платформа управління автопарком</p>
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
