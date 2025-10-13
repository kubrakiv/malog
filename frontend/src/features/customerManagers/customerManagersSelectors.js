export const selectCustomerManagers = (state) =>
  state.customerManagersInfo.customerManagers;

export const selectCustomerManager = (state) =>
  state.customerManagersInfo.customerManager.data;

export const selectIsAddCustomerManager = (state) =>
  state.customerManagersInfo.isAddCustomerManager;

export const selectShowCustomerManagerForm = (state) =>
  state.customerManagersInfo.showCustomerManagerForm;

export const selectIsEditModeCustomerManager = (state) =>
  state.customerManagersInfo.customerManager.isEditMode;
