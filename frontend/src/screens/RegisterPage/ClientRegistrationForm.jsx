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
    subscriptionPlan: "base", // Default to base plan
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
        toast.error("Failed to load subscription plans");
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
        newErrors.clientName = "Company name is required";
      }
      if (!formData.clientSlug.trim()) {
        newErrors.clientSlug = "Company identifier is required";
      } else if (!/^[a-z0-9-]+$/.test(formData.clientSlug)) {
        newErrors.clientSlug =
          "Only lowercase letters, numbers, and hyphens allowed";
      }
      if (
        formData.companyEmail &&
        !/\S+@\S+\.\S+/.test(formData.companyEmail)
      ) {
        newErrors.companyEmail = "Please enter a valid email address";
      }
    }

    if (step === 2) {
      // Validate admin user information
      if (!formData.username.trim()) {
        newErrors.username = "Username is required";
      }
      if (!formData.email.trim()) {
        newErrors.email = "Email is required";
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = "Please enter a valid email address";
      }
      if (!formData.firstName.trim()) {
        newErrors.firstName = "First name is required";
      }
      if (!formData.lastName.trim()) {
        newErrors.lastName = "Last name is required";
      }
      if (!formData.password) {
        newErrors.password = "Password is required";
      } else if (formData.password.length < 8) {
        newErrors.password = "Password must be at least 8 characters long";
      }
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = "Please confirm your password";
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
    }

    if (step === 3) {
      // Validate subscription plan selection
      if (!formData.subscriptionPlan) {
        newErrors.subscriptionPlan = "Please select a subscription plan";
      }
      if (!formData.billingCycle) {
        newErrors.billingCycle = "Please select a billing cycle";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    setHasAttemptedSubmit(true);
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => prev + 1);
      setHasAttemptedSubmit(false); // Reset for next step
      setErrors({}); // Clear all errors when moving to next step
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => prev - 1);
    setHasAttemptedSubmit(false); // Reset validation state when going back
    setErrors({}); // Clear errors when going back
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setHasAttemptedSubmit(true);
    if (!validateStep(3)) {
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
          toast.success(
            "Registration submitted successfully! Your account is pending approval. You'll receive an email once approved.",
            {
              position: "top-right",
              duration: 6000,
            }
          );
          navigate("/registration-pending");
        } else {
          // Handle immediate approval (if implemented)
          toast.success("Registration successful! Welcome to Malog!", {
            position: "top-right",
            duration: 4000,
          });
          navigate("/main");
        }
      } else {
        // Handle server validation errors
        if (result.errors) {
          setErrors(result.errors);
          toast.error("Please fix the errors and try again", {
            position: "top-right",
          });
        } else {
          toast.error(
            result.message || "Registration failed. Please try again.",
            {
              position: "top-right",
            }
          );
        }
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast.error("Registration failed. Please try again.", {
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
        <div className="step-label">Company Info</div>
      </div>
      <div className="step-connector"></div>
      <div className={`step ${currentStep >= 2 ? "active" : ""}`}>
        <div className="step-number">2</div>
        <div className="step-label">Admin Account</div>
      </div>
      <div className="step-connector"></div>
      <div className={`step ${currentStep >= 3 ? "active" : ""}`}>
        <div className="step-number">3</div>
        <div className="step-label">Subscription Plan</div>
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="registration-step">
      <h3>Company Information</h3>
      <p className="step-description">
        Let's start by setting up your company profile
      </p>

      <div className="form-row">
        <div className="form-group">
          <InputComponent
            label="Company Name *"
            name="clientName"
            type="text"
            placeholder="Your Company Name"
            value={formData.clientName}
            onChange={handleClientNameChange}
            error={hasAttemptedSubmit ? errors.clientName : ""}
          />
        </div>
        <div className="form-group">
          <InputComponent
            label="Company Identifier *"
            name="clientSlug"
            type="text"
            placeholder="company-identifier"
            value={formData.clientSlug}
            onChange={handleInputChange}
            error={hasAttemptedSubmit ? errors.clientSlug : ""}
            helperText="Unique identifier (lowercase, hyphens only)"
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <InputComponent
            label="Company Email"
            name="companyEmail"
            type="email"
            placeholder="company@example.com"
            value={formData.companyEmail}
            onChange={handleInputChange}
            error={hasAttemptedSubmit ? errors.companyEmail : ""}
          />
        </div>
        <div className="form-group">
          <InputComponent
            label="Company Phone"
            name="companyPhone"
            type="tel"
            placeholder="+1 (555) 123-4567"
            value={formData.companyPhone}
            onChange={handleInputChange}
            error={hasAttemptedSubmit ? errors.companyPhone : ""}
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <InputComponent
            label="VAT Number"
            name="companyVatNumber"
            type="text"
            placeholder="Enter VAT number"
            value={formData.companyVatNumber}
            onChange={handleInputChange}
            error={hasAttemptedSubmit ? errors.companyVatNumber : ""}
            helperText="Optional - Your company's VAT registration number"
          />
        </div>
        <div className="form-group">
          <InputComponent
            label="Company Address"
            name="companyAddress"
            type="textarea"
            placeholder="Enter your company address"
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
      <h3>Admin Account</h3>
      <p className="step-description">
        Create your admin account to manage your company
      </p>

      <div className="form-row">
        <div className="form-group">
          <InputComponent
            label="Username *"
            name="username"
            type="text"
            placeholder="admin_username"
            value={formData.username}
            onChange={handleInputChange}
            error={hasAttemptedSubmit ? errors.username : ""}
          />
        </div>
        <div className="form-group">
          <InputComponent
            label="Email Address *"
            name="email"
            type="email"
            placeholder="admin@company.com"
            value={formData.email}
            onChange={handleInputChange}
            error={hasAttemptedSubmit ? errors.email : ""}
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <InputComponent
            label="First Name *"
            name="firstName"
            type="text"
            placeholder="John"
            value={formData.firstName}
            onChange={handleInputChange}
            error={hasAttemptedSubmit ? errors.firstName : ""}
          />
        </div>
        <div className="form-group">
          <InputComponent
            label="Last Name *"
            name="lastName"
            type="text"
            placeholder="Doe"
            value={formData.lastName}
            onChange={handleInputChange}
            error={hasAttemptedSubmit ? errors.lastName : ""}
          />
        </div>
        <div className="form-group">
          <InputComponent
            label="Phone Number"
            name="phoneNumber"
            type="tel"
            placeholder="+1 (555) 123-4567"
            value={formData.phoneNumber}
            onChange={handleInputChange}
            error={hasAttemptedSubmit ? errors.phoneNumber : ""}
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <InputComponent
            label="Password *"
            name="password"
            type="password"
            placeholder="Enter secure password"
            value={formData.password}
            onChange={handleInputChange}
            error={hasAttemptedSubmit ? errors.password : ""}
          />
        </div>
        <div className="form-group">
          <InputComponent
            label="Confirm Password *"
            name="confirmPassword"
            type="password"
            placeholder="Confirm your password"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            error={hasAttemptedSubmit ? errors.confirmPassword : ""}
          />
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="step-content">
      <h3>Choose Your Subscription Plan</h3>
      <p>Select the plan that best fits your business needs</p>

      {plansLoading ? (
        <div className="loading-plans">
          <p>Loading subscription plans...</p>
        </div>
      ) : (
        <>
          <div className="billing-toggle">
            <div className="toggle-group">
              <label
                className={formData.billingCycle === "monthly" ? "active" : ""}
              >
                <input
                  type="radio"
                  name="billingCycle"
                  value="monthly"
                  checked={formData.billingCycle === "monthly"}
                  onChange={handleInputChange}
                />
                Monthly
              </label>
              <label
                className={formData.billingCycle === "yearly" ? "active" : ""}
              >
                <input
                  type="radio"
                  name="billingCycle"
                  value="yearly"
                  checked={formData.billingCycle === "yearly"}
                  onChange={handleInputChange}
                />
                Yearly (Save 17%)
              </label>
            </div>
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
                  <h4>{plan.display_name}</h4>
                  <div className="plan-price">
                    <span className="price">
                      $
                      {formData.billingCycle === "yearly"
                        ? plan.yearly_price
                        : plan.monthly_price}
                    </span>
                    <span className="period">
                      /{formData.billingCycle === "yearly" ? "year" : "month"}
                    </span>
                  </div>
                </div>

                <div className="plan-features">
                  <div className="truck-limit">
                    <strong>
                      {plan.truck_limit === -1
                        ? "Unlimited trucks"
                        : `Up to ${plan.truck_limit} trucks`}
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
        <h2>Join Malog</h2>
        <p>Logistics Management Platform</p>
      </div>

      {renderStepIndicator()}

      <form onSubmit={handleSubmit}>
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
                Previous
              </button>
            )}
          </div>

          <div className="form-actions-right">
            {currentStep < 3 ? (
              <>
                <button
                  type="button"
                  onClick={handleNext}
                  className="btn btn-primary"
                >
                  Next
                </button>
                <div className="login-link">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => navigate("/login")}
                    className="link-button"
                  >
                    Login here
                  </button>
                </div>
              </>
            ) : (
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isLoading}
              >
                {isLoading ? "Creating Account..." : "Register Company"}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default ClientRegistrationForm;
