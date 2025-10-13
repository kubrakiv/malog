/*
 * Example: Integration with TrucksPage
 * This example shows how to integrate subscription checking into existing pages
 */

import React, { useEffect, useState } from "react";
import { FaPlus, FaTruck, FaLock, FaExclamationTriangle } from "react-icons/fa";
import useSubscription from "../hooks/useSubscription";
import useTruckLimitCheck from "../utils/subscriptionUtils";
import SubscriptionBanner from "../components/SubscriptionBanner/SubscriptionBanner";

// Example of how to enhance TrucksPage with subscription features
const EnhancedTrucksPage = () => {
  const [trucks, setTrucks] = useState([]);
  const { subscription, hasFeatureAccess } = useSubscription();
  const {
    canAddTruck,
    checkTruckLimit,
    checkingLimit,
    limitError,
    showTruckLimitModal,
    limits,
  } = useTruckLimitCheck();

  // Check if user has access to Fleet Management feature
  const hasFleetAccess = hasFeatureAccess("Fleet Management");

  const handleAddTruck = async () => {
    // First check if user has feature access
    if (!hasFleetAccess) {
      alert(
        "Fleet Management feature is not available in your current plan. Please upgrade to access this feature."
      );
      return;
    }

    // Then check truck limits
    const canAdd = await checkTruckLimit();
    if (!canAdd) {
      showTruckLimitModal();
      return;
    }

    // Proceed with adding truck
    console.log("User can add truck - proceed with truck creation");
    // ... existing truck creation logic
  };

  // Show subscription-based page content
  if (!hasFleetAccess) {
    return (
      <div className="feature-locked-page">
        <SubscriptionBanner />
        <div className="locked-content">
          <FaLock className="lock-icon" />
          <h2>Fleet Management</h2>
          <p>
            This feature is not available in your current subscription plan.
          </p>
          <button
            className="upgrade-button"
            onClick={() => (window.location.href = "/subscription-plans")}
          >
            Upgrade Plan
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="trucks-page">
      <SubscriptionBanner showOnlyWarnings={true} />

      <div className="trucks-header">
        <h1>Fleet Management</h1>
        <div className="trucks-stats">
          <div className="stat-item">
            <FaTruck />
            <span>
              {limits.truck_count} /{" "}
              {limits.truck_limit === -1 ? "∞" : limits.truck_limit} trucks
            </span>
          </div>
        </div>
      </div>

      {/* Show warning if near limit */}
      {limits.truck_limit !== -1 &&
        limits.truck_count >= limits.truck_limit * 0.8 && (
          <div className="truck-limit-warning">
            <FaExclamationTriangle />
            <span>
              You're approaching your truck limit. Consider upgrading your plan.
            </span>
          </div>
        )}

      <div className="trucks-actions">
        <button
          className={`add-truck-btn ${!canAddTruck ? "disabled" : ""}`}
          onClick={handleAddTruck}
          disabled={checkingLimit || !canAddTruck}
        >
          <FaPlus />
          {checkingLimit
            ? "Checking..."
            : canAddTruck
            ? "Add Truck"
            : "Limit Reached"}
        </button>
      </div>

      {limitError && (
        <div className="limit-error">
          <FaExclamationTriangle />
          <span>{limitError}</span>
        </div>
      )}

      {/* Existing trucks list */}
      <div className="trucks-list">
        {trucks.map((truck) => (
          <div key={truck.id} className="truck-item">
            {/* Truck details */}
          </div>
        ))}
      </div>
    </div>
  );
};

export default EnhancedTrucksPage;
