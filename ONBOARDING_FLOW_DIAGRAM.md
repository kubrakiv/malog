# Onboarding UX Flow Diagram

## Complete User Journey Map

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         SOVTES AUTHENTICATION                            │
│                     (User logs in via Sovtes)                           │
└─────────────────────────────┬───────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     SovtesAuthHandler.jsx                               │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │  1. Extract tokens from URL                                     │    │
│  │  2. Fetch user profile: GET /api/users/profile/                │    │
│  │  3. Check onboarding status: GET /api/onboarding/status/       │    │
│  └────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
            needs_onboarding?                  │
                    │                           │
        ┌───────────┴──────────┐                │
        │ YES                  │ NO             │
        ▼                      ▼                ▼
┌───────────────────┐  ┌────────────────────────────────┐
│   /onboarding     │  │        /planner                │
│ (New User Path)   │  │  (Existing User Path)          │
└────────┬──────────┘  └────────────┬───────────────────┘
         │                          │
         │                          │
         ▼                          ▼
┌─────────────────────────────────────────────────────────┐
│            ONBOARDING WIZARD                            │
│  (OnboardingWizard.jsx)                                │
│                                                         │
│  ┌────────────────────────────────────────────────┐   │
│  │ STEP 1: WELCOME                                │   │
│  │ ┌────────────────────────────────────────────┐ │   │
│  │ │ 🚀 Welcome to MALOG TMS                   │ │   │
│  │ │                                            │ │   │
│  │ │ What you'll set up:                       │ │   │
│  │ │ ✓ Your Fleet (Trucks & Trailers)         │ │   │
│  │ │ ✓ Your Drivers                           │ │   │
│  │ │ ✓ Ready to Go                            │ │   │
│  │ │                                            │ │   │
│  │ │ [Get Started →]                           │ │   │
│  │ └────────────────────────────────────────────┘ │   │
│  └────────────────────────┬───────────────────────┘   │
│                           │                            │
│                           ▼                            │
│  ┌────────────────────────────────────────────────┐   │
│  │ STEP 2: ADD TRUCKS                            │   │
│  │ ┌────────────────────────────────────────────┐ │   │
│  │ │ 🚛 Add Your Fleet                         │ │   │
│  │ │                                            │ │   │
│  │ │ Trucks are essential for creating routes  │ │   │
│  │ │ and assigning orders.                     │ │   │
│  │ │                                            │ │   │
│  │ │ Status: [✓ 3 trucks added] or [Empty]    │ │   │
│  │ │                                            │ │   │
│  │ │ [Add Trucks →]  [Skip for now]           │ │   │
│  │ └────────────────────────────────────────────┘ │   │
│  └────────────────────────┬───────────────────────┘   │
│                           │                            │
│                           ▼                            │
│  ┌────────────────────────────────────────────────┐   │
│  │ STEP 3: ADD DRIVERS                           │   │
│  │ ┌────────────────────────────────────────────┐ │   │
│  │ │ 👤 Add Your Drivers                       │ │   │
│  │ │                                            │ │   │
│  │ │ Drivers operate your trucks and can be    │ │   │
│  │ │ assigned to routes.                       │ │   │
│  │ │                                            │ │   │
│  │ │ Status: [✓ 2 drivers added] or [Empty]   │ │   │
│  │ │                                            │ │   │
│  │ │ [Add Drivers →]  [Skip for now]          │ │   │
│  │ └────────────────────────────────────────────┘ │   │
│  └────────────────────────┬───────────────────────┘   │
│                           │                            │
│                           ▼                            │
│  ┌────────────────────────────────────────────────┐   │
│  │ STEP 4: COMPLETION                            │   │
│  │ ┌────────────────────────────────────────────┐ │   │
│  │ │ 🎉 You're All Set!                        │ │   │
│  │ │                                            │ │   │
│  │ │ You can now start creating orders,        │ │   │
│  │ │ planning routes, and managing logistics.  │ │   │
│  │ │                                            │ │   │
│  │ │ [Go to Planner →]                         │ │   │
│  │ └────────────────────────────────────────────┘ │   │
│  └────────────────────────┬───────────────────────┘   │
└──────────────────────────┬┴────────────────────────────┘
                           │
                           │ POST /api/onboarding/complete/
                           │ (marks is_onboarded = true)
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         /planner                                        │
│  (Planner Component)                                                    │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │ IF planner_tutorial_shown = false:                              │  │
│  │                                                                  │  │
│  │  ┌────────────────────────────────────────────────────────┐    │  │
│  │  │         PLANNER TUTORIAL (PlannerTutorial.jsx)         │    │  │
│  │  │                                                         │    │  │
│  │  │  Step 1: Welcome to Planner 👋                         │    │  │
│  │  │  Step 2: Add Trucks → [highlight .add-truck-button]    │    │  │
│  │  │  Step 3: Truck Rows → [highlight .truck-row]           │    │  │
│  │  │  Step 4: Week Navigation → [highlight .week-nav]       │    │  │
│  │  │  Step 5: Filter Views → [highlight .filter-buttons]    │    │  │
│  │  │  Step 6: Assign Drivers → [highlight .driver-assign]   │    │  │
│  │  │  Step 7: Complete 🎉                                   │    │  │
│  │  │                                                         │    │  │
│  │  │  [Previous] [Next/Finish]  [Skip tutorial]            │    │  │
│  │  └────────────────────────────────────────────────────────┘    │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │ IF trucks.length === 0 && drivers.length === 0:                 │  │
│  │                                                                  │  │
│  │  ┌────────────────────────────────────────────────────────┐    │  │
│  │  │      WELCOME BANNER (PlannerWelcomeBanner)             │    │  │
│  │  │                                                         │    │  │
│  │  │  📖 Welcome to MALOG Planner! 👋                      │    │  │
│  │  │                                                         │    │  │
│  │  │  This is where you'll plan routes and assign trucks.   │    │  │
│  │  │  Let's get you started!                                │    │  │
│  │  │                                                         │    │  │
│  │  │  [📖 Start Onboarding Guide]  [🚛 Add Truck]          │    │  │
│  │  └────────────────────────────────────────────────────────┘    │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │ IF trucks.length === 0:                                         │  │
│  │                                                                  │  │
│  │  ┌────────────────────────────────────────────────────────┐    │  │
│  │  │        EMPTY TRUCK CARD (EmptyTruckCard)               │    │  │
│  │  │                                                         │    │  │
│  │  │           🚛                                           │    │  │
│  │  │      No Trucks Yet                                     │    │  │
│  │  │                                                         │    │  │
│  │  │  Add trucks to your fleet to start planning routes    │    │  │
│  │  │  and assigning orders.                                 │    │  │
│  │  │                                                         │    │  │
│  │  │      [➕ Add Your First Truck]                         │    │  │
│  │  └────────────────────────────────────────────────────────┘    │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │ IF drivers.length === 0:                                        │  │
│  │                                                                  │  │
│  │  ┌────────────────────────────────────────────────────────┐    │  │
│  │  │       EMPTY DRIVER CARD (EmptyDriverCard)              │    │  │
│  │  │                                                         │    │  │
│  │  │           👤                                           │    │  │
│  │  │      No Drivers Yet                                    │    │  │
│  │  │                                                         │    │  │
│  │  │  Add drivers so they can be assigned to trucks        │    │  │
│  │  │  and routes.                                           │    │  │
│  │  │                                                         │    │  │
│  │  │      [➕ Add Your First Driver]                        │    │  │
│  │  └────────────────────────────────────────────────────────┘    │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │ ELSE: Normal Planner View                                       │  │
│  │                                                                  │  │
│  │  ┌──────────────────────────────────────────────────────────┐  │  │
│  │  │  Week Navigation  [←] [Week 42] [→]                      │  │  │
│  │  ├──────────────────────────────────────────────────────────┤  │  │
│  │  │  Filters: [Driver] [Order] [Customer] [Task]            │  │  │
│  │  ├──────────────────────────────────────────────────────────┤  │  │
│  │  │  Truck #1 | Driver: John | [================] Orders    │  │  │
│  │  │  Truck #2 | Driver: Mary | [================] Orders    │  │  │
│  │  │  Truck #3 | Driver: ---  | [================] Orders    │  │  │
│  │  └──────────────────────────────────────────────────────────┘  │  │
│  └─────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

