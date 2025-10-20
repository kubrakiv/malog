# Onboarding System Implementation Guide

## Overview

This document outlines the complete onboarding system implementation for Malog TMS, combining best practices for user experience and progressive disclosure.

## Features Implemented

### 1. Backend Changes

#### Models (`base/models.py`)

Added onboarding tracking fields to Client model:

- `is_onboarded` - Boolean flag for onboarding completion
- `onboarded_at` - Timestamp of when onboarding was completed
- `planner_tutorial_shown` - Boolean flag for tutorial completion

#### API Endpoints (`base/views/onboarding_views.py`)

- `GET /api/onboarding/status/` - Check onboarding status and progress
- `POST /api/onboarding/complete/` - Mark onboarding as complete
- `POST /api/onboarding/skip/` - Skip onboarding wizard
- `POST /api/onboarding/tutorial/complete/` - Mark planner tutorial as shown
- `POST /api/onboarding/reset/` - Reset onboarding (for testing)

### 2. Frontend Components

#### OnboardingWizard (`frontend/src/components/OnboardingWizard/`)

Multi-step wizard with:

- Welcome screen explaining the system
- Trucks setup step
- Drivers setup step
- Completion screen
- Smart navigation based on completed steps
- Progress tracking with visual indicators

#### EmptyState Components (`frontend/src/components/EmptyState/`)

Friendly empty states for:

- Empty truck lists
- Empty driver lists
- Empty order lists
- Welcome banner for planner
- Inline empty states for grid rows

#### PlannerTutorial (`frontend/src/components/PlannerTutorial/`)

Interactive tutorial system with:

- Contextual tooltips
- Step-by-step guidance
- Element highlighting
- Skip/complete functionality

### 3. User Journeys

#### A. New User Flow

1. User authenticates via Sovtes
2. System checks onboarding status
3. Redirects to `/onboarding` if needed
4. Wizard guides through setup:
   - Welcome screen
   - Add trucks (required)
   - Add drivers (required)
   - Completion
5. Redirect to planner
6. Show planner tutorial (first time only)

#### B. Existing User Flow

1. User authenticates via Sovtes
2. System detects existing data
3. Direct redirect to `/planner`
4. No tutorial shown (already completed)

## Database Migration

Run this migration to add the new fields:

```python
# migrations/XXXX_add_onboarding_fields.py
from django.db import migrations, models
import django.utils.timezone


class Migration(migrations.Migration):
    dependencies = [
        ('base', 'XXXX_previous_migration'),
    ]

    operations = [
        migrations.AddField(
            model_name='client',
            name='is_onboarded',
            field=models.BooleanField(default=False, help_text='Client has completed the onboarding wizard'),
        ),
        migrations.AddField(
            model_name='client',
            name='onboarded_at',
            field=models.DateTimeField(blank=True, help_text='When the client completed onboarding', null=True),
        ),
        migrations.AddField(
            model_name='client',
            name='planner_tutorial_shown',
            field=models.BooleanField(default=False, help_text='Planner tutorial has been shown to client users'),
        ),
    ]
```

## Frontend Integration

### Add Routes (App.jsx or Router configuration)

```jsx
import OnboardingWizard from "./components/OnboardingWizard/OnboardingWizard";

// Add route
<Route path="/onboarding" element={<OnboardingWizard />} />;
```

### Integrate in Planner Component

