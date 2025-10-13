import { combineReducers } from "@reduxjs/toolkit";

// import { orderReducer } from "./reducers/orderReducers";
import orderReducer from "./features/orders/ordersSlicers";
import { driverReducer } from "./reducers/driverReducers";
import {
  userLoginReducer,
  userRegisterReducer,
  clientRegisterReducer,
  userDetailsReducer,
  userUpdateProfileReducer,
  userListReducer,
  userDeleteReducer,
  userUpdateReducer,
} from "./reducers/userReducers";
import { mapDefaultCenter } from "./reducers/mapReducers";
import { paymentTypeReducer } from "./reducers/paymentTypeReducers";
import { platformReducer } from "./reducers/platformReducers";
import { documentReducer } from "./reducers/documentReducers";
// import { pointReducer } from "./reducers/pointReducers";
import { taskTypeReducer } from "./reducers/taskTypeReducers";
import taskReducer from "./features/tasks/tasksSlice";
import truckReducer from "./features/trucks/trucksSlice";
import trailerReducer from "./features/trailers/trailersSlice";
import plannerReducers from "./features/planner/plannerSlice";
import roleReducer from "./features/roles/roleSlice";
import customerReducer from "./features/customers/customersSlice";
import customerManagerReducer from "./features/customerManagers/customerManagersSlice";
import currencyReducer from "./features/currencies/currenciesSlice";
import invoiceReducer from "./features/invoices/invoicesSlice";
import pointReducer from "./features/points/pointsSlice";
import countryReducer from "./features/countries/countriesSlice";
import pointCompanyReducer from "./features/pointCompanies/pointCompanySlice";
import sovtesReducer from "./features/orderImport/orderImportSlice";
import sovtesTendersReducer from "./features/sovtesTenders/sovtesTendersSlices";
import {
  pendingClientsReducer,
  approveClientReducer,
  rejectClientReducer,
} from "./reducers/adminReducers";

const rootReducer = combineReducers({
  ordersInfo: orderReducer,
  pointsInfo: pointReducer,
  userLogin: userLoginReducer,
  userRegister: userRegisterReducer,
  clientRegister: clientRegisterReducer,
  userDetails: userDetailsReducer,
  userUpdateProfile: userUpdateProfileReducer,
  userList: userListReducer,
  userDelete: userDeleteReducer,
  userUpdate: userUpdateReducer,
  map: mapDefaultCenter,
  trucksInfo: truckReducer,
  trailersInfo: trailerReducer,
  driversInfo: driverReducer,
  paymentTypesInfo: paymentTypeReducer,
  platformsInfo: platformReducer,
  documentsInfo: documentReducer,
  taskTypesInfo: taskTypeReducer,
  tasksInfo: taskReducer,
  plannerInfo: plannerReducers,
  rolesInfo: roleReducer,
  customersInfo: customerReducer,
  customerManagersInfo: customerManagerReducer,
  currenciesInfo: currencyReducer,
  invoicesInfo: invoiceReducer,
  countriesInfo: countryReducer,
  pointCompaniesInfo: pointCompanyReducer,
  sovtesInfo: sovtesReducer,
  sovtesTendersInfo: sovtesTendersReducer,
  pendingClients: pendingClientsReducer,
  approveClient: approveClientReducer,
  rejectClient: rejectClientReducer,
});

export default rootReducer;
