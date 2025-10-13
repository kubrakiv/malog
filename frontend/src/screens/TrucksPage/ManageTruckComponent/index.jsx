import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import cn from "classnames";

import {
  createTruck,
  updateTruck,
} from "../../../features/trucks/trucksOperations";

import {
  setEditModeTruck,
  setSelectedTruck,
} from "../../../features/trucks/trucksSlice";

import { TRUCK_CONSTANTS } from "../../../constants/global";
import { formFields } from "./truckFormFields.jsx";
import { formatDateForInput } from "../../../utils/formatDate";

import ManageTruckFooterComponent from "../ManageTruckFooterComponent";
import InputComponent from "../../../globalComponents/InputComponent";

import "./style.scss";

const ManageTruckComponent = ({
  onCloseModal,
  onEditMode,
  initialTruckData = null,
  activeTab,
  setActiveTab,
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;

  const [truckLimitCheck, setTruckLimitCheck] = useState({
    canAddTruck: true,
    currentTruckCount: 0,
    truckLimit: 0,
    planName: "",
    loading: true,
  });

  const [truckFields, setTruckFields] = useState(() => {
    if (initialTruckData) {
      return {
        ...initialTruckData,
      };
    }

    return Object.values(TRUCK_CONSTANTS).reduce((acc, item) => {
      acc[item] = "";
      return acc;
    }, {});
  });

  // Check truck limits when creating new truck
  useEffect(() => {
    if (!initialTruckData && userInfo?.token) {
      const checkTruckLimit = async () => {
        try {
          const config = {
            headers: {
              Authorization: `Bearer ${userInfo.token}`,
            },
          };
          const response = await axios.get(
            "/api/subscriptions/check-truck-limit/",
            config
          );
          setTruckLimitCheck({
            canAddTruck: response.data.can_add_truck,
            currentTruckCount: response.data.current_truck_count,
            truckLimit: response.data.truck_limit,
            planName: response.data.plan,
            loading: false,
          });
        } catch (error) {
          console.error("Error checking truck limit:", error);
          setTruckLimitCheck((prev) => ({ ...prev, loading: false }));
        }
      };

      checkTruckLimit();
    } else {
      setTruckLimitCheck((prev) => ({ ...prev, loading: false }));
    }
  }, [initialTruckData, userInfo]);

  const handleTruckChange = (e) => {
    const { name, value } = e.target;
    setTruckFields((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();

    // Check truck limit for new truck creation
    if (!initialTruckData && !truckLimitCheck.canAddTruck) {
      navigate("/subscription-plans");
      return;
    }

    let data = {};
    Object.keys(truckFields).forEach((key) => {
      data[key] = truckFields[key];
    });

    if (initialTruckData) {
      dispatch(updateTruck(data));
      dispatch(setSelectedTruck(data));
      dispatch(setEditModeTruck(false));
    } else {
      dispatch(createTruck(data));
      onCloseModal();
    }
  };

  return (
    <>
      <form className="add-truck__form" onSubmit={(e) => handleFormSubmit(e)}>
        <div className="truck-card-container">
          <div className="truck-card-details">
            <div className="add-truck__content">
              <div className="add-truck__content-block">
                {!onEditMode && (
                  <h3 className="add-truck__title">Додати тягач</h3>
                )}

                {/* Subscription limit warning */}
                {!initialTruckData && !truckLimitCheck.loading && (
                  <div
                    className={`subscription-info ${
                      !truckLimitCheck.canAddTruck
                        ? "subscription-limit-reached"
                        : ""
                    }`}
                  >
                    <div className="truck-count-info">
                      <strong>
                        Trucks: {truckLimitCheck.currentTruckCount} /{" "}
                        {truckLimitCheck.truckLimit === -1
                          ? "∞"
                          : truckLimitCheck.truckLimit}
                      </strong>
                      <span className="plan-name">
                        ({truckLimitCheck.planName})
                      </span>
                    </div>
                    {!truckLimitCheck.canAddTruck && (
                      <div className="limit-warning">
                        <p>
                          You've reached your truck limit for the current plan.
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
                <div className="truck-card-details__tabs">
                  <button
                    className={cn(
                      "truck-card-details__tab",
                      activeTab === "basic" && "active"
                    )}
                    type="button"
                    onClick={() => setActiveTab("basic")}
                  >
                    Базові параметри
                  </button>
                  <button
                    className={cn(
                      "truck-card-details__tab",
                      activeTab === "norms" && "active"
                    )}
                    type="button"
                    onClick={() => setActiveTab("norms")}
                  >
                    Норми
                  </button>
                </div>
                <div className="add-truck__content-row">
                  {formFields[activeTab]?.map((fields) => (
                    <div
                      className={cn(
                        "add-truck__content-row-block",
                        initialTruckData !== null &&
                          "add-truck__content-row-block_edit-mode"
                      )}
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
                            value={
                              field.type !== "date"
                                ? truckFields[field.id]
                                : formatDateForInput(truckFields[field.id])
                            }
                            onChange={handleTruckChange}
                          />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {!initialTruckData && (
              <ManageTruckFooterComponent
                onCloseModal={onCloseModal}
                canAddTruck={truckLimitCheck.canAddTruck}
              />
            )}
            {initialTruckData && (
              <div className="edit-truck__footer">
                <button
                  title={
                    initialTruckData ? "Оновити тягач" : "Додати менеджера"
                  }
                  style={{ margin: "0px 0px 5px 5px" }}
                  className="end-time__footer-btn end-time__footer-btn_save"
                  type="submit"
                  // disabled={initialTruckData ? isFormValid : !isFormValid}
                >
                  {initialTruckData ? "Оновити тягач" : "Додати менеджера"}
                </button>
              </div>
            )}
          </div>
        </div>
      </form>
    </>
  );
};

export default ManageTruckComponent;
