import { createSlice } from "@reduxjs/toolkit";
import {
  createTruck,
  listTrucks,
  updateTruck,
  deleteTruck,
  updateTruckTrailerAndDriver,
} from "./trucksOperations";

export const truckSlice = createSlice({
  name: "truck",
  initialState: {
    trucks: {
      data: [],
    },
    selectedTruck: {
      data: {},
    },
    createdTruck: {
      data: {},
    },
    editModeTruck: false,
    showTruckModal: false,
    showAddTruckModal: false,
  },
  reducers: {
    setEditModeTruck: (state, action) => {
      state.editModeTruck = action.payload;
    },
    setShowTruckModal: (state, action) => {
      state.showTruckModal = action.payload;
    },
    setShowAddTruckModal: (state, action) => {
      state.showAddTruckModal = action.payload;
    },
    setSelectedTruck: (state, action) => {
      state.selectedTruck.data = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(listTrucks.fulfilled, (state, action) => {
      state.trucks.data = action.payload;
    });
    builder.addCase(updateTruck.fulfilled, (state, action) => {
      const index = state.trucks.data.findIndex(
        (truck) => truck.id === action.payload.id
      );
      state.trucks.data[index] = action.payload;
    });
    builder.addCase(updateTruckTrailerAndDriver.fulfilled, (state, action) => {
      const index = state.trucks.data.findIndex(
        (truck) => truck.id === action.payload.id
      );
      state.trucks.data[index] = action.payload;
    });
    builder.addCase(createTruck.fulfilled, (state, action) => {
      state.trucks.data.push(action.payload);
      state.createdTruck.data = action.payload;
    });
    builder.addCase(deleteTruck.fulfilled, (state, action) => {
      state.trucks.data = state.trucks.data.filter(
        (truck) => truck.id !== action.payload
      );
    });
  },
});

export const truckActions = truckSlice.actions;
export const {
  setEditModeTruck,
  setShowTruckModal,
  setShowAddTruckModal,
  setSelectedTruck,
} = truckActions;
export default truckSlice.reducer;