```jsx
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import PlannerTutorial from './components/PlannerTutorial/PlannerTutorial';
import { PlannerWelcomeBanner, EmptyTruckCard, EmptyDriverCard } from './components/EmptyState/EmptyState';

const Planner = () => {
  const userInfo = useSelector(state => state.userLogin.userInfo);
  const [showTutorial, setShowTutorial] = useState(false);
  const [trucks, setTrucks] = useState([]);
  const [drivers, setDrivers] = useState([]);

  useEffect(() => {
    // Check if tutorial should be shown
    if (!userInfo.planner_tutorial_shown) {
      setShowTutorial(true);
    }
  }, [userInfo]);

  const handleTutorialComplete = () => {
    setShowTutorial(false);
  };

  return (
    <div className="planner-container">
      {showTutorial && (
        <PlannerTutorial
          onComplete={handleTutorialComplete}
          onSkip={handleTutorialComplete}
        />
      )}

      {trucks.length === 0 && drivers.length === 0 && (
        <PlannerWelcomeBanner
          onStartOnboarding={() => navigate('/onboarding')}
          onAddTruck={() => navigate('/trucks')}
        />
      )}

      {trucks.length === 0 ? (
        <EmptyTruckCard fromPlanner={true} />
      ) : (
        // Render truck rows
      )}

      {drivers.length === 0 ? (
        <EmptyDriverCard fromPlanner={true} />
      ) : (
        // Render driver rows
      )}
    </div>
  );
};
```

## Testing Checklist

### Backend

- [ ] Run migrations: `python manage.py makemigrations && python manage.py migrate`
- [ ] Test `/api/onboarding/status/` endpoint
- [ ] Test onboarding completion flow
- [ ] Test tutorial completion tracking
- [ ] Verify reset functionality

### Frontend

- [ ] Test new user flow (create test account)
- [ ] Test existing user flow (use account with data)
- [ ] Test onboarding wizard navigation
- [ ] Test skip functionality
- [ ] Test empty states in planner
- [ ] Test planner tutorial
- [ ] Test responsive design on mobile

### Integration

- [ ] Verify Sovtes authentication redirects correctly
- [ ] Test onboarding → add truck → return to onboarding
- [ ] Test onboarding → add driver → return to onboarding
- [ ] Verify completion requires trucks AND drivers
- [ ] Test localStorage persistence

## Configuration Options

### Customization Points

1. **Tutorial Steps** - Edit `PlannerTutorial.jsx` tutorialSteps array
2. **Required Onboarding Steps** - Modify validation in `onboarding_views.py`
3. **Welcome Message** - Update text in `OnboardingWizard.jsx`
4. **Empty State Actions** - Customize buttons in `EmptyState.jsx`

### Feature Flags (optional)

Add to client settings JSON:

```json
{
  "onboarding": {
    "require_trucks": true,
    "require_drivers": true,
    "require_trailers": false,
    "show_tutorial": true,
    "allow_skip": true
  }
}
```

## Performance Considerations

- Empty states load synchronously (no API calls)
- Tutorial position calculated on mount and step change
- Onboarding status cached in Redux/localStorage
- Highlight animations use CSS transforms (GPU accelerated)

## Accessibility

- All buttons have proper ARIA labels
- Keyboard navigation supported (Tab, Enter, Esc)
- Focus management in tutorial overlay
- High contrast mode compatible
- Screen reader announcements for step changes

## Future Enhancements

1. **Analytics Tracking**

   - Track which users skip onboarding
   - Measure time spent in each step
   - Track tutorial completion rates

2. **Personalization**

   - Remember user preferences
   - Customize tutorial based on role
   - Industry-specific onboarding paths

3. **Help System**

   - Add "Help" menu with onboarding restart
   - Contextual help tooltips throughout app
   - Video tutorials embedded in steps

4. **Progressive Features**
   - Advanced features unlocked after basic setup
   - Achievement badges for completing setup
   - Gamification elements

## Support

For issues or questions:

- Check browser console for errors
- Verify API endpoints are accessible
- Review network tab for failed requests
- Test with different user roles

## Rollback Plan

If issues occur:

1. Set `is_onboarded = True` for all clients in database
2. Comment out tutorial rendering in Planner
3. Redirect all users to `/planner` instead of `/onboarding`
4. Revert migration if needed

```sql
-- Emergency rollback SQL
UPDATE base_client SET is_onboarded = TRUE, planner_tutorial_shown = TRUE;
```
