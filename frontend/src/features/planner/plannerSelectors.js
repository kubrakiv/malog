export const selectSwitchers = (state) => state.plannerInfo.switchers;

export const selectSelectedTask = (state) =>
  state.plannerInfo.selectedTask.data;

export const selectShowStartTimeModal = (state) =>
  state.plannerInfo.modals.showStartTimeModal;

export const selectShowEndTimeModal = (state) =>
  state.plannerInfo.modals.showEndTimeModal;

export const selectShowServiceTaskModal = (state) =>
  state.plannerInfo.modals.showServiceTaskModal;

export const selectShowTruckOnMapModal = (state) =>
  state.plannerInfo.modals.showTruckOnMapModal;

export const selectEditModeServiceTask = (state) =>
  state.plannerInfo.editModeServiceTask;

export const selectSelectedTruck = (state) =>
  state.plannerInfo.selectedTruck.data;

export const selectSelectedDriver = (state) =>
  state.plannerInfo.selectedDriver.data;

export const selectSelectedDate = (state) =>
  state.plannerInfo.selectedDate.data;
