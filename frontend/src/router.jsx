import { createBrowserRouter } from "react-router-dom";
import Layout from "./Layout";
import AdminLayout from "./AdminLayout";
import MainPage from "./screens/MainPage/MainPage";
import LoginPage from "./screens/LoginPage/LoginPage";
import StartScreen from "./screens/StartScreen";
import ProfilePage from "./screens/ProfilePage/ProfilePage";
import UserListPage from "./screens/UserListPage/UserListPage";
import UserEditPage from "./screens/UserEditPage/UserEditPage";
// import Orders from "./components/Orders/Orders";
import OrdersTableComponent from "./components/OrdersTableComponent/OrdersTableComponent";
import PlanScreen from "./screens/PlanScreen";
import DragDropPlannerPage from "./screens/DragDropPlannerPage/DragDropPlannerPage";
import TaskPage from "./screens/TaskPage/TaskPage";
import TaskTablePage from "./screens/TaskTablePage";
import Dashboard from "./screens/Dashboard/Dashboard";
import AddTaskPage from "./screens/AddTaskPage";
import AddOrder from "./components/AddOrder/AddOrder";
import MapPage from "./screens/MapPage/MapPage";
import PointsPage from "./screens/PointsPage/PointsPage";
import PointPage from "./screens/PointPage/PointPage";
import OrderPage from "./screens/OrderPage/OrderPage";
import RegisterPage from "./screens/RegisterPage/RegisterPage";
import DriverListPage from "./screens/DriverListPage/DriverListPage";
import TrucksPage from "./screens/TrucksPage";
import AddDriverPage from "./screens/AddDriverPage";
import AddUserPage from "./screens/AddUserPage";
import MainPageComponent from "./screens/MainPageComponent";
import CareerPage from "./screens/CareerPage";
import CustomerPage from "./screens/CustomerPage";
import InvoicePage from "./screens/InvoicePage";
import InvoiceComponent from "./components/InvoiceComponent";
import SovtesTenderPage from "../src/screens/SovtesTenderPage";
import FreeOrdersPage from "../src/screens/FreeOrdersPage";
import CalculatorPage from "../src/screens/CalculatorPage";
import RegistrationPendingPage from "./screens/RegistrationPendingPage/RegistrationPendingPage";
import ClientApprovalPage from "./screens/AdminPages/ClientApprovalPage/ClientApprovalPage";
import SubscriptionPlansPage from "./screens/SubscriptionPlansPage";
import SubscriptionManagementPage from "./screens/SubscriptionManagementPage/SubscriptionManagementPage";
import PlanChangeRequestsPage from "./screens/AdminPages/PlanChangeRequestsPage/PlanChangeRequestsPage";
import AdminDashboard from "./screens/AdminPages/AdminDashboard/AdminDashboard";
import AdminSubscriptionPlansPage from "./screens/AdminPages/AdminSubscriptionPlansPage/AdminSubscriptionPlansPage";
import AdminClientSubscriptionsPage from "./screens/AdminPages/AdminClientSubscriptionsPage/AdminClientSubscriptionsPage";

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
    path: "/vehicles",
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
    path: "/calculator",
    element: <CalculatorPage />,
    roles: ["system_admin", "client_admin", "logist"],
    requiredFeature: "Route Calculator",
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
];

const generateRoutes = (routes) =>
  routes.map(({ path, element, roles, requiredFeature }) => ({
    path,
    element: (() => {
      let wrappedElement = element;

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
