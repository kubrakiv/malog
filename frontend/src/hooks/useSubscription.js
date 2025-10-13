import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import axios from "axios";

/**
 * Custom hook to manage subscription state and feature access
 */
export const useSubscription = () => {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;

  useEffect(() => {
    const fetchSubscription = async () => {
      if (!userInfo?.token) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const config = {
          headers: {
            Authorization: `Bearer ${userInfo.token}`,
          },
        };

        const response = await axios.get("/api/subscriptions/current/", config);
        setSubscription(response.data);
      } catch (err) {
        setError(err.response?.data?.error || "Failed to fetch subscription");
        setSubscription(null);
        console.log("No active subscription found");
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, [userInfo]);

  /**
   * Check if user has access to a specific feature
   */
  const hasFeatureAccess = (featureName) => {
    if (!subscription || !subscription.plan_details) {
      return false;
    }

    return subscription.plan_details.features?.includes(featureName) || false;
  };

  /**
   * Check if user can add more trucks based on subscription limits
   */
  const canAddTruck = () => {
    if (!subscription || !subscription.current_usage) {
      return false;
    }

    const { truck_count, truck_limit } = subscription.current_usage;

    // -1 means unlimited
    if (truck_limit === -1) {
      return true;
    }

    return truck_count < truck_limit;
  };

  /**
   * Get subscription plan limits and usage
   */
  const getSubscriptionLimits = () => {
    if (!subscription) {
      return {
        truck_count: 0,
        truck_limit: 0,
        can_add_truck: false,
        plan_name: "No Plan",
        features: [],
      };
    }

    return {
      truck_count: subscription.current_usage?.truck_count || 0,
      truck_limit: subscription.plan_details?.truck_limit || 0,
      can_add_truck: subscription.current_usage?.can_add_truck || false,
      plan_name: subscription.plan_details?.display_name || "Unknown Plan",
      features: subscription.plan_details?.features || [],
    };
  };

  /**
   * Check feature access with API call (for complex features)
   */
  const checkFeatureAccess = async (featureName) => {
    if (!userInfo?.token) {
      return false;
    }

    try {
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };

      const response = await axios.get(
        `/api/subscriptions/check-feature/${featureName}/`,
        config
      );

      return response.data.has_access;
    } catch (error) {
      console.error(`Error checking feature access for ${featureName}:`, error);
      return false;
    }
  };

  return {
    subscription,
    loading,
    error,
    hasFeatureAccess,
    canAddTruck,
    getSubscriptionLimits,
    checkFeatureAccess,
    refetch: () => {
      if (userInfo?.token) {
        setLoading(true);
        // Trigger re-fetch by updating a dependency
        const fetchSubscription = async () => {
          try {
            const config = {
              headers: {
                Authorization: `Bearer ${userInfo.token}`,
              },
            };

            const response = await axios.get(
              "/api/subscriptions/current/",
              config
            );
            setSubscription(response.data);
            setError(null);
          } catch (err) {
            setError(
              err.response?.data?.error || "Failed to fetch subscription"
            );
            setSubscription(null);
          } finally {
            setLoading(false);
          }
        };

        fetchSubscription();
      }
    },
  };
};

export default useSubscription;
