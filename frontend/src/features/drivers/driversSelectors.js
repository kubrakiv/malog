export const selectDrivers = (state) => state.driversInfo.drivers.data;
export const selectSelectedDriver = (state) =>
  state.driversInfo.selectedDriver.data;
export const selectEditModeDriver = (state) => state.driversInfo.editModeDriver;
export const selectShowDriverModal = (state) =>
  state.driversInfo.showDriverModal;
export const selectShowAddDriverModal = (state) =>
  state.driversInfo.showAddDriverModal;
export const selectCreatedDriver = (state) =>
  state.driversInfo.createdDriver.data;
