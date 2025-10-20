# Onboarding System - Quick Setup Guide

## Step 1: Run Database Migration

```bash
# Navigate to project directory
cd d:\malog\malog-app

# Create migration file
python manage.py makemigrations base --name add_onboarding_fields

# Apply migration
python manage.py migrate
```

## Step 2: Add Frontend Route

In your `frontend/src/App.jsx` (or wherever routes are defined), add:

```jsx
import OnboardingWizard from "./components/OnboardingWizard/OnboardingWizard";

// Inside your Routes component:
<Route path="/onboarding" element={<OnboardingWizard />} />;
```

## Step 3: Update Planner Component

In your planner component, integrate the new features:

```jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import PlannerTutorial from "../PlannerTutorial/PlannerTutorial";
import {
  PlannerWelcomeBanner,
  EmptyTruckCard,
  EmptyDriverCard,
  InlineEmptyTruck,
  InlineEmptyDriver,
} from "../EmptyState/EmptyState";

const Planner = () => {
  const navigate = useNavigate();
  const userInfo = useSelector((state) => state.userLogin.userInfo);
  const [showTutorial, setShowTutorial] = useState(false);
  const [trucks, setTrucks] = useState([]);
  const [drivers, setDrivers] = useState([]);

  useEffect(() => {
    // Check if tutorial should be shown
    const checkTutorialStatus = async () => {
      try {
        const response = await fetch("/api/onboarding/status/", {
          headers: {
            Authorization: `Bearer ${userInfo.token}`,
            "Content-Type": "application/json",
          },
        });
        const data = await response.json();

        if (
          !data.planner_tutorial_shown &&
          data.has_trucks &&
          data.has_drivers
        ) {
          setShowTutorial(true);
        }
      } catch (error) {
        console.error("Error checking tutorial status:", error);
      }
    };

    if (userInfo && userInfo.token) {
      checkTutorialStatus();
    }
  }, [userInfo]);

  const handleTutorialComplete = () => {
    setShowTutorial(false);
  };

  // Fetch trucks and drivers
  useEffect(() => {
    // Your existing fetch logic
    fetchTrucks();
    fetchDrivers();
  }, []);

  const isNewUser = trucks.length === 0 && drivers.length === 0;

  return (
    <div className="planner-container">
      {/* Tutorial Overlay */}
      {showTutorial && (
        <PlannerTutorial
          onComplete={handleTutorialComplete}
          onSkip={handleTutorialComplete}
        />
      )}

      {/* Welcome Banner for New Users */}
      {isNewUser && (
        <PlannerWelcomeBanner
          onStartOnboarding={() => navigate("/onboarding")}
          onAddTruck={() => navigate("/trucks")}
        />
      )}

      {/* Main Planner Content */}
      <div className="planner-content">
        {/* Trucks Section */}
        {trucks.length === 0 ? (
          <EmptyTruckCard fromPlanner={true} />
        ) : (
          <div className="trucks-section">
            {/* Your existing truck rendering logic */}
            {trucks.map((truck) => (
              <TruckRow key={truck.id} truck={truck} />
            ))}
          </div>
        )}

        {/* Drivers Section */}
        {drivers.length === 0 ? (
          <EmptyDriverCard fromPlanner={true} />
        ) : (
          <div className="drivers-section">
            {/* Your existing driver rendering logic */}
            {drivers.map((driver) => (
              <DriverRow key={driver.id} driver={driver} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Planner;
```

## Step 4: Add CSS Classes to Planner Elements

For the tutorial to work properly, add these CSS classes to your planner elements:

```jsx
// Add truck button
<button className="add-truck-button" onClick={handleAddTruck}>
  Add Truck
</button>

// Week navigation
<div className="week-navigation">
  <button onClick={previousWeek}>←</button>
  <span>{currentWeek}</span>
  <button onClick={nextWeek}>→</button>
</div>

// Filter toggle buttons
<div className="filter-toggle-buttons">
  <button onClick={() => setFilter('driver')}>Driver</button>
  <button onClick={() => setFilter('order')}>Order</button>
  <button onClick={() => setFilter('customer')}>Customer</button>
</div>

// Truck row
<div className="truck-row">
  {/* Truck content */}
</div>

// Driver assignment
<div className="driver-assignment">
  {/* Driver selection dropdown */}
</div>
```

