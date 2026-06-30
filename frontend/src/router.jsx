import { lazy, Suspense } from "react";
import { createBrowserRouter } from "react-router-dom";
import Layout from "./Layout";
import AdminLayout from "./AdminLayout";
const LoginPage = lazy(() => import("./screens/LoginPage/LoginPage"));
const StartScreen = lazy(() => import("./screens/StartScreen"));
const ProfilePage = lazy(() => import("./screens/ProfilePage/ProfilePage"));
const UserListPage = lazy(() => import("./screens/UserListPage/UserListPage"));
const UserEditPage = lazy(() => import("./screens/UserEditPage/UserEditPage"));
// import Orders from "./components/Orders/Orders";
const OrdersTableComponent = lazy(
  () => import("./components/OrdersTableComponent/OrdersTableComponent"),
);
const PlanScreen = lazy(() => import("./screens/PlanScreen"));
const DragDropPlannerPage = lazy(
  () => import("./screens/DragDropPlannerPage/DragDropPlannerPage"),
);
const TaskPage = lazy(() => import("./screens/TaskPage/TaskPage"));
const TaskTablePage = lazy(() => import("./screens/TaskTablePage"));
const Dashboard = lazy(() => import("./screens/Dashboard/Dashboard"));
const AddTaskPage = lazy(() => import("./screens/AddTaskPage"));
const AddOrder = lazy(() => import("./components/AddOrder/AddOrder"));
const MapPage = lazy(() => import("./screens/MapPage/MapPage"));
const PointsPage = lazy(() => import("./screens/PointsPage/PointsPage"));
const PointPage = lazy(() => import("./screens/PointPage/PointPage"));
const OrderPage = lazy(() => import("./screens/OrderPage/OrderPage"));
const RegisterPage = lazy(() => import("./screens/RegisterPage/RegisterPage"));
const DriverListPage = lazy(
  () => import("./screens/DriverListPage/DriverListPage"),
);
const TrucksPage = lazy(() => import("./screens/TrucksPage"));
const AddDriverPage = lazy(() => import("./screens/AddDriverPage"));
const AddUserPage = lazy(() => import("./screens/AddUserPage"));
import MainPageComponent from "./screens/MainPageComponent";
const CustomerPage = lazy(() => import("./screens/CustomerPage"));
const InvoicePage = lazy(() => import("./screens/InvoicePage"));
const InvoiceComponent = lazy(() => import("./components/InvoiceComponent"));
const SovtesTenderPage = lazy(() => import("../src/screens/SovtesTenderPage"));
const SovtesTenderDetailPage = lazy(
  () => import("../src/screens/SovtesTenderDetailPage"),
);
const FreeOrdersPage = lazy(() => import("../src/screens/FreeOrdersPage"));
const CalculatorPage = lazy(() => import("../src/screens/CalculatorPage"));
const RegistrationPendingPage = lazy(
  () => import("./screens/RegistrationPendingPage/RegistrationPendingPage"),
);
const ClientApprovalPage = lazy(
  () => import("./screens/AdminPages/ClientApprovalPage/ClientApprovalPage"),
);
const SubscriptionPlansPage = lazy(
  () => import("./screens/SubscriptionPlansPage"),
);
const SubscriptionManagementPage = lazy(
  () =>
    import("./screens/SubscriptionManagementPage/SubscriptionManagementPage"),
);
const PlanChangeRequestsPage = lazy(
  () =>
    import("./screens/AdminPages/PlanChangeRequestsPage/PlanChangeRequestsPage"),
);
const AdminDashboard = lazy(
  () => import("./screens/AdminPages/AdminDashboard/AdminDashboard"),
);
const AdminSubscriptionPlansPage = lazy(
  () =>
    import("./screens/AdminPages/AdminSubscriptionPlansPage/AdminSubscriptionPlansPage"),
);
const AdminClientSubscriptionsPage = lazy(
  () =>
    import("./screens/AdminPages/AdminClientSubscriptionsPage/AdminClientSubscriptionsPage"),
);
const ExternalIdentitiesPage = lazy(
  () =>
    import("./screens/AdminPages/ExternalIdentitiesPage/ExternalIdentitiesPage"),
);
const OnboardingWizard = lazy(
  () => import("./components/OnboardingWizard/OnboardingWizard"),
);
const CompanyPage = lazy(() => import("./screens/CompanyPage"));
const CostCentersPage = lazy(
  () => import("./screens/CostCentersPage/CostCentersPage"),
);
const RouteCategoriesPage = lazy(
  () => import("./screens/RouteCategoriesPage/RouteCategoriesPage"),
);

