import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import cn from "classnames";
import axios from "axios";

import MessageComponent from "../../../components/MessageComponent/MessageComponent";
import { getCsrfToken } from "../../../utils/getCsrfToken";
import { setShowAddDriverModal } from "../../../features/drivers/driversSlice";
import {
  createDriver,
  listDrivers,
} from "../../../features/drivers/driversOperations";

import SelectComponent from "../../../globalComponents/SelectComponent";
import InputComponent from "../../../globalComponents/InputComponent";
import { transformSelectOptions } from "../../../utils/transformers";
import { listRoles } from "../../../features/roles/roleOperations";
import { selectRoles } from "../../../features/roles/roleSelectors";

import { REGISTER_CONSTANTS } from "./constants";
import { formFields } from "./driverFormFields";

import "./style.scss";

const {
  ROLE,
  FIRST_NAME,
  LAST_NAME,
  EMAIL,
  PHONE,
  PASSWORD,
  CONFIRM_PASSWORD,
} = REGISTER_CONSTANTS;

const RegisterFormComponent = ({
  fromOnboarding,
  onboardingNextStep,
  inModal,
  onCloseModal,
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [selectedRole, setSelectedRole] = useState("");
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState("basic");
  const [isRegistered, setIsRegistered] = useState(false);
  const [driverLimitCheck, setDriverLimitCheck] = useState({
    canAddDriver: true,
    currentDriverCount: 0,
    driverLimit: 0,
    planName: "",
    loading: true,
  });

  const [registerFields, setRegisterFields] = useState(
    Object.values(REGISTER_CONSTANTS).reduce((acc, item) => {
      acc[item] = "";
      return acc;
    }, {})
  );

  const redirect = "/login";
  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;
  const userRegister = useSelector((state) => state.userRegister);
  const { success, error } = userRegister;
  const roles = useSelector(selectRoles);
  const roleTypesOptions = transformSelectOptions(roles, "name");

  // Check driver limits when creating new driver
  useEffect(() => {
    if (userInfo?.token) {
      const checkDriverLimit = async () => {
        try {
          const config = {
            headers: {
              Authorization: `Bearer ${userInfo.token}`,
            },
          };
          const response = await axios.get(
            "/api/subscriptions/check-driver-limit/",
            config
          );
          setDriverLimitCheck({
            canAddDriver: response.data.can_add_driver,
            currentDriverCount: response.data.current_driver_count,
            driverLimit: response.data.driver_limit,
            planName: response.data.plan,
            loading: false,
          });
        } catch (error) {
          console.error("Error checking driver limit:", error);
          setDriverLimitCheck((prev) => ({ ...prev, loading: false }));
        }
      };

      checkDriverLimit();
    } else {
      setDriverLimitCheck((prev) => ({ ...prev, loading: false }));
    }
  }, [userInfo]);

  useEffect(() => {
    dispatch(listRoles());
  }, [dispatch]);

  // Auto-select the driver role when roles are loaded
  useEffect(() => {
    if (roles && roles.length > 0) {
      // Find the driver role
      const driverRole = roles.find(
        (role) =>
          role.name.toLowerCase().includes("driver") ||
          role.name.toLowerCase().includes("водій")
      );

      if (driverRole) {
        setSelectedRole(driverRole.name);
        console.log("Driver role auto-selected:", driverRole.name);
      } else if (roles.length > 0) {
        // Fallback - use the first role if no driver role is found
        setSelectedRole(roles[0].name);
        console.log("No driver role found, using first role:", roles[0].name);
      }
    }
  }, [roles]);

  const handleRegisterDataChange = (e) => {
    const { name, value } = e.target;
    setRegisterFields((prev) => ({ ...prev, [name]: value }));
  };

  const handleCloseRegistration = () => {
    setMessage("");
    // Make sure we refresh the drivers list using our new Redux Toolkit action
    dispatch(listDrivers());

    // If in modal, close the modal and clear the state
    if (inModal && onCloseModal) {
      dispatch(setShowAddDriverModal(false));
      onCloseModal();
      return;
    }

    // Navigate based on whether this was part of the onboarding flow
    if (fromOnboarding) {
      // If we have a next step in onboarding, navigate to that specific step
      if (onboardingNextStep) {
        navigate("/onboarding", { state: { currentStep: onboardingNextStep } });
      } else {
        navigate("/onboarding");
      }
    } else {
      navigate("/drivers");
    }
    console.log("Close registration");
  };

  const submitHandler = (e) => {
    e.preventDefault();

    // Check driver limit for new driver creation
    if (!driverLimitCheck.canAddDriver) {
      navigate("/subscription-plans");
      return;
    }

    let userData = {};
    let isValid = true;
    setMessage("");

    // Check if all necessary fields are filled
    Object.keys(registerFields).forEach((key) => {
      if (!registerFields[key] && key !== CONFIRM_PASSWORD && key !== ROLE) {
        isValid = false;
        setMessage(`Поле ${key} не може бути порожнім!`);
      }
    });

    // Check if password and confirmPassword match
    if (registerFields[PASSWORD] !== registerFields[CONFIRM_PASSWORD]) {
      setMessage("Паролі не співпадають!");
      isValid = false;
    }

    // Use the auto-selected driver role
    if (isValid) {
      Object.keys(registerFields).forEach((key) => {
        if (key !== CONFIRM_PASSWORD) {
          userData[key] = registerFields[key];
        }
      });

      // Ensure we have a role selected
      if (!selectedRole) {
        console.warn("No role selected, this shouldn't happen!");
        setMessage("Помилка: Не вибрано роль водія");
        isValid = false;
      } else {
        console.log("Using role for driver:", selectedRole);
        userData[ROLE] = selectedRole;
      }

      // For both modal and non-modal creation, use the Redux Toolkit createDriver action
      const actionResult = dispatch(createDriver(userData));
      actionResult
        .then((result) => {
          if (result.meta.requestStatus === "fulfilled") {
            // Refresh the list of drivers
            dispatch(listDrivers());
            handleCloseRegistration();
          } else if (result.meta.requestStatus === "rejected") {
            setMessage(result.payload?.error || "Failed to create driver");
          }
        })
        .catch((error) => {
          setMessage(
            "Error creating driver: " + (error.message || "Unknown error")
          );
        });
    }
  };

  useEffect(() => {
    if (success) {
      setMessage("Користувач зареєстрований успішно!");
      setIsRegistered(true);
    } else if (error) {
      setMessage("Помилка реєстрації користувача!");
    }
  }, [success, error]);

  return (
    <form className="add-driver__form" onSubmit={(e) => submitHandler(e)}>
      <div className="driver-card-container">
        <div className="driver-card-details">
          <div className="add-driver__content">
            <div className="add-driver__content-block">
              {/* {!inModal && <h3 className="add-driver__title">Додати водія</h3>} */}
              {<h3 className="add-driver__title">Додати водія</h3>}

              {/* Subscription limit warning */}
              {!driverLimitCheck.loading && (
                <div
                  className={`subscription-info ${
                    !driverLimitCheck.canAddDriver
                      ? "subscription-limit-reached"
                      : ""
                  }`}
                >
                  <div className="driver-count-info">
                    <strong>
                      Водії: {driverLimitCheck.currentDriverCount} /{" "}
                      {driverLimitCheck.driverLimit === -1
                        ? "∞"
                        : driverLimitCheck.driverLimit}
                    </strong>
                    <span className="plan-name">
                      {driverLimitCheck.planName}
                    </span>
                  </div>
                  {/* Visual progress bar */}
                  {driverLimitCheck.driverLimit !== -1 && (
                    <div className="driver-limit-progress">
                      <div
                        className="driver-limit-progress-bar"
                        style={{
                          width: `${Math.min(
                            100,
                            (driverLimitCheck.currentDriverCount /
                              driverLimitCheck.driverLimit) *
                              100
                          )}%`,
                          backgroundColor: driverLimitCheck.canAddDriver
                            ? "var(--sidebarcolor, #1976d2)"
                            : "#dc3545",
                        }}
                      ></div>
                    </div>
                  )}
                  {!driverLimitCheck.canAddDriver && (
                    <div className="limit-warning">
                      <p>
                        Ви досягли обмеження в кількості водіїв у поточному
                        плані
                      </p>
                      <button
                        type="button"
                        className="upgrade-link"
                        onClick={() => navigate("/subscription-plans")}
                      >
                        Upgrade Plan
                      </button>
                    </div>
                  )}
                </div>
              )}

              {message && (
                <MessageComponent color={"red"}>{message}</MessageComponent>
              )}

              {/* Tabs similar to ManageTruckComponent */}
              <div className="driver-card-details__tabs">
                <button
                  className={cn(
                    "driver-card-details__tab",
                    activeTab === "basic" && "active"
                  )}
                  type="button"
                  onClick={() => setActiveTab("basic")}
                >
                  Основні дані
                </button>
                {/* Add more tabs if needed in the future */}
              </div>

              <div className="add-driver__content-row">
                {formFields[activeTab]
                  ? formFields[activeTab].map((fields) => (
                      <div
                        className="add-driver__content-row-block"
                        key={`fields-row-${fields[0].id}`}
                      >
                        {fields.map((field) => (
                          <div key={field.id}>
                            <InputComponent
                              label={field.title}
                              id={field.id}
                              type={field.type}
                              name={field.id}
                              title={field.title}
                              placeholder={field.placeholder}
                              icon={field.icon}
                              value={registerFields[field.id]}
                              onChange={handleRegisterDataChange}
                            />
                          </div>
                        ))}
                      </div>
                    ))
                  : formFields["basic"] &&
                    formFields["basic"].map((fields) => (
                      <div
                        className="add-driver__content-row-block"
                        key={`fields-row-${fields[0].id}`}
                      >
                        {fields.map((field) => (
                          <div key={field.id}>
                            <InputComponent
                              label={field.title}
                              id={field.id}
                              type={field.type}
                              name={field.id}
                              title={field.title}
                              placeholder={field.placeholder}
                              icon={field.icon}
                              value={registerFields[field.id]}
                              onChange={handleRegisterDataChange}
                            />
                          </div>
                        ))}
                      </div>
                    ))}
                {/* No role selector needed as driver role is auto-selected */}
              </div>
            </div>
          </div>

          <div className="driver-form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleCloseRegistration}
            >
              Скасувати
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!driverLimitCheck.canAddDriver}
            >
              {location.pathname === "/register"
                ? "Зареєструватися"
                : "Додати водія"}
            </button>
          </div>
        </div>
      </div>

      {location.pathname === "/register" && (
        <div className="login-link">
          <span>Вже зареєструвалися? </span>
          <Link to={redirect ? `/login?redirect=${redirect}` : "/login"}>
            Увійти
          </Link>
        </div>
      )}
    </form>
  );
};

export default RegisterFormComponent;