## Step 5: Test the Implementation

### Test 1: New User Flow

1. Create a new test account via Sovtes
2. Login and verify redirect to `/onboarding`
3. Complete the wizard
4. Verify redirect to `/planner`
5. Check that tutorial appears

### Test 2: Existing User Flow

1. Login with an account that has trucks and drivers
2. Verify direct redirect to `/planner`
3. Verify tutorial does NOT appear

### Test 3: Empty States

1. Login with account that has no trucks
2. Navigate to `/planner`
3. Verify `EmptyTruckCard` appears
4. Click "Add Your First Truck"
5. Verify navigation to `/trucks`

### Test 4: Skip Functionality

1. Start onboarding wizard
2. Click "Skip for now"
3. Verify redirect to `/planner`
4. Verify onboarding doesn't appear again

## Step 6: Optional Enhancements

### Add "Help" Menu Item to Restart Onboarding

```jsx
// In your navigation/sidebar component
import { useNavigate } from "react-router-dom";

const Navigation = () => {
  const navigate = useNavigate();
  const userInfo = useSelector((state) => state.userLogin.userInfo);

  const handleRestartOnboarding = async () => {
    try {
      await fetch("/api/onboarding/reset/", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
          "Content-Type": "application/json",
        },
      });
      navigate("/onboarding");
    } catch (error) {
      console.error("Error resetting onboarding:", error);
    }
  };

  return (
    <nav>
      {/* Other menu items */}
      <div className="help-menu">
        <button onClick={handleRestartOnboarding}>Setup Guide</button>
      </div>
    </nav>
  );
};
```

### Add Analytics Tracking

```jsx
// In OnboardingWizard.jsx, add tracking
const handleStepAction = () => {
  // Track step completion
  if (window.gtag) {
    window.gtag("event", "onboarding_step", {
      step: currentStepData.id,
      step_number: currentStep + 1,
    });
  }

  // ... rest of your code
};
```

## Troubleshooting

### Issue: Migration fails

```bash
# Check for syntax errors in models.py
python manage.py check

# Try creating migration manually
python manage.py makemigrations base

# If still fails, check for existing migrations
ls base/migrations/
```

### Issue: Frontend components not found

```bash
# Verify files exist
ls frontend/src/components/OnboardingWizard/
ls frontend/src/components/EmptyState/
ls frontend/src/components/PlannerTutorial/

# Check imports in your router file
```

### Issue: Styles not applied

```bash
# Verify SCSS files are imported in components
# Check your build process includes SCSS compilation
# Restart dev server
```

### Issue: API returns 404

```bash
# Verify URL patterns are included in backend/urls.py
# Check that onboarding_urls.py exists
# Restart Django server
python manage.py runserver
```

## Verification Checklist

- [ ] Database migration successful
- [ ] All API endpoints accessible
- [ ] OnboardingWizard route added
- [ ] Components imported correctly
- [ ] SCSS compiled successfully
- [ ] New user redirects to /onboarding
- [ ] Existing user redirects to /planner
- [ ] Tutorial appears for first-time planner users
- [ ] Empty states render correctly
- [ ] Skip functionality works
- [ ] Completion validation works
- [ ] Mobile responsive layout works

## Next Steps After Setup

1. **Customize Content** - Update wizard text for your brand
2. **Add Analytics** - Track onboarding metrics
3. **Gather Feedback** - Monitor user behavior
4. **Iterate** - Improve based on data
5. **Expand** - Add more onboarding steps as needed

## Support

If you encounter issues:

1. Check browser console for errors
2. Check Django logs for backend errors
3. Verify API responses in Network tab
4. Test with different user accounts
5. Review ONBOARDING_IMPLEMENTATION_GUIDE.md

## Success! 🎉

Your onboarding system is now ready to guide users through their MALOG TMS setup experience!
