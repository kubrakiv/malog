import { useContext } from "react";
import sidebarMenuItems from "./sidebarMenuItems";
import OpenContext from "../OpenContext";
import SidebarItem from "./SidebarItem/SidebarItem";
import useSubscription from "../../hooks/useSubscription";

import "./Sidebar.scss";

const SubscriptionAwareSidebar = ({ children }) => {
  const { isSidebarOpen } = useContext(OpenContext);
  const { hasFeatureAccess, subscription, loading } = useSubscription();

  // Feature mapping for sidebar menu items
  const featureMapping = {
    // Company section (only for admin)
    "/userlist": "Employee Management",
    "/drivers": "Driver Management",
    "/vehicles": "Fleet Management",

    // Dashboard
    "/dashboard": "Dashboard",

    // Platform section
    "/platforms": "External Platforms",

    // Planner section
    "/planner": "Route Planner",
    "/planner/drag-drop": "Route Planner",

    // Orders section
    "/orders": "Orders Management",
    "/free-orders": "Orders Management",
    "/orders/add": "Orders Management",

    // Invoices
    "/invoices": "Invoicing",

    // Tasks (if enabled)
    "/tasks": "Tasks Management",
    "/tasks/add": "Tasks Management",

    // Other features
    "/points": "Points Management",
    "/customers": "Customer Management",
    "/platforms/sovtes": "External Platforms",
    "/platforms/lardi": "External Platforms",
    "/calculator": "Route Calculator",
  };

  /**
   * Filter menu items based on subscription features
   */
  const filterMenuItems = (menuItems) => {
    if (loading) {
      return []; // Show nothing while loading
    }

    // If no subscription, only show items that don't require features (like main menu)
    if (!subscription) {
      return menuItems
        .map((item) => {
          const mainFeature = featureMapping[item.path];

          // Only show items that don't require a subscription feature
          if (mainFeature) {
            return null; // Hide items that require subscription features
          }

          // For items without feature requirements, filter children
          let filteredItem = { ...item };
          if (item.childrens) {
            filteredItem.childrens = item.childrens.filter((child) => {
              const childFeature = featureMapping[child.path];
              return !childFeature; // Only show children that don't require features
            });

            // If no children remain and it's a parent-only item, hide it
            if (
              filteredItem.childrens.length === 0 &&
              item.childrens.length > 0
            ) {
              return null;
            }
          }

          return filteredItem;
        })
        .filter(Boolean);
    }

    return menuItems
      .map((item) => {
        let filteredItem = { ...item };

        // Check main item access
        const mainFeature = featureMapping[item.path];
        const hasMainAccess = mainFeature
          ? hasFeatureAccess(mainFeature)
          : true;

        // If item has children, filter them too
        if (item.childrens) {
          filteredItem.childrens = item.childrens.filter((child) => {
            const childFeature = featureMapping[child.path];
            return childFeature ? hasFeatureAccess(childFeature) : true;
          });

          // If no children have access, hide the parent item
          if (filteredItem.childrens.length === 0 && mainFeature) {
            return null;
          }
        }

        // Return item only if has access to main feature
        return hasMainAccess ? filteredItem : null;
      })
      .filter(Boolean); // Remove null items
  };

  const filteredMenuItems = filterMenuItems(sidebarMenuItems);

  // Show loading state
  if (loading) {
    return (
      <div className="container-sidebar">
        <div
          style={{ width: isSidebarOpen ? "250px" : "50px" }}
          className="sidebar sidebar-loading"
        >
          <div className="sidebar-loading-message">
            <div className="loading-spinner"></div>
            {isSidebarOpen && <span>Loading menu...</span>}
          </div>
        </div>
        <main className="page__main">{children}</main>
      </div>
    );
  }

  // Show no subscription state
  if (!subscription) {
    return (
      <div className="container-sidebar">
        <div
          style={{ width: isSidebarOpen ? "250px" : "50px" }}
          className="sidebar sidebar-no-subscription"
        >
          {isSidebarOpen && (
            <div className="no-subscription-message">
              <div className="lock-icon">🔒</div>
              <span>No active subscription</span>
              <small>Contact admin to activate features</small>
            </div>
          )}
        </div>
        <main className="page__main">{children}</main>
      </div>
    );
  }

  return (
    <div className="container-sidebar">
      <div
        style={{ width: isSidebarOpen ? "250px" : "50px" }}
        className="sidebar"
      >
        {filteredMenuItems.map((item, index) => (
          <SidebarItem key={index} item={item} isSidebarOpen={isSidebarOpen} />
        ))}

        {isSidebarOpen && filteredMenuItems.length === 0 && (
          <div className="no-features-message">
            <div className="lock-icon">🔒</div>
            <span>No features available</span>
            <small>Upgrade your plan to access features</small>
          </div>
        )}
      </div>
      <main className="page__main">{children}</main>
    </div>
  );
};

export default SubscriptionAwareSidebar;
