export const selectCustomers = (state) => state.customersInfo.customers.data;

export const selectEditModeCustomer = (state) =>
  state.customersInfo.editModeCustomer;

export const selectCustomer = (state) => state.customersInfo.customer.data;

export const selectManagers = (state) => state.customersInfo.managers.data;
