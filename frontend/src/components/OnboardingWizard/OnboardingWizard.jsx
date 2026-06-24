import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  FaTruck,
  FaTrailer,
  FaUserTie,
  FaCheckCircle,
  FaArrowRight,
  FaRocket,
  FaCheck,
} from "react-icons/fa";
import "./OnboardingWizard.scss";

const OnboardingWizard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const userInfo = useSelector((state) => state.userLogin.userInfo);

  // Check if we're being redirected back from add truck or add driver pages
  const initialStep = location.state?.currentStep || 0;

  const [currentStep, setCurrentStep] = useState(initialStep);
  const [onboardingStatus, setOnboardingStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOnboardingStatus();
  }, []);

  // If we have an initial step from location state, use it
  useEffect(() => {
    if (location.state?.currentStep !== undefined) {
      setCurrentStep(location.state.currentStep);

      // Clear the step from location state after using it to prevent persistence
      if (history.replaceState) {
        const newState = { ...location.state };
        delete newState.currentStep;
        history.replaceState({ ...newState }, document.title);
      }
    }
  }, [location.state]);

  const fetchOnboardingStatus = async () => {
    try {
      const response = await fetch("/api/onboarding/status/", {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      setOnboardingStatus(data);
      setLoading(false);

      // Only determine current step if we don't already have one from location state
      if (initialStep === 0) {
        // Determine current step based on completed steps
        if (data.completed_steps.includes("trucks")) {
          if (data.completed_steps.includes("drivers")) {
            setCurrentStep(3); // Jump to completion step
          } else {
            setCurrentStep(2); // Jump to drivers step
          }
        } else if (data.has_trucks || data.has_drivers) {
          setCurrentStep(1); // Some data exists, start from trucks
        }
      }
    } catch (error) {
      console.error("Error fetching onboarding status:", error);
      setLoading(false);
    }
  };

  const steps = [
    {
      id: "welcome",
      title: "Вас вітає TMS SOVTES",
      description:
        "Давайте налаштуємо вашу транспортну компанію за декілька кроків. Ми допоможемо додати автопарк і водіїв, щоб ви могли почати планувати маршрути та керувати автопарком.",
      icon: <FaRocket />,
      action: "Почати",
      route: null,
    },
    {
      id: "trucks",
      title: "Додайте автопарк",
      description:
        "Почніть з додавання вантажівок і причепів до вашого автопарку. Вантажівки необхідні для створення маршрутів і призначення замовлень. Потрібно додати хоча б одну вантажівку, щоб продовжити.",
      icon: <FaTruck />,
      action: onboardingStatus?.has_trucks
        ? "Далі: Водії"
        : "Додати вантажівки",
      route: "/trucks",
      completed: onboardingStatus?.has_trucks,
      badge: onboardingStatus?.truck_count
        ? `${onboardingStatus.truck_count} вантажівк${
            onboardingStatus.truck_count === 1
              ? "а"
              : onboardingStatus.truck_count < 5
                ? "и"
                : ""
          } додано`
        : null,
    },
    {
      id: "drivers",
      title: "Додайте водіїв",
      description:
        "Додайте водіїв, які будуть керувати вашими вантажівками. Кожного водія можна призначати на маршрути у планувальнику. Потрібно додати хоча б одного водія для завершення налаштування.",
      icon: <FaUserTie />,
      action: onboardingStatus?.has_drivers ? "Завершити" : "Додати водіїв",
      route: "/drivers",
      completed: onboardingStatus?.has_drivers,
      badge: onboardingStatus?.driver_count
        ? `${onboardingStatus.driver_count} воді${
            onboardingStatus.driver_count === 1
              ? "й"
              : onboardingStatus.driver_count < 5
                ? "я"
                : "їв"
          } додано`
        : null,
    },
    {
      id: "complete",
      title: "Все готово!",
      description:
        "Чудово! Ваша транспортна компанія налаштована. Тепер ви можете створювати замовлення, планувати маршрути та ефективно керувати автопарком.",
      icon: <FaCheckCircle />,
      action: "До планувальника",
      route: "/planner",
    },
  ];

  const handleStepAction = () => {
    const step = steps[currentStep];

    if (step.id === "welcome") {
      // Move to next step
      setCurrentStep(1);
    } else if (step.id === "trucks" && onboardingStatus?.has_trucks) {
      // If trucks exist and we're on the trucks step,
      // just move to the next step instead of navigating to trucks page
      setCurrentStep(currentStep + 1);
    } else if (step.id === "drivers" && onboardingStatus?.has_drivers) {
      // If drivers exist and we're on the drivers step (with "Завершити" button),
      // move directly to the completion step
      setCurrentStep(3);
    } else if (step.route) {
      // Navigate to the specific page with onboarding context
      // Add appropriate state based on the step
      if (step.id === "trucks") {
        navigate(step.route, {
          state: {
            fromOnboarding: true,
            addTruck: true,
            nextStep: currentStep + 1,
          },
        });
      } else if (step.id === "drivers") {
        // Only add 'addDriver: true' if we don't already have drivers
        navigate(step.route, {
          state: {
            fromOnboarding: true,
            addDriver: !onboardingStatus?.has_drivers,
            nextStep: currentStep + 1,
          },
        });
      } else {
        navigate(step.route, {
          state: { fromOnboarding: true, nextStep: currentStep + 1 },
        });
      }
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleSkip = async () => {
    try {
      const response = await fetch("/api/onboarding/skip/", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        console.log("Onboarding skipped");
      }

      // Navigate to planner regardless
      navigate("/planner");
    } catch (error) {
      console.error("Error skipping onboarding:", error);
      navigate("/planner"); // Navigate anyway
    }
  };

  const handleComplete = async () => {
    try {
      const response = await fetch("/api/onboarding/complete/", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.ok) {
        console.log("Onboarding completed successfully!");
        navigate("/planner");
      } else {
        // Show error message
        alert(
          data.message ||
            "Cannot complete onboarding. Please add required data.",
        );
        // Refresh status
        await fetchOnboardingStatus();
      }
    } catch (error) {
      console.error("Error completing onboarding:", error);
    }
  };

  const handleBackToStep = (stepIndex) => {
    setCurrentStep(stepIndex);
  };

  if (loading) {
    return (
      <div className="onboarding-loading">
        <div className="spinner"></div>
        <p>Loading onboarding wizard...</p>
      </div>
    );
  }

  const currentStepData = steps[currentStep];

  // User can always proceed from welcome screen or navigate to setup pages
  // Only prevent "Continue" action if required data is missing
  const canProceed = true;

  return (
    <div className="onboarding-wizard fit-screen">
      {/* Step Content */}
      <div
        className={`onboarding-content ${
          currentStep === 0 ? "welcome-step" : ""
        }`}
      >
        {/* Progress Steps - shown at top for steps 2, 3, 4 */}
        {currentStep > 0 && (
          <div className="onboarding-progress">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`progress-step ${
                  index === currentStep ? "active" : ""
                } ${index < currentStep ? "completed-step" : ""} ${
                  step.completed ? "has-data" : ""
                }`}
                onClick={() => {
                  // Allow clicking on: any previous step, OR step 1 if has trucks, OR step 2 if has drivers
                  if (
                    index < currentStep ||
                    (index === 1 && onboardingStatus?.has_trucks) ||
                    (index === 2 && onboardingStatus?.has_drivers)
                  ) {
                    handleBackToStep(index);
                  }
                }}
                style={{
                  cursor:
                    index < currentStep ||
                    (index === 1 && onboardingStatus?.has_trucks) ||
                    (index === 2 && onboardingStatus?.has_drivers)
                      ? "pointer"
                      : "default",
                }}
              >
                <div className="step-number">
                  {step.icon}
                </div>
                <div className="step-label">{step.title}</div>
              </div>
            ))}
          </div>
        )}

        <div className="step-hero-icon">
          {currentStepData.icon}
        </div>

        {currentStep === 0 ? (
          <h1 className="welcome-title">
            <span className="welcome-prefix">Вас вітає</span>
            <span className="welcome-brand">TMS SOVTES</span>
          </h1>
        ) : (
          <h1>{currentStepData.title}</h1>
        )}
        <p className="step-description">{currentStepData.description}</p>

        {/* Progress Steps - shown after description only for step 1 (welcome) */}
        {currentStep === 0 && (
          <div className="onboarding-progress">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`progress-step ${
                  index === currentStep ? "active" : ""
                } ${index < currentStep ? "completed-step" : ""} ${
                  step.completed ? "has-data" : ""
                }`}
                onClick={() => {
                  // Allow clicking on: any previous step, OR step 1 if has trucks, OR step 2 if has drivers
                  if (
                    index < currentStep ||
                    (index === 1 && onboardingStatus?.has_trucks) ||
                    (index === 2 && onboardingStatus?.has_drivers)
                  ) {
                    handleBackToStep(index);
                  }
                }}
                style={{
                  cursor:
                    index < currentStep ||
                    (index === 1 && onboardingStatus?.has_trucks) ||
                    (index === 2 && onboardingStatus?.has_drivers)
                      ? "pointer"
                      : "default",
                }}
              >
                <div className="step-number">
                  {step.icon}
                </div>
                <div className="step-label">{step.title}</div>
              </div>
            ))}
          </div>
        )}

        {/* Welcome Screen Features */}
        {/* {currentStep === 0 && (
          <div className="welcome-features">
            <h3>Що ви налаштуєте:</h3>
            <ul>
              <li>
                <FaTruck className="feature-icon" />
                <div>
                  <strong>Ваш автопарк</strong>
                  <p>
                    Додавайте вантажівки та причепи для керування транспортом
                  </p>
                </div>
              </li>
              <li>
                <FaUserTie className="feature-icon" />
                <div>
                  <strong>Ваші водії</strong>
                  <p>Створюйте профілі водіїв для призначення маршрутів</p>
                </div>
              </li>
              <li>
                <FaRocket className="feature-icon" />
                <div>
                  <strong>Готові до старту</strong>
                  <p>Починайте планувати маршрути та керувати замовленнями</p>
                </div>
              </li>
            </ul>
          </div>
        )} */}

        {/* Badge for completed steps */}
        {currentStepData.badge && (
          <div className="step-badge completed-badge">
            <FaCheckCircle /> {currentStepData.badge}
          </div>
        )}

        {/* Removed completion status note per request */}

        {/* Action Buttons */}
        <div className="onboarding-actions">
          {currentStep === 3 ? (
            <button className="btn-primary btn-large" onClick={handleComplete}>
              {currentStepData.action} <FaArrowRight />
            </button>
          ) : (
            <button
              className="btn-primary btn-large"
              onClick={handleStepAction}
            >
              {currentStepData.action} <FaArrowRight />
            </button>
          )}
        </div>

        {/* Help Text - shown only when user tries to skip without adding required data */}
        {currentStep === 1 && !onboardingStatus?.has_trucks && (
          <p className="help-text">
            💡 Потрібно додати хоча б одну вантажівку, щоб продовжити
          </p>
        )}
        {currentStep === 2 && !onboardingStatus?.has_drivers && (
          <p className="help-text">
            💡 Потрібно додати хоча б одного водія, щоб продовжити
          </p>
        )}
      </div>
    </div>
  );
};

export default OnboardingWizard;