## API Endpoints Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        API ENDPOINTS                                    │
└─────────────────────────────────────────────────────────────────────────┘

GET /api/onboarding/status/
├─ Check: has_trucks (Truck.objects.filter(client=client).exists())
├─ Check: has_drivers (DriverProfile.objects.filter(profile__client=client).exists())
├─ Check: has_trailers (Trailer.objects.filter(client=client).exists())
├─ Determine: needs_onboarding = not is_onboarded AND (not has_trucks OR not has_drivers)
└─ Return: {
     needs_onboarding: boolean,
     is_new_client: boolean,
     completed_steps: ['trucks', 'drivers'],
     has_trucks: boolean,
     has_drivers: boolean,
     has_trailers: boolean,
     is_onboarded: boolean,
     planner_tutorial_shown: boolean
   }

POST /api/onboarding/complete/
├─ Validate: has_trucks AND has_drivers
├─ If valid: client.is_onboarded = True, client.onboarded_at = now()
├─ If invalid: return missing_steps and error
└─ Return: success/failure message

POST /api/onboarding/skip/
├─ Set: client.is_onboarded = True
├─ Set: client.settings['onboarding_skipped'] = True
└─ Return: success message

POST /api/onboarding/tutorial/complete/
├─ Set: client.planner_tutorial_shown = True
├─ Store: completion details in client.settings
└─ Return: success message

