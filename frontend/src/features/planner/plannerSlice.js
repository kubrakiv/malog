import { createSlice } from "@reduxjs/toolkit";
import { set } from "date-fns";

export const plannerSlice = createSlice({
  name: "planner",
  initialState: {
    selectedTask: {
      data: {},
    },
    selectedTruck: {
      data: {},
    },
    selectedDriver: {
      data: {},
    },
    selectedDate: {
      data: {},
    },
    modals: {
      showStartTimeModal: false,
      showEndTimeModal: false,
      showServiceTaskModal: false,
      showTruckOnMapModal: false,
    },
    switchers: {
      showOrderNumber: false,
      showDriver: false,
      showCustomer: false,
    },

    editModeServiceTask: false,
    addModeServiceTask: false,
  },
  reducers: {
    setSwitchers: (state, action) => {
      state.switchers = { ...state.switchers, ...action.payload };
    },
    setSelectedTask: (state, action) => {
      state.selectedTask.data = action.payload;
    },
    setSelectedTruck: (state, action) => {
      state.selectedTruck.data = action.payload;
    },
    setSelectedDriver: (state, action) => {
      state.selectedDriver.data = action.payload;
    },
    setSelectedDate: (state, action) => {
      state.selectedDate.data = action.payload;
    },
    setShowStartTimeModal: (state, action) => {
      state.modals.showStartTimeModal = action.payload;
    },
    setShowEndTimeModal: (state, action) => {
      state.modals.showEndTimeModal = action.payload;
    },
    setShowServiceTaskModal: (state, action) => {
      state.modals.showServiceTaskModal = action.payload;
    },
    setEditModeServiceTask: (state, action) => {
      state.editModeServiceTask = action.payload;
    },
    setAddModeServiceTask: (state, action) => {
      state.addModeServiceTask = action.payload;
    },
    setShowTruckOnMapModal: (state, action) => {
      state.modals.showTruckOnMapModal = action.payload;
    },
  },
});

export const {
  setSwitchers,
  setSelectedTask,
  setSelectedTruck,
  setSelectedDriver,
  setSelectedDate,
  setShowStartTimeModal,
  setShowEndTimeModal,
  setShowServiceTaskModal,
  setEditModeServiceTask,
  setAddModeServiceTask,
  setShowTruckOnMapModal,
} = plannerSlice.actions;

export default plannerSlice.reducer;
