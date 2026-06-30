import React from "react";
import { useNavigate } from "react-router-dom";
import { FaTruck, FaUserTie, FaBoxOpen, FaPlus, FaBook } from "react-icons/fa";
import "./EmptyState.scss";

/**
 * Empty State Component for Planner
 * Shows friendly cards when no data exists instead of grey disabled boxes
 */

export const EmptyTruckCard = ({ fromPlanner = false }) => {
  const navigate = useNavigate();

  return (
    <div className="empty-state-card truck-empty">
      <div className="empty-state-icon">
        <FaTruck />
      </div>
      <h3>No Trucks Yet</h3>
      <p>
        Add trucks to your fleet to start planning routes and assigning orders.
      </p>
      <button
        className="btn-add-primary"
        onClick={() => navigate("/fleet", { state: { fromPlanner } })}
      >
        <FaPlus /> Add Your First Truck
      </button>
    </div>
  );
};

export const EmptyDriverCard = ({ fromPlanner = false }) => {
  const navigate = useNavigate();

  return (
    <div className="empty-state-card driver-empty">
      <div className="empty-state-icon">
        <FaUserTie />
      </div>
      <h3>No Drivers Yet</h3>
      <p>
        Add drivers to your company so they can be assigned to trucks and
        routes.
      </p>
      <button
        className="btn-add-primary"
        onClick={() => navigate("/drivers", { state: { fromPlanner } })}
      >
        <FaPlus /> Add Your First Driver
      </button>
    </div>
  );
};

export const EmptyOrderCard = ({ fromPlanner = false }) => {
  const navigate = useNavigate();

  return (
    <div className="empty-state-card order-empty">
      <div className="empty-state-icon">
        <FaBoxOpen />
      </div>
      <h3>No Orders Yet</h3>
      <p>
        Create your first order to start managing shipments and planning
        deliveries.
      </p>
      <button
        className="btn-add-primary"
        onClick={() => navigate("/orders/create", { state: { fromPlanner } })}
      >
        <FaPlus /> Create Your First Order
      </button>
    </div>
  );
};

/**
 * Welcome Banner for New Users in Planner
 */
export const PlannerWelcomeBanner = ({ onStartOnboarding, onAddTruck }) => {
  return (
    <div className="planner-welcome-banner">
      <div className="banner-content">
        <div className="banner-icon">
          <FaBook />
        </div>
        <div className="banner-text">
          <h2>Welcome to TMS SOVTES Planner! 👋</h2>
          <p>
            This is where you'll plan routes, assign trucks and drivers, and
            manage your logistics operations. Let's get you started!
          </p>
        </div>
        <div className="banner-actions">
          <button className="btn-banner-primary" onClick={onStartOnboarding}>
            <FaBook /> Start Onboarding Guide
          </button>
          <button className="btn-banner-secondary" onClick={onAddTruck}>
            <FaTruck /> Add Truck Directly
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Inline Empty State for Planner Rows
 * More compact version for use within the planner grid
 */
export const InlineEmptyTruck = ({ onAddTruck }) => {
  return (
    <div className="inline-empty-state">
      <FaTruck className="inline-icon" />
      <span className="inline-text">No trucks available</span>
      <button className="btn-inline-add" onClick={onAddTruck}>
        <FaPlus /> Add Truck
      </button>
    </div>
  );
};

export const InlineEmptyDriver = ({ onAddDriver }) => {
  return (
    <div className="inline-empty-state">
      <FaUserTie className="inline-icon" />
      <span className="inline-text">No drivers available</span>
      <button className="btn-inline-add" onClick={onAddDriver}>
        <FaPlus /> Add Driver
      </button>
    </div>
  );
};

/**
 * Generic Empty State Component
 */
export const EmptyState = ({
  icon = <FaBoxOpen />,
  title = "No Data",
  description = "Get started by adding your first item.",
  actionText = "Add Item",
  onAction,
  actionIcon = <FaPlus />,
}) => {
  return (
    <div className="empty-state-card">
      <div className="empty-state-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{description}</p>
      {onAction && (
        <button className="btn-add-primary" onClick={onAction}>
          {actionIcon} {actionText}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
