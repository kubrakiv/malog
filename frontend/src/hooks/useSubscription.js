import { useSelector, useDispatch } from "react-redux";
import { fetchSubscription } from "../features/subscription/subscriptionOperations";

export const useSubscription = () => {
  const dispatch = useDispatch();
  const { data: subscription, loading, error } = useSelector(
    (state) => state.subscriptionInfo
  );

  const hasFeatureAccess = (featureName) => {
    if (!subscription?.plan_details) return false;
    return subscription.plan_details.features?.includes(featureName) || false;
  };

  const canAddTruck = () => {
    if (!subscription?.current_usage) return false;
    const { truck_count, truck_limit } = subscription.current_usage;
    if (truck_limit === -1) return true;
    return truck_count < truck_limit;
  };

  const getSubscriptionLimits = () => {
    if (!subscription) {
      return { truck_count: 0, truck_limit: 0, can_add_truck: false, plan_name: "No Plan", features: [] };
    }
    return {
      truck_count: subscription.current_usage?.truck_count || 0,
      truck_limit: subscription.plan_details?.truck_limit || 0,
      can_add_truck: subscription.current_usage?.can_add_truck || false,
      plan_name: subscription.plan_details?.display_name || "Unknown Plan",
      features: subscription.plan_details?.features || [],
    };
  };

  const refetch = () => dispatch(fetchSubscription());

  return { subscription, loading, error, hasFeatureAccess, canAddTruck, getSubscriptionLimits, refetch };
};

export default useSubscription;