POST /api/onboarding/reset/
├─ Reset: client.is_onboarded = False
├─ Reset: client.planner_tutorial_shown = False
├─ Clear: onboarding-related settings
└─ Return: success message
```

## State Management

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      STATE MANAGEMENT                                   │
└─────────────────────────────────────────────────────────────────────────┘

Redux State (userLogin.userInfo):
├─ id: number
├─ username: string
├─ email: string
├─ token: string (JWT access token)
├─ refresh_token: string
├─ is_sovtes_user: boolean
├─ role: string
├─ client: object/null
├─ needs_onboarding: boolean ← From API
├─ is_new_client: boolean ← From API
├─ completed_steps: array ← From API
└─ planner_tutorial_shown: boolean ← From API

localStorage:
└─ userInfo: JSON.stringify(userInfo) ← Persists across sessions

Database (Client model):
├─ is_onboarded: BooleanField (default=False)
├─ onboarded_at: DateTimeField (null=True)
├─ planner_tutorial_shown: BooleanField (default=False)
└─ settings: JSONField (stores skip info, completion details)
```

## Component Hierarchy

```
App.jsx
├─ SovtesAuthHandler ← Handles auth and routing
├─ Route: /onboarding
│  └─ OnboardingWizard
│     ├─ Step 0: Welcome Screen
│     ├─ Step 1: Trucks Setup
│     ├─ Step 2: Drivers Setup
│     └─ Step 3: Completion
└─ Route: /planner
   └─ Planner
      ├─ PlannerTutorial (conditional)
      │  ├─ Tutorial Overlay
      │  └─ Tooltip with Steps
      ├─ PlannerWelcomeBanner (conditional)
      ├─ EmptyTruckCard (conditional)
      ├─ EmptyDriverCard (conditional)
      └─ Normal Planner Content (conditional)
```

## Decision Tree

```
User Authentication
        │
        ▼
   Is Sovtes Auth?
        │
    ┌───┴───┐
   YES      NO
    │        │
    │        └─► Normal Login Flow
    │
    ▼
Fetch Profile & Onboarding Status
    │
    ▼
needs_onboarding?
    │
┌───┴───┐
│       │
YES    NO
│       │
│       └─► Navigate to /planner
│           │
│           ▼
│       planner_tutorial_shown?
│           │
│       ┌───┴───┐
│      YES      NO
│       │        │
│       │        └─► Show PlannerTutorial
│       │
│       └─► Show Normal Planner
│
└─► Navigate to /onboarding
    │
    ▼
Onboarding Wizard
    │
    ├─► User Completes → Mark is_onboarded = True → /planner
    └─► User Skips → Mark is_onboarded = True → /planner
```

## Success Metrics

```
Measure:
├─ Onboarding Completion Rate = (completed / started) × 100%
├─ Time to Complete = avg(onboarded_at - created_at)
├─ Skip Rate = (skipped / started) × 100%
├─ Tutorial Engagement = (tutorial_completed / tutorial_shown) × 100%
└─ Feature Adoption = (trucks_added + drivers_added) / users
```
