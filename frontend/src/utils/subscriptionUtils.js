import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import useSubscription from "../hooks/useSubscription";

/**
 * Hook to check truck limits before allowing truck creation
 */
export const useTruckLimitCheck = () => {
  const { canAddTruck, getSubscriptionLimits } = useSubscription();
  const [checkingLimit, setCheckingLimit] = useState(false);
  const [limitError, setLimitError] = useState(null);

  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;

  /**
   * Check if user can add a truck (with API verification)
   */
  const checkTruckLimit = async () => {
    if (!userInfo?.token) {
      return false;
    }

    setCheckingLimit(true);
    setLimitError(null);

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

      if (!response.data.can_add_truck) {
        setLimitError(
          `You've reached your truck limit (${response.data.current_truck_count}/${response.data.truck_limit}). Please upgrade your plan to add more trucks.`
        );
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error checking truck limit:", error);
      setLimitError("Failed to check truck limit. Please try again.");
      return false;
    } finally {
      setCheckingLimit(false);
    }
  };

  /**
   * Show truck limit reached modal/alert
   */
  const showTruckLimitModal = () => {
    const limits = getSubscriptionLimits();

    const modalMessage = `
      Truck Limit Reached
      
      You've reached your truck limit (${limits.truck_count}/${limits.truck_limit}) for your current plan: ${limits.plan_name}
      
      To add more trucks, please upgrade your subscription plan.
    `;

    if (
      window.confirm(
        modalMessage + "\n\nWould you like to view upgrade options?"
      )
    ) {
      window.location.href = "/subscription-plans";
    }
  };

  return {
    canAddTruck,
    checkTruckLimit,
    checkingLimit,
    limitError,
    showTruckLimitModal,
    limits: getSubscriptionLimits(),
  };
};

/**
 * Component wrapper for truck limit checking
 */
export const withTruckLimitCheck = (Component) => {
  return (props) => {
    const truckLimitProps = useTruckLimitCheck();

    return <Component {...props} {...truckLimitProps} />;
  };
};

export default useTruckLimitCheck;
