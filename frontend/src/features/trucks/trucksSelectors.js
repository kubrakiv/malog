export const selectTrucks = (state) => state.trucksInfo.trucks.data;

export const selectEditModeTruck = (state) => state.trucksInfo.editModeTruck;

export const selectShowTruckModal = (state) => state.trucksInfo.showTruckModal;

export const selectShowAddTruckModal = (state) =>
  state.trucksInfo.showAddTruckModal;

export const selectSelectedTruck = (state) =>
  state.trucksInfo.selectedTruck.data;
