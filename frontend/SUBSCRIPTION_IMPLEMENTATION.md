# Subscription-Based Feature Access Implementation

This implementation provides comprehensive subscription-based feature access and route protection for the Malog application.

## Components Overview

### 1. `useSubscription` Hook (`src/hooks/useSubscription.js`)

Central hook for managing subscription state and feature access checking.

**Features:**

- Fetches and manages subscription data
- Provides feature access checking
- Handles truck limit checking
- Automatic re-fetching capabilities

**Usage:**

```javascript
import useSubscription from "../hooks/useSubscription";

const MyComponent = () => {
  const { subscription, hasFeatureAccess, canAddTruck, loading } =
    useSubscription();

  const canAccessOrders = hasFeatureAccess("Orders Management");

  return <div>{canAccessOrders ? <OrdersContent /> : <UpgradePrompt />}</div>;
};
```

### 2. `SubscriptionAwareSidebar` (`src/components/Sidebar/SubscriptionAwareSidebar.jsx`)

Enhanced sidebar that filters menu items based on subscription features.

**Features:**

- Automatically hides menu items for unavailable features
- Shows loading state while checking subscription
- Displays appropriate messages for no subscription
- Filters both parent and child menu items

**Feature Mapping:**

````javascript
const featureMapping = {
  // Main menu is always accessible - no feature requirement
  // "/main": null,
  "/userlist": "Employee Management",
  "/user/add": "Employee Management",
  "/user/:id/edit": "Employee Management",
  "/orders": "Orders Management",
  "/planner": "Route Planner",
  "/drivers": "Driver Management",
  "/vehicles": "Fleet Management",
  "/customers": "Customer Management",
  "/invoices": "Invoicing",
  "/points": "Points Management",
  "/calculator": "Route Calculator",
};
```### 3. `ProtectedRoute` Component (`src/components/ProtectedRoute/ProtectedRoute.jsx`)

Route-level protection based on subscription features.

**Features:**

- Blocks access to routes requiring specific features
- Shows informative error pages with upgrade options
- Provides loading states during subscription checks
- Includes current plan information in error displays

**Usage:**

```javascript
import ProtectedRoute from "../components/ProtectedRoute/ProtectedRoute";

// Protect a single route
<ProtectedRoute requiredFeature="Orders Management">
  <OrdersPage />
</ProtectedRoute>;

// Using the HOC
const ProtectedOrdersPage = withSubscriptionProtection(
  OrdersPage,
  "Orders Management"
);
````

### 4. `SubscriptionBanner` (`src/components/SubscriptionBanner/SubscriptionBanner.jsx`)

Informational banner showing subscription status and warnings.

**Features:**

- Shows expiration warnings
- Displays truck limit notifications
- Provides quick access to subscription management
- Different variants (success, warning, danger, info)

**Usage:**

```javascript
import SubscriptionBanner from '../components/SubscriptionBanner/SubscriptionBanner';

// Show all notifications
<SubscriptionBanner />

// Show only warnings and errors
<SubscriptionBanner showOnlyWarnings={true} />
```

### 5. `useTruckLimitCheck` Hook (`src/utils/subscriptionUtils.js`)

Specialized hook for checking truck limits before creation.

**Features:**

- API-based truck limit verification
- Automatic error handling
- Modal/alert integration for limit reached scenarios

**Usage:**

```javascript
import useTruckLimitCheck from "../utils/subscriptionUtils";

const TrucksPage = () => {
  const { canAddTruck, checkTruckLimit, showTruckLimitModal } =
    useTruckLimitCheck();

  const handleAddTruck = async () => {
    const canAdd = await checkTruckLimit();
    if (!canAdd) {
      showTruckLimitModal();
      return;
    }
    // Proceed with truck creation
  };
};
```

## Router Integration

The router has been enhanced to support subscription-based route protection:

```javascript
const routes = [
  {
    path: "/orders",
    element: <OrdersPage />,
    roles: ["admin", "logist"],
    requiredFeature: "Orders Management", // Subscription feature requirement
  },
  {
    path: "/drivers",
    element: <DriversPage />,
    roles: ["admin", "logist"],
    requiredFeature: "Driver Management",
  },
];
```

## Feature Names Reference

The following feature names are used throughout the system:

- `"Dashboard"` - Main dashboard access
- `"Orders Management"` - Order creation, viewing, editing
- `"Route Planner"` - Route planning and optimization
- `"Driver Management"` - Driver profiles and assignment
- `"Fleet Management"` - Truck/vehicle management
- `"Customer Management"` - Customer database access
- `"Invoicing"` - Invoice creation and management
- `"Points Management"` - Pickup/delivery points
- `"Route Calculator"` - Distance/cost calculations
- `"External Platforms"` - Third-party integrations
- `"Employee Management"` - User/staff management
- `"Tasks Management"` - Task assignment and tracking
- `"Live Map"` - Real-time tracking features

## Layout Integration

The main layout has been updated to use subscription-aware components:

```javascript
// Layout.jsx
import SubscriptionAwareSidebar from "./components/Sidebar/SubscriptionAwareSidebar";
import SubscriptionBanner from "./components/SubscriptionBanner/SubscriptionBanner";

return (
  <div>
    <Header />
    <SubscriptionAwareSidebar>
      <SubscriptionBanner showOnlyWarnings={true} />
      <Outlet />
    </SubscriptionAwareSidebar>
    <Footer />
  </div>
);
```

## Backend API Integration

The system integrates with existing backend APIs:

- `GET /api/subscriptions/current/` - Get current subscription
- `GET /api/subscriptions/check-feature/<feature_name>/` - Check feature access
- `GET /api/subscriptions/check-truck-limit/` - Check truck limits
- `GET /api/subscriptions/plans/` - Get available plans

## Styling

Comprehensive SCSS styling is provided for all components:

- Loading states with spinners
- Warning/error states with appropriate colors
- Responsive design for mobile devices
- Consistent color scheme based on subscription status

## Migration Guide

To integrate subscription checking into existing components:

1. **Import the hook:**

   ```javascript
   import useSubscription from "../hooks/useSubscription";
   ```

2. **Check feature access:**

   ```javascript
   const { hasFeatureAccess } = useSubscription();
   const canAccess = hasFeatureAccess("Feature Name");
   ```

3. **Add conditional rendering:**

   ```javascript
   return canAccess ? <FeatureContent /> : <UpgradePrompt />;
   ```

4. **For truck-related features:**
   ```javascript
   import useTruckLimitCheck from "../utils/subscriptionUtils";
   const { canAddTruck, checkTruckLimit } = useTruckLimitCheck();
   ```

## Error Handling

The system gracefully handles various error scenarios:

- No active subscription
- API failures
- Network connectivity issues
- Invalid subscription states
- Feature access denied

## Performance Considerations

- Subscription data is cached and shared across components
- API calls are minimized through intelligent caching
- Loading states prevent UI blocking
- Error boundaries prevent crashes

## Testing

The system supports testing through:

- Mock subscription data injection
- Feature flag overrides
- Subscription state manipulation
- API response mocking

## Future Enhancements

Potential future improvements:

- Real-time subscription status updates
- Progressive feature unlocking
- Usage analytics integration
- Custom feature sets per client
- Advanced limit management