import { RestrictedRoute } from "./RestrictedRoute";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";

// Regular client/user routes
const routes = [
  // { path: "/career", element: <CareerPage /> },
  { path: "/register", element: <RegisterPage /> },
  { path: "/registration-pending", element: <RegistrationPendingPage /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/subscription-plans", element: <SubscriptionPlansPage /> },
  {
    path: "/subscriptions",
    element: <SubscriptionManagementPage />,
    roles: ["client_admin"],
  },
  {
    path: "/company",
    element: <CompanyPage />,
    roles: ["system_admin", "client_admin"],
  },
  {
    path: "/settings/cost-centers",
    element: <CostCentersPage />,
    roles: ["system_admin", "client_admin"],
  },
  {
    path: "/settings/route-categories",
    element: <RouteCategoriesPage />,
    roles: ["system_admin", "client_admin"],
  },
  {
    path: "/main",
    element: <StartScreen />,
    roles: ["system_admin", "client_admin", "logist", "driver"],
    // No requiredFeature - main page should always be accessible to show available features
  },
  {
    path: "/profile",
    element: <ProfilePage />,
    roles: ["system_admin", "client_admin", "logist"],
  },
  {
    path: "/userlist",
    element: <UserListPage />,
    roles: ["system_admin", "client_admin"],
    requiredFeature: "Employee Management",
  },
  {
    path: "/user/add",
    element: <AddUserPage />,
    roles: ["system_admin", "client_admin"],
    requiredFeature: "Employee Management",
  },
  {
    path: "/user/:id/edit",
    element: <UserEditPage />,
    roles: ["system_admin", "client_admin"],
    requiredFeature: "Employee Management",
  },

  // { path: "/orders-list", element: <Orders />, roles: [ "logist"] },
  {
    path: "/orders",
    element: <OrdersTableComponent />,
    roles: ["system_admin", "client_admin", "logist"],
    requiredFeature: "Orders Management",
  },
  {
    path: "/free-orders",
    element: <FreeOrdersPage />,
    roles: ["system_admin", "client_admin", "logist"],
    requiredFeature: "Orders Management",
  },
  {
    path: "/orders/:id",
    element: <OrderPage />,
    roles: ["system_admin", "client_admin", "logist"],
    requiredFeature: "Orders Management",
  },
  {
    path: "/points",
    element: <PointsPage />,
    roles: ["system_admin", "client_admin", "logist"],
    requiredFeature: "Points Management",
  },
  {
    path: "/dashboard",
    element: <Dashboard />,
    roles: ["system_admin", "client_admin", "logist"],
    requiredFeature: "Dashboard",
  },
  {
    path: "/planner",
    element: <PlanScreen />,
    roles: ["system_admin", "client_admin", "logist"],
    requiredFeature: "Route Planner",
  },
  {
    path: "/planner/drag-drop",
    element: <DragDropPlannerPage />,
    roles: ["system_admin", "client_admin", "logist"],
    requiredFeature: "Route Planner",
  },
  {
    path: "/tasks",
    element: <TaskTablePage />,
    roles: ["system_admin", "client_admin", "logist"],
    requiredFeature: "Tasks Management",
  },
  {
    path: "/tasks/:id",
    element: <TaskPage />,
    roles: ["system_admin", "client_admin", "logist"],
    requiredFeature: "Tasks Management",
  },
  {
    path: "/tasks/add",
    element: <AddTaskPage />,
    roles: ["system_admin", "client_admin", "logist"],
    requiredFeature: "Tasks Management",
  },
  {
    path: "/orders/add",
    element: <AddOrder />,
    roles: ["system_admin", "client_admin", "logist"],
    requiredFeature: "Orders Management",
  },
  {
    path: "/map",
    element: <MapPage />,
    roles: ["system_admin", "client_admin", "logist"],
    requiredFeature: "Live Map",
  },
  {
    path: "/points/:id",
    element: <PointPage />,
    roles: ["system_admin", "client_admin", "logist"],
    requiredFeature: "Points Management",
  },
  {
    path: "/drivers",
    element: <DriverListPage />,
    roles: ["system_admin", "client_admin", "logist"],
    requiredFeature: "Driver Management",
  },
  {
    path: "/drivers/add",
    element: <AddDriverPage />,
    roles: ["system_admin", "client_admin", "logist"],
    requiredFeature: "Driver Management",
  },
  {
    path: "/fleet",
    element: <TrucksPage />,
    roles: ["system_admin", "client_admin", "logist"],
    requiredFeature: "Fleet Management",
  },
  {
    path: "/customers",
    element: <CustomerPage />,
    roles: ["system_admin", "client_admin", "logist"],
    requiredFeature: "Customer Management",
  },
  {
    path: "/invoices",
    element: <InvoicePage />,
    roles: ["system_admin", "client_admin", "logist"],
    requiredFeature: "Invoicing",
  },
  {
    path: "/invoices/create",
    element: <InvoiceComponent />,
    roles: ["system_admin", "client_admin", "logist"],
    requiredFeature: "Invoicing",
  },
  {
    path: "/invoices/:invoiceId",
    element: <InvoiceComponent />,
    roles: ["system_admin", "client_admin", "logist"],
    requiredFeature: "Invoicing",
  },
  {
    path: "/invoices/create",
    element: <InvoiceComponent />,
    roles: ["system_admin", "client_admin", "logist"],
    requiredFeature: "Invoicing",
  },
  {
    path: "/platforms/sovtes",
    element: <SovtesTenderPage />,
    roles: ["system_admin", "client_admin", "logist"],
    requiredFeature: "External Platforms",
  },
  {
    path: "/platforms/sovtes/:periodic",
    element: <SovtesTenderDetailPage />,
    roles: ["system_admin", "client_admin", "logist"],
    requiredFeature: "External Platforms",
  },
  {
    path: "/calculator",
    element: <CalculatorPage />,
    roles: ["system_admin", "client_admin", "logist"],
    requiredFeature: "Route Calculator",
  },
  {
    path: "/onboarding",
    element: <OnboardingWizard />,
  },
];

// Admin routes (separate layout)
const adminRoutes = [
  {
    path: "/admin",
    element: <AdminDashboard />,
    roles: ["system_admin"],
  },
  {
    path: "/admin/users",
    element: <UserListPage />,
    roles: ["system_admin", "client_admin"],
    requiredFeature: "Employee Management",
  },
  {
    path: "/admin/user/add",
    element: <AddUserPage />,
    roles: ["system_admin", "client_admin"],
    requiredFeature: "Employee Management",
  },
  {
    path: "/admin/user/:id/edit",
    element: <UserEditPage />,
    roles: ["system_admin", "client_admin"],
    requiredFeature: "Employee Management",
  },
  {
    path: "/admin/client-approval",
    element: <ClientApprovalPage />,
    roles: ["system_admin"],
  },
  {
    path: "/admin/plan-change-requests",
    element: <PlanChangeRequestsPage />,
    roles: ["system_admin"],
  },
  {
    path: "/admin/subscription-plans",
    element: <AdminSubscriptionPlansPage />,
    roles: ["system_admin"],
  },
  {
    path: "/admin/client-subscriptions",
    element: <AdminClientSubscriptionsPage />,
    roles: ["system_admin"],
  },
  {
    path: "/admin/external-identities",
    element: <ExternalIdentitiesPage />,
    roles: ["system_admin"],
  },
];

const generateRoutes = (routes) =>
  routes.map(({ path, element, roles, requiredFeature }) => ({
    path,
    element: (() => {
      let wrappedElement = (
        <Suspense fallback={<div>Loading...</div>}>{element}</Suspense>
      );

      // Wrap with subscription protection if required
      if (requiredFeature) {
        wrappedElement = (
          <ProtectedRoute requiredFeature={requiredFeature}>
            {wrappedElement}
          </ProtectedRoute>
        );
      }

      // Wrap with role protection if required
      if (roles) {
        wrappedElement = (
          <RestrictedRoute requiredRoles={roles}>
            {wrappedElement}
          </RestrictedRoute>
        );
      }

      return wrappedElement;
    })(),
  }));

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <MainPageComponent /> },
      ...generateRoutes(routes),
    ],
  },
  {
    path: "/admin",
    element: <AdminLayout />,
    children: [...generateRoutes(adminRoutes)],
  },
]);

export default router;
